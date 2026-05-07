# Etapa 07: Correções de API e Fluxo de Acessos (Backend)

**Data:** 19/04/2026  
**Analista:** IA Antigravity  

### 🛡️ Objetivo
Ajustar o comportamento da API de contas para garantir a separação de papéis entre Web/Mobile e permitir a gestão operacional completa por parte do Gestor.

### 🛠️ Implementação Realizada
1.  **Proteção de Perfil**: No `FuncionarioSerializer`, foi bloqueada a criação de perfis com cargo `GESTOR` via endpoints de equipe.
2.  **Gestão de Status**: O campo `is_active` foi liberado para edição, permitindo que o gestor inative ou reative colaboradores via portal web.
3.  **Reset de Senha**: Implementada lógica no `FuncionarioDetailView` que detecta o campo `password` no `PATCH` e aplica o hash via `set_password`, permitindo que o gestor recupere o acesso de funcionários.
4.  **Enriquecimento**: Adicionado `last_login` ao payload de saída para monitoramento de atividade.

### ✅ Resultados de Verificação
- **Suíte de Testes**: 16 testes passando (`test_rf12_funcionarios.py`).
- **Build**: Sem erros de sintaxe ou lint no backend.
- **Segurança**: Regras de multi-tenant preservadas.
