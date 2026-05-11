# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: RF-29 - Portal do Cliente: Jornada e Checkout

### 1.1 Use Case
**Nome:** Fluxo de Conversão e Acompanhamento RT (B2C)

**Ator:** Cliente Final

**Descrição:** O cliente realiza o login simplificado, cadastra seu veículo, finaliza o agendamento de um serviço e acompanha o progresso da lavagem em tempo real através de uma barra de progresso.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-29.1** | Autenticação B2C (OTP) | Login via número de WhatsApp com envio de código PIN. Geração automática de "email fantasma" para compatibilidade com o sistema de autenticação Django. |
| **RF-29.2** | Cadastro de Veículos | Formulário simplificado (Placa, Modelo, Marca, Cor) integrado ao perfil do cliente. |
| **RF-29.3** | Fluxo de Checkout | Escolha de horário disponível e criação da Ordem de Serviço com status inicial `PATIO`. |
| **RF-29.4** | Acompanhamento Real-Time | Tela de status da OS ativa exibindo uma barra de progresso baseada no campo `etapa_atual` (0-100%) recebido via Polling. |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Segurança (Isolamento) | O cliente só pode visualizar e acompanhar as Ordens de Serviço vinculadas ao seu `User ID`. |
| **RNF-02** | UX (Feedback) | A barra de progresso deve possuir animação de transição suave ao mudar de valor. |

### 1.4 Endpoints RESTful e Dependências de Backend
- **POST** `/api/auth/b2c/login/` - Inicia fluxo de OTP.
- **POST** `/api/operacao/agendar/` - Cria a OS.
- **GET** `/api/operacao/acompanhamento/{os_id}/` - Retorna `etapa_atual` e `status`.
- **Dependência:** RF-27 (Campo `etapa_atual` no banco).

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O login via WhatsApp redireciona o usuário autenticado para a Home do App. |
| **CA-02** | O cadastro de veículo impede placas com formato inválido (REGEX). |
| **CA-03** | O agendamento é bloqueado se o horário escolhido já tiver sido ocupado por outro cliente (Race Condition Check). |
| **CA-04** | A barra de progresso exibe "100%" e ícone de check quando o status for `FINALIZADO`. |

---

> [!IMPORTANT]
> **Mandato TDD:** Escreva os testes abaixo antes de iniciar a implementação da lógica. Eles devem falhar inicialmente (Red) e guiar o desenvolvimento até o sucesso (Green).

## 2. Testes Esperados

### 2.1 Teste 1: Fluxo de Login OTP
**Descrição:** Simular login com telefone válido.
**Esperado:** Token JWT retornado e armazenado no LocalStorage.

### 2.2 Teste 2: Polling de Progresso
**Descrição:** Alterar a `etapa_atual` no banco de dados manualmente.
**Esperado:** A interface mobile reflete a mudança em até 30 segundos sem recarregar a página.

---

## 3. Esboço de Usabilidade (Wireframes B2C)
### Tela de Checkout
- **Resumo:** Valor Total e Tempo Estimado em destaque.
- **Formulário:** Inputs com bordas arredondadas (12px) e foco em `var(--lm-primary)`.
### Tela de Acompanhamento
- **Barra de Progresso:** Estilo gradiente (Lava-Me Blue/Green).
- **Status Label:** Texto explicativo (ex: "Sujidade removida - Iniciando secagem").
---
