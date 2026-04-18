# 🧱 Modelo de Documentação de Funcionalidade
---
*Este documento serve como guia padrão para a criação de novas regras de negócio e especificações técnicas no projeto Lava-Me. Use este modelo para garantir que a IA e os desenvolvedores tenham contexto completo.*

## 1. Funcionalidade: Gestão e Parametrização do Estabelecimento e Equipe

### 1.1 Use Case
**Nome:** Configurar Catálogo de Serviços, Perfil da Unidade e Quadro de Equipe  
**Ator:** Gestor  
**Descrição:** O gestor define quais os serviços o lava-jato oferece, gere as contas de acesso dos operadores de pista (funcionários) e mantém os dados cadastrais da unidade atualizados para o cliente final.

---

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-11** | Gestão de Serviços | Cadastrar e editar serviços contendo Nome, Descrição, Preço e Duração Estimada. Implementar Soft Delete para preservar o histórico de OS. |
| **RF-12** | Administração de Funcionários | Criar, listar e inativar contas de acesso para a equipe de pista (operadores), garantindo o vínculo com o estabelecimento. |
| **RF-13** | Configurações da Unidade | Editar dados do lava-jato (Nome Fantasia, CNPJ, Endereço) e gerir a URL pública de autoagendamento. |

---

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Isolamento (IDOR) | A listagem, edição e criação de serviços e funcionários devem ser estritamente filtradas pelo `estabelecimento_id` do gestor logado (Multi-tenant). |
| **RNF-02** | Integridade Relacional | A exclusão de um funcionário ou serviço deve ser lógica (`is_active=False` ou `status_ativo=False`). É proibido o Hard Delete se houver vínculos com `OrdemServico` passadas. |

---

### 1.4 Endpoints RESTful


**Endpoint:** `/api/gestao/servicos/` (RF-11)
- **Método:** `GET/POST/PATCH/DELETE`
- **Camada:** `GestaoViewSet`
- **Descrição:** CRUD de serviços do estabelecimento.
- **Requisição (POST):** JSON com `nome`, `descricao`, `preco`, `duracao_estimada_min`.
- **Resposta:** Sucesso `200/201` | Falha `400/403`.

**Endpoint:** `/api/gestao/funcionarios/` (RF-12)
- **Método:** `GET/POST/PATCH`
- **Camada:** `GestaoViewSet`
- **Descrição:** Gestão do quadro de funcionários do estabelecimento.
- **Requisição (POST):** JSON com `email`, `password`, `nome_completo`, `cargo`. O `estabelecimento_id` deve ser inferido do token do Gestor no backend.
- **Resposta:** Sucesso `200/201` | Falha `400/403`.

**Endpoint:** `/api/gestao/estabelecimento/` (RF-13)
- **Método:** `GET/PATCH`
- **Camada:** `GestaoViewSet`
- **Descrição:** Atualiza os dados da unidade do gestor logado.
- **Requisição (PATCH):** JSON com `nome_fantasia`, `cnpj`, `endereco_completo`.
- **Resposta:** Sucesso `200 OK` | Falha `400/403`.

---

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O formulário de serviço deve obrigar o preenchimento da `duracao_estimada_min` para alimentar o cálculo de eficiência (RF-20). <br> *(Nota: Corrigido de "duracao_estimada_minutos" para refletir o schema real do `models.py`)* |
| **CA-02** | Ao inativar um serviço ou funcionário, o sistema deve apenas alterar o campo de controle (`is_active` / `status_ativo`) para falso (Soft Delete). |
| **CA-03** | A inativação de um funcionário não pode anular ou corromper o campo `funcionario_id` nas `OrdemServico` do histórico que ele já finalizou. |
| **CA-04** | O backend deve rejeitar automaticamente tentativas de criação de funcionários vinculados a um `estabelecimento_id` diferente daquele do gestor autenticado. |
| **CA-05** | Os dados da unidade (RF-13) devem ser refletidos imediatamente na URL de autoagendamento gerada. |

---

## 2. Testes Esperados

### 2.1 Teste 1: Cadastro de Serviço com Sucesso
**Descrição:** Gestor insere um novo serviço de "Lavagem Completa" com duração de 40 min.  
**Esperado:**
- Resposta HTTP: `201 Created`
- O serviço aparece na listagem filtrada pelo `estabelecimento_id` do gestor.

---

### 2.2 Teste 2: Tentativa de Exclusão Física (Proteção de Histórico)
**Descrição:** Tentar deletar um serviço que já possui 10 Ordens de Serviço vinculadas.  
**Esperado:**
- Resposta HTTP: `200 OK` (se simulado via PATCH de inativação) ou `403/400` (se tentativa de DELETE físico capturada pelo backend).
- No banco de dados, o registro permanece, mas com flag inativa.

---

### 2.3 Teste 3: Criação e Inativação de Funcionário (Isolamento e Histórico)
**Descrição:** Um Gestor cadastra um Funcionário e, posteriormente, o inativa. Uma OS previamente executada pelo funcionário é então consultada.
**Esperado:**
- Resposta HTTP (Criação): `201 Created`. O registro no modelo `Funcionario` e no modelo `User` devem ser gerados.
- Resposta HTTP (Inativação): `200 OK`. O funcionário perde o acesso (`is_active=False`).
- A consulta à OS antiga continua a retornar os dados do funcionário, garantindo a integridade relacional exigida no CA-03.

---

### 2.4 Teste 4: Prevenção de IDOR na Listagem de Funcionários e Serviços
**Descrição:** Gestor do "Lava-Jato A" tenta listar os serviços ou funcionários usando as credenciais do "Lava-Jato A", mas tenta injetar o ID do "Lava-Jato B" na query string ou payload.
**Esperado:**
- O backend deve ignorar a injeção do ID e forçar a filtragem pelo `estabelecimento_id` extraído do Token JWT do gestor.
- Resposta HTTP: `200 OK` retornando **apenas** os dados do "Lava-Jato A" (ou `403 Forbidden` se o request for de manipulação direta).

---


### 2.5 Teste 5: Prevenção de Acesso por Cargo (Hierarquia)
**Descrição:** Um usuário com `tipo_usuario` marcado como `FUNCIONARIO` tentar criar um novo serviço ou funcionário no sistema via API `/api/gestao/...`.
**Esperado:**
- A API deve barrar o acesso antes de processar os dados.
- Resposta HTTP: `403 Forbidden`.