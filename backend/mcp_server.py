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
WEB_DIR = BASE_DIR.parent / "web"

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
        from ingest_docs import ingest_documents  # type: ignore
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

# ======== Ferramentas Web (Angular) ========

@mcp.tool()
def read_web_standard() -> str:
    """Retorna as regras absolutas de arquitetura e design do projeto Angular. Use antes de criar telas WEB."""
    standard_file = DOCS_DIR / "1_arquitetura" / "web_standard.md"
    if not standard_file.exists():
        return "Padronização web não encontrada."
    with open(standard_file, "r") as f:
        return f.read()

@mcp.tool()
def list_web_components() -> str:
    """Lista todos os componentes Angular (.component.ts) em busca de reuso no diretório web/."""
    if not WEB_DIR.exists():
        return "Diretório Web não encontrado."
    
    files = list(WEB_DIR.glob("src/app/**/*.component.ts"))
    file_list = [f"- {f.relative_to(WEB_DIR)}" for f in files]
    return "Componentes Angular Encontrados:\n" + "\n".join(file_list)

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
    Ideal para usar o ORM (ex: 'from operacao.models import OrdemServico; print(OrdemServico.objects.count())')."""
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
    """Executa os testes unitários (Vitest/Jest) no frontend. Detecta automaticamente se é Mobile ou Web."""
    cwd = MOBILE_DIR
    cmd = ["npm", "run", "test.unit", "--", "--run"]
    
    # Inteligência de detecção de diretório
    if test_file:
        if "web/" in test_file:
            cwd = WEB_DIR
            # No Angular (Web), usamos npx vitest para testes isolados de spec.ts
            cmd = ["npx", "vitest", "run", test_file.replace("web/", "")]
        elif "mobile/" in test_file:
            cwd = MOBILE_DIR
            test_file = test_file.replace("mobile/", "")
            cmd = ["npm", "run", "test.unit", "--", "--run", test_file]
        else:
            # Tenta inferir se o arquivo existe em algum dos dois
            if (WEB_DIR / test_file).exists():
                cwd = WEB_DIR
                cmd = ["npx", "vitest", "run", test_file]
            elif (MOBILE_DIR / test_file).exists():
                cwd = MOBILE_DIR
                cmd = ["npm", "run", "test.unit", "--", "--run", test_file]

    try:
        proc = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
        return f"Executando em: {cwd.name}\nComando: {' '.join(cmd)}\n\n{proc.stdout if proc.stdout else proc.stderr}"
    except Exception as e:
        return f"Erro ao rodar testes: {str(e)}"

@mcp.tool()
def run_frontend_linter() -> str:
    """Executa o linter e checagem de tipos estáticos (ESLint e TSC) na pasta mobile."""
    try:
        proc = subprocess.run(["npm", "run", "lint"], cwd=str(MOBILE_DIR), capture_output=True, text=True)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro no linter front: {str(e)}"

# ======== Ferramentas de Consistência e Governança ========

@mcp.tool()
def verify_api_endpoints() -> str:
    """Verifica se as URLs chamadas no Mobile/Web existem no Backend (Django). Detecta erros de integração."""
    # 1. Extrair URLs do Django
    code = '''import django; django.setup(); from django.urls import get_resolver;
def get_urls(resolver, prefix=''):
    out = []
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'url_patterns'):
            out.extend(get_urls(pattern, prefix + pattern.pattern.regex.pattern.replace('^', '')))
        else:
            p = prefix + pattern.pattern.regex.pattern.replace('^', '').replace('$', '')
            out.append(p.replace('\\\\', ''))
    return out
print("\\n".join(get_urls(get_resolver())))'''
    
    try:
        proc = subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "shell", "-c", code], 
                            capture_output=True, text=True, check=True)
        django_urls = [u.strip() for u in proc.stdout.split('\n') if u.strip()]
        
        # 2. Buscar URLs no Front (Busca simplificada por strings que parecem /api/)
        errors = []
        for directory in [MOBILE_DIR, WEB_DIR]:
            if not directory.exists(): continue
            # Busca em arquivos de serviço/api
            p = subprocess.run(['grep', '-r', "/api/", str(directory)], capture_output=True, text=True)
            for line in p.stdout.split('\n'):
                if not line or ".spec.ts" in line or "node_modules" in line: continue
                # Extrair o que parece uma rota (ex: /api/gestao/servicos/)
                import re
                matches = re.findall(r'(/api/[a-zA-Z0-9\-_/]+)', line)
                for m in matches:
                    # Limpar e verificar se existe no backend (match parcial ou exato)
                    found = any(u.startswith(m.lstrip('/')) for u in django_urls) or \
                            any(m.lstrip('/') in u for u in django_urls)
                    if not found:
                        errors.append(f"ALERTA: Rota '{m}' usada em {line.split(':')[0]} não encontrada no Backend.")
        
        return "\n".join(errors) if errors else "Todas as rotas mapeadas parecem válidas."
    except Exception as e:
        return f"Erro na verificação: {str(e)}"

@mcp.tool()
def check_test_coverage(files: list[str]) -> str:
    """Verifica se arquivos alterados (lista de paths) possuem arquivos de teste correspondentes."""
    results = []
    for f in files:
        path = Path(f)
        if not path.exists(): continue
        
        # Lógica de mapeamento
        test_file = None
        if f.endswith('.py'):
            # Backend: views.py -> tests/test_views.py ou tests.py
            test_file = path.parent / f"tests/test_{path.name}"
            if not test_file.exists(): test_file = path.parent / "tests.py"
        elif f.endswith('.ts') or f.endswith('.tsx'):
            # Frontend: name.component.ts -> name.component.spec.ts
            test_file = path.parent / f"{path.stem}.spec.ts"
            if not test_file.exists(): test_file = path.parent / f"{path.stem}.spec.tsx"

        if test_file and test_file.exists():
            results.append(f"✅ {f} -> Testado em {test_file.name}")
        else:
            results.append(f"❌ {f} -> SEM TESTE CORRESPONDENTE")
            
    return "\n".join(results)

# ======== Ferramentas de Automação de Release ========

@mcp.tool()
def generate_sprint_release_draft(version: str, sprint_title: str) -> str:
    """Gera o texto (markdown) profissional da Release da Sprint puxando os PRs mergeados do GitHub CLI."""
    try:
        # Busca últimos 15 PRs mergeados usando gh
        proc = subprocess.run(
            ["gh", "pr", "list", "--state", "merged", "--limit", "15", "--json", "number,title,author"],
            cwd=str(BASE_DIR.parent), capture_output=True, text=True, check=True
        )
        import json
        prs = json.loads(proc.stdout)
        
        pr_list_md = ""
        for pr in prs:
            pr_list_md += f"* {pr['title']} (#{pr['number']}) por @{pr['author']['login']}\n"

        draft = f"""# 🚀 Release {version} - {sprint_title}

