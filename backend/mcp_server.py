import sys
import chromadb
import subprocess
import os
from pathlib import Path
from mcp.server.fastmcp import FastMCP

# Caminhos do sistema
BASE_DIR = Path(__file__).resolve().parent
CHROMA_PATH = BASE_DIR / ".chroma_db"
LOG_FILE = BASE_DIR / "logs" / "dev.log"
SCRIPTS_DIR = BASE_DIR / "scripts"
DOCS_DIR = BASE_DIR.parent / "docs"
MOBILE_DIR = BASE_DIR.parent / "mobile"

# Setup FastMCP
mcp = FastMCP("LavaMe-AI-Governance")

# ======== Ferramentas do RAG (Conhecimento Backend e Negócio) ========

@mcp.tool()
def consultar_documentacao_projeto(query: str, n_results: int = 3) -> str:
    """Busca regras de negócio, glossário ou especificações da API no banco RAG local."""
    try:
        client = chromadb.PersistentClient(path=str(CHROMA_PATH))
        collection = client.get_collection(name="regras_projeto")
        results = collection.query(query_texts=[query], n_results=n_results)
        
        if not results['documents'] or not results['documents'][0]:
            return "Nenhum resultado relevante no RAG. Se atente para a documentação na pasta docs/."
            
        resposta = f"--- RESULTADOS RAG PARA: '{query}' ---\n\n"
        for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
            resposta += f"FONTE: [{metadata.get('source')}]\n{doc}\n{'-'*30}\n"
        return resposta
    except Exception as e:
        return f"Erro na consulta do RAG: {str(e)}"

@mcp.tool()
def inspect_logs(n_lines: int = 50) -> str:
    """Retorna as últimas N linhas do trace de log do backend Django (logs/dev.log)."""
    if not LOG_FILE.exists():
        return "Arquivo de log não montado ou inexistente."
    try:
        with open(LOG_FILE, "r") as f:
            lines = f.readlines()
            return "".join(lines[-n_lines:])
    except Exception as e:
        return f"Erro de File IO: {str(e)}"

@mcp.tool()
def sync_api_schema() -> str:
    """Dispara autogeração OpenAPI (Django) e reindexa o ChromaDB com as novas rotas/regras."""
    try:
        schema_path = DOCS_DIR / "4_api" / "schema.yml"
        # Usando sys.executable (o python do ambiente ativado)
        subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "spectacular", "--file", str(schema_path)], check=True)
        
        sys.path.append(str(SCRIPTS_DIR))
        from ingest_docs import ingest_documents
        msg = ingest_documents()
        return f"Swagger OpenAPI gerado. Re-ingestão RAG finalizada: {msg}"
    except subprocess.CalledProcessError:
        return "Falha (CalledProcessError) ao gerar schema. Verifique imports Django e syntax."
    except Exception as e:
        return f"Erro desconhecido na sincronização: {str(e)}"

# ======== Ferramentas Mobile (Ecossistema Ionic/React) ========

@mcp.tool()
def read_mobile_standard() -> str:
    """Retorna as regras absolutas de arquitetura, CSS e tokens do projeto Ionic. Deve ser usado antes de criar UI."""
    standard_file = DOCS_DIR / "1_arquitetura" / "mobile_standard.md"
    if not standard_file.exists():
        return "Padronização não encontrada. Favor não alterar componentes nativos."
    with open(standard_file, "r") as f:
        return f.read()

@mcp.tool()
def list_mobile_components() -> str:
    """Lista todos os componentes React compartilhados (mobile/src/components) que a IA deve reaproveitar."""
    components_dir = MOBILE_DIR / "src" / "components"
    if not components_dir.exists():
        return "Nenhum componente base encontrado."
        
    files = list(components_dir.glob("*.tsx"))
    file_list = [f"- {t.name}" for t in files]
    return "Componentes React/Ionic Encontrados:\n" + "\n".join(file_list) + "\n\n(Reaproveite estes arquivos e respeite suas Props)"

if __name__ == "__main__":
    mcp.run(transport='stdio')
