# 📱 Manual de Execução e Teste do WhatsApp OTP Local (AI-Ready)

Este documento descreve o padrão técnico atualizado e validado para levantar o ambiente local do gateway de WhatsApp (Evolution API) contornando os limites de performance e corrupção de rede do WSL2 no Windows.

**Contexto**: O ecossistema de envio de WhatsApp exige a execução nativa do Node.js para o serviço Evolution API, ao invés da containerização completa com Docker, melhorando drasticamente a velocidade e confiabilidade. O banco de dados PostgreSQL exclusivo da Evolution deve ser subido em um container isolado (porta 5433).

---

## 🛠️ Passo a Passo de Execução

### Passo 1: Subir o PostgreSQL Isolado e a Evolution API Nativa
Para evitar colisão de portas e sobrecarga no Docker:
1. Levante o banco de dados via container utilizando o manifesto dedicado:
   ```powershell
   docker-compose -f docker-compose.db.yml up -d
   ```
   *(O arquivo `docker-compose.db.yml` configura o banco na porta host `5433` com as credenciais padrão de desenvolvimento).*

2. Acesse a pasta `evolution-api`, instale dependências e sincronize o Prisma com o banco recém-criado:
   ```powershell
   cd evolution-api
   npm install
   npm run db:generate
   npx prisma db push --schema ./prisma/postgresql-schema.prisma
   ```

3. Inicie a API de forma nativa no Windows:
   ```powershell
   npm run start
   ```
   *(A API subirá na porta local `8080` de forma super responsiva).*

### Passo 2: Pareamento do WhatsApp via Manager Visual
Para escanear o QR Code de forma limpa e simples:
1. Certifique-se de que no `.env` da pasta `evolution-api`, os parâmetros do manager estão ativados.
2. Abra o painel administrativo no seu navegador: `http://localhost:8080/manager`
3. Crie a sua instância de trabalho (por padrão o backend Django utiliza `sua_instancia`) e clique no ícone para exibir o **QR Code** renderizado na tela.
4. Escaneie pelo WhatsApp usando "Aparelhos Conectados".

> **Nota para IAs**: Alternativamente, a requisição `POST /instance/create` com o corpo `{"instanceName": "sua_instancia", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}` retornará o Base64 na resposta. O QR Code também é impresso nos logs do processo ativo do Node.js (`npm run start`).

### Passo 3: Iniciar o Backend (Django)
Com o gateway de mensageria 100% online, levante o backend que efetuará os disparos:
1. Em um novo terminal, ative seu ambiente virtual.
2. Entre na pasta `backend` e rode o servidor:
   ```powershell
   cd backend
   python manage.py runserver
   ```
   *(O backend se comunicará com o Evolution local usando as chaves `AUTHENTICATION_API_KEY` e a instância default configurada).*

### Passo 4: Iniciar o Frontend do Cliente
Para testar a experiência real de recebimento do cliente:
1. Em um novo terminal, suba a aplicação:
   ```powershell
   cd frontend/mobile-cliente
   npm run dev
   ```

### Passo 5: Teste de Pista Real (Checkout / Login)
1. Acesse o sistema pelo navegador na URL do Vite (ex: `http://localhost:5173`).
2. Acesse a área de login/agendamento de serviços e informe um número telefônico válido.
3. Finalize a requisição. Você receberá o OTP de 4 dígitos fisicamente via mensagem de WhatsApp no número indicado, disparado nativamente pelo seu próprio PC através da `sua_instancia` conectada!
