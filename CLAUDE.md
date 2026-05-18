# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lava-Me** is a multi-tenant SaaS for car wash management. Three separate frontends consume a single Django REST API:
- `backend/` — Django 5.2 + DRF (API, Python)
- `web/` — Angular 21 (Gestor/admin portal, B2B web)
- `mobile/` — Ionic 8 + React 19 (Funcionário/operator app, B2B mobile)
- `mobile-cliente/` — Ionic 8 + React 19 (Cliente app, B2C mobile — being built in Sprint 4)

The **venv** lives at the repo root (`venv/`), not inside `backend/`.

---

## Commands

### Run everything (all 3 servers simultaneously)
```bash
make dev
```

### Backend (Django)
```bash
# Activate venv first (Windows PowerShell)
.\venv\Scripts\Activate.ps1

cd backend
python manage.py runserver          # Dev server at :8000
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser
python manage.py seed_data          # Populate dev DB with fixtures
python manage.py shell

# Tests (run from backend/)
pytest                              # Full suite with coverage
pytest operacao/tests/              # Single app
pytest operacao/tests/test_services.py::TestClass::test_method  # Single test
pytest -v -W ignore                 # Verbose, suppress warnings
```

`pytest.ini` auto-configures `DJANGO_SETTINGS_MODULE`, uses `--nomigrations --reuse-db`, and generates HTML coverage to `backend/htmlcov/`.

### Web (Angular)
```bash
cd web
npm start                           # Dev server at :4200 (proxies /api → :8000)
npm run build
npm run test                        # Vitest (unit, runs spec.ts files)
npm run test:e2e                    # Cypress E2E
npm run lint
```

### Mobile B2B (Ionic/React)
```bash
cd mobile
npm run dev                         # Vite dev server
npm run build
npm run test.unit                   # Vitest interactive
npm run test.unit -- --run          # Vitest single-run (CI)
npm run test.e2e                    # Cypress headless
npm run lint
```

### RAG / AI Infrastructure
```bash
# After changing anything in docs/, re-index the vector store:
python backend/scripts/ingest_docs.py
```

### Release automation
```bash
make release v=4.0.0 title="Sprint 4 - B2C e Refatoração"
```

---

## Architecture

### Backend Layer Rules (mandatory)

Every Django app follows a strict 4-layer pattern:

| Layer | File | Responsibility |
|---|---|---|
| Data | `models.py` | Schema, choices, structural constraints only |
| Parsing | `serializers.py` | JSON↔Python, type validation — **no business logic** |
| Entry | `views.py` | Permission checks, call serializer, **delegate to service** |
| Logic | `services.py` | All business rules, state validation, `ValidationError` here |

Never put business logic in serializers or views. Services are the single source of truth for rules.

### Multi-Tenant Isolation

Every queryset **must** filter by the logged-in user's `estabelecimento`. The pattern is:

```python
# In services.py — always resolve via perfil_gestor or perfil_funcionario
estabelecimento = user.perfil_gestor.estabelecimento
queryset = Model.objects.filter(estabelecimento=estabelecimento)
```

`User.estabelecimento` is a property that resolves through either `perfil_gestor` or `perfil_funcionario`. Clients (`perfil_cliente`) are isolated by their own FK to `Veiculo`.

### Domain Model

**Central entity:** `OrdemServico` (OS) — never call it "Atendimento" (legacy term).

**Status machine:**
```
PATIO → VISTORIA_INICIAL → EM_EXECUCAO → LIBERACAO → FINALIZADO
                                    ↘ BLOQUEADO_INCIDENTE (only Gestor unblocks)
                    ↘ CANCELADO (only from PATIO)
```

**Key rules:**
- 5 photos required at `VISTORIA_GERAL` and at `FINALIZADO` before advancing
- A `Funcionario` cannot have 2 OS in `EM_EXECUCAO` simultaneously
- `BLOQUEADO_INCIDENTE` requires a Gestor note to unlock (`observacoes_resolucao`)
- Images are compressed via Pillow (RGBA→RGB, JPEG 85%, max 1920px) — never store raw uploads

**Core models and their apps:**

