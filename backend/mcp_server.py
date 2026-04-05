from mcp.server.fastmcp import FastMCP
import chromadb
from pathlib import Path

# Configuração de caminhos (executando a partir da raiz do backend)
BASE_DIR = Path(__file__).resolve().parent
CHROMA_PATH = BASE_DIR / ".chroma_db"

# Inicializa o servidor MCP
mcp = FastMCP("Projeto Doc Server")

@mcp.tool()
def consultar_documentacao_projeto(query: str) -> str:
    """
    Consulta a documentação do projeto (regras, diagramas, etc.) usando busca semântica no ChromaDB.
    
    Args:
        query: A pergunta ou termo de busca relacionado ao projeto.
    """
    try:
        # Inicializa cliente ChromaDB de forma persistente
        client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        
        # Obtém a coleção de regras do projeto
        try:
            collection = client.get_collection(name="regras_projeto")
        except Exception:
            return "Erro: A coleção 'regras_projeto' não foi encontrada. Certifique-se de rodar o script de ingestão primeiro."
        
        # Realiza a busca semântica (top 3 resultados)
        results = collection.query(
            query_texts=[query],
            n_results=3
        )
        
        # Verifica se há resultados
        if not results["documents"] or not results["documents"][0]:
            return "Nenhum trecho relevante encontrado na documentação para a consulta informada."
            
        # Constrói a resposta formatada
        response_parts = ["### Trechos Relevantes Encontrados na Documentação:\n"]
        
        for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
            source = meta.get("source", "Arquivo não identificado")
            response_parts.append(f"**Fonte: {source}**\n{doc}\n\n---\n")
            
        return "\n".join(response_parts)
        
    except Exception as e:
        return f"Ocorreu um erro interno ao processar a consulta: {str(e)}"

if __name__ == "__main__":
    # Inicia o servidor (utiliza stdio por padrão)
    mcp.run()
