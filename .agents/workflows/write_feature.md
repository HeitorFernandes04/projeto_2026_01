---
description: Cria especificações técnicas blindadas e validadas contra o RAG (Documentation-First).
---

# Workflow: Gerador de Funcionalidades (write_feature)

Este workflow instrui a IA a atuar como um Arquiteto de Software rigoroso, seguindo o padrão "Documentation-First" do Lava-Me. A IA será responsável por criar especificações técnicas blindadas e aprová-las contra o RAG antes que qualquer código seja escrito.

## Gatilho de Uso
Sempre que um usuário pedir para criar uma "nova tela", "nova rota" ou "nova funcionalidade" (ex: `/write_feature Login Social`), siga este manual estritamente.

---

## 🛡️ Passo a Passo da IA (O "Guardião do Escopo")

### Passo 1: Prova de Colisão (RAG)
1. Antes de pensar na solução, use a tool `mcp_lava-me-context-server_consultar_documentacao_projeto` e pesquise pelas entidades centrais envolvidas na ideia do usuário.
2. Identifique se a nova ideia fere a arquitetura *Multi-tenant* do projeto. (Ex: "Essa tabela consegue filtrar por estabelecimento?").
3. **Thought**: Reflita internamente: *"Existe alguma regra do ChromaDB que proíba essa abordagem?"* Se sim, pare o workflow e avise o usuário imediatamente sobre o bloqueio arquitetural.

### Passo 2: Mapeamento de Dependências
Para criar a modelagem correta, entenda o terreno atual:
1. Use a tool `read_django_models_schema` para ver quais tabelas já existem e se podemos apenas adicionar uma coluna em vez de criar uma tabela nova.
2. Use a tool `list_mobile_components` ou `list_web_components` para identificar componentes React/Angular que podem ser reaproveitados (ex: `EstadoLavagem`, `Toast`, `Modal`).

### Passo 3: Geração da Documentação BDD e Contrato de Testes
1. Leia o template oficial usando `view_file` no caminho `docs/templates/TEMPLATE_FUNCIONALIDADE.md` (se existir) ou crie a estrutura padrão.
2. Gere um documento **completo** em memória. O rigor máximo deve estar na seção de Testes (Critérios de Aceite). 
3. **Escrita BDD:** Escreva os Critérios de Aceite usando BDD (*Dado que / Quando / Então*). Preveja explicitamente exceções, IDOR e Rate Limiting. **Nunca** resuma ou omita cenários pensados pelo usuário; abrace a totalidade da regra.
4. **Alinhamento Arquitetural Obrigatório (Cross-Platform):** Transcreva *obrigatoriamente* os cenários BDD para a linguagem das suítes de teste oficiais do projeto, garantindo paridade entre Web e Mobile:
    * **Backend:** Gere os scripts completos e executáveis usando `Pytest` + `APIClient` do Django REST Framework.
    * **Frontend Web:** Gere os scripts unitários usando `Vitest` + `@testing-library/angular`.
    * **Mobile (Crítico):** Gere os scripts unitários/integração usando `Vitest` + `Ionic/React`. **Proibido iniciar código mobile sem os testes correspondentes (TDD)**.

### Passo 4: Submissão do Draft
1. Use `write_to_file` para salvar o seu documento gerado na pasta da Sprint atual (ex: `docs/3_regras_negocio/sprint_3/rfXX_draft.md`). O número do RF deve ser sequencial.
2. Apresente ao usuário as principais decisões arquiteturais (quais rotas serão criadas e quais tabelas alteradas).
3. Aguarde o comando de APROVAÇÃO do usuário.

### Passo 5: Sincronização (Após Aprovação)
1. Quando o usuário disser "Aprovado", utilize a ferramenta `sync_api_schema` (se aplicável) ou simplesmente comunique que a nova regra agora faz parte do repositório.
2. Dê sinal verde para iniciar a codificação usando agentes.
