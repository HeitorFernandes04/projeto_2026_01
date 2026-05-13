# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: RF-31 - Unificação de APIs e Segurança

### 1.1 Use Case
**Nome:** Saneamento de APIs e Auditoria de Incidentes (Web)

**Ator:** Gestor / Sistema

**Descrição:** O sistema passa por uma limpeza arquitetural para unificar endpoints de consulta e resolver vulnerabilidades críticas. Além disso, o Painel do Gestor (Web) recebe melhorias na auditoria de incidentes.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-31.1** | Unificação de ViewSets | Consolidar endpoints de `historico` (accounts e operacao) em um único ponto de entrada que filtra os dados pelo perfil do requisitante. |
| **RF-31.2** | Segurança (npm audit) | Corrigir vulnerabilidades reportadas em pacotes críticos (Babel, fast-uri, Vite). |
| **RF-31.3** | Auditoria Side-by-Side | Implementar no Painel Web do Gestor a visualização comparativa das fotos de entrada (vistoria) e fotos do incidente. |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Padronização de Response | Todos os endpoints unificados devem seguir o mesmo padrão de envelope JSON (data, meta, errors). |
| **RNF-02** | Estabilidade de Build | O comando `npm run build` deve ser executado com sucesso em ambos os frontends após as correções. |

### 1.4 Endpoints RESTful e Dependências de Backend
- **GET** `/api/shared/historico/` - Endpoint unificado.
- **GET** `/api/gestao/incidentes/{id}/comparativo/` - Retorna fotos de entrada e incidente.

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O comando `npm audit` retorna 0 vulnerabilidades Críticas/Altas. |
| **CA-02** | O gestor consegue abrir uma modal de incidente e ver as fotos de vistoria e as fotos do incidente lado a lado. |
| **CA-03** | A API de histórico unificada reduz o número de chamadas de rede no carregamento do dashboard. |

---

> [!IMPORTANT]
> **Mandato TDD:** Escreva os testes abaixo antes de iniciar a implementação da lógica. Eles devem falhar inicialmente (Red) e guiar o desenvolvimento até o sucesso (Green).

## 2. Testes Esperados

### 2.1 Teste 1: Auditoria Side-by-Side
**Descrição:** Abrir um incidente no painel gestor.
**Esperado:** Renderização de duas colunas de imagens: "Entrada" e "Incidente".

### 2.2 Teste 2: Validação de Segurança
**Descrição:** Rodar scanner de vulnerabilidades pós-fix.
**Esperado:** Relatório limpo para pacotes identificados.

---

## 3. Esboço de Usabilidade (Web)
### Modal de Auditoria de Incidentes
- **Layout:** Duas colunas com zoom ao passar o mouse (magnifier).
- **Controles:** Manter os botões de ação atuais do modal de auditoria sem alterações.
---
