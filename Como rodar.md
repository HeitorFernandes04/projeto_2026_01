# 🚀 Como Rodar o Projeto Lava-me

## 📋 Sumário

- [Requisitos](#requisitos)
- [Backend](#backend-django)
- [Git Flow](#git-flow)
---

## Requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Python** 3.10 ou superior
- **pip** (gerenciador de pacotes do Python)
- **Git**

---

## Backend (Django)

### 1. Clone o repositório

```bash
git clone https://github.com/HeitorFernandes04/projeto_2026_01.git
cd projeto_2026_01
```

---

### 2. Ambiente Virtual

É altamente recomendado utilizar um ambiente virtual para isolar as dependências do projeto.

**Criar o ambiente virtual:**

```bash
python -m venv venv
```

**Ativar o ambiente virtual:**

- No **Linux/macOS**:
  ```bash
  source venv/bin/activate
  ```

- No **Windows (CMD)**:
  ```bash
  venv\Scripts\activate
  ```

- No **Windows (PowerShell)**:
  ```bash
  venv\Scripts\Activate.ps1
  ```

> Após ativar, você verá `(venv)` no início da linha do terminal.

**Desativar o ambiente virtual:**

```bash
deactivate
```

---

### 3. Instalar as Dependências

Com o ambiente virtual **ativado**, instale as dependências do projeto:

```bash
pip install -r requirements.txt
```

---

### 4. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis necessárias:

```bash
cp .env.example .env
```

> Edite o arquivo `.env` com as configurações do seu ambiente (banco de dados, secret key, etc.).

---

### 5. Executar as Migrações

Aplique as migrações para criar as tabelas no banco de dados:

```bash
python manage.py migrate
```

---

### 6. Criar Superusuário *(opcional)*

Para acessar o painel de administração do Django, crie um superusuário:

```bash
python manage.py createsuperuser
```

> Siga as instruções no terminal para definir nome de usuário, e-mail e senha.
> O painel admin estará disponível em: `http://localhost:8000/admin`

---

### 7. Rodar o Servidor

Inicie o servidor de desenvolvimento:

```bash
python manage.py runserver
```

Por padrão, o servidor estará disponível em:

```
http://localhost:8000
```

Para rodar em uma porta diferente:

```bash
python manage.py runserver 8080
```

---

## Gerenciamento de Dependências

### Gerar novo `requirements.txt`

Sempre que instalar uma nova biblioteca, atualize o arquivo de dependências:

```bash
pip install <nome-da-biblioteca>
pip freeze > requirements.txt
```

> Certifique-se de que o ambiente virtual está **ativado** antes de executar esses comandos.

---
## Extras - Backend
### Shell (terminal) do django
Útil para consultas e alterações direatmente do terminal do Django

```shell
python manage.py shell
```

---

## Resumo dos Comandos de Backend

| Ação | Comando |
|---|---|
| Criar ambiente virtual | `python -m venv venv` |
| Ativar (Linux/macOS) | `source venv/bin/activate` |
| Ativar (Windows CMD) | `venv\Scripts\activate` |
| Desativar | `deactivate` |
| Instalar dependências | `pip install -r requirements.txt` |
| Rodar migrações | `python manage.py migrate` |
| Criar superusuário | `python manage.py createsuperuser` |
| Rodar servidor | `python manage.py runserver` |
| Atualizar requirements | `pip freeze > requirements.txt` |
| Shell Django | `python manage.py shell`|

## Git Flow

Este projeto segue o padrão **Git Flow** para organização de branches e fluxo de desenvolvimento.

### Branches Principais

| Branch | Descrição |
|---|---|
| `main` | Código em produção — estável e testado |
| `develop` | Branch de integração — base para novas features |

### Branches de Suporte

| Tipo | Padrão de Nome | Exemplo |
|---|---|---|
| Nova funcionalidade | `feature/<descricao>` | `feature/autenticacao-jwt` |
| Correção de bug | `fix/<descricao>` | `fix/login-redirect` |
| Correção urgente em produção | `hotfix/<descricao>` | `hotfix/token-expirado` |
| Release | `release/<versao>` | `release/1.2.0` |

---

### Fluxo de uma Feature

**1. Sempre parta da `develop` atualizada:**

```bash
git checkout develop
git pull origin develop
```

**2. Crie sua branch de feature:**

```bash
git checkout -b feature/<descricao>
```

**3. Desenvolva, faça commits e suba a branch:**

```bash
git add .
git commit -m "feat: descrição clara do que foi feito"
git push origin feature/<descricao>
```

**4. Abra um Pull Request** de `feature/<descricao>` → `develop`.

**5. Após aprovação e merge, delete a branch:**

```bash
git branch -d feature/<descricao>
git push origin --delete feature/<descricao>
```

---

### Fluxo de um Hotfix

Hotfixes partem da `main` e devem ser mergeados tanto em `main` quanto em `develop`:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/<descricao>

# ... correção ...

git add .
git commit -m "fix: descrição da correção urgente"
git push origin hotfix/<descricao>
```

Abra **dois PRs**: `hotfix/<descricao>` → `main` e `hotfix/<descricao>` → `develop`.

---

## Padrão de Commits

Os commits seguem o padrão **Conventional Commits**:

```
<tipo>(escopo opcional): mensagem curta no imperativo
```

### Tipos de Commit

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `docs` | Alterações em documentação |
| `style` | Formatação, espaços, ponto e vírgula (sem lógica) |
| `test` | Adição ou correção de testes |
| `chore` | Tarefas de build, configs, dependências |
| `perf` | Melhoria de performance |

### Exemplos

```bash
git commit -m "feat(auth): adiciona autenticação via JWT"
git commit -m "fix(users): corrige validação de e-mail duplicado"
git commit -m "docs: atualiza README com instruções de setup"
git commit -m "chore: atualiza dependências do requirements.txt"
git commit -m "refactor(views): extrai lógica de paginação para mixin"
```

> ✅ Use o imperativo: "adiciona", "corrige", "atualiza" — não "adicionado" ou "adicionando".
> ✅ Seja específico: descreva **o que** foi feito, não **como**.
> ❌ Evite: `git commit -m "fix"`, `git commit -m "alterações"`, `git commit -m "wip"`.

---

## Pull Requests

### Antes de Abrir um PR

- [ ] O código está funcionando localmente
- [ ] As migrações foram geradas (se necessário) — `python manage.py makemigrations`
- [ ] O `requirements.txt` está atualizado (se instalou novas libs)
- [ ] Não há conflitos com a branch de destino
- [ ] O título do PR segue o padrão de commits

### Regras Gerais

- PRs devem ser revisados por **ao menos 1 pessoa** antes do merge.
- PRs de `feature` e `fix` sempre apontam para `develop`.
- PRs de `hotfix` apontam para `main` **e** `develop`.
- PRs de `release` apontam para `main` **e** `develop`.
- Não faça merge do próprio PR sem revisão (exceto em casos autorizados).

---

## Resumo dos Comandos de Backend

|Ação|Comando|
|---|---|
| Atualizar branch develop | `git checkout develop && git pull origin develop` |
| Criar branch de feature | `git checkout -b feature/<descricao>` |
| Criar branch de fix | `git checkout -b fix/<descricao>` |
| Criar branch de hotfix | `git checkout -b hotfix/<descricao>` |
| Subir branch | `git push origin <nome-da-branch>` |
| Deletar branch local | `git branch -d <nome-da-branch>` |
| Deletar branch remota | `git push origin --delete <nome-da-branch>` |