Nesta release, a equipe Lava-Me concluiu mais uma Sprint, entregando ferramentas essenciais para a evolução do ecossistema.

## 🛠 O que há de novo ({sprint_title})
* [AGENTE IA: LISTE AQUI AS FUNCIONALIDADES DETECTADAS NO REPOSITÓRIO]

## 🤖 Inovação: IA e Engenharia de Software
* **Documentation-First:** Código especificado e validado pela IA antes do deploy.
* **Governança:** Testes automatizados e linting aplicados no pipeline.

## 👥 Pull Requests e Contribuições
{pr_list_md}"""
        
        draft_path = DOCS_DIR / "releases"
        draft_path.mkdir(exist_ok=True)
        file_path = draft_path / f"draft_{version}.md"
        
        with open(file_path, "w") as f:
            f.write(draft)
            
        return f"Draft de Release gerado com sucesso em {file_path}. O agente de IA deve revisar e preencher as features novas."
    except Exception as e:
        return f"Erro ao gerar draft: {str(e)}"

# ======== Ferramentas de Auxílio ao Desenvolvedor ========

@mcp.tool()
def start_development_environment() -> str:
    """
    Inicia automaticamente os 3 servidores do projeto (Django Backend, Angular Web e Ionic Mobile)
    em background. Retorna os endereços de acesso.
    """
    try:
        log_file = BASE_DIR / "logs" / "dev_servers.log"
        log_file.parent.mkdir(exist_ok=True)
        
        cmd = f"nohup make dev > {log_file} 2>&1 &"
        subprocess.run(cmd, shell=True, cwd=str(BASE_DIR.parent))
        
        return f"""Ambiente de desenvolvimento iniciado com sucesso em Background!

