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

# ======== Ferramentas de Manutenção e Testes (Django Base) ========

@mcp.tool()
def read_django_models_schema() -> str:
    """Retorna a estrutura atual (campos, tipos e relacionamentos) de todos os Models registrados no Django."""
    code = '''import django
django.setup()
from django.apps import apps
output = []
for app in apps.get_app_configs():
    for model in app.get_models():
        output.append(f"Model: {model.__name__} (App: {app.name})")
        for f in model._meta.get_fields():
            output.append(f"  - {f.name}: {type(f).__name__}")
print("\\n".join(output))'''
    try:
        proc = subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "shell", "-c", code], capture_output=True, text=True, check=True)
        return proc.stdout
    except Exception as e:
        return f"Erro ao extrair schema: {str(e)}"

@mcp.tool()
def execute_django_query(python_query_code: str) -> str:
    """Executa um código Python dentro do shell do Django e retorna os prints. 
    Ideal para usar o ORM (ex: 'from atendimentos.models import Atendimento; print(Atendimento.objects.count())')."""
    setup = "import django; django.setup();\n"
    full_code = setup + python_query_code
    try:
        proc = subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "shell", "-c", full_code], capture_output=True, text=True, timeout=10)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro ao executar query: {str(e)}"

@mcp.tool()
def run_backend_tests(test_path: str = "") -> str:
    """Executa o pytest no backend. Pode receber o caminho de um arquivo ou pasta específica. Deixe vazio para rodar tudo."""
    cmd = [sys.executable, "-m", "pytest"]
    if test_path:
        cmd.append(test_path)
    try:
        env = os.environ.copy()
        env['DJANGO_SETTINGS_MODULE'] = 'lava_me.settings'
        proc = subprocess.run(cmd, cwd=str(BASE_DIR), capture_output=True, text=True, env=env)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro ao rodar pytest: {str(e)}"

# ======== Ferramentas de Manutenção e Testes (Frontend / Mobile) ========

@mcp.tool()
def run_frontend_tests(test_file: str = "") -> str:
    """Executa os testes unitários (Vitest) no frontend/mobile. Retorna o output de sucesso ou falha."""
    cmd = ["npm", "run", "test.unit", "--", "--run"]
    if test_file:
        cmd.append(test_file)
    try:
        proc = subprocess.run(cmd, cwd=str(MOBILE_DIR), capture_output=True, text=True)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro ao rodar vitest: {str(e)}"

@mcp.tool()
def run_frontend_linter() -> str:
    """Executa o linter e checagem de tipos estáticos (ESLint e TSC) na pasta mobile."""
    try:
        proc = subprocess.run(["npm", "run", "lint"], cwd=str(MOBILE_DIR), capture_output=True, text=True)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro no linter front: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport='stdio')
