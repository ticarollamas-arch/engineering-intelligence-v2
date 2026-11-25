# Prompt técnico — Independência de APIs de terceiros + Modelo de IA próprio (pesos abertos, execução local) + Processamento multimodal (texto, áudio e voz) + Revisão automatizada de repositórios + Geração de prompts técnicos com políticas

## 1. Executor
Atue como uma equipe formada por: Arquiteto(a) de software, Engenheiro(a) backend, Engenheiro(a) de ML (MLOps), Engenheiro(a) de IA aplicada, Engenheiro(a) de software sênior, Especialista em AppSec, Engenheiro(a) de prompts.

## 2. Objetivo
Construir uma solução que reúna independência de APIs de terceiros; modelo de IA próprio (pesos abertos, execução local); processamento multimodal (texto, áudio e voz); revisão automatizada de repositórios; geração de prompts técnicos com políticas, com requisitos verificáveis, segurança desde a concepção e evidência de funcionamento.

## 3. Interpretação da solicitação
- Intenção principal: Crie uma aplicação que pro Claude toda vez quando ele for, ele, o Claude, ele revisar todos os meus repositórios do GitHub. É como se eu usasse somente Claude em todos os meus projetos e como eu usando o Claude em todos os meus projetos, eu gostaria que o Claude não usasse API nenhuma de terceira, seja pra qualquer projeto do meu repositório.
- Contexto: Eu tenho um aplicativo de prompts. Gerador de prompts.
- Requisitos técnicos implícitos: Independência de APIs de terceiros; Modelo de IA próprio (pesos abertos, execução local); Processamento multimodal (texto, áudio e voz); Revisão automatizada de repositórios; Geração de prompts técnicos com políticas.
- Exemplos citados (servem de ilustração, não viram requisito): Se eu fiz um, se eu, se eu fui num repositório, vamos supor, fui lá num repositório open source e esse repositório open source precisa de API, eu vou criar minha própria API pra que ele, pra descodificar. Descodificar como se eu quisesse desenvolver um sistema que já existe. […]
- Restrições: Não precisar mais usar APIs de terceiros de ninguém; Não usasse API nenhuma de terceira; Sem precisar de nenhuma API; Não depender de API de terceiros pra nada.
- Hipótese: "cloud" foi interpretado como "Claude" (assistente de IA), comum em transcrição de áudio.
- Hipótese: O pedido inclui pergunta de viabilidade; o prompt prevê uma prova de conceito antes da implementação completa.

## 4. Classificação do projeto
- Domínio principal: Engenharia de Software
- Domínios complementares: Arquitetura de software, Inteligência artificial
- Operação: Classificação dinâmica (sem categoria cadastrada)
- Nível de profundidade: Avançado

## 5. Política transversal — Soberania tecnológica
- Priorize APIs próprias, processamento local e modelos de pesos abertos executados na infraestrutura do projeto.
- Cada dependência externa que permanecer precisa de justificativa escrita, alternativa própria planejada e adaptador isolado.
- Nenhuma chave de provedor externo é necessária para o sistema funcionar; os testes passam com o tráfego de saída bloqueado.
- Use apenas fontes de dados com licença ou autorização de uso; registre a procedência de cada conjunto.
- Bibliotecas de código aberto são permitidas: elas rodam localmente e não são APIs de terceiros.
Esta política vale para todo o projeto e não acrescenta funcionalidades de negócio.

## 6. Conflitos a resolver antes de implementar
- O pedido cita um provedor de IA (ex.: Claude) e também pede independência de APIs de terceiros. Usar Claude, GPT ou Gemini é usar a API de um terceiro; independência total exige modelo de pesos abertos executado localmente. Decida se o provedor é só ferramenta de desenvolvimento (escreve o código) ou se nada pode depender dele.

## 7. Pergunta objetiva antes de implementar
Antes de implementar: o provedor de IA citado será usado só como ferramenta de desenvolvimento (o sistema final roda sem APIs de terceiros) ou nada pode depender dele, nem durante o desenvolvimento?

## 8. Requisitos funcionais
### RF-001 — Inventário de dependências externas
- Finalidade: Saber exatamente de quais serviços de terceiros o projeto depende.
- Comportamento esperado: Varrer código e manifestos para listar SDKs de provedores, chamadas HTTP a domínios externos e variáveis de chave de API, gerando um relatório por módulo.
- Entradas: Código-fonte e manifestos de dependências.
- Saídas: Lista de dependências externas com local de uso e criticidade.
- Restrições: A varredura é estática: nenhum código analisado é executado.
- Critério de aceitação: Uma chamada externa plantada num repositório de teste aparece no relatório com arquivo e linha.
- Validação (T-001): Teste com repositório de exemplo contendo dependências conhecidas.

