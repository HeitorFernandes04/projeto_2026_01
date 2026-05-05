# Implementação de Autenticação B2C por Telefone e PIN

## Resumo

Esta PR adiciona o fluxo de autenticação B2C para clientes finais, permitindo acesso ao painel do cliente usando telefone e PIN de 4 dígitos.

A implementação é RESTful, baseada em JWT, sem dependência de cookies ou e-mail informado pelo cliente. O login B2C fica separado do login de gestor/funcionário, preservando os fluxos administrativos existentes.

Também foram atualizadas as documentações do projeto para refletir os novos endpoints, a estratégia de titularidade atual e o estado da autenticação B2C no Web e Backend.

---

## Principais Mudanças

### Backend

- Implementado fluxo de primeiro acesso do cliente.
- Validação de telefone + placa contra o veículo existente.
- Criação de usuário B2C com `username=b2c_[telefone]`.
- Geração de e-mail técnico automático no formato `[telefone]@cliente.lava.me`.
- Criação de perfil `Cliente`.
- Emissão de tokens JWT (`access` e `refresh`) no body da resposta.
- Implementado login recorrente por telefone + PIN.
- Implementado endpoint de painel do cliente autenticado.
- Aplicado throttle restrito para setup/login B2C.
- Adicionadas proteções contra:
  - colisão entre contas B2B e B2C;
  - sobrescrita de PIN via setup repetido;
  - IDOR por combinação inválida de placa + telefone.

### Frontend Web

- Criada tela dedicada para login/setup do cliente.
- Login B2C separado do acesso de gestor/funcionário.
- Implementado guard específico para painel cliente, exigindo perfil `CLIENTE`.
- Painel do cliente passou a consumir API real.
- Mantido fallback mockado para ambientes sem dados reais.
- Fluxo pós-autoagendamento redireciona para criação de PIN com placa e telefone pré-preenchidos.
- Login de gestor/funcionário permanece preservado em `/login`.

---

## Endpoints Adicionados

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/cliente/auth/setup/` | Primeiro acesso / criação de PIN |
| `POST` | `/api/cliente/auth/token/` | Login recorrente por telefone + PIN |
| `GET` | `/api/cliente/painel/` | Painel do cliente autenticado |

---

## Arquitetura

A implementação foi mantida no app existente `agendamento_publico`, sem criação de novo app Django.

As regras de domínio foram centralizadas em `services.py`, mantendo as views DRF enxutas e responsáveis apenas por validar entrada, delegar execução e retornar respostas HTTP.

As rotas B2C foram isoladas em:

```text
backend/agendamento_publico/cliente_urls.py
```

E expostas pelo projeto em:

```text
/api/cliente/
```

---

## Modelagem

Esta implementação não altera a estrutura do banco de dados.

Não foram criadas migrations.

A titularidade atual do cliente é resolvida pela relação entre telefone do perfil cliente e telefone do veículo:

```text
Cliente.telefone_whatsapp <-> Veiculo.celular_dono
```

O vínculo relacional direto, como `Veiculo.cliente_id`, permanece como evolução futura caso o projeto decida formalizar a titularidade por chave estrangeira.

---

## Documentação Atualizada

Foram atualizados os seguintes documentos:

- `docs/4_api/ENDPOINTS.md`
- `docs/3_regras_negocio/sprint_3/auth_b2c.md`
- `docs/3_regras_negocio/sprint_3/sprint3-TRILHA-3.md`

As documentações agora refletem:

- novos endpoints B2C;
- separação entre login de cliente e login de gestão;
- estratégia atual de titularidade por telefone normalizado;
- ausência de alteração estrutural no banco;
- evolução futura recomendada para vínculo direto entre `Veiculo` e `Cliente`.

---

## Checklist

- [x] Backend B2C implementado.
- [x] Frontend Web B2C implementado.
- [x] Login gestor preservado.
- [x] Painel cliente integrado com API real.
- [x] Fallback mockado mantido no painel cliente.
- [x] Documentação atualizada.
- [x] Sem migrations.
- [x] Throttle de segurança configurado.

