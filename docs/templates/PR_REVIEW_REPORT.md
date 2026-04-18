# Revisão Semântica de Pull Request (Via IA)

**Análise realizada automaticamente por Agentes de IA via Workflow de Governança.**

## 📊 Status Técnico (Execução de Código)
_Resultado das varreduras estruturais e unitárias no repositório sanitarizado._

* **Backend (Pytest):** [🟢 Aprovado / 🔴 Falhou / ⚠️ Parcial] - _X/X testes passando_.
* **Mobile (Cypress/Tipagem):** [🟢 Aprovado / 🔴 Falhou / ➖ N/A] - _Comentário breve sobre testes E2E._
* **Web (Vitest/Angular):** [🟢 Aprovado / 🔴 Falhou / ➖ N/A] - _Comentário breve sobre componentes CSS/UI._

## 🧠 Validação Semântica (Aderência de Negócio)
_Cruzamento entre a AST dos testes desenvolvidos e os requisitos RAG (User Stories)._

* **O que foi testado vs O que foi pedido:**
  _Descrever se as regras de negócio foram de fato validadas. Exemplo: "Embora haja testes, faltou cobrir a regra de exclusão lógica que é exigida pelo CA-02 do RF-11."_

## 🛡️ Riscos Identificados e Viés de Segurança
_Vazamentos de isolamento, IDOR, chaves perdidas ou má aplicação de permissões (ex: Gestor vs Operador)._

* **Multitenancy:** _Está seguro?_
* **Outros:** _N/D_

## 🎯 Ação Recomendada
[ ] **APROVAR:** A PR atende à documentação e passa nos testes com segurança.
[ ] **BLOQUEAR MANUAMENTE:** A PR passa nos testes técnicos mas ignora requisitos vitais de negócio.
[ ] **REFATORAR (REJEITAR):** Código quebrado, vazamento de dependências ou quebra de tipagem. Resumo do que precisa consertar.
