# 📱 Especificação Frontend: RF-29 — Jornada Completa do Cliente (mobile-cliente)



> **Tipo:** Complemento frontend-only à RF-28 e RF-29.

> **Escopo:** Exclusivamente o app `mobile-cliente/` (Ionic 8 + React 19).

> **Backend:** Implementado por outro membro do time. Este doc cobre apenas a camada de apresentação e integração de API.

> **Fonte visual:** Protótipo Figma validado em 17/05/2026.

> **Decisões de divergência:**

> - OTP: **4 dígitos** (segue o backend — `regex \d{4}`). O Figma mostra 6 boxes; ignorar.

> - Campo "Cor" do veículo: **`IonSelect`** com opções predefinidas (segue RF-29 e resolve DT-015). O Figma mostra texto livre; ignorar.



---



## 1. Estrutura de Navegação e Rotas



### 1.1 Arquitetura de Rotas (`App.tsx`)



O app possui **dois contextos de navegação**:



| Contexto | Condição | Estrutura |

|---|---|---|

| **Deslogado** | Sem token no storage | Rotas planas (sem tab bar) |

| **Logado** | Token válido | `IonTabs` com 5 abas fixas |



```

/                        → Redirect → /mapa

/mapa                    → Home/Mapa (deslogado e logado)

/auth                    → AuthGate

/auth/whatsapp           → LoginWhatsApp

/auth/verificacao        → VerificacaoOTP

/servicos/:slug          → Servicos

/agendamento             → Agendamento

/agendamento/confirmacao → Confirmacao

/veiculo/novo            → SeuVeiculo (criar)

/veiculo/:id             → SeuVeiculo (editar)



[Logado — dentro de IonTabs]

/inicio                  → HomeDashboard

/acompanhamento          → Acompanhamento

/veiculos                → MeusVeiculos

/historico               → Historico

/perfil                  → Perfil

```



### 1.2 Fluxo Completo de Navegação



```

ABERTURA DO APP (primeira vez)

  └─> PermissaoLocalizacao

        ├─> [Permitir localização] ──> /mapa (centralizado no usuário)

        └─> [Agora não] ──────────> /mapa (centro padrão)



DESLOGADO — Fluxo de Descoberta e Agendamento

  /mapa

    └─> [Clicar pin] ──> EstabelecimentoDrawer (bottom sheet)

          ├─> [Como chegar] ──> App de mapas nativo (deep link)

          └─> [Ver Serviços] ──> /auth (se sem token)

                                  /servicos/:slug (se com token)

  /auth

    ├─> [Entrar com WhatsApp] ──> /auth/whatsapp

    └─> [Criar conta] ─────────> /auth/whatsapp (mesmo fluxo)



  /auth/whatsapp

    └─> [Continuar] ──> /auth/verificacao



  /auth/verificacao

    └─> [PIN correto] ──> /inicio (HomeDashboard, monta IonTabs)



LOGADO — Tab Bar fixa em todas as telas autenticadas

  Tab Início (/inicio) ──> HomeDashboard

    ├─> [Acompanhar lavagem] ──────> /acompanhamento

    ├─> [Agendar nova lavagem] ────> /mapa (compartilhado)

    └─> [Card de veículo] ─────────> /veiculo/:id



  Tab Acompanhamento (/acompanhamento) ──> Acompanhamento



  Tab Veículos (/veiculos) ──> MeusVeiculos

    └─> [+ Adicionar / card veículo] ──> /veiculo/novo ou /veiculo/:id



  Tab Histórico (/historico) ──> Historico



  Tab Perfil (/perfil) ──> Perfil

    └─> [Sair da conta] ──> limpa storage + redireciona /mapa



FLUXO DE AGENDAMENTO (logado, continuando do mapa)

  /mapa → Drawer → [Ver Serviços] → /servicos/:slug

    └─> [Continuar] ──> (sem veículo?) /veiculo/novo → volta

                    ──> (com veículo?) /agendamento

                          └─> [Finalizar Agendamento] ──> /agendamento/confirmacao

                                └─> [Confirmar Agendamento] ──> /inicio

```



---



## 2. Especificação por Tela



---



### TELA 1 — PermissaoLocalizacao



**Arquivo:** `src/pages/permissao/PermissaoLocalizacao.tsx`

**Exibição:** Apenas na primeira abertura do app (checar flag em `Capacitor Preferences`).



