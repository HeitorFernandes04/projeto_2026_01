# User Stories — Documentação do Projeto

> Organização por Sprints · Formato: *Como [persona], quero [ação] para que [benefício]*

---

> A organização por sprints pode ser alterada de acordo com a necessidade de entregas atual do projeto.

---

## Índice

* [Sprint 1 — Setup Técnico e Experiência do Operacional](#sprint-1--setup-técnico-e-experiência-do-operacional)
* [Sprint 2 — Gestão e Controle Operacional](#sprint-2--gestão-e-controle-operacional)
* [Sprint 3 — Experiência do Cliente](#sprint-3--experiência-do-cliente)
* [Sprint 4 — Comunicação, Fechamento e Setup Final](#sprint-4--comunicação-fechamento-e-setup-final)

---

## Sprint 1 — Setup Técnico e Experiência do Operacional

> **Objetivo:** Estabelecer a fundação do sistema, adequar a linguagem de domínio e garantir que o operador de pista consiga registrar o ciclo de vida da Ordem de Serviço com segurança e fluidez.

---

### RF-01 · Cadastro de Usuário

**Como** usuário,
**quero** me cadastrar no sistema,
**para** acessar as funcionalidades disponíveis.

**Critérios de Aceitação:**

* [ ] Cadastro com nome, email e senha.
* [ ] Validação de dados obrigatórios.
* [ ] Usuário salvo no sistema.

Responsáveis: ---

### RF-02 · Login de Usuário

**Como** usuário,
**quero** fazer login no sistema,
**para** acessar minha conta.

**Critérios de Aceitação:**

* [ ] Login com email e senha.
* [ ] Validação de credenciais via JWT.
* [ ] Redirecionamento após login.

Responsáveis: ---

### RF-03 · Refatoração de Nomenclaturas Ubíquas (Technical Task)

**Como** desenvolvedor,
**quero** adequar os termos do banco de dados, API e frontend,
**para** refletir a linguagem real do ambiente de lava-jatos e evitar confusões semânticas.

**Critérios de Aceitação:**

* [ ] Renomear modelos (ex: `Atendimento` para `OrdemServico`).
* [ ] Atualizar os Enums de status para: `PATIO`, `VISTORIA_INICIAL`, `EM_EXECUCAO`, `LIBERACAO`, `FINALIZADO`, `BLOQUEADO_INCIDENTE`, `CANCELADO`.
* [ ] Substituir labels no frontend mobile ("Fila de agendados" por "Pátio", "Iniciar Atendimento" por "Vistoria Inicial").

Responsáveis: ---

### RF-04 · Visualizar Pátio (Fila de Espera)

**Como** operador de pista,
**quero** visualizar os veículos agendados no formato de "Pátio",
**para** organizar o fluxo de entrada e saber os próximos serviços.

**Critérios de Aceitação:**

* [ ] Lista de Ordens de Serviço exibida com status `PATIO` para a data atual.
* [ ] Informações básicas do veículo (Placa, Modelo) e serviço visíveis.

Responsáveis: ---

### RF-05 · Ordem de Serviço em Abas Progressivas (Single-State View)

**Como** operador de pista,
**quero** gerenciar o ciclo do serviço em uma única tela dividida em etapas,
**para** não perder o contexto do veículo e evitar carregamento de múltiplas páginas.

**Critérios de Aceitação:**

* [ ] Tela de detalhes estruturada com abas de navegação visual (Vistoria Inicial -> Em Execução -> Liberação).
* [ ] O acesso às abas é controlado pelo status da OS retornado pela API.
* [ ] Ao avançar para "Em Execução", as informações da "Vistoria Inicial" ficam travadas (somente leitura) e o timestamp de `horario_inicio_real` é gravado.

Responsáveis: ---

### RF-06 · Vistoria Inicial e Grid de Avarias

**Como** operador de pista,
**quero** registrar o estado do veículo rapidamente usando tags visuais,
**para** proteger o estabelecimento de falsas acusações de danos prévios.

**Critérios de Aceitação:**

* [ ] O sistema exige o envio de 5 fotos gerais obrigatórias do veículo.
* [ ] Apresentação de um grid com Tags selecionáveis agrupadas por setores do carro (Frente, Laterais, Traseira, Interior).
* [ ] Se uma tag for selecionada (avaria prévia), o sistema exige o anexo de uma foto focada no dano.

Responsáveis: ---

### RF-07 · Liberação de Veículo (Check-out Operacional)

**Como** operador de pista,
**quero** registrar a qualidade do serviço finalizado na etapa de Liberação,
**para** prestação de contas com o cliente e encerramento da OS.

**Critérios de Aceitação:**

* [ ] Exigência de fotos obrigatórias do veículo finalizado e limpo.
* [ ] Campo de texto opcional para "Laudo Técnico / Observações".
* [ ] O avanço desta etapa altera o status para `FINALIZADO`, grava o `horario_fim_real` e redireciona ao Pátio.

Responsáveis: ---

### RF-08 · Entrada Avulsa (Fluxo Expresso)

**Como** operador de pista,
**quero** criar uma Ordem de Serviço expressa para veículos sem agendamento,
**para** iniciar a lavagem imediatamente sem perder tempo com cadastros completos.

**Critérios de Aceitação:**

* [ ] Formulário minimalista exigindo apenas Placa, Modelo, Cor e Seleção do Serviço.
* [ ] Salvamento imediato gerando a OS e direcionando automaticamente para a aba de Vistoria Inicial.

Responsáveis: ---

### RF-09 · Registro de Incidente / Sinistro

**Como** operador de pista,
**quero** reportar um dano causado pela equipe imediatamente,
**para** que a gestão atue antes de o veículo ser entregue.

**Critérios de Aceitação:**

* [ ] Botão de atenção "Registrar Incidente" nas abas "Em Execução" e "Liberação".
* [ ] Modal exigindo seleção da peça danificada (via tags), foto e descrição textual.
* [ ] Submissão cria um registro de `IncidenteOS` e altera o status da OS para `BLOQUEADO_INCIDENTE`, impedindo a finalização pelo operador.

Responsáveis: ---

### RF-10 · Sincronização de Mídias em Background

**Como** operador de pista,
**quero** que o envio de fotos ocorra em segundo plano,
**para** que a minha navegação não trave e eu possa começar a lavar o carro mesmo com sinal fraco de Wi-Fi.

**Critérios de Aceitação:**

* [ ] Fotos capturadas na vistoria são guardadas no cache/storage local do dispositivo.
* [ ] O envio para a API/S3 ocorre de forma assíncrona.
* [ ] O cronômetro de execução pode ser iniciado independentemente da conclusão do upload.

Responsáveis: ---

## Sprint 2 — Gestão e Controle Operacional

> **Objetivo:** Transformar o gestor em um controlador ativo da operação em tempo real (WIP) e parametrizar o isolamento multi-tenant (SaaS) do estabelecimento.

---

### TRILHA 1: Setup de Domínio e Multi-Tenant

### RF-11 · Gestão de Serviços Oferecidos

**Como** gestor,
**quero** cadastrar e editar os serviços oferecidos no meu lava-jato,
**para** que os operadores possam vinculá-los às Ordens de Serviço.

**Critérios de Aceitação:**

* [x] Cadastro contendo: Nome, Descrição, Preço e Duração Estimada (`duracao_estimada_minutos`).
* [x] Proteção de Domínio (IDOR): Listagem estritamente filtrada pelo `estabelecimento_id` do gestor logado.
* [x] Soft Delete: Impedir exclusão física de serviços que já possuam OS vinculada (usar inativação lógica).

Responsáveis: Letícia Gomes Lopes

### RF-12 · Administração do Quadro de Funcionários

**Como** gestor,
**quero** gerenciar as contas de acesso da minha equipe de pista,
**para** controlar quem tem acesso à operação e responsabilizar quem executa as OS.

**Critérios de Aceitação:**

* [ ] Criação de contas vinculadas ao perfil `FUNCIONARIO` e ao `estabelecimento_id`.
* [ ] Função de inativar/suspender acesso de funcionários desligados.
* [ ] A inativação não pode corromper a Foreign Key em registros de `OrdemServico` passadas.

Responsáveis: ---

### RF-13 · Configurações do Estabelecimento

**Como** gestor,
**quero** editar os dados do meu lava-jato, incluindo a identidade visual (logo),
**para** manter as informações operacionais atualizadas e personalizadas em todos os canais.

**Critérios de Aceitação:**

* [x] Formulário para alteração na tabela de Estabelecimento (Nome Fantasia, CNPJ, Endereço).
* [x] Upload e gestão de Logotipo com suporte a formatos JPG/PNG/WEBP.
* [x] Sincronização Reativa: A alteração da logo reflete instantaneamente no Dashboard Web e no App Mobile sem necessidade de novo login.
* [x] Exibição da URL pública de autoagendamento (`link_autoagendamento`).

Responsáveis: Letícia Gomes Lopes

### TRILHA 2: Operação em Tempo Real

### RF-14 · Kanban de Pista (Work In Progress)

**Como** gestor,
**quero** visualizar um quadro Kanban com todas as Ordens de Serviço do dia atual,
**para** identificar rapidamente gargalos e o fluxo de veículos.

**Critérios de Aceitação:**

* [ ] Exibição de colunas baseadas nos status: `PATIO`, `VISTORIA_INICIAL`, `EM_EXECUCAO`, `LIBERACAO`.
* [ ] Cards da OS exibindo Placa, Modelo, Serviço e tempo decorrido.
* [ ] Destaque visual para OS em execução onde o tempo real ultrapassou a duração estimada do serviço.

Responsáveis: ---

### RF-15 · Central de Incidentes / Sinistros Pendentes

**Como** gestor,
**quero** ter uma visão destacada de Ordens de Serviço com bloqueios operacionais,
**para** agir rapidamente em problemas ou danos causados pela equipe.

**Critérios de Aceitação:**

* [ ] Listagem exclusiva de OS com o status `BLOQUEADO_INCIDENTE`.
* [ ] Alertas visuais (badges) na interface principal caso existam incidentes não resolvidos.

Responsáveis: ---

### RF-16 · Auditoria e Desbloqueio de Incidente

**Como** gestor,
**quero** analisar um incidente registrado e tomar providências,
**para** liberar a continuação ou encerramento da Ordem de Serviço travada.

**Critérios de Aceitação:**

* [ ] Modal de auditoria cruzando dados da OS com o `IncidenteOS` (foto, peça, descrição).
* [ ] Campo para o gestor inserir uma "Nota de Resolução".
* [ ] Botão "Resolver e Desbloquear", que assinala a flag de resolvido e devolve a OS ao seu status original antes do bloqueio.

Responsáveis: ---

### TRILHA 3: Histórico e Analytics

### RF-17 · Histórico Consolidado de Atendimentos

**Como** gestor,
**quero** consultar Ordens de Serviço passadas,
**para** buscar ocorrências ou auditar serviços prestados.

**Critérios de Aceitação:**

* [ ] Motor de busca com filtros por período de datas, placa do veículo e status.
* [ ] Listagem com paginação na API para controle de performance.

Responsáveis: ---

### RF-18 · Auditoria de Qualidade Visual (Galeria de OS)

**Como** gestor,
**quero** comparar as fotos do início e fim de uma Ordem de Serviço do histórico,
**para** garantir o padrão de qualidade do serviço entregue.

**Critérios de Aceitação:**

* [ ] Na visão de histórico, agrupar registros de mídias e vistorias.
* [ ] Seção "Estado Inicial" agrupando fotos da vistoria geral e fotos de avarias prévias.
* [ ] Seção "Estado Final" exibindo as fotos do veículo finalizado.

Responsáveis: ---

### RF-19 · Dashboard Executivo Básico

**Como** gestor,
**quero** visualizar os indicadores diários de desempenho de forma resumida,
**para** acompanhar a saúde financeira e operacional do dia.

**Critérios de Aceitação:**

* [ ] Card de Volume: Contagem total de OS finalizadas no dia.
* [ ] Card de Receita: Soma do `valor_cobrado` de todas as OS com status `FINALIZADO` no dia atual.

Responsáveis: ---

### RF-20 · Relatório de Eficiência da Equipe

**Como** gestor,
**quero** analisar o desvio entre tempo estimado e tempo real executado por funcionário,
**para** identificar quem são os operadores mais ágeis e mapear necessidades de treinamento.

**Critérios de Aceitação:**

* [ ] Relatório consolidando as OS finalizadas agrupadas pelo `funcionario_id`.
* [ ] Cálculo comparando o tempo real (fim menos início) contra a `duracao_estimada_minutos` do serviço.

Responsáveis: ---

## Sprint 3 — Experiência do Cliente

> **Objetivo:** Oferecer um fluxo de autoatendimento sem atrito para o consumidor final (B2C), garantindo transparência no pós-serviço e integração direta com o Pátio do lava-jato.

---

### TRILHA 1: Motor de Agendamento e Conversão (Public Facing)

### RF-21 · Portal de Autoagendamento (Web)

**Como** cliente final,
**quero** acessar um link público do lava-jato e visualizar os serviços disponíveis,
**para** iniciar a minha marcação sem precisar instalar um aplicativo.

**Critérios de Aceitação:**

* [x] Endpoint público (`AllowAny`) que recebe a referência do estabelecimento e retorna dados de contato, logo e serviços ativos.
* [ ] O endpoint nunca deve expor dados financeiros ou de funcionários do local.
* [x] Interface mobile-first desenvolvida para rodar diretamente via navegador.

Responsáveis: ---

### RF-22 · Motor de Disponibilidade de Horários

**Como** cliente final,
**quero** selecionar um serviço e ver apenas os horários realmente livres,
**para** não gerar conflitos de agenda (overbooking) no estabelecimento.

**Critérios de Aceitação:**

* [ ] Cálculo no backend cruzando a duração estimada do serviço selecionado com os horários de Ordens de Serviço já agendadas (`PATIO` ou superior).
* [ ] Retorno da API contendo apenas blocos de tempo livres.

Responsáveis: ---

### TRILHA 2: Onboarding B2C e Fidelização

### RF-23 · Fluxo Integrado de Checkout e Cadastro

**Como** cliente final,
**quero** confirmar o meu agendamento preenchendo apenas os dados essenciais de uma vez,
**para** evitar formulários de registro burocráticos.

**Critérios de Aceitação:**

* [ ] Formulário final coletando Placa, Modelo, Nome e WhatsApp.
* [ ] Pesquisa automática: se o dado não existir, a API cria o perfil `CLIENTE` e o `VEICULO` correspondente de forma transparente.
* [ ] Geração da `OrdemServico` com origem `AGENDADO` e status `PATIO`.

Responsáveis: ---

### RF-24 · Cancelamento Autônomo

**Como** cliente final,
**quero** poder cancelar um agendamento futuro através de um botão simples,
**para** liberar o horário no lava-jato em caso de imprevisto.

**Critérios de Aceitação:**

* [ ] Cancelamento permitido exclusivamente para Ordens de Serviço no status `PATIO`.
* [ ] Ação rejeitada pela API caso o serviço já esteja em Vistoria Inicial ou etapas subsequentes.

Responsáveis: ---

### TRILHA 3: Portal do Cliente e Transparência

### RF-25 · Painel do Cliente (Histórico)

**Como** cliente,
**quero** iniciar sessão e acessar meu histórico pessoal,
**para** gerenciar meus veículos e verificar datas de lavagens passadas.

**Critérios de Aceitação:**

* [ ] Autenticação via JWT para perfil `CLIENTE`.
* [ ] Dashboard listando veículos vinculados ao cliente.
* [ ] Histórico de Ordens de Serviço restrito aos veículos do cliente logado.

Responsáveis: ---

### RF-26 · Transparência de Serviço (Galeria Pós-Venda)

**Como** cliente,
**quero** visualizar as fotos do meu carro após a finalização do serviço,
**para** validar a qualidade do trabalho executado antes de buscar o veículo.

**Critérios de Aceitação:**

* [ ] Acesso liberado apenas para Ordens de Serviço no status `FINALIZADO`.
* [ ] Visão restrita (somente leitura) às mídias categorizadas como estado finalizado e ao laudo técnico público.
* [ ] Proteção estrita bloqueando a exibição de fotos de incidentes operacionais para o cliente final.

Responsáveis: ---

## Sprint 4 — Comunicação, Fechamento e Setup Final

> **Objetivo:** Automatizar a comunicação transacional para reduzir faltas, parametrizar regras de negócio da agenda e implementar o fluxo de checkout financeiro.

---

### TRILHA 1: Automação e Mensageria (Async)

### RF-27 · Mensageria Transacional (Confirmação e Lembrete)

**Como** sistema operacional,
**quero** disparar mensagens automáticas para o cliente final,
**para** confirmar sua marcação e lembrá-lo do horário do serviço.

**Critérios de Aceitação:**

* [ ] Gatilho imediato de envio de confirmação quando a OS é criada.
* [ ] Gatilho de lembrete agendado para execução prévia ao horário do atendimento.
* [ ] Processamento executado obrigatoriamente através de fila assíncrona (ex: Celery) para evitar travamento da API.

Responsáveis: ---

### RF-28 · Gatilho de Pós-Venda (Aviso de Término)

**Como** sistema operacional,
**quero** notificar o cliente automaticamente quando o veículo estiver pronto,
**para** avisá-lo sobre a liberação e direcioná-lo para avaliar o resultado.

**Critérios de Aceitação:**

* [ ] Gatilho disparado na transição de status da Ordem de Serviço para `FINALIZADO`.
* [ ] Mensagem contendo um link direto ou indicativo para a galeria pública de transparência (RF-26).

Responsáveis: ---

### TRILHA 2: Setup de Agenda e Motor de Reservas

### RF-29 · Gestão de Horários de Funcionamento

**Como** gestor,
**quero** definir os dias e horários em que meu lava-jato está aberto,
**para** limitar o autoagendamento a blocos úteis e impedir reservas de madrugada.

**Critérios de Aceitação:**

* [ ] Configuração de abertura, fechamento e horário de almoço por dia da semana no Estabelecimento.
* [ ] Integração com o Motor de Disponibilidade (RF-22) para invalidar horários fora do expediente comercial estabelecido.

Responsáveis: ---

### RF-30 · Bloqueio Manual de Agenda (Exceções)

**Como** gestor,
**quero** bloquear um dia inteiro ou período específico na agenda,
**para** lidar com feriados locais, falta de água ou manutenções.

**Critérios de Aceitação:**

* [ ] Inserção de bloqueios temporais associados à grade do estabelecimento.
* [ ] O autoagendamento web passa a reconhecer e devolver ausência de vagas durante o período bloqueado.

Responsáveis: ---

### TRILHA 3: Checkout Operacional (PDV Básico)

### RF-31 · Fechamento de Conta e Checkout da OS

**Como** operador de caixa ou gestor,
**quero** confirmar o recebimento do pagamento antes de fechar o atendimento,
**para** garantir o controle do caixa diário.

**Critérios de Aceitação:**

* [ ] Na transição de Liberação para Finalizado, exibir o `valor_cobrado` base vindo do serviço.
* [ ] Permitir ajuste manual do valor para aplicação de descontos ou cobranças extras.
* [ ] Registrar o método de pagamento antes de processar a conclusão definitiva da OS.

Responsáveis: ---

### RF-32 · Extrato de Fechamento de Caixa Diário

**Como** gestor,
**quero** visualizar um resumo financeiro do dia agrupado por método de pagamento,
**para** realizar a conciliação do caixa físico.

**Critérios de Aceitação:**

* [ ] Consulta ao valor total de todas as Ordens de Serviço finalizadas na data.
* [ ] Consolidação agrupando os valores conforme o método de pagamento registrado no RF-31.
* [ ] Funcionalidade de exportação em PDF ou CSV do relatório diário.

Responsáveis: ```