### RF-002 — Camada de portas e adaptadores
- Finalidade: Trocar uma dependência externa sem reescrever o sistema.
- Comportamento esperado: Definir interfaces internas (portas) para cada capacidade usada (ex.: transcrição, busca, geração de texto) e isolar cada fornecedor num adaptador substituível.
- Entradas: Capacidades identificadas no inventário.
- Saídas: Interfaces internas e adaptadores configuráveis.
- Restrições: O núcleo do sistema não importa SDK de provedor diretamente.
- Critério de aceitação: Trocar o adaptador por configuração não exige mudança no núcleo.
- Validação (T-002): Teste de arquitetura que falha se o núcleo importar SDK externo.

### RF-003 — Implementações próprias com teste de paridade
- Finalidade: Substituir APIs de terceiros por funções próprias confiáveis.
- Comportamento esperado: Para cada dependência substituída, implementar a função com dados e modelos próprios e comparar as saídas com o comportamento esperado.
- Entradas: Contrato da porta e casos de referência.
- Saídas: Adaptador próprio aprovado nos testes de paridade.
- Restrições: Fontes de dados usadas precisam ter licença ou autorização de uso.
- Critério de aceitação: O adaptador próprio passa no mesmo conjunto de casos que o adaptador original.
- Validação (T-003): Suíte de paridade executada no CI.

### RF-004 — Servidor de inferência local
- Finalidade: Executar o modelo na própria infraestrutura, sem enviar dados a provedores.
- Comportamento esperado: Servir um modelo de pesos abertos (ex.: via llama.cpp, vLLM ou Ollama) por uma API interna com contrato próprio, tempo limite e fila de requisições.
- Entradas: Pergunta, tarefa ou documento do usuário.
- Saídas: Resposta do modelo ou erro claro de indisponibilidade.
- Restrições: Nenhuma chamada de inferência sai da rede controlada pelo projeto.
- Critério de aceitação: Com a saída para a internet bloqueada, a inferência continua respondendo.
- Validação (T-004): Teste de integração com egress de rede bloqueado.

### RF-005 — Ajuste fino com dados próprios
- Finalidade: Especializar o modelo no domínio do projeto.
- Comportamento esperado: Preparar conjunto de dados versionado, treinar adaptadores (ex.: LoRA/QLoRA) e só promover a nova versão se a avaliação melhorar.
- Entradas: Conjunto de dados autorizado e versionado.
- Saídas: Adaptador treinado com relatório de avaliação.
- Restrições: Só dados com licença ou autorização de uso entram no treino; dados pessoais são minimizados.
- Critério de aceitação: Versão nova com métrica pior que a atual não é promovida.
- Validação (T-005): Execução do conjunto de avaliação antes e depois do ajuste.

### RF-006 — Transcrição de áudio local (ASR)
- Finalidade: Transformar fala em texto sem serviço externo.
- Comportamento esperado: Transcrever áudio com modelo local (ex.: whisper.cpp), com marcação de tempo e idioma configurável.
- Entradas: Arquivo ou fluxo de áudio.
- Saídas: Texto transcrito com marcações de tempo.
- Restrições: O áudio não sai da infraestrutura do projeto; limite de duração por requisição.
- Critério de aceitação: Um áudio de referência é transcrito com taxa de erro de palavras (WER) dentro da meta definida.
- Validação (T-006): Teste com áudios de referência e cálculo de WER.

### RF-007 — Síntese de voz local (TTS)
- Finalidade: Responder por voz sem serviço externo.
- Comportamento esperado: Gerar áudio a partir do texto com modelo local (ex.: Piper), com escolha de voz e velocidade.
- Entradas: Texto da resposta.
- Saídas: Arquivo ou fluxo de áudio.
- Restrições: Vozes usadas têm licença compatível com o uso do projeto.
- Critério de aceitação: Texto de referência gera áudio audível e inteligível dentro do tempo-alvo.
- Validação (T-007): Teste automatizado de geração e revisão humana de amostras.

### RF-008 — Coleta e inventário dos repositórios
- Finalidade: Ter todos os repositórios disponíveis para revisão.
- Comportamento esperado: Listar e clonar os repositórios autorizados com token somente-leitura, registrando linguagem, tamanho e última atualização.
- Entradas: Lista de repositórios ou conta autorizada.
- Saídas: Inventário de repositórios clonados.
- Restrições: Token com permissão mínima (somente leitura); nada é alterado nos repositórios.
- Critério de aceitação: Repositório sem permissão aparece como "não acessível", sem interromper os demais.
- Validação (T-008): Teste com repositórios públicos, privados e inexistentes.