**Layout:**

```

┌──────────────────────────┐

│                          │

│                          │

│    [📍 ícone grande]     │  ← círculo --lm-card com ícone de pin

│                          │

│  Encontre lava-jatos     │

│       próximos           │  ← h1 centralizado

│                          │

│  Precisamos da sua       │

│  localização para...     │  ← p --lm-text-muted

│                          │

│  [✈️ Permitir localização]│  ← lm-btn-primary expand="block"

│                          │

│      Agora não           │  ← link simples, --lm-text-muted

│                          │

└──────────────────────────┘

```



**Comportamento:**

- Ao clicar "Permitir localização": chama `Geolocation.requestPermissions()` → navega `/mapa`.

- Ao clicar "Agora não": salva flag `localizacao_solicitada=true` no storage → navega `/mapa` sem centralizar.

- Nunca exibir novamente após a primeira resposta (verificar flag no `App.tsx` antes de redirecionar).



---



### TELA 2 — Home/Mapa (`/mapa`)



**Arquivo:** `src/pages/home/Home.tsx` *(upgrade do existente)*

**Acesso:** Deslogado (entrada principal) e Logado (via "Agendar nova lavagem").



**Layout:**

```

┌──────────────────────────┐

│  Encontre um Lava-Me     │  ← título flutuante sobre o mapa

│  próximo                 │

│  ┌────────────────────┐  │

│  │ 🔍 Buscar estab... ▽ │  │  ← IonSearchbar + ícone de filtro

│  └────────────────────┘  │

│  [Mais próximos][Melhor  │  ← chips de filtro horizontais (scroll)

│   avaliados][Abertos]    │  ← badge contador "N encontrados"

│                          │

│   [🔵 pin][🔵 pin]       │

│        [🔵 pin 🔴]       │  ← pin vermelho = selecionado

│                    [📍A] │  ← FAB localização

└──────────────────────────┘

```



**Novidades em relação ao RF-28 implementado:**

- Chips de filtro: `Mais próximos` | `Melhor avaliados` | `Abertos` (scroll horizontal, `IonChip`)

- Badge contador dinâmico: "N encontrados" (baseado nos pins filtrados)

- Título "Encontre um Lava-Me próximo" fixo no topo sobre o mapa

- Pin selecionado muda de cor (azul → vermelho/destaque) ao abrir drawer



**Filtros e lógica:**

- `Mais próximos`: ordena por distância calculada a partir da posição do usuário (haversine no frontend)

- `Melhor avaliados`: campo `avaliacao` na API (a ser fornecido pelo backend — anotar como dependência)

- `Abertos`: filtra estabelecimentos onde hora atual está entre `horario_abertura` e `horario_fechamento`



> **Nota para o desenvolvedor:** os campos `horario_abertura`, `horario_fechamento` já existem no modelo `Estabelecimento`. Confirmar com o responsável do backend se esses campos serão incluídos no endpoint `GET /api/publico/estabelecimentos/`. O campo `avaliacao` é novo e pode ser omitido nesta sprint, desabilitando o chip "Melhor avaliados".



---



### TELA 3 — EstabelecimentoDrawer (upgrade)



**Arquivo:** `src/components/EstabelecimentoDrawer/EstabelecimentoDrawer.tsx` *(upgrade)*



**Layout (Bottom Sheet expandido):**

```

┌──────────────────────────┐

│    ── (handle bar)       │  ← indicador de swipe

│ [logo] Lava Rápido       │

│        Premium  [Aberto] │  ← badge verde/vermelho

│ ⭐ 4.8  📍 0.8 km  ⏱ 15min│  ← métricas em linha

│ Av. Paulista, 1000       │  ← endereço

│ Lavagem premium com...   │  ← descrição (max 2 linhas)

│                          │

│ 🏷 Serviços disponíveis  │

│ [Lavagem][Polimento]...  │  ← IonChip readonly (não clicável)

│                          │

│ [📍Como chegar][Ver Ser.]│  ← dois botões lado a lado

└──────────────────────────┘

```



**Campos adicionais necessários na API** (além dos já retornados):

- `avaliacao: number | null` — média de estrelas

- `distancia_km: number | null` — calculado no frontend via haversine (não precisar do backend)

- `tempo_estimado_min: number | null` — campo novo, ou calcular como `distancia_km * 2` (simplificado)

