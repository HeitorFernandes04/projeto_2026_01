# 📋 Memória de Sprint — Dívidas Técnicas e Checklist de Deploy

> **Arquivo privado** — não versionado no Git. Acessível apenas localmente e pela IA.
> Atualizado automaticamente pela IA a cada sprint. Leia antes de gerar uma release.

---

## Como usar este arquivo

A cada sprint, a IA registra aqui tudo que:
- Foi implementado de forma simplificada para o ambiente de **desenvolvimento**
- Precisa ser revisado ou ajustado antes de ir para **produção**
- Representa um risco se esquecido no deploy

---

## 🔴 Dívidas Abertas — Sprint 3 (RF-21)

### [DT-001] Campo `slug` nulo para registros existentes de `Estabelecimento`
- **Arquivo:** `backend/accounts/models.py`
- **O que é:** O campo `slug` foi adicionado com `null=True, blank=True`. Registros de estabelecimentos criados *antes* dessa migration (0004) têm `slug=NULL` no banco.
- **Impacto em produção:** Estabelecimentos antigos **não têm URL pública**. O portal de autoagendamento retorna 404 para eles.
- **O que fazer antes do deploy:**
  1. Rodar o script de backfill no shell Django:
     ```python
     # Executar via: python manage.py shell
     from accounts.models import Estabelecimento
     for est in Estabelecimento.objects.filter(slug__isnull=True):
         est.save()  # O save() já gera o slug automaticamente
         print(f"Slug gerado: {est.nome_fantasia} → {est.slug}")
     ```
  2. Verificar no admin do Django se todos os estabelecimentos têm slug preenchido.
- **Risco se ignorado:** Baixo (Resolvido em Dev) / Alto (Produção se houver importação)
- **Status:** ✅ Resolvida para Dev (Banco resetado em 01/05/2026) / 🟡 Alerta para Prod

---

### [DT-002] Rate Limiting sem backend de cache persistente
- **Arquivo:** `backend/agendamento_publico/views.py` (classe `EstabelecimentoPublicoRateThrottle`)
- **O que é:** O `AnonRateThrottle` do DRF usa **cache em memória** por padrão (cache local do processo). Em produção com múltiplos workers (gunicorn/uvicorn), cada processo tem seu próprio contador — o limite de 60 req/min não é compartilhado entre workers.
- **Impacto em produção:** Um atacante com 4 workers consegue 240 req/min em vez de 60.
- **O que fazer antes do deploy:**
  ```python
  # backend/lava_me/settings.py — adicionar cache Redis
  CACHES = {
      "default": {
          "BACKEND": "django_redis.cache.RedisCache",
          "LOCATION": "redis://127.0.0.1:6379/1",
      }
  }
  # E instalar: pip install django-redis
  ```
- **Risco se ignorado:** Médio — o rate limiting funciona, mas é menos eficaz com múltiplos workers.
- **Status:** 🔴 Aberta

---

### [DT-003] `db.sqlite3` como banco de dados
- **Arquivo:** `backend/lava_me/settings.py`
- **O que é:** O projeto usa SQLite em desenvolvimento. SQLite não suporta acesso concorrente real, não escala e não é adequado para produção.
- **O que fazer antes do deploy:**
  1. Configurar PostgreSQL (Sprint 4 conforme plano).
  2. Rodar todas as migrations do zero no banco de produção.
- **Risco se ignorado:** Crítico — SQLite não escala.
- **Status:** 🟡 Planejado para Sprint 4

---

## ✅ Dívidas Resolvidas

- **[DT-009]** Colisão de Tokens: Implementado isolamento via `b2c_access_token` e lógica de roteamento no `AuthInterceptor`. (Resolvido em 07/05/2026).

---

## 📌 Checklist Rápido Pré-Deploy (Sprint 3)

Antes de gerar a release com a RF-21 e Portal do Cliente, confirme:

- [ ] **[DT-001]** Rodar script de backfill de slugs no banco de produção
- [ ] **[DT-002]** Configurar Redis como cache para o throttle do DRF
- [ ] **[DT-003]** Migrar de SQLite para PostgreSQL
- [ ] **[DT-012]** Remover `console.log` e `print` residuais identificados na auditoria
- [ ] Rodar `npm run test:e2e` na branch de release para validar fluxos B2C reais
- [ ] Confirmar que estabelecimentos inativos retornam 404

---

## 🔴 Dívidas Abertas — Auditoria Atual (UX & Arquitetura)

