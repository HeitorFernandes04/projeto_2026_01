# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: Portal de Autoagendamento (Web)

### 1.1 Use Case
**Nome:** Autoagendamento Público B2C

**Ator:** Cliente Final

**Descrição:** Permite que clientes finais acessem um link público exclusivo do estabelecimento para visualizar os serviços de lavagem oferecidos e iniciem o fluxo de agendamento diretamente pelo navegador do celular, sem necessidade de instalação de aplicativos.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-21** | Portal de Autoagendamento (Web) | Disponibilizar interface mobile-first acessível publicamente via link (`/agendar/:slug`) que apresente informações básicas do estabelecimento e liste seus serviços ativos. |
| **RF-21.1** | Resgate de Informações do Estabelecimento | A API deve buscar os dados via um identificador único (`slug` ou `uuid`) na URL. **Nota Técnica:** Será necessária uma *migration* no backend para adicionar este campo ao model `Estabelecimento` (evitando uso de `id` público). Retornar apenas `nome_fantasia` e `endereco_completo`. |
| **RF-21.2** | Listagem Segura de Serviços | A API deve retornar apenas os serviços com `is_active=True`, expondo estritamente o `id`, `nome`, `preco` e `duracao_estimada_minutos`. |
| **RF-21.3** | Interface Mobile-First | O desenvolvimento no frontend Angular deve focar primordialmente na visualização em dispositivos móveis (responsividade, touch-friendly), consumindo as diretrizes do `styles.scss` padrão do projeto. |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Isolamento de Dados (Segurança) | O endpoint público nunca deve expor dados internos do tenant (ex: faturamento, lista de funcionários ou e-mails administrativos). |
| **RNF-02** | Proteção contra Abuso (Rate Limiting) | A rota pública deve possuir limitação de requisições por IP para evitar scrapers e sobrecarga no banco de dados. |
| **RNF-03** | Usabilidade Web (Acessibilidade) | O carregamento da página deve ser rápido (< 2s) e os componentes visuais devem seguir práticas de acessibilidade (contraste alto e `aria-labels`). |

### 1.4 Endpoints RESTful
**Endpoint:** `/api/agendamento/estabelecimento/{slug}/`

- **Método:** `GET`
- **Camada:** `agendamento_publico.views.EstabelecimentoPublicoView` (Módulo dedicado ao portal de autoagendamento B2C)
- **Descrição:** Recupera os dados públicos do estabelecimento e seus serviços ativos para renderização do autoagendamento.
- **Requisição:** N/A (Path variable `slug`)
- **Resposta:**
  - Sucesso: `200 OK`
    ```json
    {
      "id": "uuid",
      "nome_fantasia": "Lava-Me Premium",
      "endereco": "Rua das Flores, 123",
      "servicos": [
        {
          "id": 1,
          "nome": "Lavagem Completa",
          "preco": 80.00,
          "duracao_estimada_minutos": 90
        }
      ]
    }
    ```
  - Falha: `404 Not Found` se o slug for inválido ou estabelecimento estiver inativo.

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O acesso ao link `/agendar/:slug` carrega corretamente os dados do lava-jato específico. |
| **CA-02** | Serviços inativos (`is_active=False`) não são retornados na chamada à API pública. |
| **CA-03** | Nenhum dado sensível do gestor, como e-mail ou dados de faturamento, é vazado na payload de resposta. |
| **CA-04** | A interface se adapta sem quebras visuais em telas com menos de `400px` de largura. |
| **CA-05** | Rate Limiting configurado no endpoint público, limitando requisições contínuas por IP (evitando sobrecarga). |
| **CA-06** | Se o estabelecimento não possuir serviços ativos, a API deve retornar a lista vazia `[]` e a interface deve exibir um *Empty State* amigável. |
| **CA-07** | O botão de "Continuar" no frontend (CTA) deve iniciar estritamente desabilitado, sendo habilitado apenas após a seleção de um serviço. |

---

## 2. Testes Esperados

### 2.1 Teste 1: Consulta pública de estabelecimento válido
**Descrição:** Fazer um `GET` no endpoint `/api/agendamento/estabelecimento/{slug}/` de um lava-jato ativo.
**Esperado:**
- Resposta HTTP: `200 OK`
- A payload deve conter `nome_fantasia` e a lista em `servicos`, mas não pode conter chaves sensíveis como `cnpj`, `usuario_dono` ou métricas financeiras.

### 2.2 Teste 2: Ocultação de serviços inativos
**Descrição:** O gestor inativa a "Higienização Interna" via área logada. Ao chamar o endpoint público, o serviço não deve aparecer.
**Esperado:**
- Resposta HTTP: `200 OK`
- A lista de `servicos` não deve conter o item com `is_active=False`.

### 2.3 Teste 3: Acesso a estabelecimento inexistente ou inválido
**Descrição:** Tentar acessar o endpoint passando um slug que não existe no banco de dados.
**Esperado:**
- Resposta HTTP: `404 Not Found`
- Mensagem: "Estabelecimento não encontrado ou indisponível para agendamentos."

