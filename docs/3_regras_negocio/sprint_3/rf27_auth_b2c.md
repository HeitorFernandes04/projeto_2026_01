# 1. Funcionalidade: RF-27 Autenticacao B2C por Telefone e PIN

## 1.1 Use Case
- **Nome:** Login do Cliente Web (B2C)
- **Ator:** Cliente Final
- **Descricao:**  
Permite que o cliente acesse o painel web usando apenas telefone e PIN de 4 digitos, sem depender de e-mail ou cookies. A autenticacao deve retornar tokens JWT no corpo da resposta REST, permitindo uso imediato no portal Web e compatibilidade futura com aplicativo Mobile.

---

## 1.2 Avaliacao do Projeto Atual

| Area | Situacao | Avaliacao |
|------|----------|-----------|
| App B2C | Implementado | O app `agendamento_publico` concentra as regras publicas e B2C. A RF-27 foi implementada nele, sem criacao de novo app. |
| Usuario Django | Pronto para o escopo | O model `accounts.User` possui `email` unico e `username`, permitindo o uso de e-mail fantasma e prefixo `b2c_`. |
| Perfil Cliente | Pronto para o escopo | Ja existe `accounts.Cliente` com vinculo one-to-one com `User` e campo `telefone_whatsapp`. |
| Veiculo | Pronto para validacao | `core.Veiculo` possui `placa` e `celular_dono`, campos necessarios para comprovar titularidade no setup. |
| Autoagendamento | Integrado | Apos checkout publico, o Web direciona o cliente para o setup de PIN com placa e telefone preenchidos. |
| JWT | Implementado | Setup e login B2C retornam `access` e `refresh` via SimpleJWT no body da resposta. |
| Painel Cliente Web | Implementado com fallback | O painel consome `/api/cliente/painel/` e mantem fallback mockado para ambiente sem dados reais. |
| Historico Cliente | Implementado no painel | O endpoint `/api/cliente/painel/` retorna ordens ativas e historico filtrados pela titularidade atual. |
| Testes Canonicos | Implementados | A cobertura B2C foi adicionada em `backend/agendamento_publico/tests/test_api.py` e `test_services.py`. |

---

## 1.3 Requisitos Funcionais (RFs)

| Numero  | Requisito                      | Descricao                                                                                  |
|---------|--------------------------------|--------------------------------------------------------------------------------------------|
| RF-27.1 | Setup Inicial do Cliente       | Cliente cria seu primeiro PIN informando telefone, placa e PIN de 4 digitos.               |
| RF-27.2 | Prova de Titularidade          | Backend valida se existe `Veiculo` com a combinacao exata de `placa` e `celular_dono`.     |
| RF-27.3 | E-mail Fantasma                | Backend cria o usuario com e-mail tecnico no formato `[telefone]@cliente.lava.me`.         |
| RF-27.4 | Isolamento B2C                 | Backend cria o usuario com `username=b2c_[telefone]` para evitar colisao com funcionarios. |
| RF-27.5 | Criacao de Perfil Cliente      | Backend cria ou vincula `Cliente` ao usuario B2C, preenchendo `telefone_whatsapp`.         |
| RF-27.6 | Login por Telefone e PIN       | Cliente autenticado acessa o sistema usando apenas telefone e PIN.                         |
| RF-27.7 | Emissao de JWT RESTful         | Setup e login retornam `{ access, refresh }` no body da resposta, sem depender de cookies. |
| RF-27.8 | Bloqueio de Sobrescrita        | Nova chamada de setup para usuario B2C ja existente retorna `409 Conflict`.                |
| RF-27.9 | Login Cliente no Web           | Web deve oferecer fluxo separado do login de gestor, usando telefone/PIN.                  |
| RF-27.10 | Painel com Dados Reais        | Painel cliente deve consumir API protegida por JWT e exibir apenas dados do cliente logado. |

---

## 1.4 Requisitos Nao Funcionais (RNFs)