- `descricao: string | null` — campo novo no modelo (confirmar com backend)

- `is_aberto: boolean` — calculado no frontend com `horario_abertura`/`horario_fechamento`

- `servicos_resumo: string[]` — nomes dos serviços ativos (já disponível via endpoint de detalhes)



**Comportamento:**

- `breakpoints={[0, 0.5, 0.85]}`, `initialBreakpoint={0.5}`

- "Como chegar": abre Google Maps / Waze via deep link `geo:{lat},{lng}?q={nome}`

- "Ver Serviços": navega `/servicos/:slug` (ou `/auth` se deslogado)



---



### TELA 4 — AuthGate (`/auth`)



**Arquivo:** `src/pages/auth/AuthGate.tsx`



**Layout:**

```

┌──────────────────────────┐

│                          │

│    [🔒 ícone]            │  ← círculo --lm-card

│                          │

│  Autenticação necessária │  ← h1

│                          │

│  Para continuar com seu  │

│  agendamento, você       │

│  precisa autenticar...   │  ← p --lm-text-muted

│                          │

│  [💬 Entrar com WhatsApp]│  ← lm-btn-primary

│  [👤 Criar conta]        │  ← botão outline

│                          │

└──────────────────────────┘

```



**Comportamento:**

- Salvar em estado/storage a rota de destino (`/servicos/:slug`) para redirecionar após login.

- "Criar conta" leva ao mesmo `LoginWhatsApp` — o backend cria o usuário automaticamente se não existir.

- Se usuário já estiver logado (token válido no storage), nunca exibir esta tela — redirecionar direto para o destino.



---



### TELA 5 — LoginWhatsApp (`/auth/whatsapp`)



**Arquivo:** `src/pages/auth/LoginWhatsApp.tsx`



**Layout:**

```

┌──────────────────────────┐

│ ← (back button)          │

│                          │

│     [🚗 Logo Lava-Me]    │

│                          │

│  Digite seu número de    │

│  celular para continuar  │

│                          │

│  [+55] [(00) 00000-0000] │  ← dois inputs lado a lado

│                          │

│  [Continuar >]           │  ← lm-btn-primary (disabled até válido)

│                          │

└──────────────────────────┘

```



**Comportamento e validação:**

- Input de número: máscara visual imediata `(99) 99999-9999` — implementar com lógica de replace no `onIonInput`.

- DDI fixo `+55` (não editável nesta versão).

- Botão "Continuar" habilitado apenas quando o número tem 10 ou 11 dígitos (sem formatação).

- Ao clicar "Continuar": chama `POST /api/publico/auth/setup/` com `{ telefone, placa, pin }` ou apenas `POST /api/publico/auth/login/` dependendo do fluxo. Confirmar endpoint com backend.

- Navegar para `/auth/verificacao` passando o telefone via state do router.



> **Endpoint:** `POST /api/publico/auth/login/` — `{ telefone: string, pin: string }`. O fluxo OTP (envio de código) pode exigir um endpoint adicional; confirmar com o responsável do backend se há endpoint de "solicitar código".



---



### TELA 6 — VerificacaoOTP (`/auth/verificacao`)



**Arquivo:** `src/pages/auth/VerificacaoOTP.tsx`



**Layout:**

```

┌──────────────────────────┐

│ ← (back button)          │

│                          │

│  Verificação             │  ← h1

│                          │

│  Digite o código enviado │

│  para +55 63985008205    │  ← telefone recebido por router state

│                          │

│  [_] [_] [_] [_]        │  ← 4 boxes (inputs individuais)

│                          │

│  Reenviar código (00:45) │  ← countdown, depois link clicável

│                          │

└──────────────────────────┘

```



**⚠️ Divergência com protótipo:** O Figma mostra 6 boxes. **Implementar 4 boxes** para compatibilidade com o backend (`regex \d{4}`).



**Comportamento:**

- 4 inputs individuais de 1 dígito. Ao preencher cada box, o foco avança automaticamente para o próximo (`autoFocus` no seguinte).

- Backspace no box vazio retorna foco ao anterior.

- Quando os 4 dígitos estão preenchidos, submeter automaticamente (sem botão extra).

- Countdown de 45 segundos para "Reenviar código". Durante o countdown, exibir o timer. Após zerar, exibir o link clicável que reenviar o código (chama o endpoint novamente).

