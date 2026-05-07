# 🧱 Funcionalidade: Histórico e Auditoria de Ordens de Serviço
---

## 1. Funcionalidade: Histórico e Auditoria de Atendimentos

### 1.1 Use Case
**Nome:** Consultar histórico e auditar qualidade dos serviços  
**Ator:** Gestor  
**Descrição:** O gestor acessa o histórico de Ordens de Serviço para consultar atendimentos passados, aplicar filtros e validar a qualidade dos serviços prestados por meio da análise das mídias registradas no início e no fim do atendimento.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-17** | Histórico Consolidado de Atendimentos | Permitir ao gestor consultar Ordens de Serviço passadas com filtros por período, placa e status. |
| **RF-18** | Auditoria de Qualidade Visual | Permitir ao gestor visualizar e comparar mídias da OS (antes e depois) para validar a qualidade do serviço. |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Controle de Acesso | Apenas usuários com perfil de gestor podem acessar o histórico e a auditoria. |
| **RNF-02** | Isolamento (Multi-tenant) | Todas as consultas devem ser filtradas pelo `estabelecimento_id` do gestor logado. |
| **RNF-03** | Performance de Consulta | A listagem de histórico deve ser paginada para evitar sobrecarga de dados. |
| **RNF-04** | Organização de Mídias | As mídias devem permitir agrupamento por momento do atendimento. |
| **RNF-05** | Escalabilidade | O sistema deve suportar grande volume de registros históricos sem perda de desempenho. |

### 1.4 Endpoints RESTful

**Endpoint:** `/api/ordens-servico/gestor/historico/` ✅ Implementado

- **Método:** `GET`
- **Camada:** `HistoricoGestorListView`
- **Descrição:** Retorna lista de OS encerradas do estabelecimento com filtros opcionais.
- **Requisição — Query params opcionais:**
  - `data_inicio` (date, formato YYYY-MM-DD)
  - `data_fim` (date, formato YYYY-MM-DD)
  - `placa` (string, busca parcial case-insensitive)
  - `status` (enum — padrão filtra apenas `FINALIZADO` e `CANCELADO`)
  - `com_incidente_resolvido` (boolean — filtra OS que tiveram incidente resolvido)
- **Regras de Negócio:**
  - Filtrar obrigatoriamente pelo `estabelecimento_id` do gestor autenticado.
  - Por padrão, exibe apenas estados terminais (`FINALIZADO`, `CANCELADO`).
  - `data_fim` não pode ser data futura.
- **Resposta (`200 OK`):**
  - Lista de OS com campos: `id`, `placa`, `modelo`, `servico_nome`, `funcionario_nome`, `status`, `data_hora`, `horario_lavagem`, `horario_finalizacao`.
- **Falha:** `400 Bad Request` (datas inválidas) / `403 Forbidden`

---

**Endpoint:** `/api/ordens-servico/gestor/historico/{id}/fotos/` ✅ Implementado

- **Método:** `GET`
- **Camada:** `HistoricoGestorFotosView`
- **Descrição:** Retorna as mídias da OS agrupadas por momento para auditoria visual. Valida que a OS pertence ao estabelecimento do gestor.
- **Requisição:** Path param `id`
- **Resposta (`200 OK`):**
```json
{
  "estado_inicial": [
    { "id": 1, "arquivo_url": "...", "momento": "VISTORIA_GERAL" },
    { "id": 2, "arquivo_url": "...", "momento": "AVARIA_PREVIA" }
  ],
  "estado_meio": [
    { "id": 3, "arquivo_url": "...", "momento": "EXECUCAO" }
  ],
  "estado_final": [
    { "id": 4, "arquivo_url": "...", "momento": "FINALIZADO" }
  ]
}
```
- **Falha:** `403 Forbidden` (OS de outro estabelecimento) / `404 Not Found`

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O sistema deve retornar histórico de OS filtrado por período, placa e status para o gestor do estabelecimento. |
| **CA-02** | As mídias da OS devem ser exibidas agrupadas em três grupos: `estado_inicial` (VISTORIA_GERAL + AVARIA_PREVIA), `estado_meio` (EXECUCAO) e `estado_final` (FINALIZADO), permitindo auditoria visual em 360°. |

---

## 2. Testes Esperados

### 2.1 Teste 1: Consulta de Histórico com Filtros
**Descrição:** Buscar Ordens de Serviço pelo período, placa e status para o gestor autenticado.
**Esperado:**
- Resposta HTTP: `200 OK`
- Lista paginada de OS retornada com dados compatíveis com os filtros aplicados.

### 2.2 Teste 2: Visualização de Mídias da OS
**Descrição:** Abrir a seção de mídias para uma OS específica e conferir o agrupamento por momento.
**Esperado:**
- Resposta HTTP: `200 OK`
- Payload com `estado_inicial` e `estado_final` contendo URLs de arquivos de mídia. 

### 2.3 Teste 3: Validação de Acesso e Isolamento
**Descrição:** Tentar acessar o histórico ou as mídias como usuário sem perfil de gestor ou de outro estabelecimento.
**Esperado:**
- Resposta HTTP: `403 Forbidden`
- Mensagem de erro indicando restrição de acesso.


