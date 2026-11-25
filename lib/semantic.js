// Interpretação semântica do pedido (v2.1).
//
// Antes, o motor procurava palavras-chave no texto inteiro: "projetos" virava "produtos" pelo
// corretor, "aplicativo de prompts" ativava Android e um exemplo ("vamos supor...") virava
// requisito. Aqui o pedido é dividido em trechos e cada trecho recebe um papel:
//   intencao · restricao · contexto · analogia · pergunta · exemplo · preenchimento
// Só trechos que expressam o que a pessoa quer contam como evidência. Exemplos ficam registrados,
// mas não geram requisitos. Termos negados ("sem API de terceiros") viram restrições.
import { CONCEPTS, POLICIES } from './concepts.js';

export const ROLE_WEIGHT = { intencao: 1, restricao: 1, pergunta: 0.6, contexto: 0.6, analogia: 0.4, exemplo: 0, preenchimento: 0 };

// Termos genéricos demais para, sozinhos, definirem o tipo de projeto.
export const WEAK_TERMS = new Set(['aplicativo', 'app', 'api', 'rest', 'produtos', 'loja', 'sistema', 'site', 'pagina', 'portal', 'painel',
  'servidor', 'hospedagem', 'agente', 'agentes', 'git', 'github', 'repositorio', 'repositorios', 'erro', 'erros', 'bug', 'bugs', 'melhorar',
  'otimizar', 'ci', 'cd', 'backend', 'claude', 'gpt', 'gemini', 'producao', 'docker', 'celular', 'existente', 'json', 'csv', 'catalogo',
  'recon', 'reconhecimento', 'blog']);

const EXEMPLO = /\b(por exemplo|e so um exemplo|so um exemplo|um exemplo|exemplo|exemplos|vamos supor|suponha|supondo|digamos que|imagine|imagina se|hipoteticamente)\b/;
const ANALOGIA = /\b(como se|e tipo um|seria tipo)\b/;
const INTENCAO = /\b(quero|queria|gostaria|preciso que|precisava que|preciso de um|preciso de uma|crie|criar|cria|desenvolva|desenvolver|construa|construir|faca|fazer um|fazer uma|implemente|implementar|implantar|corrigir|objetivo|o ideal|seria bom|publicar|automatizar)\b/;
const INTENCAO_FORTE = /\b(quero que|queria que|gostaria que|gostaria de|eu quero|eu queria|preciso que o|preciso que a|meu objetivo|o objetivo|crie|desenvolva|construa|implemente)\b/;
const NARRATIVA = /\b(vou la|eu vou|quando eu (vou|for|fui)|esse projeto|ele tinha|ele foi|antes ele|fui la|fui num)\b/;
const POSSE = /\b(eu tenho|tenho um|tenho uma|ja tenho|temos um|temos uma|eu uso)\b/;
const PERGUNTA = /\b(existe|tem como|e possivel|como fazer|como faco|qual|quais|sera que|da para|da pra|consigo|voce consegue)\b/;
const RESTRICAO = /\b(sem|nao|nunca|nenhum|nenhuma|apenas|somente|so pode|obrigatorio|proibido|evitar)\b/;
const NEG = /\b(sem|nao|nunca|nenhum|nenhuma|nem|evitar|evite|exceto|independente de|livre de)\b/;
const FILLER = /^(oi|ne|ta|entendeu|sim|ok|beleza|(pra|para) qualquer coisa|pode ser qualquer coisa|qualquer coisa)$/;

/** Limpa marcas de fala transcrita no texto original, para exibição. */
export function limparTranscricao(text) {
  const B = '(?<![\\p{L}\\p{N}])', E = '(?![\\p{L}\\p{N}])';
  return String(text || '')
    .replace(new RegExp(`${B}(\\p{L}+)(?:,?\\s+\\1${E})+`, 'giu'), '$1')                          // "eu, eu" / "do, do, do"
    .replace(new RegExp(`^${B}(a[íi]\\s+)?(eu\\s+)?(falei|disse|pedi)\\s+(pra|para)\\s+ele(\\s+assim)?(\\s+[óo])?${E}[,:]?\\s*`, 'iu'), '')
    .replace(new RegExp(`,?\\s*${B}(n[ée]|entendeu|t[áa]|oi|tipo)${E}\\s*\\?`, 'giu'), '.')
    .replace(new RegExp(`,?\\s*${B}(n[ée]|entendeu|t[áa]|oi|assim [óo]|tipo)${E}\\s*(?=[,.]|$)`, 'giu'), '')
    .replace(new RegExp(`^${B}(a[íi]|mas|ent[ãa]o|tipo|ah)${E},?\\s*`, 'iu'), '')
    .replace(/\s+([,.?!])/g, '$1').replace(/([,.?!])[,.?!]+/g, '$1').replace(/\s{2,}/g, ' ').trim().replace(/^[,.;\s]+/, '')
    .replace(/^\p{Ll}/u, c => c.toUpperCase());
}

