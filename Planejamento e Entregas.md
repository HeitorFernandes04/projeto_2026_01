# User Stories — Documentação do Projeto

> Organização por Sprints · Formato: *Como [persona], quero [ação] para que [benefício]*

---

> A organização por sprints pode ser alterada de acordo com a necessidade de entregas atual do projeto.

---

## Índice

* [Sprint 1 — Setup Técnico e Experiência do Operacional](#sprint-1--setup-técnico-e-experiência-do-operacional)
* [Sprint 2 — Gestão e Controle Operacional](#sprint-2--gestão-e-controle-operacional)
* [Sprint 3 — Experiência do Cliente](#sprint-3--experiência-do-cliente)
* [Sprint 4 — Refatoração, Isolamento e Apps Independentes](#sprint-4--refatoração-isolamento-e-apps-independentes)

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

### RF-21 · Aplicativo Mobile de Agendamento

**Como** cliente final,
**quero** utilizar um aplicativo dedicado para visualizar os serviços disponíveis,
**para** iniciar a minha marcação de forma rápida e segura.

**Critérios de Aceitação:**

* [x] Endpoint que recebe a referência do estabelecimento e retorna dados de contato, logo e serviços ativos.
* [ ] O endpoint nunca deve expor dados financeiros ou de funcionários do local.
* [x] Interface mobile-first desenvolvida como base para o aplicativo B2C.

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

## Sprint 4 — Refatoração, Isolamento e Apps Independentes

> **Objetivo:** Implementar o desmembramento total do sistema em aplicativos independentes (B2C e B2B), refatorar o núcleo de dados para otimização da esteira de produção e garantir a blindagem de segurança da API.

---

### TRILHA 1: Infraestrutura e Núcleo de Dados

### RF-27 · Refatoração do Core e Banco de Dados

**Como** desenvolvedor,
**quero** ajustar a estrutura de dados para suportar a nova esteira de produção e campos de progresso real-time,
**para** habilitar as funcionalidades de acompanhamento do cliente e agilidade do operador.

**Critérios de Aceitação:**
* [ ] Inclusão do campo `etapa_atual` (integer 0-100) na tabela `OrdemServico`.
* [ ] Migração para remover a obrigatoriedade de campos de `ACABAMENTO` na transição de estados.
* [ ] Otimização de queries de listagem para reduzir overhead no dashboard gestor.

Responsáveis: Maurício Monteiro

---

### TRILHA 2: App Mobile Cliente (B2C)

### RF-28 · App Cliente: Arquitetura e Mapa

**Como** cliente final,
**quero** um aplicativo mobile dedicado com visualização de estabelecimentos em mapa,
**para** localizar lava-jatos próximos e iniciar meu agendamento de forma intuitiva.

**Critérios de Aceitação:**
* [ ] Setup do novo projeto `mobile-cliente` (Ionic/React) com isolamento total de dependências do app B2B.
* [ ] Implementação de tela de busca com integração Google Maps API.
* [ ] Listagem de estabelecimentos com filtros de distância e serviços.

Responsáveis: Heitor Fernandes

### RF-29 · App Cliente: Jornada e Checkout

**Como** cliente final,
**quero** realizar meu agendamento via fluxo mobile com autenticação simplificada (OTP),
**para** garantir minha reserva e acompanhar o progresso do serviço em tempo real.

**Critérios de Aceitação:**
* [ ] Implementação do fluxo de Login via WhatsApp (OTP).
* [ ] Fluxo de agendamento em 3 etapas (Veículo -> Serviço -> Horário).
* [ ] Tela de acompanhamento com barra de progresso animada consumindo o campo `etapa_atual`.

Responsáveis: Letícia Gomes Lopes

---

### TRILHA 3: App Mobile Operacional (B2B)

### RF-30 · Refatoração UX Operacional B2B

**Como** operador de pista,
**quero** uma interface de esteira simplificada e o fluxo de "Entrada Rápida",
**para** agilizar o registro de veículos no pátio e pular etapas burocráticas de acabamento.

**Critérios de Aceitação:**
* [ ] Implementação do botão "Entrada Rápida" na Home.
* [ ] Máquina de estados no App pulando automaticamente o status `ACABAMENTO`.
* [ ] Renomeação de todas as labels "Avulso" para "Entrada Rápida".

Responsáveis: Lucas José

---

### TRILHA 4: Backend e Qualidade

### RF-31 · Unificação de APIs e Segurança

**Como** desenvolvedor,
**quero** unificar os endpoints de histórico e corrigir vulnerabilidades de segurança,
**para** reduzir o débito técnico e proteger os dados contra acessos não autorizados.

**Critérios de Aceitação:**
* [ ] Consolidação de ViewSets de histórico em um endpoint unificado `/api/shared/historico/`.
* [ ] Correção de vulnerabilidades críticas reportadas pelo `npm audit`.
* [ ] Implementação de auditoria "Side-by-Side" no Painel Web (fotos de entrada vs incidente).

Responsáveis: Marcos Barbosa

---

### TRILHA 5: Gestão Financeira

### RF-32 · Painel Financeiro Básico (Web)

**Como** gestor,
**quero** visualizar um resumo simples do faturamento por período,
**para** acompanhar a saúde financeira do meu negócio sem precisar de planilhas externas.

**Critérios de Aceitação:**
* [ ] Card de totalização exibindo a soma das Ordens de Serviço finalizadas no período.
* [ ] Tabela de transações detalhando Data, Veículo, Serviço e Valor.
* [ ] Filtros de data (Inicial/Final) para consulta de períodos específicos.
* [ ] Botão de exportação para PDF (Relatório de Fechamento).

Responsáveis: ---