| Model | App | Notes |
|---|---|---|
| `Estabelecimento`, `User`, `Cliente`, `Funcionario`, `Gestor` | `accounts` | `User` uses email as `USERNAME_FIELD` |
| `Servico`, `Veiculo`, `TagPeca`, `VistoriaItem` | `core` | Shared domain models |
| `OrdemServico`, `MidiaOrdemServico`, `IncidenteOS` | `operacao` | Core operational flow |
| Public scheduling, B2C auth | `agendamento_publico` | Unauthenticated + B2C endpoints |

### URL Structure (`backend/lava_me/urls.py`)

```
/api/auth/           → accounts.urls          (JWT login/register)
/api/gestao/         → core.urls              (Gestor: servicos, funcionarios, estabelecimento, financeiro)
/api/gestao/incidentes/ → operacao.gestao_incidentes_urls
/api/ordens-servico/ → operacao.urls          (OS CRUD, avançar, fotos, incidentes)
/api/shared/         → operacao.shared_urls   (historico unificado — RF-31)
/api/publico/        → agendamento_publico.urls (unauthenticated: estabelecimentos, disponibilidade)
/api/cliente/        → agendamento_publico.cliente_urls + operacao.cliente_urls
/api/docs/           → Swagger UI (drf-spectacular)
```

### Frontend (Web — Angular)

- **Guards:** `authGuard` (B2B gestor/funcionario), `clienteAuthGuard` (B2C client)
- **Route structure:** `/gestao/**` (protected B2B), `/agendar/:slug/**` (public + B2C portal)
- **Services** live in `web/src/app/services/` — one per domain, all `HttpClient`-based
- **Components:** `changeDetection: ChangeDetectionStrategy.OnPush` mandatory
- **Test runner:** Vitest (not Angular's built-in karma) — `vitest.config.ts` uses a custom plugin to inline `templateUrl`/`styleUrl` for component tests
- **URL prefix:** `/api/gestao/` for backoffice, `/api/cliente/` for B2C

### Frontend (Mobile — Ionic/React B2B)

- Router: `react-router-dom` v5 inside `IonReactRouter`
- **Life cycle:** Use `useIonViewWillEnter` (not `useEffect`) for data fetching on tab/modal return
- **Camera/native:** Always via `@capacitor/camera` — never `<input type="file">`
- **Design system:** All styling via CSS variables in `src/theme/lava-me.css`. Key tokens: `--lm-bg`, `--lm-card`, `--lm-primary`, `--lm-text`, `--lm-border`
- **Classes:** `.lm-page`, `.lm-card`, `.lm-input`, `.lm-btn-primary`, `.lm-badge-{status}`
- **Page structure:** Always `<IonPage className="lm-page"><IonHeader/><IonContent/></IonPage>`
- **File naming:** `PascalCase.tsx` + paired `PascalCase.css`

### AI Infrastructure (RAG + MCP)

`backend/mcp_server.py` exposes project docs and schema as MCP tools. `backend/scripts/ingest_docs.py` populates the ChromaDB vector store from `docs/`. Run ingest after any `docs/` change.

---

## Key Development Constraints

- **TDD Mandate:** Tests from the RF's Section 2 must be written and failing (Red) before implementation begins.
- **Documentation-First:** Read the full RF spec in `docs/3_regras_negocio/sprint_atual/` before writing any code.
- **No CSS inline / no new color classes:** Use existing design system tokens only.
- **Soft delete only:** Services with linked OS are inactivated (`is_active=False`), never hard-deleted.
- **RF-31 is done (15/05/2026):** Unified history endpoint is `GET /api/shared/historico/`. The old fragmented routes have been removed — do not reference them.
- **Sprint 4 active RFs:** RF-27 (DB), RF-28 (mobile-cliente setup + map), RF-29 (B2C journey), RF-30 (B2B UX refactor), RF-32 (financial panel). See `docs/3_regras_negocio/sprint_atual/` for full specs.
- **Technical debts to watch:** `DT-010` (`etapa_atual` field, resolved by RF-27), `DT-014` (acabamento removal, RF-27/RF-30), `DT-015` (Cor field must be `IonSelect`, RF-30). See `docs/_privado/DIVIDAS_TECNICAS.md`.