/** "cloud" em transcrição de áudio costuma ser "Claude" quando usado como agente ("o cloud revisar"). */
function corrigirCloud(text, hipoteses) {
  const re = /\b(o|pro|do|no|ao|somente|usasse|usando o|usar o|que o)\s+cloud\b/gi;
  if (!re.test(text) || /\b(cloud computing|computa[cç][aã]o em nuvem|aws|azure|gcp|google cloud)\b/i.test(text)) return text;
  hipoteses.push('"cloud" foi interpretado como "Claude" (assistente de IA), comum em transcrição de áudio.');
  return text.replace(/\b(o|pro|do|no|ao|somente|usasse|usando o|usar o|que o)\s+cloud\b/gi, '$1 Claude');
}

function dividir(original) {
  return String(original).split(/(?<=[.!?;])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}

function papelBase(norm, orig, idx) {
  if (!norm || FILLER.test(norm) || norm.split(' ').length <= 1) return 'preenchimento';
  if (EXEMPLO.test(norm)) return 'exemplo';
  if (/\?\s*$/.test(orig) && PERGUNTA.test(norm) && !INTENCAO_FORTE.test(norm)) return 'pergunta';
  if (INTENCAO.test(norm) && !POSSE.test(norm)) return 'intencao';
  if (ANALOGIA.test(norm)) return 'analogia';
  if (RESTRICAO.test(norm)) return 'restricao';
  if (POSSE.test(norm)) return 'contexto';
  return idx === 0 ? 'intencao' : 'contexto';
}

/** Posições de cada ocorrência do termo e se está negada (janela de 5 palavras antes ou "api nenhuma"). */
function ocorrencias(norm, term) {
  const t = term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const re = new RegExp(`(^|[^a-z0-9])${t}(?=$|[^a-z0-9])`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(norm))) {
    const start = m.index + m[1].length;
    const antes = norm.slice(0, start).split(' ').slice(-6).join(' ');
    const depois = norm.slice(start + term.length).split(' ').slice(0, 3).join(' ');
    out.push({ negado: NEG.test(antes) || /^\s*(nenhum|nenhuma)\b/.test(depois) });
  }
  return out;
}

/**
 * Analisa o pedido. `correct` é o corretor do motor (normaliza e corrige digitação).
 * Devolve trechos com papéis, texto positivo (sem exemplos), restrições, exemplos e hipóteses.
 */
export function analisarSemantica(pedido, correct) {
  const hipoteses = [];
  const base = corrigirCloud(String(pedido || ''), hipoteses);
  const trechos = [];
  let continuacao = 0;
  dividir(base).forEach((orig, i) => {
    const { text } = correct(orig);
    const norm = text.replace(/\b(\w+)( \1\b)+/g, '$1');
    // "quero X, por exemplo Y": a parte antes do marcador é intenção; depois, exemplo
    const mk = norm.match(EXEMPLO);
    if (mk && mk.index > 0 && INTENCAO.test(norm.slice(0, mk.index))) {
      trechos.push({ orig, norm: norm.slice(0, mk.index).trim(), papel: 'intencao' });
      trechos.push({ orig, norm: norm.slice(mk.index).trim(), papel: 'exemplo' });
      continuacao = 2;
      return;
    }
    let papel = papelBase(norm, orig, trechos.length ? i : 0);
    if (papel === 'exemplo') continuacao = 3;
    else if (continuacao > 0 && papel !== 'preenchimento') {
      // frases narrativas logo após um exemplo continuam fazendo parte dele
      if (!INTENCAO_FORTE.test(norm) || NARRATIVA.test(norm)) { papel = 'exemplo'; continuacao -= 1; } else continuacao = 0;
    }
    trechos.push({ orig, norm, papel });
  });

  const positivos = trechos.filter(t => ROLE_WEIGHT[t.papel] > 0);
  const textoPositivo = positivos.map(t => t.norm).join(' . ');

  // Restrições: trecho que começa na negação, no texto original (até o fim da oração)
  const restricoes = [];
  for (const t of positivos) {
    const re = /(?<![\p{L}])(sem|n[ãa]o|nunca|nenhum|nenhuma)(?![\p{L}])[^,.;?!]{6,80}/giu;
    let m;
    while ((m = re.exec(t.orig))) {
      const frase = limparTranscricao(m[0]).replace(/\s+(entendeu|n[ée]|qualquer coisa)$/iu, '').replace(/[.?!]$/, '');
      const n = norm(frase);
      if (n.split(' ').length >= 3 && !/^nao (e|eh) que/.test(n) && !restricoes.some(r => norm(r).includes(n) || n.includes(norm(r)))) restricoes.push(frase.charAt(0).toUpperCase() + frase.slice(1));
    }
  }
  const exemplos = trechos.filter(t => t.papel === 'exemplo').map(t => limparTranscricao(t.orig)).filter((x, i, a) => x && a.indexOf(x) === i);
  const intencoes = trechos.filter(t => t.papel === 'intencao').map(t => limparTranscricao(t.orig));
  const contexto = trechos.filter(t => t.papel === 'contexto' || t.papel === 'analogia').map(t => limparTranscricao(t.orig));
  const perguntas = trechos.filter(t => t.papel === 'pergunta').map(t => limparTranscricao(t.orig));
  if (perguntas.length) hipoteses.push('O pedido inclui pergunta de viabilidade; o prompt prevê uma prova de conceito antes da implementação completa.');

  return { trechos, positivos, textoPositivo, restricoes, exemplos, intencoes, contexto, perguntas, hipoteses, textoBase: base };
}

