# 📋 User Stories — Documentação do Projeto

> Organização por Sprints · Formato: *Como [persona], quero [ação] para que [benefício]*

---

> A organização por sprints pode ser alterada de acordo com a necessidade de entregas atual do projeto.

---

## Índice

* [Sprint 1 — Experiência do Funcionário](#sprint-1--experiência-do-funcionário)
* [Sprint 2 — Gestão e Controle Operacional](#sprint-2--gestão-e-controle-operacional)
* [Sprint 3 — Experiência do Cliente](#sprint-3--experiência-do-cliente)
* [Sprint 4 — Comunicação, Relatórios e Recursos Avançados](#sprint-4--comunicação-relatórios-e-recursos-avançados)

---

## Sprint 1 — Experiência do Funcionário

> **Objetivo:** Permitir que o funcionário gerencie atendimentos de forma prática e eficiente no dia a dia.

---

### RF-01 · Cadastro de Usuário

**Como** usuário,
**quero** me cadastrar no sistema,
**para** acessar as funcionalidades disponíveis.

**Critérios de Aceitação:**

* [x] Cadastro com nome, email e senha
* [x] Validação de dados obrigatórios
* [x] Usuário salvo no sistema

Responsáveis: @MontDeP, @HeitorFernandes04

---

### RF-02 · Login de Usuário

**Como** usuário,
**quero** fazer login no sistema,
**para** acessar minha conta.

**Critérios de Aceitação:**

* [x] Login com email e senha
* [x] Validação de credenciais
* [x] Redirecionamento após login

Responsáveis: @MontDeP, @HeitorFernandes04

---

### RF-03 · Visualizar Atendimentos do Dia

**Como** funcionário,
**quero** visualizar os atendimentos agendados para o dia,
**para que** eu possa me organizar melhor.

**Critérios de Aceitação:**

* [x] Lista de atendimentos exibida por data atual
* [x] Informações do veículo e serviço visíveis
* [x] Ordenação por horário

Responsáveis: @HeitorFernandes04

---

### RF-04 · Iniciar Atendimento

**Como** funcionário,
**quero** iniciar um atendimento,
**para que** o sistema registre o início do serviço.

**Critérios de Aceitação:**

* [x] Botão de iniciar atendimento disponível
* [x] Registro de horário de início salvo
* [x] Status do atendimento atualizado

Responsáveis: @HeitorFernandes04, @WandersonAMello

---

### RF-05 · Registrar Fotos Antes do Atendimento

**Como** funcionário,
**quero** tirar fotos do veículo antes do serviço,
**para** registrar o estado inicial.

**Critérios de Aceitação:**

* [x] Upload de múltiplas fotos permitido
* [x] Fotos vinculadas ao atendimento
* [x] Pré-visualização disponível

Responsáveis: @yamatosz, @WandersonAMello

---

### RF-06 · Registrar Fotos Após o Atendimento

**Como** funcionário,
**quero** tirar fotos depois do serviço,
**para** demonstrar o resultado final.

**Critérios de Aceitação:**

* [x] Upload de fotos após finalização
* [x] Fotos organizadas como “depois”
* [x] Associação automática ao atendimento

Responsáveis: @yamatosz, @WandersonAMello

---

### RF-07 · Adicionar Comentários no Atendimento

**Como** funcionário,
**quero** adicionar comentários,
**para** registrar ocorrências durante o serviço.

**Critérios de Aceitação:**

* [x] Campo de texto disponível
* [x] Comentários salvos no atendimento
* [x] Histórico visível

Responsáveis: @WandersonAMello

---

### RF-08 · Criar Atendimento Manual

**Como** funcionário,
**quero** cadastrar um atendimento na hora,
**para** atender clientes sem agendamento.

**Critérios de Aceitação:**

* [x] Formulário com dados do veículo
* [x] Seleção de serviço disponível
* [x] Salvamento imediato

Responsáveis: @WandersonAMello

---

### RF-09 · Agendar Atendimento em Horário Vago

**Como** funcionário,
**quero** agendar um atendimento,
**para** organizar horários disponíveis.

**Critérios de Aceitação:**

* [x] Visualização de horários livres
* [x] Bloqueio de conflitos
* [x] Confirmação de agendamento

Responsáveis: @WandersonAMello

---

### RF-10 · Visualizar Histórico de Atendimentos

**Como** funcionário,
**quero** ver meus atendimentos realizados,
**para** acompanhar meu desempenho.

**Critérios de Aceitação:**

* [x] Filtro por período
* [x] Lista com atendimentos realizados
* [x] Informações resumidas

Responsáveis: @WandersonAMello

---

## Sprint 2 — Gestão e Controle Operacional

> **Objetivo:** Permitir ao gestor administrar funcionários, serviços e acompanhar o desempenho do negócio.

---

### RF-11 · Gerenciar Funcionários

**Como** gestor,
**quero** gerenciar funcionários,
**para** manter a equipe organizada.

**Critérios de Aceitação:**

* [ ] Criar, editar e remover funcionários
* [ ] Listagem com dados básicos
* [ ] Status ativo/inativo

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-12 · Gerenciar Serviços

**Como** gestor,
**quero** gerenciar os serviços oferecidos,
**para** manter o catálogo atualizado.

**Critérios de Aceitação:**

* [ ] Criar, editar e excluir serviços
* [ ] Definir preço e descrição
* [ ] Listagem disponível

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-13 · Visualizar Dashboard

**Como** gestor,
**quero** visualizar indicadores do negócio,
**para** tomar decisões estratégicas.

**Critérios de Aceitação:**

* [ ] Exibição de métricas principais
* [ ] Atualização em tempo real ou sob demanda
* [ ] Interface clara

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-14 · Filtrar Dados no Dashboard

**Como** gestor,
**quero** aplicar filtros,
**para** analisar dados específicos.

**Critérios de Aceitação:**

* [ ] Filtro por data
* [ ] Filtro por funcionário
* [ ] Filtro por serviço

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-15 · Gerar Relatórios

**Como** gestor,
**quero** gerar relatórios,
**para** acompanhar o desempenho.

**Critérios de Aceitação:**

* [ ] Relatórios por período
* [ ] Exportação (PDF ou CSV)
* [ ] Dados consolidados

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-16 · Relatórios por Funcionário

**Como** gestor,
**quero** ver relatórios por funcionário,
**para** avaliar produtividade.

**Critérios de Aceitação:**

* [ ] Dados individuais
* [ ] Quantidade de atendimentos
* [ ] Receita gerada

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-17 · Relatórios por Cliente

**Como** gestor,
**quero** visualizar relatórios por cliente,
**para** entender comportamento de consumo.

**Critérios de Aceitação:**

* [ ] Histórico de serviços
* [ ] Frequência de uso
* [ ] Ticket médio

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 3 — Experiência do Cliente

> **Objetivo:** Permitir que o cliente interaja com o sistema de forma simples e autônoma.

---

### RF-18 · Agendamento de Serviço

**Como** cliente,
**quero** agendar um serviço,
**para** garantir atendimento.

**Critérios de Aceitação:**

* [ ] Escolha de data e horário
* [ ] Seleção de serviço
* [ ] Confirmação do agendamento

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-19 · Autoagendamento via Link

**Como** cliente,
**quero** agendar por link,
**para** facilitar o acesso.

**Critérios de Aceitação:**

* [ ] Link funcional
* [ ] Interface simples
* [ ] Confirmação automática

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-20 · Cadastro de Veículo

**Como** cliente,
**quero** cadastrar meu veículo,
**para** agilizar futuros agendamentos.

**Critérios de Aceitação:**

* [ ] Cadastro com placa e modelo
* [ ] Salvamento persistente
* [ ] Seleção em novos agendamentos

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-21 · Enviar Fotos no Agendamento

**Como** cliente,
**quero** enviar fotos do veículo,
**para** informar o estado antes do serviço.

**Critérios de Aceitação:**

* [ ] Upload de imagens
* [ ] Associação ao agendamento
* [ ] Visualização prévia

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-22 · Visualizar Histórico de Serviços

**Como** cliente,
**quero** ver meu histórico,
**para** acompanhar serviços realizados.

**Critérios de Aceitação:**

* [ ] Lista de serviços
* [ ] Filtro por período
* [ ] Informações detalhadas

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-23 · Visualizar Fotos do Atendimento

**Como** cliente,
**quero** ver fotos do antes e depois,
**para** validar o serviço.

**Critérios de Aceitação:**

* [ ] Exibição de fotos
* [ ] Separação antes/depois
* [ ] Disponível por até 60 dias

Responsáveis: <!-- @membro1 @membro2 -->

---

## Sprint 4 — Comunicação, Relatórios e Recursos Avançados

> **Objetivo:** Melhorar comunicação com o cliente e oferecer recursos avançados de busca e controle.

---

### RF-24 · Notificação de Confirmação

**Como** sistema,
**quero** notificar o cliente,
**para** confirmar o agendamento.

**Critérios de Aceitação:**

* [ ] Notificação via app
* [ ] Mensagem via WhatsApp
* [ ] Confirmação registrada

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-25 · Lembrete de Atendimento

**Como** sistema,
**quero** enviar lembretes,
**para** reduzir faltas.

**Critérios de Aceitação:**

* [ ] Envio automático
* [ ] Configuração de horário
* [ ] Registro de envio

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-26 · Busca de Atendimentos por Veículo

**Como** gestor,
**quero** buscar atendimentos por veículo,
**para** localizar registros rapidamente.

**Critérios de Aceitação:**

* [ ] Busca por placa
* [ ] Resultados filtrados
* [ ] Exibição clara

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-27 · Busca por Serviço

**Como** gestor,
**quero** buscar por serviço,
**para** analisar execução.

**Critérios de Aceitação:**

* [ ] Filtro por tipo de serviço
* [ ] Resultados organizados
* [ ] Dados relevantes exibidos

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-28 · Busca por Data

**Como** gestor,
**quero** buscar atendimentos por data,
**para** análises temporais.

**Critérios de Aceitação:**

* [ ] Filtro por período
* [ ] Resultados corretos
* [ ] Performance adequada

Responsáveis: <!-- @membro1 @membro2 -->

---

### RF-29 · Acesso a Fotos por Período

**Como** gestor,
**quero** acessar fotos de atendimentos,
**para** auditoria e controle de qualidade.

**Critérios de Aceitação:**

* [ ] Disponível por 60 dias
* [ ] Associação correta com atendimento
* [ ] Visualização organizada

Responsáveis: <!-- @membro1 @membro2 -->

---