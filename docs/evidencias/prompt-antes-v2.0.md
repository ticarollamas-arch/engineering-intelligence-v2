# Prompt técnico — Loja virtual (e-commerce) + Aplicativo Android + API REST

## 1. Executor
Atue como uma equipe formada por: Engenheiro(a) full stack, Especialista em AppSec, Especialista em UX, Engenheiro(a) DevSecOps, Desenvolvedor(a) Android, Especialista em AppSec mobile, Engenheiro(a) backend, Especialista em segurança de APIs.

## 2. Objetivo
Construir loja virtual com catálogo, pedidos e pagamentos + aplicativo Android + API REST documentada e segura, com requisitos verificáveis, segurança desde a concepção e evidência de funcionamento.

## 3. Classificação do projeto
- Domínio principal: Engenharia de Software
- Domínios complementares: Application Security, Proteção de dados, Desenvolvimento mobile
- Operação: Transações e operação comercial
- Nível de profundidade: Avançado

## 4. Requisitos funcionais
### RF-001 — Catálogo de produtos
- Finalidade: Permitir que o cliente encontre e avalie produtos.
- Comportamento esperado: Listar produtos com busca, filtros por categoria e preço, página de detalhe com fotos, variações e disponibilidade.
- Entradas: Cadastro de produtos (nome, preço, variações, estoque, imagens).
- Saídas: Páginas de listagem e de detalhe.
- Restrições: Preço e estoque sempre lidos do servidor.
- Critério de aceitação: Busca por termo retorna só produtos que contêm o termo; produto sem estoque aparece como indisponível.
- Validação (T-001): Testes de API e de ponta a ponta na busca e no detalhe.

### RF-002 — Carrinho e checkout
- Finalidade: Converter interesse em pedido.
- Comportamento esperado: Adicionar/remover itens, recalcular totais e frete no servidor, coletar endereço e confirmar o pedido.
- Entradas: Itens, quantidades, CEP e dados de entrega.
- Saídas: Pedido criado com valor total calculado no servidor.
- Restrições: O total enviado pelo navegador é ignorado; recalculado no servidor.
- Critério de aceitação: Alterar o preço no navegador não altera o valor cobrado.
- Validação (T-002): Teste de manipulação de parâmetros no checkout.

### RF-003 — Pagamento por gateway
- Finalidade: Receber pagamentos sem tratar dados de cartão diretamente.
- Comportamento esperado: Criar cobrança no gateway (Pix/cartão), receber confirmação por webhook assinado e atualizar o pedido.
- Entradas: Pedido e método de pagamento.
- Saídas: Status do pagamento e do pedido.
- Restrições: Dados completos de cartão nunca passam pelo servidor da loja; webhook só é aceito com assinatura válida.
- Critério de aceitação: Webhook com assinatura inválida é rejeitado e o pedido não muda de estado.
- Validação (T-003): Teste com webhook assinado e não assinado no ambiente de sandbox do gateway.

### RF-004 — Permissões mínimas em tempo de execução
- Finalidade: Pedir só o necessário e explicar o motivo.
- Comportamento esperado: Solicitar cada permissão no momento do uso, com explicação, e manter o app funcional quando negada.
- Entradas: Ação do usuário que exige permissão.
- Saídas: Permissão concedida ou fluxo alternativo.
- Restrições: Nenhuma permissão declarada sem uso no código.
- Critério de aceitação: Negar a permissão não derruba o app e mostra alternativa.
- Validação (T-004): Teste instrumentado negando cada permissão; revisão do AndroidManifest.

### RF-005 — Armazenamento local seguro
- Finalidade: Proteger dados e tokens no dispositivo.
- Comportamento esperado: Guardar tokens no Android Keystore e dados sensíveis criptografados; nada sensível em logs ou armazenamento externo.
- Entradas: Tokens e dados do usuário.
- Saídas: Dados persistidos de forma segura.
- Restrições: Sem segredos de API embutidos no APK.
- Critério de aceitação: Busca por chaves e tokens no APK decompilado não encontra segredos.
- Validação (T-005): Análise do APK (decompilação) e revisão de logs.