### RF-009 — Avaliação contínua do modelo
- Finalidade: Detectar regressões ao trocar modelo, adaptador ou prompt.
- Comportamento esperado: Manter conjunto fixo de casos com respostas esperadas e calcular taxa de acerto a cada mudança.
- Entradas: Conjunto de avaliação versionado.
- Saídas: Relatório de acerto por versão.
- Restrições: Os casos de avaliação não entram no treino.
- Critério de aceitação: O pipeline falha se a taxa de acerto cair abaixo do limiar definido.
- Validação (T-009): Execução do conjunto no CI.

### RF-010 — Orquestração entre modalidades
- Finalidade: Encadear áudio, texto e voz num fluxo único.
- Comportamento esperado: Receber áudio ou texto, transcrever quando preciso, enviar ao modelo e devolver texto e/ou voz, registrando cada etapa.
- Entradas: Entrada em qualquer modalidade suportada.
- Saídas: Resposta na modalidade pedida.
- Restrições: Cada etapa tem tempo limite e falha de forma explícita.
- Critério de aceitação: Uma pergunta falada recebe resposta em voz, com a transcrição registrada.
- Validação (T-010): Teste ponta a ponta com áudio de exemplo.

### RF-011 — Relatório de revisão por repositório
- Finalidade: Mostrar o que precisa de atenção em cada projeto.
- Comportamento esperado: Gerar relatório por repositório com dependências externas, segredos expostos, riscos e sugestão de substituição.
- Entradas: Repositório clonado e regras de análise.
- Saídas: Relatório em Markdown e JSON.
- Restrições: Segredos encontrados aparecem mascarados.
- Critério de aceitação: Um segredo plantado aparece mascarado no relatório do repositório certo.
- Validação (T-011): Teste com repositório de exemplo contendo achados conhecidos.

### RF-012 — Políticas aplicadas em todo prompt gerado
- Finalidade: Garantir que as preferências permanentes do usuário entrem em todos os prompts.
- Comportamento esperado: Permitir ativar políticas transversais (ex.: soberania tecnológica) que acrescentam diretrizes e filtram tecnologias em qualquer prompt gerado.
- Entradas: Políticas ativas e pedido do usuário.
- Saídas: Prompt com a seção de política e sem tecnologias que a violem.
- Restrições: Uma política nunca adiciona funcionalidades de negócio ao prompt.
- Critério de aceitação: Com a política ativa, nenhum prompt gerado recomenda API de provedor externo.
- Validação (T-012): Teste automatizado sobre um conjunto de pedidos de domínios diferentes.

## 9. Requisitos não funcionais
- RNF-001 — Independência operacional: A suíte de testes passa com o tráfego de saída para a internet bloqueado.
- RNF-002 — Hardware de inferência: Documentar requisitos mínimos (RAM/VRAM) e latência medida no hardware alvo; primeira resposta em até 5 s em streaming.
- RNF-003 — Latência multimodal: Ciclo voz → resposta em voz em até 8 s para perguntas curtas no hardware alvo.
- RNF-004 — Escala da revisão: Revisar 100 repositórios pequenos em até 30 min, com retomada após falha.

## 10. Arquitetura proporcional
Componentes: Inventário de dependências externas · Camada de portas e adaptadores · Implementações próprias · Servidor de inferência local · Pipeline de dados e ajuste fino · Avaliação de modelos · Reconhecimento de fala · Síntese de voz · Orquestrador multimodal · Coletor de repositórios · Relatório por repositório · Motor de geração de prompts.
Organize os componentes em módulos com fronteiras claras; extraia serviços apenas onde houver necessidade medida de escala ou isolamento.

## 11. Tecnologias e justificativas
- Arquitetura hexagonal (portas e adaptadores) — isola fornecedores e permite trocar por implementação própria
- Servidor de inferência local (llama.cpp, vLLM ou Ollama) com modelo de pesos abertos — mantém dados e custo sob controle do projeto, sem chave de provedor
- Adaptadores LoRA/QLoRA para ajuste fino — especializa o modelo com pouco hardware
- whisper.cpp para transcrição e Piper para síntese de voz — modelos abertos que rodam localmente, inclusive em CPU
- git CLI e análise estática local — revisão sem depender de serviço externo de análise
Troque qualquer escolha se o contexto pedir, registrando o motivo.

## 12. Modelo de ameaças (resumo)
- AM-001 — Dependência oculta reintroduzida por biblioteca → controle: Inventário no CI e bloqueio de egress nos testes
- AM-002 — Envenenamento de dados de treino → controle: Procedência registrada, revisão de amostras e avaliação antes de promover
- AM-003 — Arquivos de mídia maliciosos ou gigantes → controle: Validação de formato, limite de tamanho e processamento isolado
- AM-004 — Vazamento do token de acesso → controle: Token só em variável de ambiente, escopo mínimo e rotação