### [DT-004] UX: "Amnésia" no Fluxo de Autoagendamento
- **Arquivos:** `web/src/app/public/autoagendamento/autoagendamento.component.ts`
- **O que é:** O formulário de criação de OS não consome a sessão (`AuthService`). Clientes logados são forçados a digitar todos os dados novamente.
- **O que fazer:** Auto-preencher Nome/WhatsApp via token e listar os Veículos vinculados num menu Dropdown, poupando a digitação manual.
- **Status:** 🔴 Aberta (Priorizar após galeria de fotos)

### [DT-005] UX: Ausência de Feedback Visual no Cancelamento
- **Arquivos:** `web/src/app/public/painel-cliente/componentes/card-ativo/card-ativo.component.ts`
- **O que é:** O `cancelarAgendamento()` esconde o componente sem notificar o usuário do sucesso da operação (via Toast/Snackbar). Erros aparecem inline e podem passar despercebidos.
- **O que fazer:** Implementar um serviço central de Snackbars informando o sucesso ou falha da API de cancelamento de forma visual e clara.
- **Status:** 🔴 Aberta (Priorizar após galeria de fotos)

### [DT-006] DB: Denormalização na Tabela `Veiculo`
- **Arquivos:** `backend/core/models.py`
- **O que é:** `Veiculo` possui `nome_dono` e `celular_dono` mesmo possuindo uma ForeignKey para `Cliente`. Fere o princípio *Single Source of Truth*.
- **O que fazer:** Remover os campos duplicados e puxar esses dados diretamente do relacionamento (`veiculo.cliente.telefone_whatsapp`). Exigirá janela de migração (`makemigrations`).
- **Status:** 🟡 Aberta (Média Severidade) — **Confirmada em 10/05/2026**

### [DT-007] API: Poluição e Redundância de Endpoints
- **Arquivos:** `backend/*/urls.py`
- **O que é:** O sistema possui quatro endpoints de histórico diferentes (`api/cliente/historico/`, `api/publico/historico/`, `api/ordens-servico/historico/`, `api/ordens-servico/gestor/historico/`). Além disso, o ViewSet `TagsPeca` é registrado duas vezes (em `gestao/` e `ordens-servico/`).
- **O que fazer:** Consolidar numa única API de histórico usando um ViewSet dinâmico com `get_queryset()` que diferencie pelo tipo de permissão (`request.user.role`). Desduplicar registro do ViewSet.
- **Status:** 🟡 Parcialmente mitigada em 15/05/2026 — a RF-31 consolidou o histórico autenticado em `/api/shared/historico/` e removeu as rotas autenticadas duplicadas. Permanecem fora do escopo desta RF a rota pública `/api/publico/historico/` e a desduplicação do registro de `TagsPeca`.

### [DT-008] DB: Fragmentação de Perfis de Colaborador
- **Arquivos:** `backend/accounts/models.py`
- **O que é:** `Gestor` e `Funcionario` são tabelas diferentes que resolvem exatamente o mesmo relacionamento OneToOne com `User` e `Estabelecimento`.
- **O que fazer:** Unificar em `PerfilColaborador` e usar um campo `role` enum.
- **Status:** 🟡 Aberta (Média prioridade) — **Confirmada em 10/05/2026**

---

## 🔴 Dívidas Abertas — Auditoria Atual (Workflow & Qualidade)

### [DT-010] Arquitetura: Workflow Industrial Incompleto (`etapa_atual`)
- **Arquivos:** `backend/operacao/models.py`, `backend/agendamento_publico/services.py`
- **O que é:** O frontend espera um campo `etapa_atual` (0-100) para exibir a barra de progresso no painel do cliente. Atualmente, o backend não possui este campo no modelo `OrdemServico` e envia um valor fixo `0` via `AuthB2CService.montar_painel_cliente`.
- **O que fazer:** Criar campo `etapa_atual` no modelo `OrdemServico` e implementar a lógica de atualização automática baseada na mudança de status ou finalização de tarefas.
- **Status:** 🔴 Aberta (Alta Prioridade - Sprint 4) — **Confirmada em 10/05/2026**

### [DT-011] Qualidade: Cobertura Mobile Crítica e Conflito de Dependências
- **Arquivos:** `mobile/package.json`, `mobile/vitest.config.ts`
- **O que é:** O projeto Mobile possui apenas 3 arquivos de teste. Além disso, há um conflito de versões do Vitest (`0.34` vs `4.1`) que impede a geração de relatórios de cobertura (ERESOLVE).
- **O que fazer:** Sincronizar as versões do Vitest entre Web e Mobile (Upgrade para v4+) e iniciar suíte de testes para as telas de Painel e Checkout Mobile.
- **Status:** 🔴 Aberta (Alta Prioridade - QA) — **Confirmada em 10/05/2026**

