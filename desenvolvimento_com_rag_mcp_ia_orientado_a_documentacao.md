🧠 Desenvolvimento Orientado a Documentação com IA (RAG + MCP)
==============================================================

Este documento estabelece o padrão oficial de desenvolvimento do projeto **Lava-Me**. Para evitar alucinações de IA, código inconsistente e conflitos de arquitetura entre os desenvolvedores, não permitimos que agentes de IA leiam o repositório de forma cega.

Toda a equipe deve utilizar a nossa **Infraestrutura Central de Contexto**, baseada em Model Context Protocol (MCP) e Geração Aumentada por Recuperação (RAG).

1\. Visão Geral da Arquitetura
------------------------------

Nossa fonte de verdade absoluta é a documentação (Docs-as-Code). O fluxo funciona da seguinte maneira:

1.  **Documentação Segmentada:** As regras residem na pasta docs/ divididas por domínios semânticos.
    
2.  **Banco Vetorial Local:** Usamos o ChromaDB para converter os arquivos .md em vetores e armazená-los localmente na pasta oculta .chroma\_db/.
    
3.  **Servidor MCP:** Um servidor em Python (mcp\_server.py) escuta requisições da IDE e busca as regras no banco vetorial antes de permitir que a IA escreva o código.
    

### Estrutura da Pasta docs/

*   docs/1\_arquitetura/: Padrões de código (TDD, Views, Services).
    
*   docs/2\_banco\_dados/: Diagramas e esquemas relacionais (Mermaid).
    
*   docs/3\_regras\_negocio/: Requisitos Funcionais fragmentados (Usuários, Atendimentos, Relatórios).
    
*   docs/4\_api/: Contratos OpenAPI.
    

2\. Configuração do Ambiente de IA (Setup Inicial)
--------------------------------------------------

Se esta é a sua primeira vez configurando o projeto ou se você acabou de clonar o repositório, siga os passos abaixo para conectar a sua IDE ao "Cérebro" do projeto.

### Passo 2.1: Inicializar o Banco Vetorial

Certifique-se de que o seu ambiente virtual (venv) está ativo e as dependências instaladas (pip install chromadb mcp).

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Na raiz do projeto:  source venv/bin/activate  # ou venv\Scripts\activate no Windows  python backend/scripts/ingest_docs.py   `

_Se for bem-sucedido, você verá uma mensagem informando que os fragmentos foram indexados na coleção regras\_projeto._

### Passo 2.2: Conectar o Antigravity (ou Cursor/Cline) ao MCP

Vá até as configurações de MCP da sua IDE e adicione o servidor local garantindo o uso de **Caminhos Absolutos** para o seu ambiente.

Exemplo de configuração (mcp\_server.json):

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "mcpServers": {      "lava-me-context-server": {        "command": "/CAMINHO_ABSOLUTO_ATE_O_PROJETO/venv/bin/python",        "args": [          "/CAMINHO_ABSOLUTO_ATE_O_PROJETO/backend/mcp_server.py"        ]      }    }  }   `

_Reinicie a sua IDE após salvar a configuração._

3\. O Fluxo Obrigatório de Desenvolvimento
------------------------------------------

Para implementar uma nova Feature ou alterar uma Regra de Negócio, você **DEVE** seguir exatamente esta ordem:

### 🔴 Etapa 1: Atualizar a Documentação (Docs-First)

Nenhuma linha de código deve ser escrita antes de a regra existir em Markdown.

*   Vá até o arquivo correspondente em docs/3\_regras\_negocio/ e altere/adicione o Requisito Funcional (RF) e seus Critérios de Aceitação.
    

### 🟡 Etapa 2: Sincronizar o Contexto (RAG)

Sempre que o Markdown for alterado (por você ou após um git pull da branch develop), atualize a IA local:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   python backend/scripts/ingest_docs.py   `

### 🟢 Etapa 3: Instruir a IA via MCP

No chat da sua IDE, não peça apenas "crie a funcionalidade". Use a ferramenta acoplada para forçar a leitura do contexto.

> **Prompt Padrão a ser utilizado:**_"Vou implementar \[Nova Feature/Mudança\]. Utilize a ferramenta consultar\_documentacao\_projeto para ler as diretrizes de arquitetura e os requisitos funcionais associados a este tema. Depois, me diga qual é o plano de ação antes de codificar."_

### 🔵 Etapa 4: Codificar (TDD Obrigatório)

O código gerado pela IA deve respeitar o padrão de arquitetura do Django definido no projeto:

1.  **Escrever Testes:** Comece por test\_services.py e test\_api.py.
    
2.  **Lógica de Negócio:** Toda a lógica fica em services.py (Zero lógica nas Views).
    
3.  **Barreiras de Segurança:** Defina permissões em permissions.py.
    
4.  **Endpoint:** Exponha via serializers.py e views.py.
    

4\. Revisão de Código (Critério de Bloqueio em Pull Requests)
-------------------------------------------------------------

**IMPORTANTE:** Um Pull Request será **imediatamente rejeitado** se houver alteração de lógica no código sem a respectiva alteração nos arquivos Markdown da pasta docs/.

A documentação reflete o código, e o código reflete a documentação. Manter a sincronia é o que garante que os agentes de IA de toda a equipe gerem resultados consistentes e seguros.