## 13. Referenciais aplicáveis
### NIST SSDF (SP 800-218)
- Motivo: organiza práticas de desenvolvimento seguro em todo o ciclo de vida
- Requisito aplicável: proteger o software, produzir software bem protegido e responder a vulnerabilidades
- Controle técnico: revisão de código, testes de segurança automatizados e processo de correção
- Implementação: checklist de práticas incorporado ao fluxo de PR e ao CI
- Verificação: auditoria do pipeline e dos registros de PR
- Evidência esperada: histórico de execuções do CI e registro de correções

### SLSA
- Motivo: protege a integridade da cadeia de build e das dependências
- Requisito aplicável: build automatizado com procedência registrada
- Controle técnico: build no CI, artefato assinado e dependências fixadas
- Implementação: geração de procedência no pipeline
- Verificação: verificação da procedência no deploy
- Evidência esperada: atestados de procedência anexados à versão

### OWASP Top 10 para aplicações com LLM
- Motivo: cobre riscos específicos de LLMs, como prompt injection e vazamento de dados
- Requisito aplicável: separar instruções de dados, limitar ferramentas e validar saídas
- Controle técnico: guarda de entrada/saída e confirmação humana para ações
- Implementação: camada de política antes de qualquer ação do agente
- Verificação: bateria de testes de injeção
- Evidência esperada: resultado da bateria por versão

Não declare conformidade ou certificação sem auditoria formal; cite identificadores de controles só a partir da fonte oficial.

## 14. Matriz de rastreabilidade
| Requisito | Componente | Controle | Teste | Aceitação |
|---|---|---|---|---|
| RF-001 | Inventário de dependências externas | Análise estática sem execução | T-001 | Uma chamada externa plantada num repositório de teste aparece no relatório com arquivo e linha. |
| RF-002 | Camada de portas e adaptadores | Regra de dependência verificada no CI | T-002 | Trocar o adaptador por configuração não exige mudança no núcleo. |
| RF-003 | Implementações próprias | Licença das fontes de dados registrada | T-003 | O adaptador próprio passa no mesmo conjunto de casos que o adaptador original. |
| RF-004 | Servidor de inferência local | Isolamento de rede e autenticação na API interna | T-004 | Com a saída para a internet bloqueada, a inferência continua respondendo. |
| RF-005 | Pipeline de dados e ajuste fino | Procedência e licença dos dados registradas | T-005 | Versão nova com métrica pior que a atual não é promovida. |
| RF-006 | Reconhecimento de fala | Limite de tamanho e validação do formato de áudio | T-006 | Um áudio de referência é transcrito com taxa de erro de palavras (WER) dentro da meta definida. |
| RF-007 | Síntese de voz | Licença das vozes registrada | T-007 | Texto de referência gera áudio audível e inteligível dentro do tempo-alvo. |
| RF-008 | Coletor de repositórios | Token de leitura com escopo mínimo | T-008 | Repositório sem permissão aparece como "não acessível", sem interromper os demais. |
| RF-009 | Avaliação de modelos | Separação entre dados de treino e de avaliação | T-009 | O pipeline falha se a taxa de acerto cair abaixo do limiar definido. |
| RF-010 | Orquestrador multimodal | Tempo limite e registro por etapa | T-010 | Uma pergunta falada recebe resposta em voz, com a transcrição registrada. |
| RF-011 | Relatório por repositório | Mascaramento de segredos | T-011 | Um segredo plantado aparece mascarado no relatório do repositório certo. |
| RF-012 | Motor de geração de prompts | Validação semântica antes da entrega | T-012 | Com a política ativa, nenhum prompt gerado recomenda API de provedor externo. |

## 15. Pipeline e implantação
- CI a cada push: lint, testes dos requisitos (T-xxx) e build.
- Gates: SAST, SCA e varredura de segredos bloqueando achados críticos/altos.
- Ambientes de homologação e produção separados, deploy com aprovação e rollback testado.

## 16. Informações ausentes (assuma um padrão razoável e declare)
- Quais capacidades hoje dependem de APIs externas (ex.: geração de texto, voz, busca, armazenamento)?
- Qual hardware estará disponível para inferência e treino (CPU, GPU, memória)?
- Quais repositórios entram na revisão e com que frequência?

## 17. Entregáveis
- Resposta direta à pergunta de viabilidade, com uma prova de conceito mínima antes da implementação completa.
- Código-fonte versionado com histórico de commits.
- Testes automatizados cobrindo T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-009, T-010, T-011, T-012.
- Pipeline de CI/CD funcionando.
- Documentação: README, decisões de arquitetura e, se houver API, contrato OpenAPI.

## 18. Regras de honestidade
- Não invente resultados, testes ou funcionalidades.
- Separe o que foi implementado, o que foi testado e o que ficou pendente.
- Se algo não puder ser feito, explique o motivo e a alternativa.
