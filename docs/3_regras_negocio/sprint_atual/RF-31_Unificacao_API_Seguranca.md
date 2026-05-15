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
| **RF-31.3** | Auditoria Side-by-Side | Implementar no Painel Web do Gestor a visualização comparativa das 5 fotos obrigatórias de entrada (vistoria) e fotos do incidente. |

> [!IMPORTANT]
> **Checklist Técnico - RF-31 (Saneamento e Segurança):**
> Para garantir que essa limpeza arquitetural seja estável e não traga regressões silenciosas, as seguintes validações devem constar na implementação:
> - **Limpeza de Rotas Duplicadas:** Ao centralizar a lógica em `/api/shared/historico/`, as antigas declarações de endpoints fragmentados devem ser fisicamente excluídas das `urls.py`. O `AuthInterceptor` e os serviços (Services) nos frontends Web e Mobile devem ser ajustados para a nova rota.
> - **Filtragem Estrita no ViewSet:** O método `get_queryset()` do novo endpoint tem a obrigação de retornar apenas os campos pertinentes ao perfil do usuário solicitante (Cliente vs Gestor), mantendo o isolamento de dados B2C/B2B (faturamento).
> - **Estratégia Pós-Audit (Lockfile):** Upgrades de segurança (`npm audit fix`) em compiladores (como Vite ou Babel) podem estilhaçar os bundles. É obrigatório reinstalar o pacote limpando as pastas `node_modules` antigas e garantir que o `npm run build` rode sem gerar artefatos quebrados.
> - **Resiliência Visual da Modal (Side-by-Side):** Por regra de negócio, **é obrigatório que o funcionário tire 5 fotos** do veículo para que a OS seja iniciada. O layout da modal deve prever um grid organizado para essas 5 fotos na coluna de Entrada, usando `object-fit: cover` para não quebrar dimensões. Contudo, como prática de segurança (fallback para OSs muito antigas), se não houver foto, o frontend **deve** exibir um Card/Placeholder elegante.

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
| **CA-02** | A modal de incidente exibe o grid com as 5 fotos obrigatórias de vistoria ao lado das fotos do incidente, sem distorções geométricas (mantendo o Placeholder de fallback para OSs antigas). |
| **CA-03** | A API unificada (`/api/shared/historico/`) responde corretamente a múltiplos perfis, e os endpoints defasados não respondem mais (Foram deletados). |
| **CA-04** | A pipeline de build (`npm run build`) no frontend completa sem erros após a fixação dos pacotes em ambas as plataformas. |

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
- **Layout:** Duas colunas. A coluna "Entrada" exibe um grid projetado para as 5 fotos obrigatórias. Ambas as colunas possuem zoom ao passar o mouse (magnifier).
- **Controles:** Manter os botões de ação atuais do modal de auditoria sem alterações.
---