- Em caso de código inválido: shake animation nos boxes + mensagem de erro abaixo.

- Em caso de sucesso: salvar `access_token` e `refresh_token` em `Capacitor Preferences`, popular `AuthContext`, redirecionar para a rota de destino salva pelo `AuthGate` (ou `/inicio`).



---



### TELA 7 — HomeDashboard (`/inicio`)



**Arquivo:** `src/pages/dashboard/HomeDashboard.tsx`

**Acesso:** Apenas logado. Primeira tela após login.



**Dois estados que devem ser tratados no mesmo componente:**



#### Estado A — Com Ordem de Serviço ativa

```

┌──────────────────────────┐

│  Olá, [Nome]!            │  ← nome do AuthContext

│  Bem-vindo de volta      │

│  ┌────────────────────┐  │

│  │ 🔵 SERVIÇO ATIVO   │  │  ← badge pulsante

│  │ Seu veículo está   │  │

│  │ em execução        │  │

│  │ 📍 Lava Rápido Premium│

│  │ 🚗 Corolla ABC-1234│  │

│  │ ⏱ ~15 min restantes│  │

│  │ ████████░░ 65%     │  │  ← progress bar animada

│  │ [⚡ Acompanhar]    │  │  ← lm-btn-primary

│  └────────────────────┘  │

│  Agendamentos recentes   │

│  [Card OS 1]             │

│  [Card OS 2]             │

│  Meus veículos           │

│  [Card Veículo]          │

│  [📅 Agendar nova lav.]  │  ← navega /mapa

└──────────────────────────┘

```



#### Estado B — Sem OS ativa

```

┌──────────────────────────┐

│  Olá, [Nome]!            │

│  Bem-vindo de volta      │

│  Agendamentos recentes   │

│  [Card OS 1]             │

│  [Card OS 2]             │

│  Meus veículos           │

│  [Card Veículo]          │

│  [📅 Agendar nova lav.]  │

└──────────────────────────┘

```



**Comportamento:**

- Dados carregados via `useIonViewWillEnter` (não `useEffect`) para garantir refresh ao voltar às tabs.

- Verificar se há OS com status diferente de `FINALIZADO`/`CANCELADO` → exibir Estado A.

- "Agendar nova lavagem" → navega `/mapa`.

- Cards de agendamentos recentes: data, serviço, estabelecimento, valor, badge de status.

- Card de veículo: placa + modelo, ao clicar → `/veiculo/:id`.

- Barra de progresso do Estado A: animação CSS de preenchimento suave (`transition: width 0.8s ease`).



---



### TELA 8 — Acompanhamento (`/acompanhamento`)



**Arquivo:** `src/pages/acompanhamento/Acompanhamento.tsx`



**Layout:**

```

┌──────────────────────────┐

│  Lava Rápido Premium     │  ← nome do estabelecimento

│  Tempo estimado: ~15 min │  ← tempo restante

│              [EM EXECUÇÃO]│  ← badge dinâmico

│                          │

│    [🚗 animação carro]   │  ← ícone animado (CSS keyframes)

│                          │

│  Progresso geral   75%   │

│  [████████████░░░]       │  ← progress bar gradiente

│                          │

│  ● ✅ NO PÁTIO           │  ← etapa concluída

│  |    Veículo chegou...  │

│  ● ✅ EM VISTORIA        │  ← etapa concluída

│  |    Inspeção do veículo│

│  ● [3] EM EXECUÇÃO       │  ← etapa atual (pulsante)

│       Lavagem em andamento│

│  ○    LIBERAÇÃO          │  ← etapa futura (cinza)

│  ○    FINALIZADO         │

└──────────────────────────┘

```



**Comportamento:**

- Polling a cada **15 segundos** via `setInterval` com `clearInterval` obrigatório no `useEffect` cleanup (ou `useIonViewWillLeave`).

- Consome `GET /api/operacao/acompanhamento/{os_id}/` → retorna `{ etapa_atual: 0-100, status: string }`.

- Falhas de rede durante polling: silenciosas — agendar próxima tentativa sem crashar.

- Quando `status === 'FINALIZADO'`: exibir progresso 100% + ícone de check + mensagem "Seu veículo está pronto!". Parar o polling.

- Timeline: mapeamento de `status` → etapas visuais:



| Status Backend | Etapa Exibida | Ícone |