### RF-006 — Comunicação segura com a API
- Finalidade: Proteger dados em trânsito.
- Comportamento esperado: Todas as chamadas via HTTPS, com tratamento de erro de rede e repetição controlada.
- Entradas: Requisições do app.
- Saídas: Respostas tratadas e estados de erro claros.
- Restrições: Tráfego em texto claro bloqueado (network security config).
- Critério de aceitação: Requisição HTTP sem TLS é recusada pelo app.
- Validação (T-006): Teste com proxy de interceptação.

### RF-007 — Contrato OpenAPI
- Finalidade: Definir a API antes de implementar e manter documentação fiel.
- Comportamento esperado: Especificar recursos, métodos, esquemas, códigos de erro e paginação em OpenAPI; validar requisições contra o contrato.
- Entradas: Recursos do domínio.
- Saídas: Arquivo OpenAPI e documentação navegável.
- Restrições: Mudança incompatível exige nova versão (/v2).
- Critério de aceitação: Requisição fora do esquema retorna 400 com erro descritivo.
- Validação (T-007): Testes de contrato gerados a partir do OpenAPI.

### RF-008 — Autenticação e autorização por objeto
- Finalidade: Cada cliente acessa só o que é dele.
- Comportamento esperado: Autenticar com tokens de curta duração e verificar a posse de cada recurso em toda operação.
- Entradas: Token e identificador do recurso.
- Saídas: Resposta autorizada ou 403/404.
- Restrições: Nenhum endpoint de escrita sem autenticação.
- Critério de aceitação: Usuário A não consegue ler nem alterar recurso do usuário B.
- Validação (T-008): Testes de BOLA para cada recurso.

### RF-009 — Paginação, filtros e limites
- Finalidade: Evitar respostas gigantes e abuso.
- Comportamento esperado: Paginação por cursor ou página com tamanho máximo, filtros explícitos e rate limiting por cliente.
- Entradas: Parâmetros de consulta.
- Saídas: Página de resultados e metadados.
- Restrições: Tamanho máximo de página fixo no servidor.
- Critério de aceitação: Pedir 10.000 itens retorna no máximo o limite definido.
- Validação (T-009): Teste de limite e de rate limiting.

### RF-010 — Gestão de pedidos e estoque
- Finalidade: Manter estoque e pedidos consistentes.
- Comportamento esperado: Reservar estoque ao confirmar o pagamento, permitir cancelamento e devolução, registrar histórico do pedido.
- Entradas: Eventos de pagamento, cancelamento e envio.
- Saídas: Estoque atualizado e linha do tempo do pedido.
- Restrições: Duas compras simultâneas não podem vender a mesma última unidade.
- Critério de aceitação: Teste concorrente com 2 compras do último item resulta em 1 pedido pago e 1 recusado.
- Validação (T-010): Teste de concorrência na reserva de estoque.

### RF-011 — Área do cliente
- Finalidade: Dar autonomia ao cliente sobre pedidos e dados.
- Comportamento esperado: Cadastro, login, histórico de pedidos, edição de dados e solicitação de exclusão da conta.
- Entradas: Credenciais e dados pessoais.
- Saídas: Conta e histórico.
- Restrições: Cliente só acessa os próprios pedidos.
- Critério de aceitação: Trocar o ID do pedido na URL não exibe pedido de outro cliente.
- Validação (T-011): Teste de IDOR/BOLA.

### RF-012 — Painel administrativo
- Finalidade: Operar a loja.
- Comportamento esperado: Gerenciar produtos, preços, estoque, pedidos e cupons, com papéis de acesso.
- Entradas: Ações dos administradores.
- Saídas: Dados atualizados e log de alterações.
- Restrições: Acesso só com MFA e papel adequado.
- Critério de aceitação: Usuário sem papel administrativo recebe 403 em todas as rotas do painel.
- Validação (T-012): Testes de autorização por papel.

## 5. Requisitos não funcionais
- RNF-001 — Desempenho: Página de produto com LCP abaixo de 2,5 s em conexão 4G.
- RNF-002 — Disponibilidade no checkout: Falha do gateway gera mensagem clara e o pedido fica pendente, sem cobrança duplicada.
- RNF-003 — Acessibilidade: Fluxo de compra navegável por teclado e com contraste adequado.
- RNF-004 — Compatibilidade: Definir minSdk e targetSdk e testar em pelo menos uma versão antiga e uma recente.
- RNF-005 — Inicialização: Abertura a frio abaixo de 2 s em aparelho intermediário.
- RNF-006 — Latência: p95 abaixo de 300 ms nas rotas de leitura com volume esperado.

