# 🧱 Padronização Web - Lava-Me (Angular)

Este documento define os padrões absolutos para o desenvolvimento do módulo Web. Toda nova funcionalidade gerada por IA deve seguir estas diretrizes.

## 1. Arquitetura de Diretórios
O projeto segue uma estrutura baseada em módulos funcionais e serviços centralizados:
- `web/src/app/gestao/`: Componentes da área administrativa.
- `web/src/app/auth/`: Lógica de autenticação, login e Guards de rota.
- `web/src/app/services/`: Camada de abstração de API (Singleton).
- `web/src/app/shared/`: Componentes e pipes reutilizáveis.

## 2. Design System (Tokens de Cores)
As cores são extraídas do `styles.scss` e devem ser usadas via variáveis CSS:
- **Background Principal:** `--lm-bg` (`#0b0e11`)
- **Sidebar:** `--lm-sidebar` (`#0f1218`)
- **Cards & Superfícies:** `--lm-card` (`#161b22`)
- **Destaque Primário:** `--lm-primary` (`#0066ff`)
- **Alertas / Incidentes:** `--lm-accent` (`#ff3b30`)
- **Texto Primário:** `--lm-text` (`#f0f6fc`)

## 3. Padrões de Código
### 3.1 Componentes
- Devem usar `changeDetection: ChangeDetectionStrategy.OnPush` sempre que possível.
- Nomenclatura: `kebab-case.component.ts`.
- Estilos exclusivos no `.scss` do componente, evitando o global.

### 3.2 Serviços e API
- Devem estender um serviço base ou usar o `HttpClient` com tratamento de erro centralizado.
- **Endpoints:** Todas as URLs devem começar com `/api/gestao/` para rotas de backoffice.

## 4. Testes (Vitest)
- Todo componente deve ter um arquivo `.spec.ts`.
- O foco dos testes deve ser a renderização correta dos estados de `loading` e `error`.
