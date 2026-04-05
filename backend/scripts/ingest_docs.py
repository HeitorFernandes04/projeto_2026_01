import os
import chromadb
from pathlib import Path

# Configurações de caminhos
BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = BASE_DIR.parent / "docs"
CHROMA_PATH = BASE_DIR / ".chroma_db"

def ingest_documents():
    """
    Lê os arquivos Markdowns em docs/ e os armazena no ChromaDB.
    """
    print(f"Iniciando ingestão de documentos de: {DOCS_DIR}")
    
    # Inicializa o cliente persistente
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    
    # Cria (ou obtém) a coleção
    collection = client.get_or_create_collection(name="regras_projeto")
    
    # Lista arquivos .md
    md_files = list(DOCS_DIR.glob("*.md"))
    
    if not md_files:
        print("Nenhum arquivo .md encontrado para ingestão.")
        return

    documents = []
    metadatas = []
    ids = []

    for i, file_path in enumerate(md_files):
        print(f"Processando: {file_path.name}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        documents.append(content)
        metadatas.append({"source": file_path.name})
        ids.append(f"doc_{i}")

    # Adiciona à coleção
    # O ChromaDB gera os embeddings automaticamente usando o modelo padrão (all-MiniLM-L6-v2)
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"Sucesso! {len(documents)} documentos ingeridos na coleção 'regras_projeto'.")

if __name__ == "__main__":
    ingest_documents()
