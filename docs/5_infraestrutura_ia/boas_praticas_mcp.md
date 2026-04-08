# 🛡️ Análise e Melhores Práticas de IA (MCP)

Este documento centraliza as regras operacionais, os cuidados de segurança e um guia definitivo de usabilidade para trabalhar com o nosso ecossistema de Model Context Protocol (MCP) e RAG no Lava-Me.

---

## 1. Análise de Segurança 🔒

A infraestrutura foi construída para funcionar estritamente de maneira local e passiva, garantindo que o código proprietário e o "cérebro" do servidor fiquem seguros:

*   **Comunicação sem Rede (STDIO):** O servidor (`mcp_server.py`) só se comunica com a sua própria IDE via canais de texto (standard input/output). Nenhuma porta de internet é aberta.
*   **Acesso Restrito do RAG:** O script de vetorização só tem permissão estrita para buscar arquivos `.md` dentro de `docs/`. Ele não varre a base de código e não captura arquivos críticos como `.env`, prevenindo injeções de segredos na IA.
*   **Tratamento de Exceções Base:** Todas as *Tools* do `mcp_server.py` estão isoladas em blocos `try/except`. Se o banco de dados falhar ou se você esquecer as variáveis de log, o MCP apenas retorna a mensagem do erro em texto para a IA (informando-a o que deu errado), sem quebrar o json-rpc da IDE abruptamente.

---

## 2. Análise de Usabilidade ⏱️

A usabilidade foi o foco da última implementação, delegando ao sistema as ações repetitivas:

*   **Docs-As-Code Invisível:** Como há um `pre-commit` hook embarcado, você ou a equipe **não precisam mais se preocupar em rodar a ingestão manual**. Modificou código backend? O hook se encarrega de reconstruir e injetar dados na IA automaticamente na hora de commitar.
*   **Modularidade Front e Back:** As ferramentas foram separadas entre inspeção nativa (`inspect_mobile_standard`, `list_mobile_components`) e inspeção de backend (`sync_api_schema`), dando ao assistente virtual contextos precisos sobre por onde ele está andando.

---

## 3. Regras para Trabalhar com MCP (O que fazer e como alterar) ⚙️

Como alterar e manter o servidor estável sem quebrar as rotinas da IA:

### Se precisar adicionar uma nova Ferramenta para a IA:
1. Abra `backend/mcp_server.py`.
2. Encapsule a nova função Python com o decorador `@mcp.tool()`.
3. **MUITO IMPORTANTE:** Use _Docstrings_ (`""" ... """`)! O servidor usa as docstrings para explicar para a IA para o que a ferramenta serve. Sem docstring, a IA não sabe quando usá-la.
4. Reinicie a integração na sua IDE (Cursor/Windsurf) para ela recarregar a lista.

### Se precisar alterar Regras de Negócio/Arquitetura:
Não altere o servidor e não lute diretamente com a IA. O modelo usa **Docs-Driven Development**.
1. Identificou que a IA está gerando o CSS de um botão incorreto sempre?
2. Vá até `docs/1_arquitetura/mobile_standard.md` e adicione explicitamente a regra: *"Nunca gere o botão XYZ de tal forma"*.
3. Dê seu próximo commit (que ativará a ingestão). A IA não errará mais.

### Cuidados e Red-Flags ⚠️:
*   **Não apague a pasta `backend/.chroma_db` do `.gitignore`:** O banco de vetores é efêmero e gerado isoladamente na máquina do dev. Subir esses vetores binários para o repositório principal gera conflitos imensos no git.
*   **Loops Infinitos de Log:** Nossa ferramenta *inspect_logs* lê o `dev.log`. Se você habilitar ferramentas da IA onde ela lê e escreve logs freneticamente para consertar seus próprios erros, você pode estourar as requisições (Tokens). Intervenha manualmente quando vir a IA travada num laço investigativo.

---

## 4. Exemplo Prático de Uso (Prompting) 💡

Ao invés de dar instruções extremamentes metódicas — que consumem vários minutos da sua escrita —, simplesmente delegue à IA a responsabilidade de investigar e validar as normas disponíveis no ambiente dela:

**Ao criar uma nova Feature (Exemplo Mobile):**
> *"Vou criar a tela de Configurações no app Mobile. Não escreva código ainda. Primeiro, vasculhe meus componentes pra ver o que pode reaproveitar, entenda nosso Design System e depois escreva as rotas e componentes"*

**Como a IA reagirá por baixo dos panos (via MCP):**
1. Chamará: `list_mobile_components()` _(e descobrirá que não tem um `<Menu>` pronto)_
2. Chamará: `read_mobile_standard()` _(aprenderá a usar a cor `var(--lm-bg)` e `.lm-page`)_
3. Escreverá a página corretamente com Ionic baseada no escopo.

**Ao debugar erros misteriosos no Backend:**
> *"Fiz um request pro Agendamentos e retornou erro 500 no simulador. Inspecione o que deu errado"*

**A IA reagirá chamando:**
1. `inspect_logs(50)`
2. _Receberá o Trackback exato (ex: KeyError em services.py)_
3. Fará a correção sugerida pra você sem que você precise abrir o arquivo de log e colar pra ela.
