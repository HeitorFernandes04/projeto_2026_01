# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: RF-29 - Portal do Cliente: Jornada e Checkout

### 1.1 Use Case
**Nome:** Fluxo de Conversão e Acompanhamento RT (B2C)

**Ator:** Cliente Final

**Descrição:** O cliente realiza o login simplificado, cadastra seu veículo, finaliza o agendamento de um serviço, acompanha o progresso da lavagem em tempo real, consulta seu histórico de atendimentos e pode encerrar a sessão de forma segura.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-29.1** | Autenticação B2C (OTP) | Login via número de WhatsApp com envio de código PIN. Geração automática de "email fantasma" para compatibilidade com o sistema de autenticação Django. |
| **RF-29.2** | Cadastro de Veículos | Formulário simplificado (Placa, Modelo, Marca, Cor) integrado ao perfil do cliente. |
| **RF-29.3** | Fluxo de Checkout | Escolha de horário disponível e criação da Ordem de Serviço com status inicial `PATIO`. |
| **RF-29.4** | Acompanhamento Real-Time | Tela de status da OS ativa exibindo uma barra de progresso baseada no campo `etapa_atual` (0-100%) recebido via Polling. |
| **RF-29.5** | Histórico de Atendimentos | Tela listando as Ordens de Serviço anteriores do cliente, reaproveitando a API unificada do sistema. |
| **RF-29.6** | Logout de Sessão | Botão acessível no perfil ou menu lateral para encerrar a sessão (limpar tokens locais e estado). |

> [!IMPORTANT]
> **Checklist Técnico - RF-29 (Checkout, Auth e RT):**
> Para que essa jornada seja considerada "Pronta" e livre de bugs silenciosos, as seguintes implementações e proteções "óbvias" devem estar contidas no código:
> - **Autenticação e Interceptadores:** Criar um cliente HTTP (Axios/Fetch) que injete o header `Authorization: Bearer` automaticamente e intercepte respostas `401 Unauthorized` (forçando o logout e redirecionamento silencioso).
> - **Persistência de Sessão:** O token e os dados do cliente não devem ser perdidos no *refresh* do navegador. Devem ser salvos via `Capacitor Preferences` ou `localStorage` e hidratados num Contexto Global (ex: `AuthContext`) na inicialização.
> - **UX e Sanitização (Formulários):**
>   - **WhatsApp:** Input deve aplicar máscara visual imediata `(99) 99999-9999`.
>   - **Placa:** Input deve forçar *UpperCase* e validar formatos (Mercosul e Tradicional).
>   - **Veículo:** Usar opções predefinidas (`IonSelect`) apenas para o campo "Cor", evitando sujeira no banco (DT-015). Os campos "Marca" e "Modelo" podem ser preenchidos como texto livre.
> - **Resiliência do Checkout:** O botão "Agendar" deve entrar em modo *Loading* (desabilitado) imediatamente ao clique para prevenir duplicidade de OS. A interface deve estar pronta para tratar o erro HTTP de *Race Condition* (horário recém-ocupado) exibindo um aviso elegante.
> - **Prevenção de Memory Leaks (Polling):** O laço de repetição (`setInterval` ou chamadas recursivas) da tela de acompanhamento **deve ser obrigatoriamente limpo** (`clearInterval`) no *unmount* do componente. Falhas de rede durante o polling não devem "crashar" a tela, apenas agendar a próxima tentativa.
> - **Importação do Histórico (Web ➡️ Mobile):** O portal B2C não precisa criar uma nova API. Deve consumir o endpoint unificado `/api/shared/historico/` (refatorado na RF-31). A UI Web em Angular serve como referência lógica e de dados, mas a visualização em React deve ser reconstruída usando componentes nativos do Ionic (`<IonList>`, `<IonItem>`) para melhor performance.
> - **Mecanismo Rigoroso de Logout:** O botão de Sair deve acionar uma função que garanta a limpeza atômica do contexto global de sessão (`AuthContext`), remova o token do armazenamento persistente (`Capacitor Preferences`/`localStorage`), cancele qualquer Polling ativo, e force o redirecionamento (via Router) para a Home.


### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Segurança (Isolamento) | O cliente só pode visualizar e acompanhar as Ordens de Serviço vinculadas ao seu `User ID`. |
| **RNF-02** | UX (Feedback) | A barra de progresso deve possuir animação de transição suave ao mudar de valor. |

### 1.4 Endpoints RESTful e Dependências de Backend
- **POST** `/api/auth/b2c/login/` - Inicia fluxo de OTP.
- **POST** `/api/operacao/agendar/` - Cria a OS.
- **GET** `/api/operacao/acompanhamento/{os_id}/` - Retorna `etapa_atual` e `status`.
- **GET** `/api/shared/historico/` - Endpoint unificado de histórico (Reaproveitado da Web).
- **Dependência:** RF-27 (Campo `etapa_atual`) e RF-31 (API de Histórico Unificada).

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O login via WhatsApp redireciona o usuário autenticado para a Home do App. |
| **CA-02** | O cadastro de veículo impede placas com formato inválido (REGEX). |
| **CA-03** | O agendamento é bloqueado se o horário escolhido já tiver sido ocupado por outro cliente (Race Condition Check). |
| **CA-04** | A barra de progresso exibe "100%" e ícone de check quando o status for `FINALIZADO`. |
| **CA-05** | A tela de histórico renderiza corretamente a lista de OS passadas consumindo a API unificada. |
| **CA-06** | O clique em Sair/Logout redireciona o usuário para a Home deslogada e limpa os dados da sessão local. |

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

### 2.3 Teste 3: Carregamento do Histórico
**Descrição:** Acessar a tela de histórico com um usuário que já possui agendamentos finalizados.
**Esperado:** A lista de agendamentos passados é renderizada com sucesso (consumo da API unificada).

### 2.4 Teste 4: Limpeza no Logout
**Descrição:** Clicar no botão de logout e tentar acessar uma rota protegida manualmente (ex: forçando a URL).
**Esperado:** Redirecionamento automático para a tela de mapa/home por ausência de credenciais válidas.

---

## 3. Esboço de Usabilidade (Wireframes B2C)
### Tela de Checkout
- **Resumo:** Valor Total e Tempo Estimado em destaque.
- **Formulário:** Inputs com bordas arredondadas (12px) e foco em `var(--lm-primary)`.
### Tela de Acompanhamento
- **Barra de Progresso:** Estilo gradiente (Lava-Me Blue/Green).
- **Status Label:** Texto explicativo (ex: "Sujidade removida - Iniciando secagem").
### Tela de Histórico e Perfil (Menu)
- **Lista de Atendimentos:** Cards simples com Data, Serviço, Placa e Status (utilizando `<IonItem>`).
- **Ações:** Botão vermelho secundário explícito para "Sair / Logout".
---
