// Conceitos técnicos e políticas transversais.
//
// Conceitos são capacidades mais finas que os arquétipos. Quando nenhum arquétipo cadastrado
// explica o pedido, o motor monta uma classificação própria juntando os conceitos com evidência
// (classificação dinâmica). Políticas não são categorias de aplicação: valem para qualquer projeto.

const rf = (o) => ({ core: true, ...o });

export const CONCEPTS = [
  {
    id: 'inferencia-local',
    nome: 'Modelo de IA próprio (pesos abertos, execução local)',
    dominio: 'Inteligência artificial',
    triggers: [/modelo (local|proprio|aberto|de pesos abertos)/, /proprio(s)? modelo/, /pesos abertos|open weights|open source model/,
      /\b(llama|ollama|mistral|qwen|whisper|llama\.cpp|vllm)\b/, /modelo de treinamento/, /trein(ar|amento) (de )?(um |o |seu |meu )?(proprio )?modelo/,
      /fine.?tun|ajuste fino/, /inferencia local|rodar (o )?modelo localmente/],
    especialistas: ['Engenheiro(a) de ML (MLOps)', 'Engenheiro(a) de IA aplicada'],
    componentes: ['Servidor de inferência local', 'Pipeline de dados e ajuste fino', 'Avaliação de modelos'],
    rf: [
      rf({ t: 'Servidor de inferência local', f: 'Executar o modelo na própria infraestrutura, sem enviar dados a provedores.', c: 'Servir um modelo de pesos abertos (ex.: via llama.cpp, vLLM ou Ollama) por uma API interna com contrato próprio, tempo limite e fila de requisições.', in: 'Pergunta, tarefa ou documento do usuário.', out: 'Resposta do modelo ou erro claro de indisponibilidade.', r: 'Nenhuma chamada de inferência sai da rede controlada pelo projeto.', ac: 'Com a saída para a internet bloqueada, a inferência continua respondendo.', v: 'Teste de integração com egress de rede bloqueado.', comp: 'Servidor de inferência local', ctrl: 'Isolamento de rede e autenticação na API interna' }),
      rf({ t: 'Ajuste fino com dados próprios', f: 'Especializar o modelo no domínio do projeto.', c: 'Preparar conjunto de dados versionado, treinar adaptadores (ex.: LoRA/QLoRA) e só promover a nova versão se a avaliação melhorar.', in: 'Conjunto de dados autorizado e versionado.', out: 'Adaptador treinado com relatório de avaliação.', r: 'Só dados com licença ou autorização de uso entram no treino; dados pessoais são minimizados.', ac: 'Versão nova com métrica pior que a atual não é promovida.', v: 'Execução do conjunto de avaliação antes e depois do ajuste.', comp: 'Pipeline de dados e ajuste fino', ctrl: 'Procedência e licença dos dados registradas' }),
      { t: 'Avaliação contínua do modelo', f: 'Detectar regressões ao trocar modelo, adaptador ou prompt.', c: 'Manter conjunto fixo de casos com respostas esperadas e calcular taxa de acerto a cada mudança.', in: 'Conjunto de avaliação versionado.', out: 'Relatório de acerto por versão.', r: 'Os casos de avaliação não entram no treino.', ac: 'O pipeline falha se a taxa de acerto cair abaixo do limiar definido.', v: 'Execução do conjunto no CI.', comp: 'Avaliação de modelos', ctrl: 'Separação entre dados de treino e de avaliação' },
    ],
    rnf: [{ t: 'Hardware de inferência', m: 'Documentar requisitos mínimos (RAM/VRAM) e latência medida no hardware alvo; primeira resposta em até 5 s em streaming.' }],
    ameacas: [{ a: 'Envenenamento de dados de treino', c: 'Procedência registrada, revisão de amostras e avaliação antes de promover' }],
    normas: ['llm10', 'ssdf'],
    tech: [{ i: 'Servidor de inferência local (llama.cpp, vLLM ou Ollama) com modelo de pesos abertos', p: 'mantém dados e custo sob controle do projeto, sem chave de provedor' },
      { i: 'Adaptadores LoRA/QLoRA para ajuste fino', p: 'especializa o modelo com pouco hardware' }],
    perguntas: ['Qual hardware estará disponível para inferência e treino (CPU, GPU, memória)?'],
  },
  {
    id: 'multimodal',
    nome: 'Processamento multimodal (texto, áudio e voz)',
    dominio: 'Inteligência artificial',
    triggers: [/multimodal/],
    modalidades: { audio: /\b(audio|audios)\b/, voz: /\b(voz|vozes|fala|falar)\b/, imagem: /\b(imagem|imagens|foto|fotos|visao)\b/, video: /\bvideos?\b/, texto: /\btextos?\b/ },
    minModalidades: 2,
    especialistas: ['Engenheiro(a) de IA aplicada'],
    componentes: ['Reconhecimento de fala', 'Síntese de voz', 'Orquestrador multimodal'],
    rf: [
      rf({ t: 'Transcrição de áudio local (ASR)', f: 'Transformar fala em texto sem serviço externo.', c: 'Transcrever áudio com modelo local (ex.: whisper.cpp), com marcação de tempo e idioma configurável.', in: 'Arquivo ou fluxo de áudio.', out: 'Texto transcrito com marcações de tempo.', r: 'O áudio não sai da infraestrutura do projeto; limite de duração por requisição.', ac: 'Um áudio de referência é transcrito com taxa de erro de palavras (WER) dentro da meta definida.', v: 'Teste com áudios de referência e cálculo de WER.', comp: 'Reconhecimento de fala', ctrl: 'Limite de tamanho e validação do formato de áudio' }),
      rf({ t: 'Síntese de voz local (TTS)', f: 'Responder por voz sem serviço externo.', c: 'Gerar áudio a partir do texto com modelo local (ex.: Piper), com escolha de voz e velocidade.', in: 'Texto da resposta.', out: 'Arquivo ou fluxo de áudio.', r: 'Vozes usadas têm licença compatível com o uso do projeto.', ac: 'Texto de referência gera áudio audível e inteligível dentro do tempo-alvo.', v: 'Teste automatizado de geração e revisão humana de amostras.', comp: 'Síntese de voz', ctrl: 'Licença das vozes registrada' }),
      { t: 'Orquestração entre modalidades', f: 'Encadear áudio, texto e voz num fluxo único.', c: 'Receber áudio ou texto, transcrever quando preciso, enviar ao modelo e devolver texto e/ou voz, registrando cada etapa.', in: 'Entrada em qualquer modalidade suportada.', out: 'Resposta na modalidade pedida.', r: 'Cada etapa tem tempo limite e falha de forma explícita.', ac: 'Uma pergunta falada recebe resposta em voz, com a transcrição registrada.', v: 'Teste ponta a ponta com áudio de exemplo.', comp: 'Orquestrador multimodal', ctrl: 'Tempo limite e registro por etapa' },
    ],
    rnf: [{ t: 'Latência multimodal', m: 'Ciclo voz → resposta em voz em até 8 s para perguntas curtas no hardware alvo.' }],
    ameacas: [{ a: 'Arquivos de mídia maliciosos ou gigantes', c: 'Validação de formato, limite de tamanho e processamento isolado' }],
    normas: ['llm10'],
    tech: [{ i: 'whisper.cpp para transcrição e Piper para síntese de voz', p: 'modelos abertos que rodam localmente, inclusive em CPU' }],
    perguntas: [],
  },
  {
    id: 'substituicao-apis',
    nome: 'Independência de APIs de terceiros',
    dominio: 'Engenharia de Software',
    triggers: [/apis? de terceiros?/, /dependencias? de apis?/, /(minha|nossa|sua) propria api|propria(s)? api|api propria/, /nao depender (de )?(api|apis|servico|servicos|terceiros)/,
      /sem (usar |precisar (de |usar )?)?(nenhuma )?apis?( de terceiros?)?/, /nenhuma api/, /servicos? de terceiros?/],
    especialistas: ['Arquiteto(a) de software', 'Engenheiro(a) backend'],
    componentes: ['Inventário de dependências externas', 'Camada de portas e adaptadores', 'Implementações próprias'],
    rf: [
      rf({ t: 'Inventário de dependências externas', f: 'Saber exatamente de quais serviços de terceiros o projeto depende.', c: 'Varrer código e manifestos para listar SDKs de provedores, chamadas HTTP a domínios externos e variáveis de chave de API, gerando um relatório por módulo.', in: 'Código-fonte e manifestos de dependências.', out: 'Lista de dependências externas com local de uso e criticidade.', r: 'A varredura é estática: nenhum código analisado é executado.', ac: 'Uma chamada externa plantada num repositório de teste aparece no relatório com arquivo e linha.', v: 'Teste com repositório de exemplo contendo dependências conhecidas.', comp: 'Inventário de dependências externas', ctrl: 'Análise estática sem execução' }),
      rf({ t: 'Camada de portas e adaptadores', f: 'Trocar uma dependência externa sem reescrever o sistema.', c: 'Definir interfaces internas (portas) para cada capacidade usada (ex.: transcrição, busca, geração de texto) e isolar cada fornecedor num adaptador substituível.', in: 'Capacidades identificadas no inventário.', out: 'Interfaces internas e adaptadores configuráveis.', r: 'O núcleo do sistema não importa SDK de provedor diretamente.', ac: 'Trocar o adaptador por configuração não exige mudança no núcleo.', v: 'Teste de arquitetura que falha se o núcleo importar SDK externo.', comp: 'Camada de portas e adaptadores', ctrl: 'Regra de dependência verificada no CI' }),
      rf({ t: 'Implementações próprias com teste de paridade', f: 'Substituir APIs de terceiros por funções próprias confiáveis.', c: 'Para cada dependência substituída, implementar a função com dados e modelos próprios e comparar as saídas com o comportamento esperado.', in: 'Contrato da porta e casos de referência.', out: 'Adaptador próprio aprovado nos testes de paridade.', r: 'Fontes de dados usadas precisam ter licença ou autorização de uso.', ac: 'O adaptador próprio passa no mesmo conjunto de casos que o adaptador original.', v: 'Suíte de paridade executada no CI.', comp: 'Implementações próprias', ctrl: 'Licença das fontes de dados registrada' }),
    ],
    rnf: [{ t: 'Independência operacional', m: 'A suíte de testes passa com o tráfego de saída para a internet bloqueado.' }],
    ameacas: [{ a: 'Dependência oculta reintroduzida por biblioteca', c: 'Inventário no CI e bloqueio de egress nos testes' }],
    normas: ['ssdf', 'slsa'],
    tech: [{ i: 'Arquitetura hexagonal (portas e adaptadores)', p: 'isola fornecedores e permite trocar por implementação própria' }],
    perguntas: ['Quais capacidades hoje dependem de APIs externas (ex.: geração de texto, voz, busca, armazenamento)?'],
  },
  {
    id: 'revisao-repositorios',
    nome: 'Revisão automatizada de repositórios',
    dominio: 'Engenharia de Software',
    triggers: [/(revisar|revise|analisar|analise|auditar|varrer|verificar) (todos )?(os )?(meus |seus )?repositorios/, /todos (os )?(meus )?repositorios/, /code review|revisao de codigo/],
    especialistas: ['Engenheiro(a) de software sênior', 'Especialista em AppSec'],
    componentes: ['Coletor de repositórios', 'Relatório por repositório'],
    rf: [
      rf({ t: 'Coleta e inventário dos repositórios', f: 'Ter todos os repositórios disponíveis para revisão.', c: 'Listar e clonar os repositórios autorizados com token somente-leitura, registrando linguagem, tamanho e última atualização.', in: 'Lista de repositórios ou conta autorizada.', out: 'Inventário de repositórios clonados.', r: 'Token com permissão mínima (somente leitura); nada é alterado nos repositórios.', ac: 'Repositório sem permissão aparece como "não acessível", sem interromper os demais.', v: 'Teste com repositórios públicos, privados e inexistentes.', comp: 'Coletor de repositórios', ctrl: 'Token de leitura com escopo mínimo' }),
      { t: 'Relatório de revisão por repositório', f: 'Mostrar o que precisa de atenção em cada projeto.', c: 'Gerar relatório por repositório com dependências externas, segredos expostos, riscos e sugestão de substituição.', in: 'Repositório clonado e regras de análise.', out: 'Relatório em Markdown e JSON.', r: 'Segredos encontrados aparecem mascarados.', ac: 'Um segredo plantado aparece mascarado no relatório do repositório certo.', v: 'Teste com repositório de exemplo contendo achados conhecidos.', comp: 'Relatório por repositório', ctrl: 'Mascaramento de segredos' },
    ],
    rnf: [{ t: 'Escala da revisão', m: 'Revisar 100 repositórios pequenos em até 30 min, com retomada após falha.' }],
    ameacas: [{ a: 'Vazamento do token de acesso', c: 'Token só em variável de ambiente, escopo mínimo e rotação' }],
    normas: ['ssdf'],
    tech: [{ i: 'git CLI e análise estática local', p: 'revisão sem depender de serviço externo de análise' }],
    perguntas: ['Quais repositórios entram na revisão e com que frequência?'],
  },
  {
    id: 'gerador-prompts',
    nome: 'Geração de prompts técnicos com políticas',
    dominio: 'Engenharia de Software',
    triggers: [/(gerador|geracao|aplicativo|app) de prompts?/, /criar (um |o )?prompts?/, /quando (eu )?(for|fosse) criar (um )?prompt/],
    especialistas: ['Engenheiro(a) de prompts'],
    componentes: ['Motor de geração de prompts'],
    rf: [
      { t: 'Políticas aplicadas em todo prompt gerado', f: 'Garantir que as preferências permanentes do usuário entrem em todos os prompts.', c: 'Permitir ativar políticas transversais (ex.: soberania tecnológica) que acrescentam diretrizes e filtram tecnologias em qualquer prompt gerado.', in: 'Políticas ativas e pedido do usuário.', out: 'Prompt com a seção de política e sem tecnologias que a violem.', r: 'Uma política nunca adiciona funcionalidades de negócio ao prompt.', ac: 'Com a política ativa, nenhum prompt gerado recomenda API de provedor externo.', v: 'Teste automatizado sobre um conjunto de pedidos de domínios diferentes.', comp: 'Motor de geração de prompts', ctrl: 'Validação semântica antes da entrega' },
    ],
    rnf: [], ameacas: [], normas: [], tech: [], perguntas: [],
  },
];

