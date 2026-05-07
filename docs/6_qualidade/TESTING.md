# 🧪 Qualidade e Testes

## Estratégia de Testes
O projeto adota a pirâmide de testes com foco em isolamento e reatividade.

## Backend (Python)
- **Framework:** Pytest
- **Principais Ferramentas:**
  - `pytest-django`: Integração com o banco de dados e transações.
  - `Factory Boy` & `Faker`: Geração de dados sintéticos realistas.
- **Cobertura:** Foco em `services.py` (lógica de negócio) e `permissions.py` (multi-tenancy/SaaS).
- **Execução:** `pytest` na raiz do backend.

## Frontend Web (Angular)
- **Framework:** Vitest
- **Principais Ferramentas:**
  - `Testing Library`: Testes focados no comportamento do usuário.
  - `jsdom`: Ambiente de DOM para testes rápidos sem browser.
- **Padrão:** Cada componente deve ter seu `.spec.ts` validando estados de UI e reatividade RxJS.
- **Execução:** `npm test` no diretório `web`.

## Frontend Mobile (Ionic/React)
- **Unitários:** Vitest + Testing Library.
- **E2E:** Cypress (validando fluxos críticos de pátio).
- **Execução:** `npm run test.unit` ou `npm run test.e2e` no diretório `mobile`.

## Governança (Review via IA)
- Uso de workflows automatizados (`review_pr.md`) para auditar semântica de negócio vs implementação de testes antes do merge.
