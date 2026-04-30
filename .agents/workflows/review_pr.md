---
description: Realiza a auditoria técnica e semântica de uma Pull Request, cruzando testes com o RAG.
---

Este workflow deve ser acionado para avaliar qualquer Pull Request no projeto Lava-Me. Siga estritamente estes passos na ordem exata. Não tire conclusões sem antes executar os comandos.

## 1. Contexto e Git Diff
1. Utilize a ferramenta MCP `fetch_github_pr_diff` passando o número da PR que o usuário pediu para revisar.
2. O retorno dessa ferramenta te dará os arquivos modificados. Anote internamente as camadas arquiteturais tocadas (Backend? Angular Web? Ionic Mobile?).

## 2. Auditoria Técnica e Qualidade (Uso do MCP)
Execute as ferramentas de teste diretamente pelo MCP para garantir que o código base compila, roda e é seguro.

1. **Qualidade Backend**: Utilize `run_backend_tests` e depois `generate_backend_coverage`. Verifique se a PR derrubou a cobertura geral ou se os testes falharam.
2. **Qualidade Web**: Se o Angular foi tocado, utilize `run_web_tests` e `run_web_linter`.
3. **Auditoria de Segurança (SAST)**: Utilize `run_security_audit` (passando target="all") para buscar dependências vulneráveis ou falhas inseridas pela PR.

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
