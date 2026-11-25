// Testes de interpretação semântica (v2.1): exemplos, negações, fala informal, transcrição de áudio,
// classificação dinâmica e política transversal de soberania tecnológica.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, correct } from '../lib/engine.js';

const COMERCIO = /\b(cat[aá]logo de produtos|carrinho|checkout|pagamento|pagamentos|estoque|gateway de pagamento|PCI DSS|pedidos de outros clientes|[aá]rea do cliente|cupom|cupons|frete)\b/i;
const titulos = a => a.requisitos.map(r => r.t).join(' | ');
const corpoSemInterpretacao = a => a.prompt.replace(/## \d+\. Interpretação da solicitação[\s\S]*?(?=\n## )/, '');

test('soberania tecnológica (transcrição real): sem e-commerce, pagamentos, estoque ou checkout', () => {
  const pedido = readFileSync(new URL('./fixtures/pedido-soberania-transcricao.txt', import.meta.url), 'utf8');
  const a = analyze(pedido);
  for (const proibido of ['Loja virtual (e-commerce)', 'Aplicativo Android', 'API REST']) assert.ok(!a.arquetipos.includes(proibido), `não pode classificar como ${proibido}`);
  assert.doesNotMatch(titulos(a), COMERCIO);
  assert.doesNotMatch(corpoSemInterpretacao(a), COMERCIO, 'o prompt não pode trazer requisitos de comércio');
  assert.ok(!a.normas.some(n => /PCI/.test(n.nome)));
  assert.ok(!a.tecnologias.some(t => /stripe|mercado pago|openai|api de llm/i.test(t.i)));
  // o que foi pedido de fato
  for (const t of ['dependências externas', 'adaptadores', 'inferência local', 'Transcrição de áudio', 'Síntese de voz', 'repositórios']) assert.match(titulos(a), new RegExp(t, 'i'));
  assert.ok(a.semantica.classificacaoDinamica, 'nenhuma categoria cadastrada representa o pedido');
  // soberania é política transversal, não categoria
  assert.deepEqual(a.semantica.politicas, ['Soberania tecnológica']);
  assert.match(a.prompt, /Política transversal — Soberania tecnológica/);
  assert.ok(!a.arquetipos.some(x => /soberania/i.test(x)));
  // exemplo registrado, não transformado em requisito
  assert.ok(a.semantica.exemplos.some(e => /vamos supor/i.test(e)));
  assert.ok(a.semantica.descartados.some(d => d.arquetipo === 'API REST' && /exemplo/.test(d.motivo)));
  // contradição real do pedido: usar Claude é usar API de terceiro
  assert.ok(a.interpretacao.conflitos.some(c => /Claude/.test(c)));
  assert.ok(a.semantica.perguntaObjetiva);
  assert.ok(!a.interpretacao.correcoes.some(([de, para]) => de === 'projetos' && para === 'produtos'));
  assert.equal(a.semantica.validacao.length, 7);
});

test('corretor não troca palavras comuns por termos do vocabulário', () => {
  assert.equal(correct('modificar projetos existentes').text, 'modificar projetos existentes');
  assert.equal(correct('aplicatvo andorid').text, 'aplicativo android');
});

test('"aplicativo" sozinho não ativa Android', () => {
  const a = analyze('Quero melhorar o meu aplicativo de prompts técnicos');
  assert.ok(!a.arquetipos.includes('Aplicativo Android'));
});

test('exemplo no meio da frase não vira requisito', () => {
  const a = analyze('Quero um chatbot de IA para atender minha empresa, por exemplo para vender produtos');
  assert.ok(a.arquetipos.includes('Aplicação com inteligência artificial'));
  assert.ok(!a.arquetipos.includes('Loja virtual (e-commerce)'));
  assert.doesNotMatch(titulos(a), COMERCIO);
});

test('exemplo de outra área em pedido de agendamento', () => {
  const a = analyze('Sistema de agendamento para clínica veterinária. Vamos supor, tipo uma loja que vende horários, é só um exemplo.');
  assert.match(titulos(a), /Agenda e disponibilidade/);
  assert.doesNotMatch(titulos(a), COMERCIO);
});

test('negações: "sem pagamentos" remove pagamentos, mas mantém o que foi pedido', () => {
  const a = analyze('Quero criar um aplicativo Android de lista de tarefas, sem pagamentos e sem loja');
  assert.ok(a.arquetipos.includes('Aplicativo Android'));
  assert.ok(!a.arquetipos.includes('Loja virtual (e-commerce)'));
  assert.ok(!a.normas.some(n => /PCI/.test(n.nome)));
});

test('transcrição de áudio com vícios de fala', () => {
  const a = analyze('então né eu queria tipo um site institucional pra minha clínica, entendeu? não precisa de loja nem de pagamento');
  assert.ok(a.arquetipos.includes('Site / aplicação web'));
  assert.ok(!a.arquetipos.includes('Loja virtual (e-commerce)'));
  assert.doesNotMatch(titulos(a), COMERCIO);
});

test('linguagem informal e erros ortográficos continuam reconhecidos', () => {
  const a = analyze('qero cria um aplicativo andorid pra vende roupa com pix');
  assert.ok(a.arquetipos.includes('Aplicativo Android'));
  assert.ok(a.arquetipos.includes('Loja virtual (e-commerce)'), 'comércio pedido explicitamente continua presente');
});

test('classificação dinâmica para pedido sem categoria cadastrada', () => {
  const a = analyze('Quero transcrever áudios e responder por voz usando um modelo local de pesos abertos');
  assert.ok(a.semantica.classificacaoDinamica);
  assert.match(titulos(a), /Transcrição de áudio/); assert.match(titulos(a), /Síntese de voz/);
  assert.equal(a.mode, 'ia');
  assert.doesNotMatch(titulos(a), COMERCIO);
});

test('política de soberania se aplica a qualquer tipo de projeto', () => {
  const a = analyze('Desenvolver uma API REST sem depender de serviços de terceiros');
  assert.ok(a.arquetipos.includes('API REST'));
  assert.ok(a.semantica.politicas.includes('Soberania tecnológica'));
  assert.match(a.prompt, /Política transversal — Soberania tecnológica/);
  assert.ok(a.naoFuncionais.some(r => /saída para a internet bloqueado/.test(r.m)));
});

test('comércio pedido explicitamente é mantido mesmo com a política ativa', () => {
  const a = analyze('Quero desenvolver uma loja virtual com Pix sem depender de APIs de terceiros');
  assert.ok(a.arquetipos.includes('Loja virtual (e-commerce)'));
  assert.match(titulos(a), /Carrinho e checkout/);
  assert.ok(a.semantica.politicas.includes('Soberania tecnológica'));
});

test('profundidade preservada: rastreabilidade, ameaças, normas e testes', () => {
  const pedido = readFileSync(new URL('./fixtures/pedido-soberania-transcricao.txt', import.meta.url), 'utf8');
  const a = analyze(pedido);
  for (const s of ['Requisitos funcionais', 'Requisitos não funcionais', 'Arquitetura proporcional', 'Tecnologias e justificativas', 'Modelo de ameaças', 'Referenciais aplicáveis', 'Matriz de rastreabilidade', 'Pipeline e implantação', 'Entregáveis', 'Regras de honestidade'])
    assert.match(a.prompt, new RegExp(`## \\d+\\. ${s}`), `seção ausente: ${s}`);
  assert.ok(a.requisitos.length >= 8);
  assert.equal(a.rastreabilidade.length, a.requisitos.length);
  for (const r of a.requisitos) for (const k of ['t', 'f', 'c', 'in', 'out', 'r', 'ac', 'v']) assert.ok(r[k] && r[k].length > 3, `${r.id} sem ${k}`);
});
