# Catálogo de Ferramentas MCP (Model Context Protocol)

Este documento destina-se aos desenvolvedores humanos da equipe Lava-Me. Ele lista todas as ferramentas (tools) nativas que foram programadas no nosso servidor local `mcp_server.py`. 

Sempre que você estiver pair-programming com um agente de Inteligência Artificial (como o Cline, Antigravity ou Cursor), você pode pedir em linguagem natural para que a IA ative essas ferramentas em seu favor.

---

## 🏗️ 1. Governança e Inteligência do Projeto (RAG)
Estas ferramentas conectam a IA ao nosso banco de conhecimento vetorial (ChromaDB) e à documentação do projeto.

*   **`consultar_documentacao_projeto`**
    *   **O que faz:** Busca regras de negócio, glossário ou especificações da API.
    *   **Como pedir:** *"Pesquise no RAG qual é a regra para o limite de reagendamentos do cliente."*
*   **`sync_api_schema`**
    *   **O que faz:** Gera o schema OpenAPI mais recente do Django e reindexa o ChromaDB.
    *   **Como pedir:** *"Atualize o RAG com as novas rotas que acabei de criar no backend."*

---

## 💻 2. Auxílio ao Desenvolvedor (DevEx)
Automações para facilitar o seu trabalho braçal e gerenciamento de processos.

*   **`start_development_environment` / `stop_development_environment`**
    *   **O que faz:** Liga (ou desliga) o Backend, Web e Mobile em background, sem travar seu terminal.
    *   **Como pedir:** *"Ligue o ambiente para mim"* ou *"Desligue apenas o frontend mobile."*
*   **`generate_sprint_release_draft`**
    *   **O que faz:** Puxa via GitHub CLI todas as PRs mergeadas e gera um arquivo Markdown de Release com os créditos (ex: `@WandersonAMello`).
    *   **Como pedir:** *"Gere o draft da Release 3.0.0 com foco em Portal do Cliente."*

---

## 🔗 3. Sincronização Cross-Stack (Front ↔ Back)
Ferramentas que garantem que o Ecossistema converse o mesmo idioma.

*   **`verify_api_endpoints`**
    *   **O que faz:** Rastreador dinâmico! Procura chamadas `fetch/axios` nos projetos Web/Mobile e cruza com as URLs oficiais do Django para ver se alguma rota frontend vai retornar Erro 404.
    *   **Como pedir:** *"Verifique se todos os endpoints chamados no front existem no backend."*
*   **`sync_typescript_models`**
    *   **O que faz:** Lê o OpenAPI do Django e transcreve todas as tipagens exatas para as pastas do Angular (`web`) e do Ionic (`mobile`).
    *   **Como pedir:** *"Atualize as interfaces do TypeScript baseado no backend atual."*

---

## 🗄️ 4. Banco de Dados e Backend Exploratório
Ferramentas para interagir com o Django sem precisar abrir Shell manualmente.

*   **`check_and_run_migrations`**
    *   **O que faz:** Verifica migrações pendentes. Se solicitado, cria o arquivo de migração e aplica no banco (SQLite/Postgres).
    *   **Como pedir:** *"Crie e rode as migrações pro novo model de Vagas."*
*   **`read_django_models_schema`**
    *   **O que faz:** A IA mapeia todas as tabelas e tipos de campos diretamente do coração do Django.
    *   **Como pedir:** *"Veja quais campos existem na tabela de OrdemServico."*
*   **`generate_database_erd`**
    *   **O que faz:** Extrai a modelagem atual e desenha um Diagrama de Entidade-Relacionamento (Mermaid) salvando na pasta `docs/`.
    *   **Como pedir:** *"Atualize o diagrama do banco de dados na documentação."*
*   **`execute_django_query`**
    *   **O que faz:** Permite que a IA rode comandos via ORM para debugar o banco localmente.
    *   **Como pedir:** *"Execute uma query pra ver quantos clientes temos cadastrados hoje."*

---

## 📱 5. Arquitetura Frontend (UI/UX)
Mantém o Angular e o Ionic respeitando o "Lava-Me Design System".

*   **`list_web_components` / `list_mobile_components`**
    *   **O que faz:** Lista os componentes de UI existentes para a IA reutilizar (Botões, Modais, Cards) em vez de recriar do zero com código CSS sujo.
    *   **Como pedir:** *"Quais componentes de UI eu posso usar na tela X?"*
*   **`read_web_standard` / `read_mobile_standard`**
    *   **O que faz:** A IA consulta os padrões absolutos de pastas e estado global aprovados pela equipe.

---

## 🛡️ 6. Qualidade, Testes e Segurança (DevSecOps)
Ferramentas usadas nos fluxos de auditoria e revisão de Pull Requests.

*   **`run_backend_tests` / `run_web_tests` / `run_frontend_tests`**
    *   **O que faz:** Roda as baterias unitárias em cada módulo.
*   **`generate_backend_coverage`**
    *   **O que faz:** Levanta a porcentagem exata de linhas testadas (Coverage) pelo pytest-cov.
    *   **Como pedir:** *"Rode a cobertura de testes do backend para vermos nossa nota de qualidade."*
*   **`run_security_audit`**
    *   **O que faz:** Roda `npm audit` (front) e validações PIP (back) em busca de bibliotecas maliciosas.
    *   **Como pedir:** *"Faça uma auditoria de dependências vulneráveis na stack inteira."*
*   **`fetch_github_pr_diff`**
    *   **O que faz:** Busca via CLI do GitHub exatamente o que um colega escreveu de novo em uma Pull Request específica para a IA analisar.
    *   **Como pedir:** *"Faça a revisão da PR 31."*

---

## 🤖 7. Workflows Autônomos (Comandos Slash)
Além das ferramentas individuais, o projeto possui "Super-Rotinas" de Inteligência Artificial. Elas ficam na pasta `.agents/workflows/`. Ao invés de pedir uma ação isolada, você chama o workflow inteiro digitando um comando direto no chat da IA:

*   **`/write_feature`**
    *   **O que faz:** Atua como o "Arquiteto de Software". Transforma sua ideia bruta em um Contrato BDD Executável, consultando o RAG e garantindo a segurança e o alinhamento arquitetural do projeto antes que o código seja escrito.
    *   **Como pedir:** `"/write_feature Quero criar um fluxo onde o cliente avalia a lavagem."`
*   **`/review_pr`**
    *   **O que faz:** Atua como o "Revisor Sênior". Lê o código alterado na Pull Request, roda os testes de Qualidade, Linter e Segurança, e confere se a regra de negócio implementada está ferindo alguma diretriz do RAG.
    *   **Como pedir:** `"/review_pr Faça a auditoria rigorosa da PR 42."`
*   **`/publish_release`**
    *   **O que faz:** Atua como o "Gerente de Deploy". Lê as funcionalidades prontas, puxa as contribuições do GitHub, escreve as Notas de Release oficiais, commita e faz o push pra branch main orquestrando toda a entrega da Sprint.
    *   **Como pedir:** `"/publish_release versão 3.0.0, título 'Portal do Cliente'"`
