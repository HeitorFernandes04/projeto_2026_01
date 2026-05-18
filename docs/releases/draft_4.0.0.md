# 🚀 Release 4.0.0 - Sprint 4 - Refatoração, Isolamento e Apps Independentes

Nesta release, a equipe Lava-Me concluiu mais uma Sprint, entregando ferramentas essenciais para a evolução do ecossistema.

## 🛠 O que há de novo (Sprint 4 - Refatoração, Isolamento e Apps Independentes)
* **Refatoração do Core e Banco de Dados (RF-27)**: Introdução do campo de progresso em tempo real `etapa_atual` (0-100%) nas Ordens de Serviço e flexibilização das restrições rígidas da esteira operacional.
* **Isolamento e Setup do App Cliente B2C (RF-28)**: Criação do novo projeto independente `mobile-cliente` (Ionic/React), totalmente apartado da equipe B2B, com tela de descoberta geográfica de lava-jatos via mapa interativo.
* **Jornada do Cliente e Checkout Simplificado (RF-29)**: Autenticação rápida via OTP no WhatsApp, motor de agendamento em 3 etapas e tela de acompanhamento ao vivo do andamento da lavagem do carro.
* **Refatoração UX Operacional B2B (RF-30)**: Simplificação do fluxo de pista do operador, botão e fluxo de "Entrada Rápida" pulando etapas burocráticas de acabamento e unificação da linguagem ubiqua.
* **Segurança e Unificação de APIs (RF-31)**: Consolidação segura dos endpoints de histórico sob a rota `/api/shared/historico/` contra vulnerabilidade IDOR e auditoria Side-by-Side (fotos iniciais vs incidentes) para o gestor.
* **Painel Financeiro Básico (RF-32)**: Exibição de receita consolidada, tabelas detalhadas de transações com filtros de data e exportação em PDF de relatórios de fechamento.
* **Refinamento de Usabilidade de Pré-Lançamento (UX/UI)**: Correção de 8 pontos de fricção do app do cliente, incluindo máscara inteligente híbrida de placas (Mercosul e Tradicional), cálculo dinâmico de tempo de esteira, indicação física da vaga de estacionamento do pátio e cancelamento autônomo com alerta.

## 🤖 Inovação: IA e Engenharia de Software
* **Documentation-First:** Código especificado e validado pela IA antes do deploy.
* **Governança:** Testes automatizados e linting aplicados no pipeline.

## 👥 Pull Requests e Contribuições
* Feature/rf29 jornada checkout (#46) por @LeticiaGLopes-151
* feat(mobile-cliente): RF-28 — setup do app B2C e mapa de descoberta (#45) por @HeitorFernandes04
* Feature/refatoracao ux operacional b2b (#44) por @yamatosz
* RF-31 - Unificacao de APIs e Seguranca (#43) por @eziors
* Docs: Sincronização da RF-32 e Roadmap Sprint 4 (#42) por @WandersonAMello
* Feature/rf 27 core e banco de dados (#41) por @MontDeP
* docs: Planejamento Sprint 4 e Workflows de Auditoria (#40) por @WandersonAMello
* Feature/rf 26 galeria fotos (#39) por @eziors
* Feature/rf 24 cancelamento autonomo (#37) por @MontDeP
* Feature/auth b2c (#36) por @eziors
* Feat/fix vazamento timezone (#35) por @LeticiaGLopes-151
* feat(RF-25): implementa painel do cliente com histórico de ordens de … (#34) por @HeitorFernandes04
* Feat/rf23 checkout publico (#33) por @LeticiaGLopes-151
* Feat/rf22 motor disponibilidade (#32) por @yamatosz
* Revert "feat(rf-26): implementar Galeria Pós-Venda)" (#31) por @yamatosz
