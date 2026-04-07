# 🧠 Documentação Técnica: Ecossistema de IA (RAG + MCP)

Este documento detalha a infraestrutura implementada do **Model Context Protocol (MCP)** em conjunto com o banco vetorial **ChromaDB**.

## 1. Estrutura Docs-As-Code Orientada ao Agente

Para otimizar o parsing vetorial, as documentações ficam restritas às pastas nomeadas para o contexto:

*   **`1_arquitetura/`**: Contém regras críticas que evitam alucinações de framework (ex: `django_standard.md` para regras de serviços e `mobile_standard.md` para Ionic tokens CSS).
*   **`2_banco_dados/`**: Diagramas de domínio.
*   **`3_regras_negocio/`**: Requisitos estritos validados via RAG e o Glóssario de Termos Gerais.
*   **`4_api/`**: OpenAPI `schema.yml` (Single source of truth mapeado via drf-spectacular).
*   **`5_infraestrutura_ia/`**: Refere-se à configuração atual e ao guia da IA.

## 2. Componentes de Software

### A. Backend de IA (`mcp_server.py`)
Utilizamos FastMCP como provider. A IA que consumir o `mcp_server.py` terá acesso a _Tools_ que permitem varredura e interação.
As ferramentas habilitadas são projetadas para estender a visão do agente sobre o que **já existe**:

1.  **consultar_documentacao_projeto**: Wrapper de busca no ChromaDB.
2.  **inspect_logs**: Permite introspecção viva de `backend/logs/dev.log` se o Django quebrar em Dev.
3.  **sync_api_schema**: Automação para forçar o backend a escrever as rotas e reindexar.
4.  **read_mobile_standard**: Leitura manual solicitada do encapsulamento de estilos e temas do Ionic app (garantia UX).
5.  **list_mobile_components**: Permite ao agente checar a listagem de componentes dinamicamente na página `mobile/src/components` e não duplicá-los desnecessariamente.

### B. O Ingestor (`ingest_docs.py`)
O script lê via RegEx as marcações `#`, `##` para gerar fragmentos com semântica local. Essa rotina garante que se uma regra de negócio for alterada no Markdown, rodar a ingestão vai atualizar localmente o ID vetorial ao invés de alocar textos mortos ou duplicados.

## 3. Resiliência por Hooks

Implementamos um `.git/hooks/pre-commit`.
A lógica de gatilho verifica qualquer mudança que aconteça nas zonas `backend/` e `docs/`.
Ele silencia saídas do Spectacular, gera o arquivo OpenAPI puro no `docs/4_api` e imediatamente re-executa a ingestão.
Assim, é garantido que mudanças committadas na API gerem um banco de vetores saudável para os próximos checkouts.