### [DT-012] Limpeza: Logs de Depuração em Produção
- **Arquivos:** `backend/core/views.py`, `web/src/app/services/servico.service.ts`, `web/src/app/public/painel-cliente/painel.component.ts`
- **O que é:** Presença de `print()` e `console.log()` com dados de depuração que poluem o log de produção e podem expor estrutura de dados interna.
- **O que fazer:** Substituir `print()` por `logger.info/error` no backend e remover `console.log` no frontend.
- **Status:** 🔴 Aberta (Baixa Prioridade) — **Confirmada em 10/05/2026**

### [DT-013] Organização: Scripts de Manutenção Órfãos
- **Arquivos:** `backend/limpar_tabelas_antigas.py`, `backend/manual_test_register_deprecated.py`
- **O que é:** Scripts de utilidade técnica estão soltos na raiz do projeto backend.
- **O que fazer:** Mover para um diretório `backend/scripts/utils/` ou deletar se não forem mais necessários após a migração para PostgreSQL.
- **Status:** 🟡 Aberta (Baixa Prioridade) — **Confirmada em 10/05/2026**

### [DT-014] Limpeza: Descontinuação do Fluxo de "Acabamento"
- **Arquivos:** `backend/accounts/models.py`, `backend/operacao/models.py`, `mobile/src/components/EstadoAcabamento.tsx`
- **O que é:** Conforme *ESPECIFICACAO_LIMPEZA_ARQUITETURAL.pdf*, o fluxo de acabamento e o cargo de Detalhista devem ser removidos para agilizar a esteira industrial. O código atual ainda mantém esses resíduos.
- **O que fazer:** Remover `DETALHISTA` de `CargoChoices`, deletar campos de acabamento em `OrdemServico`, refatorar `avancar_etapa` para pular de `EM_EXECUCAO` direto para `LIBERACAO` e remover componentes/imports no Mobile.
- **Status:** 🔴 Aberta (Alta Prioridade - Sprint 4) — **Confirmada em 10/05/2026**

### [DT-015] Mobile: Padronização de Dados e Melhoria de UX
- **Arquivos:** `mobile/src/pages/atendimento/NovaOrdemServico.tsx`
- **O que é:** Conforme *REQUISITOS_MELHORIA_MOBILE-1.pdf*, a interface de entrada de veículos precisa de renomeação visual e o campo "Cor" deve ser um seletor (`IonSelect`) para evitar duplicidade de dados ("Branco" vs "branco").
- **O que fazer:** Renomear título para "Entrada rápida de veículos", implementar `IonSelect` para cores pré-definidas e adicionar hook `useIonViewWillLeave` para resetar o formulário.
- **Status:** 🔴 Aberta (Médica Prioridade)

### [DT-016] UX/Arquitetura: Sistema de Temas (Dark/Light Mode) Cross-Platform
- **Arquivos:** Global (Web e Mobile)
- **O que é:** Necessidade de permitir que cada usuário escolha seu tema visual.
- **O que fazer:** Implementar design system baseado em variáveis CSS e serviço de persistência.
- **Status:** 🔴 Aberta (Nova - Sprint 4)

### [DT-017] Segurança: Vulnerabilidades Críticas em Dependências (Web/Mobile)
- **Arquivos:** `mobile/package.json`, `web/package.json`
- **O que é:** Auditoria identificou riscos de execução de código arbitrário (`@babel/plugin-transform-modules-systemjs` no Mobile) e Path Traversal (`fast-uri` no Web).
- **O que fazer:** Executar `npm audit fix` e validar compatibilidade de breaking changes (`vite@8`, `jsdom@29`).
- **Status:** 🔴 Aberta (Alta Severidade - Auditoria 10/05)

### [DT-018] Infraestrutura: Persistência Local do RAG na Raiz do Backend
- **Arquivos:** `backend/.chroma_db/`
- **O que é:** O banco de vetores do RAG está sendo persistido diretamente na raiz do projeto backend, poluindo o diretório de trabalho e dificultando a gestão de ignore do Git.
- **O que fazer:** Mover a persistência para um diretório de cache/dados persistentes (`backend/data/rag_db/`) e atualizar as configurações do MCP/Scripts.
- **Status:** 🟡 Aberta (Baixa Prioridade - Auditoria 10/05)

