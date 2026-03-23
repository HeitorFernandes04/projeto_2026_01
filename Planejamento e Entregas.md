# 📋 User Stories — Documentação do Projeto

> Organização por Sprints · Formato: *Como [persona], quero [ação] para que [benefício]*

---

## Índice

- [Sprint 0 — Configuração e Definição de Requisitos](#sprint-0--configuração-e-definição-de-requisitos)
- [Sprint 1 — Autenticação, Cadastro e Estrutura Base](#sprint-1--autenticação-cadastro-e-estrutura-base)
- [Sprint 2 — Módulo de Agendamento (Backend + Web)](#sprint-2--módulo-de-agendamento-backend--web)
- [Sprint 3 — Dashboard Financeiro e Painel de Gestão](#sprint-3--dashboard-financeiro-e-painel-de-gestão)
- [Sprint 4 — App Mobile: Mapa e Busca de Estabelecimentos](#sprint-4--app-mobile-mapa-e-busca-de-estabelecimentos)
- [Sprint 5 — App Mobile: Agendamento e Histórico](#sprint-5--app-mobile-agendamento-e-histórico)
- [Sprint 6 — Avaliações, Notificações e Ajustes Finais](#sprint-6--avaliações-notificações-e-ajustes-finais)

---

## Sprint 0 — Configuração e Definição de Requisitos

> **Objetivo:** Preparar o ambiente de desenvolvimento, repositório e documentar os requisitos do projeto.

---

### RF-01 · Configuração do Repositório

**Como** desenvolvedor,  
**quero** configurar o repositório Git com branches e políticas de contribuição,  
**para que** a equipe colabore de forma organizada.

**Critérios de Aceitação:**
- [ ] Repositório criado e acessível a todos os membros
- [ ] Branches `main`, `develop` e padrão de nomenclatura definidos
- [ ] README com instruções de setup

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-02 · Configuração de Ambientes

**Como** desenvolvedor,  
**quero** configurar os ambientes de desenvolvimento (local, staging e produção),  
**para que** o código possa ser executado de forma consistente em qualquer máquina.

**Critérios de Aceitação:**
- [ ] Arquivo `.env.example` documentado
- [ ] Docker Compose funcional (opcional)
- [ ] Passos de instalação documentados no README

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-03 · Documentação de Requisitos

**Como** gerente de projeto,  
**quero** ter os requisitos funcionais e não funcionais documentados,  
**para que** a equipe tenha uma referência clara durante o desenvolvimento.

**Critérios de Aceitação:**
- [ ] Documento de requisitos criado
- [ ] Casos de RFo principais identificados
- [ ] Critérios de aceite definidos por funcionalidade

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-04 · Definição de Arquitetura

**Como** desenvolvedor,  
**quero** definir a arquitetura do sistema (banco de dados, APIs e estrutura de pastas),  
**para que** o projeto tenha uma base sólida e escalável.

**Critérios de Aceitação:**
- [ ] Diagrama de arquitetura elaborado
- [ ] Banco de dados modelado (entidades e relacionamentos)
- [ ] Stack tecnológico definido e documentado

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 1 — Autenticação, Cadastro e Estrutura Base

> **Objetivo:** Implementar o fluxo de autenticação, cadastro de estabelecimentos, funcionários e clientes, e a estrutura base da aplicação.

---

### RF-05 · Cadastro de Estabelecimento

**Como** dono de estabelecimento,  
**quero** me cadastrar na plataforma informando nome, CNPJ, endereço e contato,  
**para que** meu negócio seja encontrado pelos clientes.

**Critérios de Aceitação:**
- [ ] Formulário com validação de CNPJ
- [ ] E-mail de confirmação enviado após o cadastro
- [ ] Dados persistidos no banco de dados

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-06 · Login de Usuário

**Como** usuário cadastrado (estabelecimento, cliente ou funcionário),  
**quero** fazer login com e-mail e senha,  
**para que** eu possa acessar minha conta com segurança.

**Critérios de Aceitação:**
- [ ] Autenticação via JWT
- [ ] Mensagem de erro em credenciais inválidas
- [ ] Token com expiração configurada

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-07 · Cadastro de Funcionário

**Como** dono do estabelecimento,  
**quero** cadastrar um funcionário no app informando nome, e-mail e telefone,  
**para que** eu possa agendar serviços.

**Critérios de Aceitação:**
- [ ] Cadastro com validação de e-mail único
- [ ] Confirmação de conta por e-mail
- [ ] Perfil editável após criação

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-08 · Estrutura Base da API

**Como** desenvolvedor,  
**quero** ter a estrutura base do projeto (rotas, middlewares e modelos) configurada,  
**para que** as funcionalidades possam ser implementadas com agilidade.

**Critérios de Aceitação:**
- [ ] API REST estruturada
- [ ] Middleware de autenticação implementado
- [ ] Estrutura de pastas padronizada e documentada

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-09 · Agenda de Serviços

**Como** dono de estabelecimento ou funcionário,  
**quero** visualizar todos os agendamentos do dia e da semana em uma agenda,  
**para que** eu possa organizar a operação do negócio.

**Critérios de Aceitação:**
- [ ] Visualizações diária e semanal disponíveis
- [ ] Agendamentos exibem serviço, cliente e horário
- [ ] Interface atualiza em tempo real

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-10 · Cadastro de Serviços

**Como** dono de estabelecimento ou funcionário,  
**quero** cadastrar os serviços que ofereço (nome, descrição, duração e valor),  
**para que** os clientes possam visualizá-los e agendá-los.

**Critérios de Aceitação:**
- [ ] CRUD completo de serviços
- [ ] Duração configurada em minutos e valor monetário
- [ ] Serviço pode ser ativado ou desativado

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-11 · Alterar estado dos serviços

**Como** funcionário,  
**quero** alterar o estado dos serviços,  
**para que** consiga iniciar e finalizar o serviço no sistema.

**Critérios de Aceitação:**  
- [ ] O serviço pode ser iniciado
- [ ] O serviço pode ser finalizado
- [ ] Deve constar em registro quem inciou e finalizou o serviço

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 2 — Módulo de Agendamento (Backend + Web)

> **Objetivo:** Desenvolver o módulo de agendamento completo, incluindo cadastro de serviços, agenda do estabelecimento e controle de status.

---

### RF-11 · Configuração de Disponibilidade

**Como** dono de estabelecimento,  
**quero** definir meus horários de funcionamento e disponibilidade,  
**para que** os clientes só consigam agendar em horários válidos.

**Critérios de Aceitação:**
- [ ] Configuração por dia da semana
- [ ] Intervalos de horário editáveis
- [ ] Feriados e exceções podem ser cadastrados

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-12 · Seleção de Horários pelo Cliente

**Como** cliente,  
**quero** visualizar os horários disponíveis de um estabelecimento para um serviço específico,  
**para que** eu possa escolher o melhor horário.

**Critérios de Aceitação:**
- [ ] Horários indisponíveis não são exibidos
- [ ] Calendário com seleção de data intuitiva
- [ ] Atualização em tempo real ao selecionar a data

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-13 · Controle de Status do Agendamento

**Como** dono de estabelecimento,  
**quero** atualizar o status de um agendamento (Aguardando / Em andamento / Finalizado),  
**para que** eu e o cliente possamos acompanhar o progresso do serviço.

**Critérios de Aceitação:**
- [ ] Troca de status com um clique
- [ ] Histórico de mudanças de status registrado
- [ ] Cliente notificado a cada mudança de status

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-14 · Dashboard Financeiro

**Como** dono de estabelecimento,  
**quero** visualizar o faturamento diário, semanal e mensal em gráficos,  
**para que** eu possa acompanhar a saúde financeira do meu negócio.

**Critérios de Aceitação:**
- [ ] Gráficos de linha/barra por período
- [ ] Filtro por data customizável
- [ ] Exibição de receita total e por tipo de serviço

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-15 · Gestão de Clientes

**Como** dono de estabelecimento,  
**quero** visualizar o histórico de atendimentos de cada cliente, incluindo veículos e serviços realizados,  
**para que** eu possa personalizar o atendimento.

**Critérios de Aceitação:**
- [ ] Busca de cliente por nome ou telefone
- [ ] Histórico ordenado por data
- [ ] Dados do veículo associados ao cliente

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 3 — Dashboard Financeiro e Painel de Gestão

> **Objetivo:** Construir o painel de gestão com métricas financeiras, histórico de clientes e visualizações gerenciais.


---

### RF-16 · Painel de Gestão (Visão Geral)

**Como** dono de estabelecimento,  
**quero** ver um painel com métricas principais (total de agendamentos, receita do dia, avaliação média),  
**para que** eu tenha uma visão geral rápida do negócio.

**Critérios de Aceitação:**
- [ ] Dashboard carrega em menos de 3 segundos
- [ ] Métricas do dia atual exibidas por padrão
- [ ] Atalhos para ações frequentes disponíveis

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-17 · Exportação de Relatórios

**Como** dono de estabelecimento,  
**quero** exportar relatórios financeiros em PDF ou Excel,  
**para que** eu possa utilizá-los em prestação de contas ou análises externas.

**Critérios de Aceitação:**
- [ ] Exportação em PDF e XLSX disponível
- [ ] Relatório inclui período, serviços e totais
- [ ] Nome do arquivo gerado automaticamente com a data

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-18 · Mapa Interativo

**Como** cliente,  
**quero** visualizar no mapa os estabelecimentos próximos à minha localização,  
**para que** eu possa encontrar facilmente uma opção conveniente.

**Critérios de Aceitação:**
- [ ] Permissão de geolocalização solicitada ao abrir o mapa
- [ ] Pins no mapa para cada estabelecimento cadastrado
- [ ] Raio de busca ajustável (ex.: 5, 10, 20 km)

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 4 — App Mobile: Mapa e Busca de Estabelecimentos

> **Objetivo:** Desenvolver as funcionalidades de mapa interativo, busca e visualização de perfis de estabelecimentos no app.

---

### RF-19 · Busca de Estabelecimentos

**Como** cliente,  
**quero** buscar estabelecimentos por nome, tipo de serviço ou localização,  
**para que** eu encontre rapidamente o que preciso.

**Critérios de Aceitação:**
- [ ] Campo de busca com autocomplete
- [ ] Filtros por serviço e distância disponíveis
- [ ] Resultados ordenados por relevância e proximidade

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-20 · Perfil do Estabelecimento

**Como** cliente,  
**quero** acessar o perfil de um estabelecimento com fotos, serviços, avaliações e horários de funcionamento,  
**para que** eu possa decidir se quero agendar um serviço.

**Critérios de Aceitação:**
- [ ] Galeria de fotos do estabelecimento
- [ ] Lista de serviços com preço e duração estimada
- [ ] Avaliação média e comentários visíveis

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-21 · Favoritar Estabelecimentos

**Como** cliente,  
**quero** salvar estabelecimentos favoritos,  
**para que** eu possa acessá-los rapidamente nas próximas visitas ao app.

**Critérios de Aceitação:**
- [ ] Ícone de favorito na tela do estabelecimento
- [ ] Lista de favoritos acessível no perfil do usuário
- [ ] Favoritos sincronizados entre dispositivos

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 5 — App Mobile: Agendamento e Histórico

> **Objetivo:** Implementar o fluxo de agendamento online pelo app, cancelamento e visualização do histórico de serviços.

---

### RF-22 · Agendamento Online

**Como** cliente,  
**quero** selecionar um serviço, data e horário disponível para agendar um atendimento diretamente pelo app,  
**para que** eu não precise ligar ou ir pessoalmente ao estabelecimento.

**Critérios de Aceitação:**
- [ ] Fluxo de agendamento em no máximo 3 passos
- [ ] Confirmação exibida ao final do processo
- [ ] Agendamento aparece imediatamente na agenda do estabelecimento

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-23 · Cancelamento de Agendamento

**Como** cliente,  
**quero** cancelar um agendamento pelo app,  
**para que** eu possa desmarcar quando necessário sem precisar contatar o estabelecimento.

**Critérios de Aceitação:**
- [ ] Cancelamento disponível até X horas antes do horário (configurável)
- [ ] Estabelecimento notificado do cancelamento
- [ ] Horário liberado automaticamente na agenda

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-24 · Histórico de Serviços

**Como** cliente,  
**quero** visualizar o histórico de todos os meus agendamentos anteriores,  
**para que** eu possa acompanhar meu histórico de serviços e reagendar facilmente.

**Critérios de Aceitação:**
- [ ] Lista separada por status (concluído, cancelado, pendente)
- [ ] Detalhes de cada atendimento acessíveis
- [ ] Opção de reagendar serviço anterior com 1 clique

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-25 · Acompanhamento de Status em Tempo Real

**Como** cliente,  
**quero** acompanhar o status do meu agendamento em tempo real,  
**para que** eu saiba quando meu veículo está sendo atendido ou está pronto.

**Critérios de Aceitação:**
- [ ] Status sincronizado com o painel do estabelecimento
- [ ] Atualização sem necessidade de recarregar a tela
- [ ] Histórico de mudanças de status visível

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-26 · Recuperação de Senha

**Como** usuário,  
**quero** recuperar minha senha via e-mail,  
**para que** eu não perca acesso à minha conta caso esqueça minhas credenciais.

**Critérios de Aceitação:**
- [ ] Link de redefinição enviado por e-mail
- [ ] Link expira em 1 hora
- [ ] Nova senha deve atender requisitos mínimos de segurança

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 6 — Avaliações, Notificações e Ajustes Finais

> **Objetivo:** Finalizar as funcionalidades de avaliação, notificações push e realizar os ajustes finais antes da apresentação.

---

### RF-27 · Avaliação Pós-Serviço

**Como** cliente,  
**quero** avaliar o serviço recebido com nota e comentário após a conclusão do atendimento,  
**para que** outros clientes possam tomar decisões informadas.

**Critérios de Aceitação:**
- [ ] Avaliação de 1 a 5 estrelas
- [ ] Comentário opcional com limite de 500 caracteres
- [ ] Avaliação só disponível após status "Finalizado"

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-28 · Resposta às Avaliações

**Como** dono de estabelecimento,  
**quero** visualizar e responder às avaliações dos clientes,  
**para que** eu possa demonstrar atenção ao feedback recebido.

**Critérios de Aceitação:**
- [ ] Lista de avaliações ordenada por data
- [ ] Campo de resposta disponível por avaliação
- [ ] Resposta visível para todos os clientes

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-29 · Notificações Push (Cliente)

**Como** cliente,  
**quero** receber notificações push de confirmação e lembrete de agendamento,  
**para que** eu não esqueça dos serviços marcados.

**Critérios de Aceitação:**
- [ ] Notificação de confirmação imediata após agendar
- [ ] Lembrete enviado 24h e 1h antes do horário
- [ ] Possível desativar nas configurações do app

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-30 · Notificações de Novos Agendamentos (Estabelecimento)

**Como** dono de estabelecimento,  
**quero** receber notificações de novos agendamentos e cancelamentos,  
**para que** eu possa reagir rapidamente a qualquer mudança na agenda.

**Critérios de Aceitação:**
- [ ] Alerta em tempo real no painel web
- [ ] Notificação por e-mail como backup
- [ ] Preferências de notificação configuráveis

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-31 · Testes e Ajustes Finais

**Como** equipe de desenvolvimento,  
**quero** realizar testes de usabilidade e corrigir os ajustes finais apontados,  
**para que** o produto esteja polido para a apresentação.

**Critérios de Aceitação:**
- [ ] Testes realizados com ao menos 3 usuários reais
- [ ] Lista de bugs críticos zerada
- [ ] Melhorias de UX documentadas e implementadas

Responsáveis: <!-- @membro1 @membro2 -->
