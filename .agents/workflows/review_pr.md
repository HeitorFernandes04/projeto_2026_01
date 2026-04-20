---
description: Realiza a auditoria técnica e semântica de uma Pull Request, cruzando testes com o RAG.
---

Este workflow deve ser acionado para avaliar qualquer Pull Request no projeto Lava-Me. Siga estritamente estes passos na ordem exata. Não tire conclusões sem antes executar os comandos.

## 1. Contexto e Git Diff
1. Utilize a tool `run_command` para puxar alterações pendentes (se houver): `git fetch origin`.
2. Utilize a tool `run_command` para listar arquivos modificados pela PR/Branch atual (ex: `git diff --name-only develop`).
3. Anote internamente as camadas arquiteturais tocadas (Backend? Mobile? Banco de Vagas?).

## 2. Limpeza e Auditoria Técnica Total
Execute as ferramentas de teste para garantir que o código base compila e roda.

// turbo-all
1. Limpe o cache do backend: `rm -rf backend/core/tests/__pycache__ backend/operacao/tests/__pycache__ backend/.pytest_cache`
2. Rode a suite total do Backend: `cd backend && ../venv/bin/python -m pytest`
3. Rode (se os arquivos `.cy.ts` foram alterados) os testes E2E básicos: `cd mobile && npx cypress run --browser chromium` (Pode pular se o Diff não tocou no mobile).
4. Rode a verificação de front-web: `cd web && npx vitest run --passWithNoTests`

*Nota: Colete todos os retornos de erro.*

## 3. Auditoria Semântica Cruzada (Mandatório)
Este é o passo mais importante. Não basta o código passar sem erros; ele precisa atender ao domínio.

1. Para cada arquivo de teste recém adicionado/modificado no passo 1, leia seu conteúdo (`view_file`).
2. Utilize a tool MCP `mcp_lava-me-context-server_consultar_documentacao_projeto` passando como parâmetro palavras-chave identificadas no Diff (ex: "Serviço", "Gestor", "Isolamento").
3. **Análise Cognitiva:** Pense e responda internamente (Thought): _"A Regra de Negócio Documentada X afirma que Y deve acontecer. O método de teste lido possui alguma asserção assertante sobre Y em caso de erro/falha?"_. Identifique lacunas onde o código tem sintaxe correta, mas lógica de negócios incompleta/inválida.

## 4. Avaliação de Risco de Segurança (Isolamento)
Como o projeto é um SaaS multi-estabelecimento:
1. Veja nas API Views (no backend modificado) se o método `get_queryset()` está fazendo verificação por `request.user.perfil_gestor.estabelecimento` ou similar. Se houver rotas expostas retornando `objects.all()`, a auditoria deve **Cair na Red Flag de Vulnerabilidade IDOR**.

## 5. Emissão do Relatório
1. Use `read_url_content` ou `view_file` para carregar `docs/templates/PR_REVIEW_REPORT.md` e preencha os dados rigorosamente conforme o template visual exigido.
2. Não omita a sessão de *Riscos Identificados*.
3. Devolva o formato preenchido como output final no chat. Se a PR tiver riscos críticos estruturais, marque como `BLOQUEAR MANUAMENTE`.
