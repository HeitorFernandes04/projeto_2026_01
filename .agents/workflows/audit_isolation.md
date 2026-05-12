---
description: Auditoria rigorosa de isolamento B2C/B2B e segurança multi-tenant no Lava-Me.
---

# Workflow: Auditoria de Isolamento (audit_isolation)

Este workflow deve ser acionado para verificar se as rotas, controllers e modelos respeitam o isolamento físico e lógico entre os fluxos de Cliente (B2C) e Operador (B2B) estabelecidos na Sprint 4.

## 🛡️ Passo a Passo da IA

### Passo 1: Mapeamento de Rotas
1. Use a ferramenta MCP `mcp_lava-me-context-server_verify_api_endpoints` para auditar a relação entre os endpoints chamados pelo Frontend e o que existe no Backend.
2. Identifique se as rotas estão prefixadas corretamente:
   - `/api/b2b/` -> Para operações de Pista/Gestão.
   - `/api/b2c/` -> Para operações do Cliente Final.
3. Se houver rotas genéricas como `/api/operacao/` sendo acessadas por ambos os apps, sinalize como **Dívida Técnica de Arquitetura**.

### Passo 2: Auditoria de Middlewares e Permissions
1. Para cada View/Controller identificada no Passo 1:
   - Verifique se a classe de permissão (`permission_classes`) está correta.
   - **B2B**: Deve exigir perfil `FUNCIONARIO` ou `GESTOR` e vínculo com `estabelecimento_id`.
   - **B2C**: Deve exigir perfil `CLIENTE` e isolamento por `User ID`.
2. Use a ferramenta genérica `grep_search` para buscar por `objects.all()` em ViewSets e use `mcp_lava-me-context-server_run_security_audit` para varredura de vulnerabilidades conhecidas.

### Passo 3: Verificação de "Esteira Enxuta"
1. Use a ferramenta MCP `mcp_lava-me-context-server_execute_django_query` ou `mcp_lava-me-context-server_read_django_models_schema` para verificar se o código backend ainda faz referência ao status `ACABAMENTO`.
2. Como este status foi removido na Sprint 4, qualquer lógica que dependa dele deve ser marcada para refatoração imediata.


### Passo 4: Emissão de Alerta de Segurança
Gere um relatório rápido em markdown destacando:
- 🔴 **Crítico**: Vulnerabilidades de IDOR (acesso a dados de outro estabelecimento/usuário).
- 🟡 **Aviso**: Rotas mal posicionadas (B2C em namespace B2B ou vice-versa).
- 🟢 **Conformidade**: O que está seguindo o padrão de isolamento da Sprint 4.

---
> [!IMPORTANT]
> O isolamento é o pilar central da Sprint 4. Não aceite "atalhos" que unifiquem rotas de perfis distintos.
