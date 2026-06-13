# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: RF-27 - Core e Banco de Dados (Refatoração de Modelos)

### 1.1 Use Case
**Nome:** Reestruturação de Dados para Geolocalização e Acompanhamento RT.

**Ator:** Desenvolvedor 1 (Infraestrutura) / Sistema.

**Descrição:** Preparar a base de dados (PostgreSQL/SQLite) para suportar as novas funcionalidades de mapa do app B2C e o acompanhamento de progresso percentual, além de limpar dados legados do fluxo de acabamento.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-27.1** | Geolocalização do Estabelecimento | Adicionar campos `latitude` e `longitude` (ambos `FloatField`) ao modelo `Estabelecimento`. |
| **RF-27.2** | Acompanhamento de Progresso | Adicionar o campo `etapa_atual` (inteiro de 0 a 100) ao modelo `OrdemServico` para representar o percentual de conclusão. |
| **RF-27.3** | Limpeza de Legado (Backend) | Remover os campos `horario_acabamento` e `comentario_acabamento` do modelo `OrdemServico`. Remover também a opção `ACABAMENTO` do campo de *choices* do `status` da OS. |
| **RF-27.4** | Saneamento de Cargos | Atualizar as `choices` do campo `cargo` em `Funcionario` para remover a opção 'DETALHISTA'. |
| **RF-27.5** | Reset e Seed de Dados | Realizar o reset do banco de dados em ambiente de desenvolvimento e atualizar o script de `seed` com dados compatíveis com o novo schema. |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Integridade de Dados | Garantir que o reset do banco não quebre o script de carga inicial (seed). |
| **RNF-02** | Compatibilidade de API | Atualizar os serializers para incluir os novos campos sem quebrar as consultas existentes. |

### 1.4 Endpoints RESTful e Dependências de Backend
- **Atualização de Modelos:** `accounts/models.py`, `operacao/models.py`.
- **Serializers:** `EstabelecimentoSerializer`, `OrdemServicoSerializer`.
- **Comando de Carga:** `python manage.py seed_data` (ou equivalente).

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O comando `python manage.py migrate` executa sem erros após o reset do banco. |
| **CA-02** | O Django Admin exibe os novos campos de latitude e longitude no Estabelecimento. |
| **CA-03** | Consultas GET em `/api/operacao/os/` retornam o campo `etapa_atual`. O endpoint de transição de estado (`avancar`) atualiza esse percentual automaticamente no banco. |
| **CA-04** | Tentativas de salvar o cargo 'DETALHISTA' ou o status 'ACABAMENTO' via API ou Admin retornam erro de validação (Choices). |

---

> [!IMPORTANT]
> **Mandato TDD:** Escreva os testes abaixo antes de iniciar a implementação da lógica. Eles devem falhar inicialmente (Red) e guiar o desenvolvimento até o sucesso (Green).

## 2. Testes Esperados

### 2.1 Teste 1: Validação de Novos Campos
**Descrição:** Verificar se os campos criados aceitam valores válidos.
**Esperado:**
- `latitude` aceita `-23.5505` e `longitude` aceita `-46.6333`.
- `etapa_atual` aceita `50` e rejeita `150`.

### 2.2 Teste 2: Verificação de Remoção
**Descrição:** Verificar se campos de acabamento foram realmente removidos.
**Esperado:**
- Erro de atributo ao tentar acessar `os.horario_acabamento` via shell ou código.

---
