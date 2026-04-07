import os
import re
import chromadb
from pathlib import Path

# Configurações de caminhos
BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = BASE_DIR.parent / "docs"
CHROMA_PATH = BASE_DIR / ".chroma_db"

def chunk_markdown(text):
    """
    Quebra o texto em blocos semânticos baseados nos cabeçalhos Markdown (#, ##, ###).
    Impede truncamento cego e garante que cada documento (e RF) seja lido integralmente no contexto.
    """
    text = "\n" + text
    chunks = re.split(r'\n(?=#{1,3}\s)', text)
    return [chunk.strip() for chunk in chunks if chunk.strip()]

def ingest_documents():
    print(f"Iniciando ingestão de documentos RAG a partir de: {DOCS_DIR}")
    
    # Inicializa o cliente persistente local
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    
    # Coleção "regras_projeto", re-criada dinamicamente
    collection = client.get_or_create_collection(name="regras_projeto")
    
    # rglob varre as subpastas em docs/
    md_files = list(DOCS_DIR.rglob("*.md"))
    
    if not md_files:
        print("Erro: Nenhum arquivo .md encontrado na docs/. Verifique a árvore de diretórios.")
        return "Erro de ingestão"

    documents = []
    metadatas = []
    ids = []

    for file_path in md_files:
        print(f"Indexando: {file_path.relative_to(DOCS_DIR)}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        chunks = chunk_markdown(content)
        
        for i, chunk in enumerate(chunks):
            documents.append(chunk)
            metadatas.append({"source": f"{file_path.parent.name}/{file_path.name}"})
            # IDs determinísticos evitam duplicação
            ids.append(f"{file_path.stem}_chunk_{i}")

    if documents:
        # Vetorização local do Chroma e gravação em banco SQLite (.chroma_db)
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        msg = f"Sucesso! {len(documents)} fragmentos indexados."
        print(f"\n{msg}")
        return msg
    else:
        return "Nenhum texto extraível."

if __name__ == "__main__":
    ingest_documents()
