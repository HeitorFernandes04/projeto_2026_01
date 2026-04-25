# 🧱 Modelo de Documentação de Funcionalidade
---
*Este documento serve como guia padrão para a criação de novas regras de negócio e especificações técnicas no projeto Lava-Me. Use este modelo para garantir que a IA e os desenvolvedores tenham contexto completo.*

## 1. Funcionalidade: Operação em Tempo Real

### 1.1 Use Case
**Nome:** Monitorar fluxo da pista e tratar incidentes  
**Ator:** Gestor  
**Descrição:** O gestor acompanha as Ordens de Serviço do dia em um quadro operacional, identifica gargalos, visualiza bloqueios por incidente e realiza a auditoria necessária para liberar a continuidade da OS.

---

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Status | Descrição |
| :--- | :--- | :--- | :--- |
| **RF-14** | Kanban de Pista | ✅ Implementado | Exibir um quadro Kanban com todas as Ordens de Serviço operacionais agrupadas em 4 colunas: `PATIO`, `LAVAGEM`, `FINALIZADO_HOJE` e `INCIDENTES`. |
| **RF-15** | Central de Incidentes Pendentes | ❌ Pendente | Exibir uma listagem exclusiva de OS com status `BLOQUEADO_INCIDENTE`, com alerta visual quando houver pendências. |
| **RF-16** | Auditoria e Desbloqueio | ❌ Pendente | Permitir ao gestor analisar os dados do incidente, registrar nota de resolução e devolver a OS ao fluxo após a liberação. |

---

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Performance Operacional | A consulta do Kanban e da central de incidentes deve suportar uso em tempo real, com resposta rápida para a operação. |
| **RNF-02** | Integridade Transacional | A resolução do incidente e o desbloqueio da OS devem ocorrer de forma atômica, sem divergência entre `INCIDENTE_OS` e `ORDEM_SERVICO`. |
| **RNF-03** | Controle de Acesso | Apenas usuários com perfil de gestor podem visualizar incidentes pendentes e executar ações de auditoria e desbloqueio. |

---

### 1.4 Endpoints RESTful
**Endpoint:** `/api/ordens-servico/kanban/` ✅ Implementado

- **Método:** `GET`
- **Camada:** `KanbanAPIView`
- **Descrição:** Retorna as OS agrupadas em 4 colunas operacionais. Inclui OS ativas de qualquer data + finalizadas somente hoje.
- **Resposta (`200 OK`):**
```json
{
  "PATIO": [...],
  "LAVAGEM": [...],
  "FINALIZADO_HOJE": [...],
  "INCIDENTES": [...]
}
```
- Cada card contém: `id`, `placa`, `modelo`, `servico`, `duracao_estimada_minutos`, `tempo_decorrido_minutos`, `is_atrasado`.
- `LAVAGEM` agrupa os status `VISTORIA_INICIAL`, `EM_EXECUCAO` e `LIBERACAO`.
- `INCIDENTES` agrupa OS com status `BLOQUEADO_INCIDENTE`.
- Falha: `401/403`

---

**Endpoint:** `/api/incidentes-os/pendentes/` ❌ Não implementado

- **Método:** `GET`
- **Camada:** `IncidenteViewSet` (a criar)
- **Descrição:** Listagem de incidentes pendentes vinculados a OS bloqueadas.
- **Requisição:** autenticado como Gestor.
- **Resposta:** `200 OK` / `403 Forbidden`

---

**Endpoint:** `/api/incidentes-os/{id}/auditoria/` ❌ Não implementado

- **Método:** `GET`
- **Camada:** `IncidenteViewSet` (a criar)
- **Descrição:** Retorna os dados consolidados da OS, incidente e peça afetada para análise do gestor.
- **Requisição:** Path param `id`.
- **Resposta:** `200 OK` / `403 Forbidden`

---

**Endpoint:** `/api/incidentes-os/{id}/resolver/` ❌ Não implementado

- **Método:** `PATCH`
- **Camada:** `IncidenteViewSet` (a criar)
- **Descrição:** Resolve o incidente, registra a nota do gestor e restaura o status anterior da OS.
- **Requisição:** JSON com `observacoes_resolucao`.
- **Pré-requisito:** migration adicionando campo `status_anterior_os` em `IncidenteOS` (ver CA-08).
- **Resposta:** `200 OK` / `400 Bad Request` / `403 Forbidden`

