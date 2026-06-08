# 📱 Manual de Execução e Teste do WhatsApp OTP Local (AI-Ready)

Este documento descreve o padrão técnico validado para levantar o ambiente local do gateway de WhatsApp (Evolution API) no projeto Lava-Me.

## Contexto Arquitetural

A Evolution API roda **nativamente no Windows via Node.js** — sem Docker, sem WSL2. Isso foi uma decisão deliberada para escapar dos timeouts e instabilidades do engine Linux do Docker Desktop no ambiente de desenvolvimento local.

O banco de dados PostgreSQL da Evolution também roda **nativamente na máquina**, isolado do banco principal do Django:

| Serviço | Porta | Usuário | Senha | Banco |
|---|---|---|---|---|
| **Django** (banco principal) | `5432` | — | — | SQLite local |
| **Evolution API** (banco mensageria) | `5433` | `postgres` | `evolution_pass_local` | `evolution_prod` |

> ⚠️ **Importante**: A pasta `evolution-api/` possui seu próprio `package.json` independente. O `npm install` da raiz do projeto **não instala** as dependências dela. É obrigatório entrar na pasta e rodar separadamente — conforme abaixo.

---

## 🛠️ Passo a Passo de Execução

Você precisará de **3 terminais abertos**, todos partindo da raiz do projeto (`projeto_2026_01`). A ordem importa.

---

### 🖥️ Terminal 1 — Evolution API (Gateway do WhatsApp)

O PostgreSQL já está rodando nativamente na porta `5433`. Basta iniciar a API:

```powershell
cd evolution-api

# Apenas na primeira vez (ou quando houver mudanças no package.json):
npm install
npm run db:generate
npx prisma db push --schema ./prisma/postgresql-schema.prisma

# Sempre que quiser iniciar:
npm run start
```

> Aguarde a mensagem de que o servidor está escutando na porta `8080`. A Evolution API estará disponível em `http://localhost:8080`. **Mantenha esse terminal aberto durante todos os testes.**

---

### 🌐 Passo Manual — Conectar o WhatsApp no Navegador

> ⚠️ **Este passo é manual e obrigatório.** Não pode ser automatizado pois envolve scan de QR Code com celular físico.

1. Certifique-se de que a Evolution API está rodando (Terminal 1 ativo).
2. Abra no navegador: **`http://localhost:8080/manager`**
3. Faça login com a API Key definida no arquivo `evolution-api/.env`:
   - Variável: `AUTHENTICATION_API_KEY`
   - Valor padrão de dev: `sua_chave_secreta_aqui`
4. Crie uma instância com o nome exato: **`sua_instancia`**
   - ⚠️ Esse nome é o que o backend Django espera. Não altere sem mudar a variável `EVOLUTION_INSTANCE_NAME` no `.env` da raiz.
5. Clique no ícone de **QR Code** ao lado da instância criada.
6. No celular: abra o **WhatsApp → Aparelhos Conectados → Conectar um aparelho** → escaneie o QR Code exibido na tela.
7. ✅ Quando o status mudar para **"Connected"** no manager, o WhatsApp está pareado e pronto.

> **Nota para IAs**: Como alternativa ao Manager visual, a requisição `POST /instance/create` com o corpo `{"instanceName": "sua_instancia", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}` e o header `apikey: sua_chave_secreta_aqui` retornará o QR Code em Base64 na resposta. O QR Code também é impresso nos logs do processo Node.js ativo (`npm run start`). Use essa alternativa para ambientes headless ou CI.

---

### 🖥️ Terminal 2 — Backend Django

Com o gateway de mensageria online, levante o backend responsável pelos disparos:

```powershell
# Ativa o ambiente virtual (Windows PowerShell):
venv\Scripts\Activate.ps1

# Ou Windows CMD:
# venv\Scripts\activate

cd backend
python manage.py runserver
```

> O backend estará disponível em `http://localhost:8000`. Ele se comunica com a Evolution API local usando `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE_NAME` definidos no `.env` da raiz do projeto.

---

### 🖥️ Terminal 3 — Frontend do Cliente (App B2C)

Para testar a experiência real de recebimento de OTP pelo cliente:

```powershell
cd mobile-cliente

# Apenas na primeira vez:
npm install

# Sempre que quiser iniciar:
npm run dev
```

> O app do cliente estará disponível em `http://localhost:5174`.

---

### ✅ Teste Final — OTP via WhatsApp

1. Acesse `http://localhost:5174` no navegador.
2. Navegue até a tela de login ou agendamento.
3. Informe um número de telefone válido (preferencialmente o mesmo celular pareado).
4. Conclua o fluxo → você receberá o OTP de 4 dígitos via **mensagem de WhatsApp**, disparado nativamente pelo seu próprio PC. 🎉

---

## 📊 Resumo — Terminais e URLs

| Terminal | O que faz | Comando principal | URL |
|---|---|---|---|
| **1** | Gateway WhatsApp | `cd evolution-api && npm run start` | `http://localhost:8080` |
| **Manual** | Parear WhatsApp | Abrir no navegador e escanear QR Code | `http://localhost:8080/manager` |
| **2** | Backend Django | `cd backend && python manage.py runserver` | `http://localhost:8000` |
| **3** | App do Cliente | `cd mobile-cliente && npm run dev` | `http://localhost:5174` |

---

## ⚠️ Avisos Importantes

- **Sem Docker**: O banco da Evolution API e a própria API rodam nativamente. Não é necessário rodar `docker-compose` para o ambiente de desenvolvimento local.
- **`npm install` da raiz não instala a `evolution-api`**: ela é um projeto Node.js independente. Sempre instale dentro de `cd evolution-api` antes do primeiro uso.
- **Ordem dos terminais importa**: a Evolution API (Terminal 1) deve estar rodando e com o WhatsApp pareado ANTES de subir o Django (Terminal 2).
- **QR Code expira**: se demorar muito para escanear, o QR Code expira. Basta clicar novamente no ícone de QR no manager para gerar um novo.
- **Credenciais do banco da Evolution** (apenas para referência — já configurado no `evolution-api/.env`):
  - Host: `localhost`, Porta: `5433`, Usuário: `postgres`, Senha: `evolution_pass_local`, Banco: `evolution_prod`
