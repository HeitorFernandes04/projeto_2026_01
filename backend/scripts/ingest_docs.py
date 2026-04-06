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
    Impede truncamento cego e garante que cada RF seja um documento isolado no banco.
    """
    # Adiciona uma quebra de linha inicial para capturar o primeiro título do documento
    text = "\n" + text
    
    # Expressão regular: divide a string sempre que encontrar uma quebra de linha
    # seguida imediatamente por 1 a 3 '#' e um espaço (Padrão de cabeçalho Markdown)
    chunks = re.split(r'\n(?=#{1,3}\s)', text)
    
    # Filtra blocos vazios e limpa espaços em branco
    return [chunk.strip() for chunk in chunks if chunk.strip()]

def ingest_documents():
    print(f"Iniciando ingestão de documentos a partir de: {DOCS_DIR}")
    
    # Inicializa o cliente persistente local
    client = chromadb.PersistentClient(path=str(CHROMA_PATH))
    
    # Obtém ou cria a coleção (upsert)
    collection = client.get_or_create_collection(name="regras_projeto")
    
    # rglob varre as subpastas (1_arquitetura, 3_regras_negocio, etc.)
    md_files = list(DOCS_DIR.rglob("*.md"))
    
    if not md_files:
        print("Erro: Nenhum arquivo .md encontrado. Verifique a estrutura da pasta docs/.")
        return

    documents = []
    metadatas = []
    ids = []

    for file_path in md_files:
        print(f"Lendo: {file_path.relative_to(DOCS_DIR)}")
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Quebra o arquivo em múltiplos blocos semânticos
        chunks = chunk_markdown(content)
        
        for i, chunk in enumerate(chunks):
            documents.append(chunk)
            # Metadado essencial: Diz à IA de qual arquivo (e domínio) essa regra veio
            metadatas.append({"source": f"{file_path.parent.name}/{file_path.name}"})
            # Geração de IDs determinísticos: se rodar o script 2x, ele atualiza em vez de duplicar
            ids.append(f"{file_path.stem}_chunk_{i}")

    if documents:
        # Executa a inserção vetorial
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"\nOperação concluída. {len(documents)} fragmentos de contexto foram indexados na coleção 'regras_projeto'.")
    else:
        print("Nenhum texto válido pôde ser extraído dos arquivos.")

if __name__ == "__main__":
    ingest_documents()