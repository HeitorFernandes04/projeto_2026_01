# 🤖 Guia de Governança IA: RAG + MCP (Lava-Me)

Este documento descreve a nova infraestrutura de apoio ao desenvolvimento orientada por IA. O objetivo é garantir que qualquer assistente de código (Cursor, Windsurf, Antigravity, etc.) siga rigorosamente as regras do projeto.

---

## 🎯 1. Por que usar isso? (Justificativa)
Desenvolver com IA economiza tempo, mas pode gerar código que ignora regras de negócio específicas ou padrões do projeto (ex: limites de fotos, fluxos de status). 

O sistema **RAG (Retrieval-Augmented Generation)** + **MCP (Model Context Protocol)** funciona como uma "âncora de realidade":
*   **Busca Semântica:** A IA não adivinha; ela busca nos nossos `docs/` antes de sugerir código.
*   **Contexto Vivo:** O banco vetorial (ChromaDB) indexa nossas Regras de Negócio e a API.
*   **Governança Mobile e Backend:** O servidor MCP possui _tools_ específicas para ler padrões do Django e forçar a validação de código Ionic/CSS pré-existentes. Em suma: ele não nos deixa gerar código despadronizado.

---

## ⚙️ 2. Como Instalar (Setup Inicial)

Certifique-se de estar com o ambiente virtual do backend ativo:

1.  **Instalar Dependências:**
    ```bash
    pip install -r backend/requirements-ia.txt
    ```
2.  **Indexar Documentos (Populando o RAG):**
    Sempre que houver mudanças na pasta `docs/`, rode este script para atualizar o cérebro da IA:
    ```bash
    python backend/scripts/ingest_docs.py
    ```

---

## 🚀 3. Como Utilizar (Workflow de Desenvolvimento)

Para que a IA tenha acesso às ferramentas de busca, o servidor MCP precisa estar rodando ou configurado na sua IDE:

*   **No dia a dia:** Ao pedir uma nova feature (ex: "Crie um relatório de lavagens"), a IA usará as ferramentas do `mcp_server.py` para ler os contratos da API e regras de negócio antes de escrever o código.
*   **Sincronização:** Se você criar uma regra nova em um arquivo Markdown, rode o `ingest_docs.py` novamente.

---

## ⚠️ 4. Cuidados e Boas Práticas (Precauções)

1.  **Não confie 100%:** O RAG ajuda a IA a não errar o contexto, mas a revisão humana (Code Review) continua sendo obrigatória.
2.  **Mantenha os `docs/` atualizados:** O RAG é tão bom quanto o que está escrito na pasta de documentação. Documento desatualizado = sugestão de código errada.
3.  **Arquivos Sensíveis:** O `.antigravitignore` e `.geminiignore` protegem chaves de API e arquivos privados de serem indexados. **Nunca remova essas entradas.**
4.  **Conflitos de Versão:** Se mudar a estrutura do banco de dados vetorial, pode ser necessário deletar a pasta `backend/chroma_db` e rodar o `ingest_docs.py` do zero.

---

**Dúvidas?** Consulte o arquivo `docs/5_infraestrutura_ia/detalhes_tecnicos_rag_mcp.md` para aprofundamento técnico.