|---|---|---|

| `PATIO` | NO PÁTIO | ✅ |

| `VISTORIA_INICIAL` | EM VISTORIA | ✅ |

| `EM_EXECUCAO` | EM EXECUÇÃO | [N] pulsante |

| `LIBERACAO` | LIBERAÇÃO | [N] pulsante |

| `FINALIZADO` | FINALIZADO | ✅ |

| `BLOQUEADO_INCIDENTE` | EM EXECUÇÃO + alerta | ⚠️ |



---



### TELA 9 — Serviços (`/servicos/:slug`)



**Arquivo:** `src/pages/servicos/Servicos.tsx`



**Layout:**

```

┌──────────────────────────┐

│ ← Serviços               │

│                          │

│  ┌────────────────────┐  │

│  │ Lavagem Simples  ○ │  │  ← radio button direita

│  │ Externa + aspiração│  │

│  │ R$ 45        30 min│  │

│  └────────────────────┘  │

│  ┌────────────────────┐  │

│  │ Lavagem Completa ● │  │  ← selecionado

│  │ Externa+interna... │  │

│  │ R$ 85        50 min│  │

│  └────────────────────┘  │

│  ...                     │

│ ─────────────────────────│

│  Total: R$ 85 | 50 min   │  ← footer fixo

│  [Continuar]             │  ← disabled até selecionar

└──────────────────────────┘

```



**Comportamento:**

- Carrega serviços de `GET /api/publico/estabelecimento/{slug}/` → campo `servicos`.

- Seleção única (radio). Footer calcula total e duração do serviço selecionado.

- "Continuar":

  - Se usuário não tem veículo cadastrado → `/veiculo/novo?next=agendamento`

  - Se tem veículo → `/agendamento` (passar `slug` + `servico_id` por estado do router)



---



### TELA 10 — Agendamento (`/agendamento`)



**Arquivo:** `src/pages/agendamento/Agendamento.tsx`



**Layout:**

```

┌──────────────────────────┐

│ ← Agendamento            │

│  ┌────────────────────┐  │

│  │ Resumo             │  │

│  │ Estab: Lava Rápido │  │

│  │ Serviço: Lav. Comp.│  │

│  │ Total: R$ 85       │  │  ← highlight --lm-primary

│  └────────────────────┘  │

│                          │

│  📅 Data                 │

│  [14/05/2026        📅]  │  ← input type="date" estilizado

│                          │

│  🕐 Horário              │

│  [09:00][10:00][11:00]   │  ← grid de chips

│  [14:00][15:00]...       │  ← chips cinzas = indisponíveis

│                          │

│  [Finalizar Agendamento] │  ← disabled até data+horário

└──────────────────────────┘

```



**Comportamento:**

- Data padrão: hoje. Input date nativo com estilo custom (não usar IonDatetime nesta versão).

- Ao mudar data: chama `GET /api/publico/agendamento/disponibilidade/?slug=&servicoId=&data=` → atualiza grid de horários.

- Horários indisponíveis: chip cinza, não clicável.

- Botão "Finalizar Agendamento": entra em modo **loading + desabilitado** imediatamente ao clique (previne duplo envio).

- Em caso de race condition (horário recém ocupado — resposta 409): exibir `IonAlert` informando que o horário foi ocupado, pedir nova seleção. Não navegar.

- Em caso de sucesso: navegar `/agendamento/confirmacao` com os dados da OS criada.



---



### TELA 11 — Confirmação (`/agendamento/confirmacao`)



**Arquivo:** `src/pages/agendamento/Confirmacao.tsx`



**Layout:**

```

┌──────────────────────────┐

│  Confirmação             │

│  ┌────────────────────┐  │

│  │ Serviço            │  │

│  │ 📍 Lava Rápido Prem│  │

│  │ 📅 14 de Maio, 2026│  │

│  │ 🕐 14:00           │  │

│  └────────────────────┘  │

│  ┌────────────────────┐  │

│  │ Veículo            │  │

│  │ 🚗 Corolla - Preto │  │

│  │    ABC-1234        │  │

│  └────────────────────┘  │

│  ┌────────────────────┐  │

│  │ $ Total   R$ 85    │  ← destaque

│  │ Duração: 50 min    │  │

│  └────────────────────┘  │

│                          │

│  [Confirmar Agendamento] │  ← lm-btn-primary + loading state

└──────────────────────────┘

```



