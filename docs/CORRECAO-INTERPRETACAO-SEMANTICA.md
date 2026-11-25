# Correção do motor de interpretação semântica (v2.1.0)

## O problema, reproduzido

Pedido usado (transcrição de áudio real, em `tests/fixtures/pedido-soberania-transcricao.txt`): independência de APIs de terceiros, APIs próprias e IA multimodal (áudio, texto e voz), com a modificação de um projeto open source citada **só como exemplo**.

O motor v2.0 gerava `Loja virtual (e-commerce) + Aplicativo Android + API REST`, com catálogo, carrinho, pagamento, estoque e área do cliente. Ver `evidencias/prompt-antes-v2.0.md`.

Causas encontradas no código:

| # | Causa | Onde |
|---|---|---|
| 1 | O corretor ortográfico trocava **"projetos" por "produtos"** (distância de 2 letras), e "produtos" ativava e-commerce | `correct()` |
| 2 | Palavras genéricas sozinhas ativavam categorias: "aplicativo de prompts" ativava **Android**, e "API" ativava **API REST** | `interpret()` |
| 3 | Trechos de exemplo ("vamos supor", "é só um exemplo") contavam como pedido | `interpret()` |
| 4 | A negação só cobria "sem/não precisa de/não quero" seguidos de 1 ou 2 palavras; "não usasse API nenhuma de terceira" passava | `stripNegations()` |
| 5 | Não havia como classificar um pedido fora das categorias cadastradas, nem política transversal | — |

## O que mudou

- **`lib/semantic.js` (novo).** Divide o pedido em trechos e dá um papel a cada um: intenção, restrição, contexto, analogia, pergunta, exemplo ou preenchimento. Cada categoria só é ativada com evidência em trechos de intenção ou contexto. Termos genéricos (aplicativo, API, produtos, loja, sistema…) precisam de um termo específico ou de um segundo termo genérico. Exemplos e termos negados ficam registrados, mas não geram requisitos.
- **`lib/concepts.js` (novo).**
  - *Classificação dinâmica:* capacidades técnicas (modelo próprio, multimodal, independência de APIs, revisão de repositórios, geração de prompts) montam uma classificação própria quando nenhuma categoria cadastrada serve.
  - *Política transversal de soberania tecnológica:* vale para qualquer projeto e não é categoria.
- **Validação semântica antes da entrega** (`validarSemantica` em `lib/engine.js`). Remove requisitos, tecnologias, ameaças, normas e perguntas de domínios não pedidos (e-commerce/pagamentos/estoque, área de membros, mobile). Também aplica a política de soberania e responde às 7 perguntas exigidas.
- **Contradição real detectada.** O pedido cita "Claude" e pede independência de APIs de terceiros. O prompt registra o conflito e faz uma pergunta objetiva: Claude será só ferramenta de desenvolvimento, ou nada pode depender dele?
- **Correções:**
  - palavras comuns protegidas no corretor;
  - plurais não são "corrigidos" para o singular;
  - repetições de fala ("eu, eu", "do, do, do") são removidas;
  - "cloud" usado como agente é interpretado como "Claude" e registrado como hipótese.
- **Interface.** Novo cartão **Interpretação semântica**. O layout existente não mudou.

## Resultado

Mesmo pedido, v2.1: classificação dinâmica com:
- inventário de dependências externas;
- portas e adaptadores;
- implementações próprias com teste de paridade;
- servidor de inferência local;
- ajuste fino;
- transcrição e síntese de voz locais;
- revisão de repositórios.

O prompt também traz a seção de política de soberania, a contradição e a pergunta objetiva. Nenhum requisito de e-commerce, pagamento, estoque ou checkout. Ver `evidencias/prompt-depois-v2.1.md` e `evidencias/interpretacao-semantica.png`.

## Preservação

- **Os 15 cenários originais:** arquétipos, requisitos, número de palavras e nota ficam **idênticos** em 14 deles (comparação v2.0 × v2.1 em `tools/cenarios.json`).
- **A exceção é o cenário 12** ("plataforma com IA que analisa repositórios do GitHub…"). Ele ganhou o conceito "Revisão automatizada de repositórios", que corresponde ao pedido.
- **Seções preservadas no prompt:** requisitos funcionais e não funcionais, arquitetura, ameaças, referenciais, matriz de rastreabilidade, pipeline e regras de honestidade. Todas continuam presentes, e há teste para isso.

## Testes

`npm test`: **40 testes, 40 passando**: 28 que já existiam e 12 novos em `tests/semantic.test.js`. Os novos cobrem exemplos, negações, linguagem informal, erros ortográficos, transcrição de áudio, classificação dinâmica, a política em projetos diferentes e o caso de soberania com a transcrição real.

## Limites

- A interpretação é determinística, feita com regras. Frases muito diferentes das previstas ainda podem ser mal classificadas: o cartão de interpretação mostra o raciocínio para revisão.
- A lista de conceitos é curada. Um conceito novo exige uma entrada em `lib/concepts.js`.
