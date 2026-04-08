# Documentação: Regras de Negócio e Requisitos Funcionais (Atendimentos)

Com base na análise do código atual nos arquivos `models.py`, `services.py` e `views.py` do módulo de `atendimentos`, aqui está a lista das funcionalidades e de todas as regras de negócio aplicadas e em vigor no backend.

## 📌 Requisitos Funcionais (RFs) Implementados
Os seguintes fluxos e requisitos puderam ser validados com base nos endpoints e serviços existentes:

*   **RF-01: Cadastro Dinâmico de Veículos** (Reutilização de perfil de veículo com base na placa durante agendamento).
*   **RF-02: Agendamento de Serviços Automotivos** (Com bloqueio de concorrência e restrições de horários).
*   **RF-03: Cálculo de Horários Livres** (Sistema automatizado para retornar os intervalos de agenda abertos por prestador/dia com base na duração do serviço alvo).
*   **RF-04: Atribuição / Iniciar Atendimento** (Check-in das atividades pelo funcionário de forma rastreada).
*   **RF-05: Capturar Fotos do ANTES** (Armazenamento de múltiplas imagens do estado de recebimento do veículo).
*   **RF-06: Capturar Fotos do DEPOIS / Finalizar** (Finalização engatilhada a restrições obrigatórias e fechamento seguro do serviço).
*   **RF-10: Emitir Histórico de Serviços** (Listagem temporal categorizada por funcionário dos status concluídos/agendados do projeto).
*   **RF-11: Adição de Comentários e Observações** no serviço e andamento.

---

## ⚙️ Regras de Negócio Aplicadas no Código (RN)

### 1. Sistema de Agendamentos e Horários
*   **RN-01 (Horário de Expediente):** O funcionamento padrão do sistema e cálculos de slots disponíveis são gerados abarcando o intervalo fixo de `08:00h às 18:00h`.
*   **RN-02 (Slots Base de Atendimento):** A agenda fragmenta os horários do dia utilizando blocos de pesquisa e intervalo fixos de `30 em 30 minutos`.
*   **RN-03 (Bloqueio Temporal Inteligente):** O sistema não exibe nem permite o agendamento em datas cujo período sobrepõe parcial ou totalmente (Start/End limits) outro agendamento já presente em status `agendado` ou `em_andamento`.
*   **RN-04 (Autocadastro do Veículo):** No momento em que se cria um Atendimento via placa, caso essa placa já exista, e ao passar novos dados (cor, nome celular), o perfil geral daquele veículo é "sobreescrito" (`update_or_create`) para refletir e renovar o portador mais recente.

### 2. Restrições do Operacional e Fluxos do Funcionário
*   **RN-05 (Bloqueio de Multitarefa em Andamento):** Um funcionário **não pode** sob nenhuma hipótese ter mais de um atendimento em estado `em_andamento` registrado para o escopo do dia vigente. É exigido a finalização do atual antes dele possuir condições de "iniciar" outro processo na sua conta no mesmo dia.
*   **RN-06 (Concorrência / Trava do Check-in):** Um atendimento deve, unicamente e estritamente, recair a um usuário quando transita do status `agendado` para `em_andamento`. Há trava em banco para prevenir que 2 funcionários assumam (claim) exatamente ao mesmo tempo uma respectiva lavagem.
*   **RN-07 (Restrição ao Começar Rápido):** Ao requisitar o parâmetro na API `iniciar_agora=True`, o sistema cria e injeta diretamente em status em andamento e insere timestamp atemporal de `horario_inicio` para o momento base no próprio servidor no exato segundo.

### 3. Tratamento e Controle de Mídias/Imagens (Evidências)
*   **RN-08 (Validação de Oportunidade Fotográfica):** Fotos não podem ser enviadas e integradas para serviços já "cancelados" ou "finalizados". Somente os em execução passiva ou ativa (`agendado` / `em_andamento`) respondem abertos ao servidor a recepção.
*   **RN-09 (Limite Restrito de Uploads):** Aplica-se limite extremo de segurança, sendo o teto estabelecido contido rigorosamente em **5 arquivos** no máximo por momento individualizado (5 do momento 'ANTES' e 5 do 'DEPOIS').
*   **RN-10 (Compressão de Peso - Storage):** Independente do dispositivo, imagens com resolução além de `1920 pixels` serão dimensionadas para este teto padrão pelo próprio backend (compressão antialiasing LANCZOS).
*   **RN-11 (Regra e Qualidade do Sistema de Arquivos):** Arquivos `RGBA/P` sem fundo devem obrigatoriamente sofrer processamento de achatamento sendo transpostos em `RGB`, exportados de forma forçosa usando codificação `JPEG` com índice de qualidade parametrizado para comprimir fixadamente e perder dados desnecessários em favorabilidade aos `85%`.

### 4. Condições e Bloqueios para Finalização do Serviço
*   **RN-12 (Limitação do Encaminhamento de Check-out):** Nenhum estado paralelo tem propriedade ou capacidade de finalizar serviço além e estritamente aos em estado `em_andamento`.
*   **RN-13 (Obrigatoriedade Probatória do Check-out):** O sistema recusa em bloco a requisição e nega finalizações (conforme RF-06 e as demandas jurídicas/comprovação) caso o banco do respectivo Atendimento ainda resida sem a associação técnica validada formalmente de **pelo menos 1 mídia vinculada com as tag 'DEPOIS'**.

### 5. Consultas e Visibilidade Histórica (Compliance)
*   **RN-14 (Blindagem Funcional Unidirecional - Privacidade de Time):** Consultas ao histórico `RF-10` respondem por blindagem estrita; jamais funcionários terão exibidos por esses caminhos resultados de terceiros, pois a consulta insere amarra interna filtrando ao respectivo usuário submetido o token JWT.
*   **RN-15 (Bloqueio Cronológico Invertido/Futuro):** Filtros não permitirão listagens onde as data inicial exigida na pesquisa possuir métrica sobre a data final, tal qual não autoriza inserção investigativa avançando os eixos da data corrente local restritiva (proibido inserir data de previsão futura em lista analística com base na "referência de hoje").