**Comportamento:**

- Dados recebidos via estado do router (não refazer chamada à API).

- Botão "Confirmar Agendamento": entra em loading imediatamente. Chama endpoint de criação da OS.

- Sucesso → navegar `/inicio` + exibir toast "Agendamento confirmado!".

- Erro → exibir `IonAlert` com detalhe do erro.



---



### TELA 12 — SeuVeiculo (`/veiculo/novo` e `/veiculo/:id`)



**Arquivo:** `src/pages/veiculos/SeuVeiculo.tsx`



**Layout:**

```

┌──────────────────────────┐

│ ← Seu Veículo            │

│                          │

│       [🚗 ícone]         │  ← círculo --lm-card

│                          │

│  Placa                   │

│  [ABC-1234         ]     │  ← forçar UPPERCASE, validar regex

│                          │

│  Marca                   │

│  [Toyota           ]     │  ← texto livre

│                          │

│  Modelo                  │

│  [Corolla          ]     │  ← texto livre

│                          │

│  Cor                     │

│  [▼ Preto          ]     │  ← IonSelect obrigatório

│                          │

│  [Salvar Veículo]        │  ← disabled até campos válidos

└──────────────────────────┘

```



**⚠️ Divergência com protótipo resolvida:** Cor usa **`IonSelect`** (não texto livre). Opções predefinidas:

`Preto | Branco | Prata | Cinza | Vermelho | Azul | Verde | Amarelo | Laranja | Marrom | Bege | Dourado | Roxo | Rosa | Outra`



**Validação de Placa:**

- Formato Mercosul: `[A-Z]{3}[0-9][A-Z][0-9]{2}` (ex: `ABC1D23`)

- Formato tradicional: `[A-Z]{3}[0-9]{4}` (ex: `ABC1234`)

- Exibir mensagem de erro inline se formato inválido.

- Forçar uppercase no input: `onIonInput` → `value.toUpperCase()`.



**Comportamento:**

- Modo criação (`/veiculo/novo`): campos vazios, botão "Salvar Veículo".

- Modo edição (`/veiculo/:id`): pré-preencher campos, botão "Atualizar Veículo".

- `useIonViewWillLeave`: resetar formulário (evita dados antigos ao voltar).



---



### TELA 13 — MeusVeiculos (`/veiculos`)



**Arquivo:** `src/pages/veiculos/MeusVeiculos.tsx`



**Layout:**

```

┌──────────────────────────┐

│  Meus Veículos           │

│  Gerencie seus veículos  │

│  ┌────────────────────┐  │

│  │ 🚗 Toyota Corolla  >│  │

│  │ Placa: ABC-1234    │  │

│  │ Cor: Preto         │  │

│  └────────────────────┘  │

│  ┌────────────────────┐  │

│  │ 🚗 Honda Civic     >│  │

│  │ Placa: XYZ-5678    │  │

│  │ Cor: Prata         │  │

│  └────────────────────┘  │

│  [+ Adicionar Veículo]   │  ← botão outline (não primary)

│                          │

│  Cadastre seus veículos  │

│  para agilizar...        │  ← exibir apenas se lista vazia

└──────────────────────────┘

```



**Comportamento:**

- Dados carregados via `useIonViewWillEnter`.

- Clicar no card → `/veiculo/:id` (editar).

- "+ Adicionar Veículo" → `/veiculo/novo`.

- Estado vazio: exibir o texto de incentivo ao cadastro (como no protótipo).



---



### TELA 14 — Historico (`/historico`)



**Arquivo:** `src/pages/historico/Historico.tsx`



**Layout:**

```

┌──────────────────────────┐

│  Histórico               │

│  Seus serviços realizados│

│  ┌────────────────────┐  │

│  │ ✅ Lavagem Completa R$ 85│

│  │ 📅 14/05 🕐 14:00  │  │

│  │ 📍 Lava Rápido     │  │

│  │ • Corolla ABC-1234 │  │

│  │ [Concluído] Ver det>│  │

│  └────────────────────┘  │

│  ...                     │

└──────────────────────────┘

```



**Comportamento:**

- Consome `GET /api/shared/historico/` (endpoint unificado — RF-31).

- "Ver detalhes": exibir `IonModal` simples com informações completas da OS (sem nova rota).

