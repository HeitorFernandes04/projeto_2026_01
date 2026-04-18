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
**Endpoint:** `/api/ordens-servico`

- **Método:** `GET`
- **Camada:** `HistoricoViewSet` (View)
- **Descrição:** Retorna lista paginada de Ordens de Serviço com filtros aplicáveis.
- **Requisição:**
  - Query params opcionais:
    - `data_inicio`
    - `data_fim`
    - `placa`
    - `status`
- **Regras de Negócio:**
  - Filtrar obrigatoriamente pelo `estabelecimento_id` do gestor autenticado.
  - Aplicar paginação obrigatória.
- **Resposta:**
  - Sucesso: `200 OK`
  - Falha: `4xx/5xx`

**Endpoint:** `/api/ordens-servico/{id}/midias`

- **Método:** `GET`
- **Camada:** `HistoricoViewSet` (View)
- **Descrição:** Retorna as mídias da Ordem de Serviço agrupadas para auditoria visual.
- **Requisição:**
  - Path param: `id`
- **Regras de Negócio:**
  - Validar se a OS pertence ao `estabelecimento_id` do gestor.
  - Agrupar mídias com base no campo `momento`.
- **Resposta (exemplo):**
```json
{
  "estado_inicial": [
    { "arquivo_url": "...", "momento": "VISTORIA_GERAL" },
    { "arquivo_url": "...", "momento": "AVARIA_PREVIA" }
  ],
  "estado_final": [
    { "arquivo_url": "...", "momento": "FINALIZADO" }
  ]
}
```

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O sistema deve retornar histórico de OS filtrado por período, placa e status para o gestor do estabelecimento. |
| **CA-02** | As mídias da OS devem ser exibidas agrupadas por estado inicial e estado final, permitindo auditoria visual clara. |

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
**Endpoint:** `/api/gestor/dashboard/indicadores`

- **Método:** `GET`
- **Camada:** `DashboardAPIView` (View)
- **Descrição:** Retorna os indicadores executivos do dia corrente, incluindo volume de OS finalizadas e receita total.
- **Requisição:**
  - Parâmetros de consulta: `data` (opcional, padrão data atual)
- **Resposta:**
  - Sucesso: `200 OK` + `{ totalOsFinalizadas, receitaTotal }`
  - Falha: `401 Unauthorized` / `403 Forbidden` + mensagem de erro.

**Endpoint:** `/api/gestor/dashboard/eficiencia-equipe`

- **Método:** `GET`
- **Camada:** `EficienciaAPIView` (View)
- **Descrição:** Retorna o relatório de eficiência por funcionário para OS finalizadas, comparando tempo real de execução com a duração estimada do serviço.
- **Requisição:**
  - Parâmetros de consulta: `dataInicio`, `dataFim`
- **Resposta:**
  - Sucesso: `200 OK` + `[{ funcionarioId, nomeFuncionario, totalOs, tempoTotalEstimadoMinutos, tempoTotalRealMinutos, desvioTotalMinutos }]`
  - Falha: `400 Bad Request` / `403 Forbidden` + mensagem de erro.

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