| Numero | Requisito                  | Descricao                                                                                  |
|--------|----------------------------|--------------------------------------------------------------------------------------------|
| RNF-01 | Prevenção de IDOR          | Setup e painel devem filtrar por titularidade, nunca apenas por placa ou ID publico.       |
| RNF-02 | Protecao contra Brute Force | Rotas de setup e login devem ter rate limiting restrito para PIN de 4 digitos.             |
| RNF-03 | Separacao B2B vs B2C       | Login de cliente nao pode sobrescrever senha, perfil ou permissoes de gestor/funcionario.  |
| RNF-04 | Mobile-Ready               | Autenticacao deve ser 100% RESTful, com token no JSON para uso em Web e SecureStorage.     |
| RNF-05 | Privacy by Design          | Cliente autenticado deve acessar somente suas OSs, veiculos e midias permitidas.           |
| RNF-06 | Baixo Atrito               | O cliente nao deve informar e-mail em nenhum ponto do fluxo B2C.                           |

---

## 1.5 Endpoints RESTful

### Endpoint: `/api/cliente/auth/setup/`
- **Metodo:** POST  
- **Camada:** `agendamento_publico.views.AuthB2CSetupView`  
- **Descricao:** Cria o primeiro acesso do cliente, validando telefone e placa contra a tabela de veiculos.
- **Request Body:**
```json
{
  "telefone": "11999999999",
  "placa": "ABC1234",
  "pin": "1234"
}
```
- **Respostas:**
  - `201 Created`: setup concluido e tokens JWT retornados.
  - `404 Not Found`: combinacao de placa e telefone nao encontrada.
  - `409 Conflict`: usuario B2C ja possui PIN cadastrado.
  - `429 Too Many Requests`: limite de tentativas excedido.

### Endpoint: `/api/cliente/auth/token/`
- **Metodo:** POST  
- **Camada:** `agendamento_publico.views.AuthB2CLoginView`  
- **Descricao:** Autentica cliente recorrente usando telefone e PIN.
- **Request Body:**
```json
{
  "telefone": "11999999999",
  "pin": "1234"
}
```
- **Respostas:**
  - `200 OK`: autenticacao bem sucedida e tokens JWT retornados.
  - `401 Unauthorized`: telefone ou PIN incorretos.
  - `429 Too Many Requests`: limite de tentativas excedido.

### Endpoint: `/api/cliente/painel/`
- **Metodo:** GET  
- **Camada:** API de painel do cliente autenticado  
- **Descricao:** Retorna ordens ativas e historico do cliente logado, filtrando por perfil `Cliente`.

---

# 2. Funcionalidade: Fluxo Web do Cliente

## 2.1 Requisitos de Experiencia
O portal web deve separar claramente o acesso do cliente do acesso do gestor. O login atual de gestao deve continuar usando e-mail/senha, enquanto o cliente deve acessar o painel pelo fluxo de telefone/PIN.

- **Login Gestao:** permanece em `/login`, usando `/api/auth/login/`.
- **Login Cliente:** deve usar rota propria no contexto B2C, por exemplo `/agendar/:slug/cliente/login`.
- **Setup Cliente:** pode ocorrer no primeiro acesso ou apos sucesso do autoagendamento.
- **Token:** salvo no `localStorage` no Web, com a mesma estrutura usada pelo AuthService atual.
- **Painel:** apos autenticar, redireciona para `/agendar/:slug/painel`.

---

## 2.2 Requisitos Funcionais Web

| Numero  | Requisito                    | Descricao                                                                                  |
|---------|------------------------------|--------------------------------------------------------------------------------------------|
| RF-27.11 | Tela de Login B2C           | Criar tela de entrada por telefone e PIN, mobile-first e separada da gestao.               |
| RF-27.12 | Tela de Setup B2C           | Criar fluxo de primeiro acesso com placa, telefone, PIN e confirmacao de PIN.              |
| RF-27.13 | Guard de Cliente            | Proteger painel cliente exigindo JWT valido e perfil `CLIENTE`.                            |
| RF-27.14 | Integracao com Autoagendamento | Apos checkout publico, permitir criacao de PIN usando placa e telefone recem-cadastrados. |
| RF-27.15 | Logout Cliente              | Remover token do armazenamento local e retornar ao contexto publico da unidade.            |