🔗 Endereços disponíveis:
- 🌐 Backend (Django API): http://localhost:8000/
- 💻 Web (Angular Painel): http://localhost:4200/
- 📱 Mobile (React/Vite App): http://localhost:5173/

📝 Os logs consolidados estão sendo gravados em: {log_file}"""
    except Exception as e:
        return f"Erro ao iniciar o ambiente: {str(e)}"

@mcp.tool()
def stop_development_environment(target: str = "all") -> str:
    """
    Desliga os servidores que estão rodando em background.
    O parâmetro `target` pode ser: 'all' (para desligar todos), 'backend', 'web' ou 'mobile'.
    """
    import os
    messages = []
    
    if target in ["all", "backend"]:
        os.system("pkill -f 'manage.py runserver'")
        messages.append("🔴 Backend (Django) desligado.")
        
    if target in ["all", "web"]:
        os.system("pkill -f 'ng serve'")
        messages.append("🔴 Web (Angular) desligado.")
        
    if target in ["all", "mobile"]:
        os.system("pkill -f 'vite'")
        messages.append("🔴 Mobile (Vite/React) desligado.")
        
    if target == "all":
        os.system("pkill -f 'make dev'")
        
    if not messages:
        return "Alvo inválido. Use 'all', 'backend', 'web' ou 'mobile'."
        
    return "\n".join(messages)

# ======== Ferramentas de Manutenção e Testes (Frontend / Web) ========

@mcp.tool()
def run_web_tests(test_file: str = "") -> str:
    """Executa os testes unitários no projeto Web (Angular). Se um arquivo for passado, usa Vitest para rapidez."""
    if test_file:
        return run_frontend_tests(test_file) # Reutiliza a lógica inteligente
        
    try:
        proc = subprocess.run(["npm", "run", "test", "--", "--watch=false"], cwd=str(WEB_DIR), capture_output=True, text=True)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro ao rodar testes web: {str(e)}"

@mcp.tool()
def run_web_linter() -> str:
    """Executa o linter (ESLint) na pasta web."""
    try:
        proc = subprocess.run(["npm", "run", "lint"], cwd=str(WEB_DIR), capture_output=True, text=True)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro no linter web: {str(e)}"

# ======== Ferramentas de Banco de Dados ========

@mcp.tool()
def check_and_run_migrations(apply: bool = False) -> str:
    """
    Verifica por migrações pendentes no Django. 
    Se apply=True, executa makemigrations e migrate automaticamente.
    """
    try:
        if not apply:
            proc = subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "makemigrations", "--dry-run"], capture_output=True, text=True)
            return proc.stdout
        else:
            p1 = subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "makemigrations"], capture_output=True, text=True)
            p2 = subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "migrate"], capture_output=True, text=True)
            return f"Makemigrations:\\n{p1.stdout}\\nMigrate:\\n{p2.stdout}"
    except Exception as e:
        return f"Erro ao manipular migrações: {str(e)}"

# ======== Ferramentas de Segurança e Qualidade ========

@mcp.tool()
def run_security_audit(target: str = "all") -> str:
    """Roda NPM Audit nos frontends e verificações básicas de segurança no backend."""
    output = []
    try:
        if target in ["all", "mobile"]:
            p = subprocess.run(["npm", "audit"], cwd=str(MOBILE_DIR), capture_output=True, text=True)
            output.append("=== MOBILE AUDIT ===\\n" + p.stdout)
        if target in ["all", "web"]:
            p = subprocess.run(["npm", "audit"], cwd=str(WEB_DIR), capture_output=True, text=True)
            output.append("=== WEB AUDIT ===\\n" + p.stdout)
        if target in ["all", "backend"]:
            p = subprocess.run([sys.executable, "-m", "pip", "check"], cwd=str(BASE_DIR), capture_output=True, text=True)
            output.append("=== BACKEND PIP CHECK ===\\n" + p.stdout)
        return "\\n".join(output)
    except Exception as e:
        return f"Erro na auditoria de segurança: {str(e)}"

@mcp.tool()
def generate_backend_coverage() -> str:
    """Roda pytest com --cov para gerar o relatório real de cobertura do código."""
    try:
        env = os.environ.copy()
        env['DJANGO_SETTINGS_MODULE'] = 'lava_me.settings'
        proc = subprocess.run([sys.executable, "-m", "pytest", "--cov=.", "--cov-report=term"], cwd=str(BASE_DIR), capture_output=True, text=True, env=env)
        return proc.stdout if proc.stdout else proc.stderr
    except Exception as e:
        return f"Erro ao gerar coverage: {str(e)}"

# ======== Ferramentas de Code Review ========

@mcp.tool()
def fetch_github_pr_diff(pr_number: int) -> str:
    """Busca o diff (código alterado) de uma PR específica para a IA auditar."""
    try:
        proc = subprocess.run(["gh", "pr", "diff", str(pr_number)], cwd=str(BASE_DIR.parent), capture_output=True, text=True, check=True)
        return proc.stdout
    except Exception as e:
        return f"Erro ao buscar diff da PR #{pr_number}. Verifique autenticação do gh CLI. Erro: {str(e)}"

# ======== Sincronização Inteligente e Integrações (Tools Novas) ========

@mcp.tool()
def sync_typescript_models() -> str:
    """Gera/Atualiza os modelos TypeScript do Angular e Ionic baseados no schema OpenAPI do Django."""
    try:
        schema_path = DOCS_DIR / "4_api" / "schema.yml"
        if not schema_path.exists():
            return "Erro: schema.yml não encontrado. Rode sync_api_schema() primeiro."
            
        web_models_dir = WEB_DIR / "src" / "app" / "models"
        mobile_models_dir = MOBILE_DIR / "src" / "models"
        web_models_dir.mkdir(exist_ok=True, parents=True)
        mobile_models_dir.mkdir(exist_ok=True, parents=True)
        
        # Usa o npx openapi-typescript para gerar interfaces brutas via CLI
        cmd_web = ["npx", "openapi-typescript", str(schema_path), "-o", str(web_models_dir / "schema.d.ts")]
        cmd_mobile = ["npx", "openapi-typescript", str(schema_path), "-o", str(mobile_models_dir / "schema.d.ts")]
        
        p1 = subprocess.run(cmd_web, capture_output=True, text=True)
        p2 = subprocess.run(cmd_mobile, capture_output=True, text=True)
        
        return f"Tipagens OpenAPI sincronizadas com sucesso! O Front agora reflete o Backend exato.\\nWEB:\\n{p1.stdout[:100]}...\\nMOBILE:\\n{p2.stdout[:100]}..."
    except Exception as e:
        return f"Erro na sincronização de tipos: {str(e)}"

@mcp.tool()
def generate_database_erd() -> str:
    """Extrai a estrutura atual do Django via Shell e escreve um diagrama Mermaid ERD no docs/2_banco_dados."""
    code = '''import django; django.setup(); from django.apps import apps
out = ["erDiagram"]
for app in apps.get_app_configs():
    if app.name in ['admin', 'auth', 'contenttypes', 'sessions', 'messages', 'staticfiles', 'corsheaders', 'rest_framework', 'drf_spectacular']: continue
    for model in app.get_models():
        out.append(f"  {model.__name__} {{")
        for f in model._meta.get_fields():
            if f.is_relation and hasattr(f, 'related_model') and f.related_model:
                out.insert(1, f"  {model.__name__} }}|--|| {f.related_model.__name__} : {f.name}")
            elif hasattr(f, 'name'):
                out.append(f"    {type(f).__name__} {f.name}")
        out.append("  }")
print("\\n".join(out))'''
    
    try:
        proc = subprocess.run([sys.executable, str(BASE_DIR / "manage.py"), "shell", "-c", code], capture_output=True, text=True, check=True)
        
        erd_path = DOCS_DIR / "2_banco_dados" / "diagrama_relacionamento.md"
        erd_path.parent.mkdir(exist_ok=True)
        
        content = f"# Diagrama Entidade-Relacionamento (ERD)\\n\\n*Gerado automaticamente pelo Agente MCP.*\\n\\n```mermaid\\n{proc.stdout}\\n```"
        with open(erd_path, "w") as f:
            f.write(content)
            
        return f"Diagrama Mermaid ERD gerado com sucesso e salvo em {erd_path}."
    except Exception as e:
        return f"Erro ao gerar diagrama ERD: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport='stdio')