export const POLICIES = {
  soberania: {
    nome: 'Soberania tecnológica',
    triggers: [/soberania|independencia tecnologica/, /auto.?hosped|self.?host/, /processamento local|infraestrutura propria/, /pesos abertos|open weights/,
      /(nao|sem) (precisar|depender|usar)[a-z ]{0,25}(apis?|servicos?|terceiros?)/, /sem (usar |precisar (de )?)?(nenhuma )?apis?( de terceiros?)?/, /apis? de terceiros?/, /nenhuma api/, /propria api|proprias apis|api propria/],
    diretrizes: [
      'Priorize APIs próprias, processamento local e modelos de pesos abertos executados na infraestrutura do projeto.',
      'Cada dependência externa que permanecer precisa de justificativa escrita, alternativa própria planejada e adaptador isolado.',
      'Nenhuma chave de provedor externo é necessária para o sistema funcionar; os testes passam com o tráfego de saída bloqueado.',
      'Use apenas fontes de dados com licença ou autorização de uso; registre a procedência de cada conjunto.',
      'Bibliotecas de código aberto são permitidas: elas rodam localmente e não são APIs de terceiros.',
    ],
    // tecnologias que violam a política e o substituto recomendado
    proibidas: /\b(api de llm|api do provedor|provedor de modelo|stripe|mercado pago|openai|gemini|saas|servico gerenciado|gateway de pagamento)\b/,
    locais: /\b(local|localmente|pesos abertos|auto.?hosped|proprio|propria)\b/,
    substitutos: [{ i: 'Servidor de inferência local com modelo de pesos abertos (ex.: llama.cpp, vLLM, Ollama)', p: 'substitui APIs de LLM de provedores mantendo os dados no projeto' }],
    provedores: /\b(claude|gpt|chatgpt|openai|gemini|anthropic|copilot)\b/,
  },
};
