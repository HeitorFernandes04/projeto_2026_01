# Documentação: Regras de Negócio e Requisitos Funcionais (Ordens de Serviço)

Com base na análise do código atual nos arquivos `models.py`, `services.py` e `views.py` do módulo de `atendimentos`, aqui está a lista das funcionalidades e de todas as regras de negócio aplicadas e em vigor no backend para o domínio de **Ordem de Serviço (OS)**.

## 📌 Requisitos Funcionais (RFs) Implementados

*   **RF-01: Cadastro Dinâmico de Veículos** (Reutilização de perfil de veículo com base na placa durante agendamento).
*   **RF-02: Agendamento de Serviços Automotivos** (Com bloqueio de concorrência e restrições de horários).
*   **RF-03: Cálculo de Horários Livres** (Sistema automatizado para retornar os intervalos de agenda abertos por prestador/dia com base na duração do serviço alvo).
*   **RF-04: Iniciar Ordem de Serviço (OS)** (Vistoria Inicial e Check-in rastreado pelo funcionário).
*   **RF-05: Capturar Fotos de Vistoria** (Armazenamento de múltiplas imagens do estado de recebimento do veículo).
*   **RF-06: Capturar Fotos de Entrega / Finalizar** (Finalização engatilhada a restrições obrigatórias e fechamento seguro do serviço).
*   **RF-10: Emitir Histórico de Serviços** (Listagem temporal categorizada por funcionário dos status concluídos/agendados do projeto).
*   **RF-11: Adição de Comentários e Observações** no serviço e andamento (Laudo Técnico).

---

## ⚙️ Regras de Negócio Aplicadas no Código (RN)

### 1. Sistema de Agendamentos e Horários
*   **RN-01 (Horário de Expediente):** O funcionamento padrão do sistema e cálculos de slots disponíveis são gerados abarcando o intervalo fixo de `08:00h às 18:00h`.
*   **RN-02 (Slots Base de Atendimento):** A agenda fragmenta os horários do dia utilizando blocos de pesquisa e intervalo fixos de `30 em 30 minutos`.
*   **RN-03 (Bloqueio Temporal Inteligente):** O sistema não exibe nem permite o agendamento em datas cujo período sobrepõe parcial ou totalmente (Start/End limits) outro agendamento já presente em status `AGENDADO` ou `EM_EXECUCAO`.
*   **RN-04 (Autocadastro do Veículo):** No momento em que se cria uma Ordem de Serviço via placa, caso essa placa já exista, e ao passar novos dados (cor, nome celular), o perfil geral daquele veículo é atualizado (`update_or_create`).

### 2. Restrições do Operacional e Fluxos do Funcionário
*   **RN-05 (Bloqueio de Multitarefa em Andamento):** Um funcionário **não pode** ter mais de uma OS em estado `EM_EXECUCAO` simultaneamente. É exigida a finalização (ou transição para Liberação) da atual antes de iniciar outro processo.
*   **RN-06 (Concorrência / Trava do Check-in):** Uma OS deve pertencer unicamente a um funcionário quando transita para execução.
*   **RN-07 (Entrada Expressa):** Ao requisitar `iniciar_agora=True`, a OS é criada diretamente com status `PATIO` e o `horario_inicio` é registrado para o momento da criação.

### 3. Matriz de Permissões e Mídias (Evidências)
*   **RN-08 (Matriz Status vs Momento):** O sistema valida rigorosamente a coerência entre o estágio da OS e o tipo de foto enviada:
    *   `PATIO` / `VISTORIA_INICIAL` -> Aceita `VISTORIA_GERAL` e `AVARIA_PREVIA`.
    *   `EM_EXECUCAO` / `BLOQUEADO_INCIDENTE` -> Aceita `EXECUCAO`.
    *   `LIBERACAO` -> Aceita `FINALIZADO`.
*   **RN-09 (Exigência Probatória - Quantidade):** 
    *   Para avançar da **Vistoria Inicial**, são exigidas exatamente **5 fotos** do momento `VISTORIA_GERAL`.
    *   Para concluir a **Liberação**, são exigidas exatamente **5 fotos** do momento `FINALIZADO`.
*   **RN-10 (Otimização de Imagem):** Independente do dispositivo, imagens com resolução além de `1920 pixels` serão redimensionadas. Exports são forçados em `JPEG` com qualidade `85%`.

### 4. Condições e Bloqueios para Finalização do Serviço
*   **RN-12 (Bloqueio de Incidentes):** Se um incidente for registrado, a OS muda para `BLOQUEADO_INCIDENTE`, impedindo qualquer avanço ou finalização até que um gestor realize o desbloqueio.
*   **RN-13 (Check-out Operacional):** A finalização exige a informação da **Vaga do Pátio** onde o veículo foi deixado.

### 5. Consultas e Visibilidade Histórica (Compliance)
*   **RN-14 (Privacidade de Time):** Funcionários só podem visualizar seu próprio histórico via API (filtro via JWT).
*   **RN-15 (Bloqueio de Datas Invertidas):** Filtros de histórico validam que a data inicial não seja superior à final e impedem consultas de datas futuras.
