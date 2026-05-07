---
description: Orquestra o fechamento de uma Sprint e a criação de uma Release Oficial do Lava-Me.
---

# Fluxo de Publicação de Release (publish_release)

Este workflow orienta o Agente de Inteligência Artificial a orquestrar o fechamento de uma Sprint e a criação de uma Release Oficial do Lava-Me, utilizando o MCP e comandos do sistema.

## Contexto
O Lava-Me utiliza automação completa para lançamentos. O objetivo deste fluxo é auditar o que foi desenvolvido na Sprint, atualizar a documentação (README), criar a nota de release (Draft) com todos os PRs e seus autores, e finalmente rodar o Makefile para publicar a release no GitHub.

---

## 🛠️ Passo a Passo da Execução do Agente

### Passo 1: Auditoria da Sprint
1. Analise o que foi implementado na branch atual. Se necessário, use `git log` ou busque no diretório `docs/3_regras_negocio/sprint_atual/` para entender as funcionalidades entregues.
2. **Auditoria de Débitos**: Leia o arquivo `docs/_privado/DIVIDAS_TECNICAS.md`. Se houver dívidas marcadas com 🔴 ou 🟡 que impactam a estabilidade da release, notifique o usuário antes de prosseguir.
3. Atualize o `README.md` (Badge de Versão, Roadmap e Novas Funcionalidades) usando a ferramenta de substituição de conteúdo (`replace_file_content`).

### Passo 2: Geração do Draft da Release (Uso do MCP)
1. Conecte-se à ferramenta `generate_sprint_release_draft` fornecida pelo `lava-me-context-server`.
2. Passe como argumentos a versão alvo (ex: `3.0.0`) e o título da Sprint (ex: `Portal do Cliente`).
3. Isso vai gerar um arquivo `docs/releases/draft_X.X.X.md` contendo as notas da release e os créditos de PR (via GitHub CLI).

### Passo 3: Preenchimento das Notas de Lançamento
1. Acesse o arquivo `draft_X.X.X.md` recém-criado.
2. Substitua o placeholder `[AGENTE IA: LISTE AQUI AS FUNCIONALIDADES DETECTADAS NO REPOSITÓRIO]` por um resumo executivo bem formatado sobre o que a equipe entregou na Sprint.
3. Certifique-se de que a linguagem soe profissional e siga os padrões estabelecidos na Release 2.0.0.

### Passo 4: Execução do Lançamento
1. Com a documentação finalizada, execute o comando de automação via bash:
   ```bash
   make release v=X.X.X title="Título da Sprint"
   ```
2. Após o `make` finalizar, caso necessário, edite as notas públicas da Release no GitHub injetando o conteúdo do seu Draft:
   ```bash
   gh release edit vX.X.X --notes-file docs/releases/draft_X.X.X.md
   ```

### Passo 5: Relatório Final
1. Forneça ao usuário a confirmação de que a Release foi fechada com sucesso.
2. Liste no terminal um breve resumo do que foi enviado e o link do GitHub para a release recém-criada.