## 6. Arquitetura proporcional
Componentes: Catálogo · Carrinho e checkout · Integração com gateway de pagamento · Gestão de pedidos e estoque · Área do cliente · Painel administrativo · Interface (telas) · Camada de dados local · Cliente de API · Gerenciador de permissões · Pipeline de build e assinatura · Camada de rotas e validação · Serviços de domínio · Persistência · Autenticação e autorização · Documentação OpenAPI.
Organize os componentes em módulos com fronteiras claras; extraia serviços apenas onde houver necessidade medida de escala ou isolamento.

## 7. Tecnologias e justificativas
- Gateway de pagamento com Pix e cartão (ex.: Mercado Pago, Stripe) — tira os dados de cartão do escopo da loja
- PostgreSQL com transações — consistência de estoque e pedidos
- Kotlin com Jetpack Compose — padrão atual do Android
- Gradle com assinatura no CI — build reprodutível
- FastAPI (Python) ou Fastify (Node.js) — validação por esquema e OpenAPI nativos
- PostgreSQL — consistência e consultas ricas
Troque qualquer escolha se o contexto pedir, registrando o motivo.

## 8. Modelo de ameaças (resumo)
- AM-001 — Adulteração de preço ou quantidade → controle: Cálculo de totais no servidor
- AM-002 — Acesso a pedidos de outros clientes → controle: Autorização por objeto em toda consulta
- AM-003 — Webhook de pagamento forjado → controle: Assinatura e idempotência
- AM-004 — Segredo embutido no APK → controle: Segredos só no servidor
- AM-005 — Interceptação de tráfego → controle: TLS obrigatório
- AM-006 — Dados expostos em backup ou logs → controle: Keystore, exclusão de backup e logs sem dados sensíveis

## 9. Referenciais aplicáveis
### OWASP ASVS
- Motivo: fornece requisitos verificáveis de segurança para aplicações web
- Requisito aplicável: autenticação, gestão de sessão, controle de acesso e validação de entrada no nível adequado ao risco
- Controle técnico: controles mapeados aos capítulos do ASVS escolhidos
- Implementação: lista dos requisitos ASVS aplicáveis no backlog, com dono
- Verificação: testes automatizados e revisão manual por requisito
- Evidência esperada: planilha de requisitos ASVS com status e link do teste

### OWASP Top 10
- Motivo: cobre as classes de falha mais frequentes em aplicações web
- Requisito aplicável: mitigar controle de acesso quebrado, injeção, falhas criptográficas e configuração insegura
- Controle técnico: autorização por objeto, consultas parametrizadas, TLS e cabeçalhos
- Implementação: regras de SAST e casos de teste por categoria
- Verificação: SAST no CI e testes dirigidos
- Evidência esperada: relatório do SAST e resultados dos testes

### OWASP API Security Top 10
- Motivo: trata riscos específicos de APIs, como autorização por objeto e consumo de recursos
- Requisito aplicável: autorização por objeto e por função, limites de consumo e inventário de endpoints
- Controle técnico: checagem de posse, rate limiting e versionamento
- Implementação: middleware de autorização e limites configuráveis
- Verificação: testes de BOLA e de limite em cada recurso
- Evidência esperada: resultado dos testes por endpoint

### LGPD
- Motivo: o projeto trata dados pessoais de pessoas no Brasil
- Requisito aplicável: base legal, minimização, transparência e atendimento aos direitos do titular
- Controle técnico: coleta mínima, consentimento quando exigido, exclusão e exportação de dados
- Implementação: política de privacidade, registro de tratamentos e fluxo de exclusão
- Verificação: revisão do inventário de dados e teste do fluxo de exclusão
- Evidência esperada: inventário de dados pessoais e teste de exclusão

### PCI DSS
- Motivo: há pagamento com cartão
- Requisito aplicável: reduzir o escopo usando gateway que tokeniza o cartão
- Controle técnico: dados de cartão nunca trafegam pelo servidor da loja
- Implementação: checkout hospedado ou campos seguros do gateway
- Verificação: revisão do fluxo de pagamento e dos logs
- Evidência esperada: diagrama do fluxo mostrando que o cartão não passa pelo servidor