### 2.4 Teste 4: Limite de Requisições Excedido (Rate Limiting)
**Descrição:** Simular múltiplas requisições sequenciais disparadas do mesmo IP (comportamento de bot/scraper).
**Esperado:**
- Resposta HTTP: `429 Too Many Requests`
- Mensagem informando que o limite de requisições foi atingido.

### 2.5 Teste 5: Empty State (Lava-Jato sem serviços)
**Descrição:** Acessar o link de um estabelecimento que inativou temporariamente todos os seus serviços.
**Esperado:**
- Resposta HTTP: `200 OK` (O estabelecimento existe).
- A lista de `servicos` retorna vazia `[]`. A interface do frontend exibe a mensagem de *Empty State*: "Nenhum serviço disponível no momento".

### 2.6 Teste 6: Frontend - Bloqueio de submissão sem serviço
**Descrição:** O usuário entra na página inicial e tenta clicar no botão "Continuar" sem ter selecionado um serviço da lista.
**Esperado:**
- O botão (CTA) deve renderizar com o atributo estático/nativo `disabled`, impedindo o evento de clique e envio para a tela 2.

---

## 3. Esboço de Usabilidade (Wireframes B2C - Sprint 3)
Abaixo está o detalhamento de campos e elementos visuais das telas que compõem a jornada do cliente, servindo como base para as RFs 21 a 26. A abordagem é estritamente **Mobile-First**.

### Tela 1: Portal Inicial & Seleção de Serviços (RF-21)
**Objetivo:** Mostrar credibilidade e permitir a escolha do que será feito.
- **Cabeçalho:** 
  - Nome Fantasia do Lava-Jato (ex: "Lava-Me Premium").
  - Endereço completo (com ícone de mapa).
- **Corpo da Tela:**
  - Título: "O que seu veículo precisa hoje?"
  - **Lista de Cards de Serviços:**
    - Nome do serviço em destaque (ex: "Lavagem Completa").
    - Preço formatado (ex: "R$ 80,00").
    - Tempo estimado com ícone de relógio (ex: "⏱ 90 min").
    - Checkbox ou botão de rádio para seleção (apenas um por vez).
- **Rodapé Fixo (Sticky):** 
  - Botão de ação principal: "Continuar" (Habilitado apenas após seleção).

### Tela 2: Disponibilidade de Horários (RF-22)
**Objetivo:** Evitar overbooking cruzando a duração do serviço com a agenda.
- **Cabeçalho:** Resumo da escolha (ex: "Lavagem Completa - 90 min").
- **Corpo da Tela:**
  - **Seletor de Data:** Carrossel horizontal de datas úteis (próximos 7 dias).
  - Título: "Escolha um horário livre"
  - **Grid de Blocos de Tempo (Chips):**
    - Horários gerados pela API, como `09:00`, `10:30`, `14:00`.
    - Os botões de horário ocupado sequer devem ser renderizados ou aparecerem bloqueados (disabled/cinza).
- **Rodapé Fixo (Sticky):**
  - Botão "Voltar".
  - Botão principal: "Confirmar Horário" (Habilitado ao selecionar).

### Tela 3: Checkout Integrado B2C (RF-23)
**Objetivo:** Coleta mínima de dados (sem burocracia de senha) para o check-in no pátio.
- **Resumo do Pedido:** 
  - Data, Horário, Serviço, Valor Total.
- **Sessão: "Sobre o seu Veículo"**
  - Placa (Input com máscara ou teclado alfanumérico).
  - Modelo (Texto simples, ex: "Civic Branco").
- **Sessão: "Seus Dados (Para te avisarmos)"**
  - Nome completo ou Apelido.
  - WhatsApp (Input numérico com máscara `(99) 99999-9999`).
- **Rodapé:** 
  - Botão principal: "Agendar Lavagem" (Trigga a RF-23 para criação de cliente/veículo e OS).

### Tela 4: Painel do Cliente e Transparência (RF-24, RF-25, RF-26)
**Objetivo:** Autoatendimento pós-venda. Acesso via link seguro ou autenticação leve (OTP por WhatsApp/Email).
- **Visão Geral (Meus Veículos):**
  - Lista de carros já cadastrados pelo cliente (RF-25).
- **Card do Agendamento Atual:**
  - Placa, Data, Hora, Serviço.
  - **Status:** "Na Fila (Pátio)", "Em Execução", ou "Finalizado".
  - Se status for `PATIO`: Exibir botão vermelho secundário **"Cancelar Agendamento"** (RF-24).
- **Galeria de Transparência (RF-26):**
  - Se status for `FINALIZADO`: 
    - Botão principal: **"Ver Resultado (Fotos)"**.
    - Ao clicar, abre modal/tela com as fotos do estado final da limpeza e o "Laudo Técnico" deixado pelo operador. As fotos de incidentes/avarias ficam estritamente ocultas.
