# 🧱 Funcionalidade: Motor de Disponibilidade de Horários
---
*Este documento descreve o motor de inteligência para agendamento, responsável por calcular e exibir horários livres para o cliente final, evitando conflitos de agenda no projeto Lava-Me.*

## 1. Funcionalidade: Motor de Disponibilidade de Horários

### 1.1 Use Case
**Nome:** Consultar disponibilidade de horários para agendamento.
**Ator:** Cliente Final.
**Descrição:** O cliente seleciona um serviço desejado e o sistema apresenta apenas os horários em que o estabelecimento possui vaga, considerando a duração do serviço e os agendamentos já existentes.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-22** | Motor de Disponibilidade de Horários | Permitir que o cliente veja apenas horários realmente livres, cruzando a duração estimada do serviço com as Ordens de Serviço já agendadas (status PATIO ou superior). |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Precisão | O cálculo deve considerar a soma da duração estimada do serviço selecionado para garantir que o bloco de tempo esteja totalmente livre. |
| **RNF-02** | Consistência | O motor deve ignorar Ordens de Serviço canceladas ou em status que não ocupem vaga na agenda futura. |

### 1.4 Endpoints RESTful
**Endpoint:** `/api/public/agendamento/disponibilidade`

- **Método:** `GET`
- **Camada:** `AgendamentoController`
- **Descrição:** Retorna uma lista de blocos de tempo (horários) disponíveis para uma determinada data e serviço.
- **Requisição:**
  - Parâmetros de consulta: `estabelecimentoId`, `servicoId`, `data` (YYYY-MM-DD)
- **Resposta:**
  - Sucesso: `200 OK` + `[{ inicio: "HH:mm", fim: "HH:mm" }]`
  - Falha: `400 Bad Request` (parâmetros inválidos) / `404 Not Found` (estabelecimento ou serviço inexistente).

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O backend deve realizar o cruzamento da duração estimada do serviço selecionado com os horários de Ordens de Serviço já agendadas (status PATIO ou superior). |
| **CA-02** | O retorno da API deve conter exclusivamente os blocos de tempo que estão livres para início imediato do serviço, respeitando o horário de funcionamento do estabelecimento. |

---

## 2. Testes Esperados

### 2.1 Teste 1: Cenário de Sucesso - Consulta de Horários
**Descrição:** Consultar a disponibilidade para um serviço de 30 minutos em um dia com baixa ocupação.
**Esperado:**
- Resposta HTTP: `200 OK`
- Payload contendo múltiplos blocos de tempo disponíveis ao longo do dia.

### 2.2 Teste 2: Bloqueio por Overbooking
**Descrição:** Tentar consultar disponibilidade em um horário que já possui uma Ordem de Serviço agendada (status PATIO).
**Esperado:**
- O bloco de tempo correspondente ao agendamento existente (e sua duração) não deve aparecer na lista de horários disponíveis.

### 2.3 Teste 3: Ajuste por Duração do Serviço
**Descrição:** Consultar disponibilidade para um serviço longo (ex: 2 horas) vs um serviço curto (ex: 30 min).
**Esperado:**
- O número de blocos disponíveis deve ser menor para o serviço longo, pois exige janelas maiores de tempo livre consecutivas.

---
> [!TIP]
> **Dica para a IA:** O motor de disponibilidade é o core do agendamento B2C. Certifique-se de que a lógica de "PATIO ou superior" inclua todos os estados operacionais (VISTORIA_INICIAL, EM_EXECUCAO, etc.) para evitar conflitos com veículos que já estão no estabelecimento.