- Estado vazio: mensagem "Nenhum serviço realizado ainda."

- Usar `useIonViewWillEnter` para refresh.



---



### TELA 15 — Perfil (`/perfil`)



**Arquivo:** `src/pages/perfil/Perfil.tsx`



**Layout:**

```

┌──────────────────────────┐

│  Perfil                  │

│  [👤] Cliente Lava-Me    │  ← avatar + nome

│       Membro desde Mai 26│

│                          │

│  INFORMAÇÕES PESSOAIS    │  ← section label (uppercase, muted)

│  ┌────────────────────┐  │

│  │ 👤 Nome          > │  │  ← clicável → edição inline ou modal

│  │ Cliente Lava-Me    │  │

│  └────────────────────┘  │

│  ┌────────────────────┐  │

│  │ 📞 WhatsApp      > │  │

│  │ +55 (11) 99999-9999│  │

│  └────────────────────┘  │

│                          │

│  PREFERÊNCIAS            │

│  ┌────────────────────┐  │

│  │ 🔔 Notificações    │  │

│  │ Receber atualizações  IonToggle │

│  └────────────────────┘  │

│                          │

│  ┌────────────────────┐  │

│  │ → Sair da conta    │  │  ← cor vermelha, --lm-red

│  └────────────────────┘  │

│  Lava-Me v1.0.0          │  ← versão do app (rodapé)

└──────────────────────────┘

```



**Comportamento — Logout (crítico):**

O botão "Sair da conta" deve executar de forma **atômica**:

1. Limpar `AuthContext` (setar `null`)

2. Remover token de `Capacitor Preferences`

3. Cancelar qualquer polling ativo (Acompanhamento)

4. Navegar para `/mapa` via `history.replace` (não `push`, para não empilhar histórico)



---



## 3. Checklist Técnico Global



### AuthContext e Persistência de Sessão

- Criar `src/contexts/AuthContext.tsx` com `user`, `token`, `login()`, `logout()`.

- Na inicialização do app (`App.tsx`), ler token de `Capacitor Preferences` e popular o contexto.

- Criar HOC ou hook `useAuthGuard()` que redireciona para `/auth` se sem token.



### HTTP Client

- Criar instância centralizada em `src/services/http.ts` usando `fetch` com interceptor manual.

- Injetar `Authorization: Bearer {token}` em todas as requisições autenticadas.

- Interceptar respostas `401`: limpar sessão + redirecionar `/auth`.



### Tab Bar (apenas logado)

- Implementar `IonTabs` em `src/components/TabLayout/TabLayout.tsx`.

- 5 tabs: Início, Acompanhamento, Veículos, Histórico, Perfil.

- Tab bar visível apenas nas rotas logadas — rotas de auth e mapa não exibem tab bar.



### Design System

- Todos os novos componentes usam exclusivamente tokens do `lava-me.css`.

- Proibido CSS inline e novas classes de cor.

- Badge de status mapeado para `.lm-badge-{agendado|andamento|finalizado|cancelado}`.



### Anti-patterns a evitar

- Não usar `useEffect` sem array de dependências para fetch.

- Não usar `input type="file"` para câmera — usar `@capacitor/camera` (relevante em sprints futuras).

- Não usar `history.push` após logout — usar `history.replace`.

- `setInterval` de polling **sempre** com `clearInterval` no cleanup.



---



## 4. Testes Esperados (TDD — Mandato)



> Escrever os testes antes da implementação. Devem falhar (Red) antes de passar (Green).



### 4.1 VerificacaoOTP — 4 dígitos

- Foco avança automaticamente ao preencher cada box.

- Submit automático ao preencher o 4º dígito.

- Backspace no box vazio retorna foco ao anterior.

- Countdown de 45s: link "Reenviar" desabilitado durante contagem.



### 4.2 HomeDashboard — Estados condicionais

- Com OS ativa: card "SERVIÇO ATIVO" renderiza com dados corretos.

- Sem OS ativa: card não aparece; botão "Agendar nova lavagem" visível.

- `useIonViewWillEnter` dispara refresh ao retornar de outra tab.



### 4.3 Acompanhamento — Polling

- Polling inicia ao entrar na tela.

- Polling é limpo (`clearInterval`) ao sair da tela.

- Falha de rede não crasha a tela — nova tentativa agendada.

- Status `FINALIZADO` → polling para + progresso = 100%.



