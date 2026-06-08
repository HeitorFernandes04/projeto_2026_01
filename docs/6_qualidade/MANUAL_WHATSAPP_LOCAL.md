# 📱 Manual de Execução e Teste do WhatsApp OTP Local (AI-Ready)

Este documento descreve o padrão técnico atualizado e validado para levantar o ambiente local do gateway de WhatsApp (Evolution API) contornando os limites de performance e corrupção de rede do WSL2 no Windows.

**Contexto**: O ecossistema de envio de WhatsApp exige a execução nativa do Node.js para o serviço Evolution API, ao invés da containerização completa com Docker, melhorando drasticamente a velocidade e confiabilidade. O banco de dados PostgreSQL exclusivo da Evolution deve ser subido em um container isolado (porta 5433).

> ⚠️ **Importante**: A pasta `evolution-api/` possui seu próprio `package.json` independente. O `npm install` da raiz do projeto **não instala** as dependências dela. É obrigatório rodar `npm install` dentro da pasta `evolution-api/` separadamente — conforme descrito abaixo.

---

## 🛠️ Passo a Passo de Execução

Você precisará de **4 terminais abertos**, todos partindo da raiz do projeto (`projeto_2026_01`).

A ordem de execução importa: siga rigorosamente a sequência abaixo.

---

### 🖥️ Terminal 1 — Banco de Dados da Evolution API

Sobe o PostgreSQL isolado na porta `5433` (separado do banco Django, que usa a porta padrão `5432`).

```powershell
docker-compose -f docker-compose.db.yml up -d
```

> Este comando usa o arquivo `docker-compose.db.yml` na raiz do projeto. O container se chama `db-evolution-native` e usa as credenciais `postgres/postgres` com banco `evolution_db`. Ele roda em background — basta executar uma vez.

---

### 🖥️ Terminal 2 — Evolution API (Gateway do WhatsApp)

Instala as dependências e inicia a API nativamente no Windows.

```powershell
cd evolution-api

# Apenas na primeira vez (ou quando houver mudanças no package.json):
npm install
npm run db:generate
npx prisma db push --schema ./prisma/postgresql-schema.prisma

# Sempre que quiser iniciar:
npm run start
```

> Aguarde a mensagem de que o servidor está escutando na porta `8080`. A evolution-api estará disponível em `http://localhost:8080`. **Mantenha esse terminal aberto durante todos os testes.**

---

### 🌐 Passo Manual — Conectar o WhatsApp no Navegador

> ⚠️ **Este passo é manual e obrigatório.** Não pode ser automatizado pois envolve scan de QR Code com celular físico.

1. Certifique-se de que a Evolution API está rodando (Terminal 2 ativo).
2. Abra no navegador: **`http://localhost:8080/manager`**
3. Faça login com a API Key definida no arquivo `evolution-api/.env`:
   - Variável: `AUTHENTICATION_API_KEY`
   - Valor padrão de dev: `sua_chave_secreta_aqui`
4. Crie uma instância com o nome exato: **`sua_instancia`**
   - ⚠️ Esse nome é o que o backend Django espera. Não altere sem mudar a configuração correspondente no `.env` do backend.
5. Clique no ícone de **QR Code** ao lado da instância criada.
6. No celular: abra o **WhatsApp → Aparelhos Conectados → Conectar um aparelho** → escaneie o QR Code exibido na tela.
7. ✅ Quando o status mudar para **"Connected"** no manager, o WhatsApp está pareado e pronto.

> **Nota para IAs**: Como alternativa ao Manager visual, a requisição `POST /instance/create` com o corpo `{"instanceName": "sua_instancia", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}` e o header `apikey: sua_chave_secreta_aqui` retornará o QR Code em Base64 na resposta. O QR Code também é impresso nos logs do processo Node.js ativo (`npm run start`). Use essa alternativa para ambientes headless ou CI.

---

### 🖥️ Terminal 3 — Backend Django

Com o gateway de mensageria online, levante o backend responsável pelos disparos.

```powershell
# Ativa o ambiente virtual (Windows PowerShell):
venv\Scripts\Activate.ps1

# Ou Windows CMD:
# venv\Scripts\activate

cd backend
python manage.py runserver
```

> O backend estará disponível em `http://localhost:8000`. Ele se comunica com a Evolution API local usando a `AUTHENTICATION_API_KEY` e a instância `sua_instancia` configuradas no `.env` da raiz.

---

### 🖥️ Terminal 4 — Frontend do Cliente (App B2C)

Para testar a experiência real de recebimento de OTP pelo cliente.

```powershell
cd mobile-cliente

# Apenas na primeira vez:
npm install

# Sempre que quiser iniciar:
npm run dev
```

> O app do cliente estará disponível em `http://localhost:5174`.

---

### ✅ Passo 5 — Teste de Pista Real (OTP via WhatsApp)

1. Acesse `http://localhost:5174` no navegador.
2. Navegue até a tela de login ou agendamento.
3. Informe um número de telefone válido (preferencialmente o mesmo celular pareado no passo anterior, ou outro número).
4. Conclua o fluxo → você receberá o OTP de 4 dígitos via **mensagem de WhatsApp**, disparado nativamente pelo seu próprio PC através da instância `sua_instancia` conectada. 🎉

---

## 📊 Resumo — Terminais e URLs

| Terminal | O que faz | Comando principal | URL |
|---|---|---|---|
| **1** | Banco da Evolution | `docker-compose -f docker-compose.db.yml up -d` | — |
| **2** | Gateway WhatsApp | `cd evolution-api && npm run start` | `http://localhost:8080` |
| **Manual** | Parear WhatsApp | Abrir no navegador e escanear QR Code | `http://localhost:8080/manager` |
| **3** | Backend Django | `cd backend && python manage.py runserver` | `http://localhost:8000` |
| **4** | App do Cliente | `cd mobile-cliente && npm run dev` | `http://localhost:5174` |

---

## ⚠️ Avisos Importantes

- **`npm install` da raiz não instala a `evolution-api`**: ela é um projeto Node.js independente com seu próprio `package.json`. Sempre instale dentro de `cd evolution-api` antes do primeiro uso.
- **Ordem dos terminais importa**: a Evolution API (Terminal 2) deve estar rodando ANTES de subir o Django (Terminal 3), pois o backend tentará se conectar ao gateway na inicialização de algumas features.
- **Porta 5433 vs 5432**: o banco da Evolution usa a porta `5433` no host para não colidir com o PostgreSQL do Django (porta `5432`). Ambos podem coexistir sem conflito.
- **QR Code expira**: se demorar muito para escanear, o QR Code expira. Basta clicar novamente no ícone de QR no manager para gerar um novo.