### WCAG
- Motivo: há interface usada por pessoas, que precisa ser acessível
- Requisito aplicável: contraste, navegação por teclado, textos alternativos e rótulos
- Controle técnico: componentes acessíveis e testes automatizados de acessibilidade
- Implementação: checagens de acessibilidade no CI e revisão manual
- Verificação: ferramenta automatizada mais teste com teclado e leitor de tela
- Evidência esperada: relatório da ferramenta e roteiro de teste manual

### NIST SSDF (SP 800-218)
- Motivo: organiza práticas de desenvolvimento seguro em todo o ciclo de vida
- Requisito aplicável: proteger o software, produzir software bem protegido e responder a vulnerabilidades
- Controle técnico: revisão de código, testes de segurança automatizados e processo de correção
- Implementação: checklist de práticas incorporado ao fluxo de PR e ao CI
- Verificação: auditoria do pipeline e dos registros de PR
- Evidência esperada: histórico de execuções do CI e registro de correções

Não declare conformidade ou certificação sem auditoria formal; cite identificadores de controles só a partir da fonte oficial.

## 10. Matriz de rastreabilidade
| Requisito | Componente | Controle | Teste | Aceitação |
|---|---|---|---|---|
| RF-001 | Catálogo | Validação e codificação de saída (XSS) | T-001 | Busca por termo retorna só produtos que contêm o termo; produto sem estoque aparece como indisponível. |
| RF-002 | Carrinho e checkout | Recalculo no servidor e proteção contra adulteração | T-002 | Alterar o preço no navegador não altera o valor cobrado. |
| RF-003 | Integração com gateway de pagamento | Verificação de assinatura e idempotência do webhook | T-003 | Webhook com assinatura inválida é rejeitado e o pedido não muda de estado. |
| RF-004 | Gerenciador de permissões | Princípio do menor privilégio | T-004 | Negar a permissão não derruba o app e mostra alternativa. |
| RF-005 | Camada de dados local | Keystore e criptografia em repouso | T-005 | Busca por chaves e tokens no APK decompilado não encontra segredos. |
| RF-006 | Cliente de API | TLS obrigatório; pinning quando aplicável | T-006 | Requisição HTTP sem TLS é recusada pelo app. |
| RF-007 | Documentação OpenAPI | Validação de entrada por esquema | T-007 | Requisição fora do esquema retorna 400 com erro descritivo. |
| RF-008 | Autenticação e autorização | Checagem de posse no servidor | T-008 | Usuário A não consegue ler nem alterar recurso do usuário B. |
| RF-009 | Camada de rotas e validação | Rate limiting (API4) | T-009 | Pedir 10.000 itens retorna no máximo o limite definido. |
| RF-010 | Gestão de pedidos e estoque | Transações no banco | T-010 | Teste concorrente com 2 compras do último item resulta em 1 pedido pago e 1 recusado. |
| RF-011 | Área do cliente | Autorização por objeto | T-011 | Trocar o ID do pedido na URL não exibe pedido de outro cliente. |
| RF-012 | Painel administrativo | RBAC e MFA | T-012 | Usuário sem papel administrativo recebe 403 em todas as rotas do painel. |

## 11. Pipeline e implantação
- CI a cada push: lint, testes dos requisitos (T-xxx) e build.
- Gates: SAST, SCA e varredura de segredos bloqueando achados críticos/altos.
- Ambientes de homologação e produção separados, deploy com aprovação e rollback testado.

## 12. Informações ausentes (assuma um padrão razoável e declare)
- Quais meios de pagamento (Pix, cartão, boleto)?
- Haverá cálculo de frete por transportadora?
- O app precisa funcionar offline?
- Haverá publicação na Play Store?

## 13. Entregáveis
- Código-fonte versionado com histórico de commits.
- Testes automatizados cobrindo T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012.
- Pipeline de CI/CD funcionando.
- Documentação: README, decisões de arquitetura e, se houver API, contrato OpenAPI.

## 14. Regras de honestidade
- Não invente resultados, testes ou funcionalidades.
- Separe o que foi implementado, o que foi testado e o que ficou pendente.
- Se algo não puder ser feito, explique o motivo e a alternativa.
