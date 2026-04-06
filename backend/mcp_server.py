import sys
import chromadb
from pathlib import Path
from mcp.server.fastmcp import FastMCP

# 1. Configuração do Caminho para o Banco Vetorial
BASE_DIR = Path(__file__).resolve().parent
CHROMA_PATH = BASE_DIR / ".chroma_db"

# 2. Inicialização do Servidor MCP
mcp = FastMCP("LavaMe-Context-Server")

# 3. Definição da Ferramenta (Tool) exposta para a IA
@mcp.tool()
def consultar_documentacao_projeto(query: str, n_results: int = 3) -> str:
    """
    Busca regras de negócio, padrões de arquitetura e contexto do banco de dados do projeto Lava-Me.
    Obrigatório usar esta ferramenta ANTES de gerar código para garantir o alinhamento com as regras do sistema.
    """
    try:
        client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        collection = client.get_collection(name="regras_projeto")
        
        # Executa a busca vetorial por similaridade semântica
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if not results['documents'] or not results['documents'][0]:
            return "Nenhuma documentação relevante encontrada para esta query. Tente termos mais específicos."
        
        # Formatação determinística para o LLM não alucinar a origem
        resposta = f"--- RESULTADOS DA BUSCA PARA: '{query}' ---\n\n"
        
        for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
            fonte = metadata.get('source', 'Fonte Desconhecida')
            resposta += f"DOCUMENTO FONTE: [{fonte}]\n{doc}\n"
            resposta += "-" * 40 + "\n\n"
            
        return resposta
        
    except Exception as e:
        return f"Erro interno ao consultar o banco vetorial local (ChromaDB): {str(e)}"

if __name__ == "__main__":
    # O servidor roda aguardando comandos via Standard Input/Output da IDE
    mcp.run(transport='stdio')