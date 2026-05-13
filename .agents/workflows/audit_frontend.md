---
description: Auditoria rigorosa de qualidade, testes e regras de negócio para o Frontend (Web e Mobile) na Sprint 4.
---

# Workflow: Auditoria Frontend (audit_frontend)

Este workflow deve ser executado para auditar o progresso do desenvolvimento das frentes Mobile (B2C/B2B) e Web, garantindo paridade com a documentação da Sprint 4.

## 🛡️ Passo a Passo da IA (Auditor Frontend)

### Passo 1: Carregamento de Escopo (A Fonte da Verdade)
1. Use `list_dir` na pasta `docs/3_regras_negocio/sprint_atual/` para ler os RFs focados em frontend (ex: RF-28, RF-29, RF-30).
2. Extraia os "Esboços de Usabilidade" e "Critérios de Aceite" (ex: Barra de Progresso, Remoção do 'Acabamento', Entrada Rápida).

### Passo 2: Verificação de Componentes Visuais
1. Use a ferramenta MCP `mcp_lava-me-context-server_list_mobile_components` (ou `mcp_lava-me-context-server_list_web_components` se aplicável) para mapear o que foi implementado.
2. **Análise Crítica:** Os componentes mapeados no Passo 1 existem? O frontend possui a `Barra de Progresso` do RF-29? O botão `Entrada Rápida` do RF-30 foi criado?
3. Se houver componentes faltantes ou nomeados de forma confusa, aponte a falha.

### Passo 3: Verificação de Integração (API Contract)
1. Execute a ferramenta MCP `mcp_lava-me-context-server_verify_api_endpoints`.
2. Verifique se o Mobile B2C está chamando exclusivamente rotas `/api/b2c/` e o B2B está usando `/api/b2b/`.
3. Qualquer chamada genérica (`/api/operacao/`) ou chamada cruzada deve gerar um alerta de Risco de Arquitetura.

### Passo 4: Auditoria de Testes e TDD
1. Execute `mcp_lava-me-context-server_run_frontend_tests`.
2. **Relevância:** Inspecione os arquivos de teste modificados. Eles estão testando o que a documentação pede? (ex: "Teste 1: Polling de Progresso"). Testes genéricos (ex: `should render component`) contam para cobertura, mas falham na auditoria semântica.
3. Se a cobertura for menor que 70%, reprove a entrega.


### Passo 5: Emissão de Relatório
Gere um relatório estruturado no chat:
- 📊 **Status de Componentes:** (Lista do que foi planejado vs. encontrado).
- 🔌 **Status de Integração:** (Relatório de rotas).
- 🧪 **Qualidade TDD:** (Análise profunda dos testes).