### 4.4 Agendamento — Race condition

- Botão desabilitado imediatamente após o clique (previne duplo envio).

- Resposta 409 → `IonAlert` com mensagem de conflito. Não navega.



### 4.5 SeuVeiculo — Validação de placa

- Placa `ABC1234` (tradicional): válida.

- Placa `ABC1D23` (Mercosul): válida.

- Placa `AB123` (inválida): botão "Salvar" permanece desabilitado.

- Input de placa converte para maiúsculas automaticamente.



### 4.6 Perfil — Logout atômico

- Após logout: token removido do storage.

- Após logout: acesso a rota protegida redireciona para `/auth`.

- Após logout: tentativa de polling (se ativo) não dispara chamadas à API.



---



## 5. Dependências de Backend a Confirmar



| Item | Status | Impacto |

|---|---|---|

| Campo `avaliacao` em `Estabelecimento` | ❓ Não confirmado | Chip "Melhor avaliados" no mapa |

| Campo `descricao` em `Estabelecimento` | ❓ Não confirmado | Drawer expandido |

| `horario_abertura`/`horario_fechamento` no endpoint `/api/publico/estabelecimentos/` | ❓ Campos existem no modelo, confirmar serializer | Chip "Abertos" e is_aberto no Drawer |

| Endpoint de solicitação de código OTP | ❓ Não documentado na RF-29 | Tela `LoginWhatsApp` |

| `GET /api/operacao/acompanhamento/{os_id}/` | ❓ Endpoint listado na RF-29, confirmar implementação | Tela `Acompanhamento` |

| Veículo via API cliente (`POST`, `GET`, `PATCH`) | ❓ Endpoints não documentados | Telas `SeuVeiculo`, `MeusVeiculos` |



---



## 6. Estrutura de Arquivos a Criar



```

mobile-cliente/src/

├── contexts/

│   └── AuthContext.tsx

├── services/

│   ├── api.ts              (já existe — expandir)

│   └── http.ts             (novo — instância autenticada)

├── components/

│   ├── EstabelecimentoDrawer/

│   │   ├── EstabelecimentoDrawer.tsx  (upgrade)

│   │   ├── EstabelecimentoDrawer.css  (upgrade)

│   │   └── EstabelecimentoDrawer.test.tsx (upgrade)

│   └── TabLayout/

│       └── TabLayout.tsx

├── pages/

│   ├── permissao/

│   │   └── PermissaoLocalizacao.tsx

│   ├── home/

│   │   ├── Home.tsx        (upgrade)

│   │   ├── Home.css        (upgrade)

│   │   └── Home.test.tsx   (upgrade)

│   ├── auth/

│   │   ├── AuthGate.tsx

│   │   ├── LoginWhatsApp.tsx

│   │   └── VerificacaoOTP.tsx

│   ├── dashboard/

│   │   ├── HomeDashboard.tsx

│   │   └── HomeDashboard.css

│   ├── acompanhamento/

│   │   ├── Acompanhamento.tsx

│   │   └── Acompanhamento.css

│   ├── servicos/

│   │   └── Servicos.tsx

│   ├── agendamento/

│   │   ├── Agendamento.tsx

│   │   └── Confirmacao.tsx

│   ├── veiculos/

│   │   ├── MeusVeiculos.tsx

│   │   └── SeuVeiculo.tsx

│   ├── historico/

│   │   └── Historico.tsx

│   └── perfil/

│       └── Perfil.tsx

```



---



## 7. Critérios de Aceitação Globais



| Critério | Descrição |

|---|---|

| **CA-01** | App navega corretamente por todos os fluxos sem erros de console. |

| **CA-02** | Token JWT persiste no `Capacitor Preferences` após fechar e reabrir o app. |

| **CA-03** | Logout limpa todos os dados de sessão; rotas protegidas redirecionam para `/auth`. |

| **CA-04** | Polling de acompanhamento não persiste após sair da tela (sem memory leak). |

| **CA-05** | Campo Cor usa `IonSelect` em todos os formulários de veículo. |

| **CA-06** | OTP aceita exatamente 4 dígitos e submete automaticamente. |

| **CA-07** | Botão de agendamento desabilita imediatamente ao clique (anti-duplicata). |

| **CA-08** | Todos os tokens CSS usados são do `lava-me.css` — zero CSS inline de cor. |