---

# 3. Modelagem e Implementacao Necessaria

## 3.1 Backend
- `agendamento_publico` foi adicionado em `INSTALLED_APPS`.
- `AuthB2CSetupSerializer` e `AuthB2CLoginSerializer` foram criados em `backend/agendamento_publico/serializers.py`.
- `AuthB2CService` foi criado em `backend/agendamento_publico/services.py`, concentrando regra de criacao, validacao e emissao de tokens.
- `AuthB2CSetupView`, `AuthB2CLoginView` e `PainelClienteView` foram criadas em `backend/agendamento_publico/views.py`.
- As rotas B2C foram isoladas em `backend/agendamento_publico/cliente_urls.py` e expostas por `path('api/cliente/', include(...))`.
- `AuthB2CRateThrottle`, baseado em `AnonRateThrottle`, foi criado com limite restrito para setup/login B2C.
- O endpoint real `/api/cliente/painel/` foi criado para alimentar o painel e integrar com a RF-25.

## 3.2 Frontend Web
- `AuthB2CService` foi criado para `/api/cliente/auth/setup/` e `/api/cliente/auth/token/`.
- O login de cliente foi separado do login de gestao.
- `clienteAuthGuard` protege o painel exigindo perfil `CLIENTE`.
- O painel cliente consome `/api/cliente/painel/`.
- O fallback mockado foi mantido para ambiente de demonstracao ou ausencia de dados reais.
- O login de gestor/funcionario foi preservado sem alteracao de contrato.

## 3.3 Observacao de Modelagem
- Nao houve migration nesta RF.
- A titularidade atual do painel cliente e do setup B2C usa `Veiculo.celular_dono` normalizado.
- O padrao `Veiculo.cliente_id` permanece como evolucao futura recomendada para uma RF propria, caso a equipe queira trocar o vinculo por telefone por um vinculo relacional direto.

---

# 4. Testes de Qualidade e Seguranca

## 4.1 Teste de Primeiro Acesso com Sucesso
- **Acao:** Cliente faz setup com placa e telefone existentes no `Veiculo`.
- **Esperado:** API retorna `201 Created`, cria `User` com `username=b2c_[telefone]`, cria `Cliente` e retorna JWT.

## 4.2 Teste de Login com Credenciais Validas
- **Acao:** Cliente ja cadastrado faz login com telefone e PIN corretos.
- **Esperado:** API retorna `200 OK` com `access` e `refresh`.

## 4.3 Teste de Prevenção de IDOR
- **Acao:** Cliente tenta fazer setup usando seu telefone com placa de outro cliente.
- **Esperado:** API retorna `404 Not Found` e nao cria usuario.

## 4.4 Teste de Rate Limiting
- **Acao:** Atacante faz 6 tentativas seguidas de login com PIN incorreto.
- **Esperado:** API retorna `429 Too Many Requests` ao exceder o limite definido.

## 4.5 Teste de Colisao B2B vs B2C
- **Acao:** Ja existe funcionario com `username=11999999999`; cliente com mesmo telefone faz setup.
- **Esperado:** Sistema cria `username=b2c_11999999999` e nao altera senha/permissoes do funcionario.

## 4.6 Teste de Bloqueio de Account Takeover
- **Acao:** Conta `b2c_11999999999` ja existe; alguem chama `/setup/` novamente com novo PIN.
- **Esperado:** API retorna `409 Conflict` e preserva a senha atual.

## 4.7 Teste do Painel Cliente Autenticado
- **Acao:** Cliente autenticado acessa `/api/cliente/painel/`.
- **Esperado:** API retorna apenas OSs vinculadas ao cliente logado, sem dados internos da unidade.