---

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O Kanban deve exibir todas as Ordens de Serviço operacionais (com status entre `PATIO` e `LIBERACAO`, além de `BLOQUEADO_INCIDENTE`), *independentemente do dia* em que foram iniciadas, desaparecendo apenas quando `FINALIZADO` ou `CANCELADO`. <br> |
| **CA-02** | Cada card deve exibir Placa, Modelo, Serviço e Tempo Decorrido. |
| **CA-03** | Ordens em `EM_EXECUCAO` com tempo real superior à duração estimada do serviço devem receber destaque visual. |
| **CA-04** | A central de incidentes deve listar apenas OS com status `BLOQUEADO_INCIDENTE`. |
| **CA-05** | A interface principal deve exibir alerta visual quando houver incidente pendente não resolvido. |
| **CA-06** | A auditoria deve exibir dados da OS, descrição do incidente, peça afetada e foto vinculada. |
| **CA-07** | O desbloqueio deve exigir preenchimento da nota de resolução. |
| **CA-08** | Ao resolver o incidente, o sistema deve marcar o registro como resolvido, preencher gestor e data de resolução, e restaurar a OS ao status anterior ao bloqueio. <br> *> ⚠️ **[Alerta Antigravity]:** Para isso funcionar, vocês precisam rodar uma migration adicionando o campo `status_anterior_os` na Model `IncidenteOS` ou na `OrdemServico`, caso contrário, não haverá como saber para qual status a OS deve retornar (nem sempre é EM_EXECUCAO).* |

---

## 2. Testes Esperados

### 2.1 Teste 1: Listagem do Kanban do Dia
**Descrição:** Consultar o Kanban com OS distribuídas entre os status operacionais.  
**Esperado:**
- Resposta HTTP: `200 OK`
- Retorno com exatamente as 4 chaves: `PATIO`, `LAVAGEM`, `FINALIZADO_HOJE`, `INCIDENTES`.
- OS com status `VISTORIA_INICIAL`, `EM_EXECUCAO` e `LIBERACAO` devem aparecer agrupadas em `LAVAGEM`.
- OS com `BLOQUEADO_INCIDENTE` devem aparecer em `INCIDENTES`.
- OS com status `FINALIZADO` e `horario_finalizacao` de data anterior ao dia atual **não** devem aparecer.

---

### 2.2 Teste 2: Destaque de Atraso em Execução
**Descrição:** Consultar o Kanban com uma OS em `EM_EXECUCAO` acima da duração estimada do serviço.  
**Esperado:**
- Resposta HTTP: `200 OK`
- A OS retorna sinalizada como atrasada.

---

### 2.3 Teste 3: Listagem de Incidentes Pendentes
**Descrição:** Consultar a central com incidentes resolvidos e pendentes cadastrados.  
**Esperado:**
- Resposta HTTP: `200 OK`
- Retorno apenas de incidentes vinculados a OS com status `BLOQUEADO_INCIDENTE`.

---

### 2.4 Teste 4: Auditoria de Incidente
**Descrição:** Consultar os detalhes de um incidente pendente existente.  
**Esperado:**
- Resposta HTTP: `200 OK`
- Retorno com dados cruzados de `ORDEM_SERVICO`, `INCIDENTE_OS` e `TAG_PECA` ou `VISTORIA_ITEM`.

---

### 2.5 Teste 5: Resolver e Desbloquear Incidente
**Descrição:** Enviar nota de resolução válida para um incidente pendente.  
**Esperado:**
- Resposta HTTP: `200 OK`
- O incidente passa a constar como resolvido e a OS retorna ao status anterior ao bloqueio.

---

### 2.6 Teste 6: Resolver sem Nota
**Descrição:** Tentar resolver um incidente sem informar `nota_resolucao`.  
**Esperado:**
- Resposta HTTP: `400 Bad Request`
- Mensagem: `"A nota de resolução é obrigatória."`

---

### 2.7 Teste 7: Resolver Incidente Já Resolvido
**Descrição:** Tentar resolver novamente um incidente já finalizado.  
**Esperado:**
- Resposta HTTP: `409 Conflict`
- Mensagem: `"O incidente informado já foi resolvido."`

---

### 2.8 Teste 8: Acesso sem Permissão
**Descrição:** Usuário sem perfil de gestor tenta acessar auditoria ou desbloqueio.  
**Esperado:**
- Resposta HTTP: `403 Forbidden`
- Regra violada: Controle de Acesso por Perfil.