### 2.4 Teste 4: Sanitização Cronológica Antiviés (Datas Futuras/Invertidas)
**Descrição:** Gestor tenta filtrar usando `data_inicio` maior que `data_fim`, ou consulta uma `data_fim` superior ao tempo atual (amanhã).
**Esperado:**
- Resposta HTTP: `400 Bad Request`
- Mensagem de erro validando a incoerência cronológica, garantindo que o relatório seja sempre fiel à realidade temporal.

### 2.5 Teste 5: Auditoria de Dano (Mídias de Incidente)
**Descrição:** Gestor tenta ler a API de mídias de uma OS que teve incidentes atrelados durante a Execução.
**Esperado:**
- Resposta HTTP: `200 OK`
- O Payload final também deve devolver a sessão `"estado_meio"` contendo fotos atreladas a `EXECUCAO` (sinistros/incidentes registrados pelo operador), garantindo a auditoria em 360 graus.

---

# 🧱 Funcionalidade: Dashboard Executivo e Relatório de Eficiência da Equipe
---

## 1. Funcionalidade: Dashboard Executivo e Relatório de Eficiência da Equipe

### 1.1 Use Case
**Nome:** Visualizar indicadores diários e eficiência operacional da equipe.
**Ator:** Gestor.
**Descrição:** O gestor acessa uma visão resumida dos principais indicadores do dia e um relatório de eficiência por funcionário para acompanhar a performance financeira e operacional.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-19** | Dashboard Executivo Básico | Exibir indicadores diários resumidos, incluindo a contagem total de Ordens de Serviço finalizadas no dia e a soma do valor cobrado das OS com status FINALIZADO no dia atual. |
| **RF-20** | Relatório de Eficiência da Equipe | Gerar relatório consolidado de Ordens de Serviço finalizadas agrupadas por funcionário, comparando o tempo real de execução com a duração estimada do serviço. |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Performance | A API deve responder em menos de 300ms para consultas de dashboard e relatório em dias com até 1000 OS finalizadas. |
| **RNF-02** | Segurança | O acesso deve ser permitido apenas para usuários com perfil de gestor e filtrar os dados pelo estabelecimento_id do gestor logado. |

### 1.4 Endpoints RESTful

**Endpoint:** `/api/gestao/gestor/dashboard/indicadores/` ✅ Implementado

- **Método:** `GET`
- **Camada:** `DashboardAPIView`
- **Descrição:** Retorna indicadores executivos do dia e histórico semanal de receita.
- **Requisição:**
  - Query param: `data` (opcional, padrão data atual, formato YYYY-MM-DD)
- **Resposta (`200 OK`):**
```json
{
  "totalOsFinalizadas": 12,
  "receitaTotal": 960.00,
  "incidentesAtivos": 2,
  "volume_por_hora": [0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 1, 2, 0, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0],
  "receita_semanal": [
    { "data": "2026-04-19", "valor": 480.00 },
    { "data": "2026-04-20", "valor": 960.00 }
  ]
}
```
- **Falha:** `400 Bad Request` (data inválida) / `403 Forbidden`

---

**Endpoint:** `/api/gestao/gestor/dashboard/eficiencia-equipe/` ✅ Implementado

- **Método:** `GET`
- **Camada:** `EficienciaAPIView`
- **Descrição:** Retorna relatório de eficiência por funcionário para OS finalizadas no período.
- **Requisição:**
  - Query params: `dataInicio`, `dataFim` (opcionais, padrão últimos 7 dias)
- **Resposta (`200 OK`):**
```json
[
  {
    "funcionarioId": 3,
    "nomeFuncionario": "João Silva",
    "totalOs": 8,
    "tempoTotalEstimadoMinutos": 320,
    "tempoTotalRealMinutos": 290,
    "desvioTotalMinutos": -30
  }
]
```
- **Falha:** `400 Bad Request` / `403 Forbidden`

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O dashboard deve mostrar o número total de Ordens de Serviço finalizadas no dia e a soma do valor_cobrado das OS com status FINALIZADO no dia atual. |
| **CA-02** | O relatório de eficiência deve agrupar OS finalizadas por funcionário e calcular o desvio entre tempo real (fim - início) e duração_estimada_minutos do serviço. |

---

## 2. Testes Esperados

### 2.1 Teste 1: Cenário de Sucesso do Dashboard
**Descrição:** Consultar os indicadores do dia para um gestor logado com OS finalizadas no mesmo estabelecimento.
**Esperado:**
- Resposta HTTP: `200 OK`
- Payload com `totalOsFinalizadas` e `receitaTotal` corretos para a data informada.

### 2.2 Teste 2: Cenário de Sucesso do Relatório de Eficiência
**Descrição:** Consultar o relatório de eficiência para um período com Ordens de Serviço finalizadas.
**Esperado:**
- Resposta HTTP: `200 OK`
- Payload contendo registros por funcionário com `totalOs`, `tempoTotalEstimadoMinutos`, `tempoTotalRealMinutos` e `desvioTotalMinutos` calculado corretamente.

### 2.3 Teste 3: Validação de Acesso e Escopo
**Descrição:** Tentar acessar os endpoints com um usuário sem perfil de gestor ou de outro estabelecimento.
**Esperado:**
- Resposta HTTP: `403 Forbidden`
- Mensagem de erro indicando que o recurso é restrito ao gestor do estabelecimento.

---
> [!TIP]
> **Dica para a IA:** Ao ler arquivos que seguem este modelo, priorize a implementação dos **Critérios de Aceitação** e garanta que todos os **Testes Esperados** passem antes de considerar a funcionalidade pronta.
