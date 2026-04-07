# 🧱 Modelo de Documentação de Funcionalidade
---
*Este documento serve como guia padrão para a criação de novas regras de negócio e especificações técnicas no projeto Lava-Me. Use este modelo para garantir que a IA e os desenvolvedores tenham contexto completo.*

## 1. Funcionalidade: [NOME_DA_FUNCIONALIDADE]

### 1.1 Use Case
**Nome:** [Breve descrição da ação]
**Ator:** [Quem realiza a ação - ex: Usuário, Funcionário, Gestor]
**Descrição:** [Explicação resumida do objetivo do caso de uso]

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-01** | [Nome] | [Descrição clara do que o sistema deve fazer] |
| **RF-02** | [Nome] | [Descrição clara do que o sistema deve fazer] |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | [Ex: Segurança] | [Ex: Criptografia de dados sensíveis] |
| **RNF-02** | [Ex: Performance] | [Ex: Resposta em menos de 200ms] |

### 1.4 Endpoints RESTful
**Endpoint:** `/api/...`

- **Método:** `GET/POST/PATCH/DELETE`
- **Camada:** `[App]Controller / View`
- **Descrição:** [O que o endpoint faz]
- **Requisição:**
  - JSON com campos: `campo1`, `campo2`.
- **Resposta:**
  - Sucesso: `200 OK` + [Payload]
  - Falha: `4xx/5xx` + [Mensagem de erro]

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | [Condição específica para considerar a tarefa concluída] |
| **CA-02** | [Condição específica para considerar a tarefa concluída] |

---

## 2. Testes Esperados

### 2.1 Teste 1: [Cenário de Sucesso]
**Descrição:** [O que é feito]
**Esperado:**
- Resposta HTTP: `200/201`
- [Efeito colateral esperado no banco ou resposta]

### 2.2 Teste 2: [Cenário de Erro - Validação]
**Descrição:** [Ex: Tentar salvar com dados inválidos]
**Esperado:**
- Resposta HTTP: `400 Bad Request`
- Mensagem: "[Mensagem de erro específica]"

### 2.3 Teste 3: [Cenário de Negócio - Restrição]
**Descrição:** [Ex: Tentar finalizar sem fotos]
**Esperado:**
- Resposta HTTP: `400/409`
- Regra violada: [RN-XX]

---
> [!TIP]
> **Dica para a IA:** Ao ler arquivos que seguem este modelo, priorize a implementação dos **Critérios de Aceitação** e garanta que todos os **Testes Esperados** passem antes de considerar a funcionalidade pronta.
