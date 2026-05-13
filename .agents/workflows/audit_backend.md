---
description: Auditoria rigorosa de qualidade, testes e estrutura de dados para o Backend na Sprint 4.
---

# Workflow: Auditoria Backend (audit_backend)

Este workflow deve ser acionado para avaliar as entregas no Core (Django/API), garantindo a estabilidade de dados e a cobertura de testes para a Sprint 4.

## 🛡️ Passo a Passo da IA (Auditor Backend)

### Passo 1: Validação do Core e Banco de Dados
1. Use `mcp_lava-me-context-server_read_django_models_schema` ou `mcp_lava-me-context-server_generate_database_erd` para auditar a estrutura atual do banco.
2. **Checagem de Refatoração (RF-27):** O campo `etapa_atual` (0-100) existe em `OrdemServico`? Os campos legados ou menções ao status `ACABAMENTO` foram completamente removidos?
3. Se existir herança ou dependência não migrada, aponte imediatamente.

### Passo 2: Caça a Testes Fantasmas (Relevância)
1. Use `mcp_lava-me-context-server_check_test_coverage` passando a lista de arquivos de `views.py`, `services.py` ou `models.py` tocados pela equipe.
2. Leia os arquivos de teste correspondentes.
3. **Análise de Falsos Positivos:** O teste está apenas instanciando o modelo e dando "assert True"? Ele cobre os cenários de falha do RF-31 (unificação de API)? Testes que não validam regra de negócio são marcados como "Débito de Teste".

### Passo 3: Segurança e SAST (RF-31)
1. Execute `mcp_lava-me-context-server_run_security_audit` focando no backend.
2. Garanta que vulnerabilidades de dependências apontadas no RF-31 tenham sido mitigadas.

### Passo 4: Execução do Mandato TDD
1. Execute `mcp_lava-me-context-server_run_backend_tests` e em seguida `mcp_lava-me-context-server_generate_backend_coverage`.
2. A cobertura mínima de **80%** foi atingida globalmente? As lógicas novas atingiram > 90%?
3. Verifique com a ferramenta `mcp_lava-me-context-server_consultar_documentacao_projeto` se os Critérios de Aceitação viraram testes no pytest.


### Passo 5: Relatório Final
Gere um relatório detalhado no chat:
- 🗄️ **Status do Model:** (Validação do banco e remoção de Acabamento).
- 🛡️ **Status de Segurança:** (Vulnerabilidades e Unificação de endpoints).
- 🧪 **Eficácia dos Testes:** (Os testes realmente testam algo? Qual a cobertura?).