/** Pontua um arquétipo pela evidência nos trechos. Exemplos e termos negados não contam. */
export function evidenciaArquetipo(arq, sem) {
  let score = 0; const fortes = new Set(), fracos = new Set(), emExemplo = new Set(), negados = new Set();
  for (const t of sem.trechos) {
    const w = ROLE_WEIGHT[t.papel] || 0;
    for (const term of arq.detect) {
      const occ = ocorrencias(t.norm, term);
      if (!occ.length) continue;
      if (t.papel === 'exemplo') { emExemplo.add(term); continue; }
      if (occ.every(o => o.negado)) { negados.add(term); continue; }
      if (!w) continue;
      const forte = term.includes(' ') || !WEAK_TERMS.has(term);
      (forte ? fortes : fracos).add(term);
      score += w * (forte ? 2 : 1);
    }
  }
  const ativo = score >= 1.2 && (fortes.size >= 1 || fracos.size >= 2);
  return { ativo, score: Math.round(score * 10) / 10, hits: [...fortes, ...fracos], emExemplo: [...emExemplo], negados: [...negados] };
}

/** Conceitos técnicos com evidência no texto positivo (classificação dinâmica). */
export function detectarConceitos(sem) {
  const txt = sem.textoPositivo;
  const out = [];
  for (const c of CONCEPTS) {
    let hits = c.triggers.filter(re => re.test(txt)).length;
    if (c.modalidades) {
      const mods = Object.entries(c.modalidades).filter(([, re]) => re.test(txt)).map(([k]) => k);
      if (mods.length >= c.minModalidades) hits += 1;
      if (hits) out.push({ c, hits, modalidades: mods });
      continue;
    }
    if (hits) out.push({ c, hits });
  }
  // gerar prompts sozinho não define um produto novo: só entra junto de outro conceito ou política
  const fortes = out.filter(x => x.c.id !== 'gerador-prompts');
  // a geração de prompts é meta (onde a política se aplica), por isso fica por último
  return (fortes.length ? out : []).sort((a, b) => (a.c.id === 'gerador-prompts') - (b.c.id === 'gerador-prompts') || b.hits - a.hits);
}

export function detectarPoliticas(sem) {
  const out = [];
  for (const [id, p] of Object.entries(POLICIES)) if (p.triggers.some(re => re.test(sem.textoPositivo))) out.push({ id, ...p });
  return out;
}

// ---------------------------------------------------------------------------
// Validação semântica antes da entrega
// ---------------------------------------------------------------------------
export const DOMINIOS_SENSIVEIS = [
  { id: 'comercio', nome: 'e-commerce, pagamentos, estoque e checkout',
    item: /\b(catalogo de produtos|carrinho|checkout|pagamento|pagamentos|estoque|gestao de pedidos|historico de pedidos|pedido pago|pedidos de outros clientes|cupom|cupons|loja|frete|gateway de pagamento|pci|preco|precos|area do cliente)\b/,
    pedido: /\b(loja|e-?commerce|ecommerce|vender|vendas|venda|carrinho|checkout|pagamento|pagamentos|pix|cartao|marketplace|estoque|frete|cupom|cupons|pedidos de compra|cobranca)\b/ },
  { id: 'membros', nome: 'área de membros e assinaturas', item: /\b(area de membros|assinantes|assinatura (mensal|recorrente|anual)|planos? de assinatura)\b/, pedido: /\b(membros|assinantes|assinatura (mensal|recorrente|anual)|planos? de assinatura|recorrencia)\b/ },
  { id: 'mobile', nome: 'aplicativo móvel', item: /\b(apk|play store|android|ios|masvs|permissoes minimas em tempo de execucao)\b/, pedido: /\b(android|apk|ios|iphone|celular|mobile|play store|app store)\b/ },
];

export function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s/+.-]/g, ' ').replace(/\s+/g, ' ').trim();
}
