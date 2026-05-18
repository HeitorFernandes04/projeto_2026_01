# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: RF-28 - Portal do Cliente: Arquitetura e Mapa

### 1.1 Use Case
**Nome:** Descoberta de Estabelecimentos via Mapa (B2C)

**Ator:** Cliente Final

**Descrição:** O cliente abre o novo aplicativo móvel `mobile-cliente` e visualiza um mapa com pins representando os lava-jatos próximos. Ao clicar em um pin, ele vê as informações básicas para decidir onde agendar.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-28.1** | Setup Mobile-Cliente | Criar o diretório `mobile-cliente` na raiz do projeto com Ionic/React e configuração base de roteamento e temas. |
| **RF-28.2** | Mapa Interativo (Home) | Implementar componente de mapa (Leaflet/Capacitor) que carrega pins com base na geolocalização do backend. |
| **RF-28.3** | Pins Dinâmicos | Os pins devem ser renderizados apenas para estabelecimentos com `is_active=True`. |
| **RF-28.4** | Drawer de Resumo (Bottom Sheet) | Ao clicar em um pin, abrir um menu inferior (Drawer) exibindo Foto (Logo), Nome, Endereço e botão "Ver Serviços". |
| **RF-28.5** | Precisão B2B no Mapa (UX) | No painel B2B, a validação de mapa via Nominatim só deve sobrescrever coordenadas se estas estiverem vazias ou forem apagadas intencionalmente; coordenadas persistidas devem ter prioridade de renderização. |

> [!NOTE]
> **O que é um Drawer (ou Bottom Sheet)?**
> É um componente de interface que "desliza" de baixo para cima na tela do celular. No Lava-Me, ele será usado para mostrar as informações do lava-jato sem que o usuário precise sair do mapa. É ideal para manter o contexto visual da localização enquanto o usuário decide se quer agendar naquele local.

> [!IMPORTANT]
> **Checklist Técnico - RF-28.1 (Setup Mobile-Cliente):**
> Para considerar a fundação do frontend B2C como concluída, as seguintes configurações implícitas devem ser implementadas no diretório `mobile-cliente`:
> - **Scaffolding e Limpeza:** Geração do projeto base via CLI do Ionic (tipo React/Vite) e remoção do boilerplate genérico.
> - **Roteamento:** Configuração do `react-router-dom` e `App.tsx` com a estrutura base de navegação e placeholder da Home.
> - **Design System:** Definição das variáveis CSS globais de marca (ex: `var(--lm-primary)`) e suporte básico a Dark Mode nativo.
> - **Qualidade e TDD:** Instalação e configuração do **Vitest** (junto com `@testing-library/react` e `setupTests.ts`), além do ESLint e Prettier padronizados com o monorepo.
> - **Integração:** Criação do `.env` (`VITE_API_BASE_URL`), configuração de Path Aliases (`@/`) e instância base do Axios/Fetch.
> - **Ponte Nativa:** Inicialização base do Capacitor (`npx cap init`).

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Performance do Mapa | O mapa deve carregar e renderizar pins em menos de 1 segundo para até 50 estabelecimentos visíveis. |
| **RNF-02** | UX (Touch Friendly) | O Drawer de resumo deve ser deslizável (swipe up/down) seguindo o padrão mobile nativo. |
| **RNF-03** | Bypass de Cache Restrito | Requisições HTTP para obter os pontos de mapa (B2C) devem ser forçadas com `Cache-Control: no-cache` e `Pragma: no-cache` para refletir imediatamente atualizações espaciais, sendo o CORS B2B compatível. |

### 1.4 Endpoints RESTful e Dependências de Backend
- **GET** `/api/publico/estabelecimentos/` - Retorna lista com `nome`, `slug`, `latitude`, `longitude` e `logo`.
- **Dependência:** RF-27 (Campos de Lat/Long populados).

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O comando `ionic serve` no diretório `mobile-cliente` abre o app sem erros, com as fundações de teste (Vitest), linting e roteamento prontas. |
| **CA-02** | O mapa exibe marcadores nas posições geográficas corretas definidas no backend. |
| **CA-03** | O clique no pin abre o Drawer com os dados reais do estabelecimento clicado. |
| **CA-04** | O botão "Ver Serviços" redireciona para a tela de escolha de serviços (RF-29). |

---

> [!IMPORTANT]
> **Mandato TDD:** Escreva os testes abaixo antes de iniciar a implementação da lógica. Eles devem falhar inicialmente (Red) e guiar o desenvolvimento até o sucesso (Green).

## 2. Testes Esperados

### 2.1 Teste 1: Renderização de Marcadores
**Descrição:** Adicionar um estabelecimento via Admin e verificar se ele aparece no mapa mobile.
**Esperado:** O novo pin aparece na posição correta após o refresh automático ou reabertura do mapa.

### 2.2 Teste 2: Swipe do Drawer
**Descrição:** Abrir o drawer e tentar fechá-lo deslizando para baixo.
**Esperado:** O componente fecha suavemente acompanhando o movimento do dedo.

---

## 3. Esboço de Usabilidade (Wireframes B2C)
### Tela Home: Mapa de Descoberta
- **Botão de Localização:** Centraliza o mapa na posição do usuário.
- **Barra de Busca (Opcional):** Filtro por nome de estabelecimento.
- **Pins:** Customizados com o logo do Lava-Me ou ícone de carro.
- **Bottom Sheet:** Card flutuante com sombra suave, cantos arredondados (24px) e botão principal em `var(--lm-primary)`.
---
