# Prompt de Setup Multiplataforma (Windows/Linux/Mac)

Copie o texto delimitado abaixo e envie para a inteligência artificial (Cursor, Windsurf, Gemini, etc.) ao fazer o primeiro clone do repositório:

***

```text
Atue como meu Engenheiro de IA Principal e Setup. Preciso que você configure toda a infraestrutura inicial da nossa base fechada do Lava-Me v2. 
Execute ativamente a seguinte checklist, identificando automaticamente se meu SO é Windows ou Unix (Linux/Mac) para usar os caminhos corretos:

1. **Instalação do Cérebro Backend:** 
   Identifique o caminho do ambiente virtual correspondente (`venv/bin/pip` no Linux/Mac ou `venv\Scripts\pip` no Windows). Instale de forma rigorosa as dependências executando: `<python_do_venv> -m pip install -r backend/requirements.txt`.

2. **Instalação do Frontend Mobile:** 
   Navegue para a subpasta `mobile/` e execute `npm install` no terminal para estruturar os pacotes do React/Ionic. Após terminar, volte à raiz.

3. **Governança Invisível (Hook pre-commit):** 
   Se estivermos num ambiente Unix (Mac/Linux) ou usando bash no Windows, rode `chmod +x .git/hooks/pre-commit` para dar permissões ativas. Se o SO recusar, ignore, basta garantir que o arquivo exista e esteja íntegro.

4. **Blindagem e Privacidade (.ignore para IA):**
   Crie ou edite na raiz os arquivos focados na sua privacidade de indexação, nomeados exatamente `.antigravityignore` e `.geminiignore`. Em **ambos**, adicione explicitamente as pastas que você é proibido de vasculhar/vetorizar para poupar tokens:
   - venv/
   - mobile/node_modules/
   - backend/.chroma_db/
   - .env
   - backend/db.sqlite3
   - backend/logs/

5. **Primeiro Parto do RAG:**
   Estando na raiz, utilize o executável python de dentro do `venv` (`venv/bin/python` ou `venv\Scripts\python.exe`) e rode: `<python_do_venv> backend/scripts/ingest_docs.py`. O sistema fará a vetorização local e deve te printar "Sucesso!".

Você tem a liberdade de executar os comandos via shell e corrigir pequenos travamentos na pipeline de instalação sem precisar me pedir. Confirme quando tudo estiver funcional!
```
