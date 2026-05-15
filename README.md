# 🚗 Lava-Me

> **Plataforma inteligente de gestão e agendamento para lava-jatos e estéticas automotivas**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Versão](https://img.shields.io/badge/versão-3.0.0--rc-blue)
![Licença](https://img.shields.io/badge/licença-MIT-green)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.x-green?logo=django)
![Angular](https://img.shields.io/badge/Angular-21.x-dd0031?logo=angular)
![Ionic](https://img.shields.io/badge/Ionic-8.x-purple?logo=ionic)
![React](https://img.shields.io/badge/React-19.x-blue?logo=react)

---

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [User Stories](#-user-stories--documentação-do-projeto)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Equipe](#-equipe)
- [Metodologia](#-metodologia)
- [Como Rodar](#️-como-rodar)
- [Testes](#-testes)
- [Roadmap](#-roadmap)
- [Protótipos](#️-protótipos---figma)
- [Licença](#-licença)

---

## 💡 Sobre o Projeto

O **Lava-Me** é uma plataforma completa que conecta proprietários de lava-jatos e estéticas automotivas aos seus clientes, resolvendo dois problemas centrais do setor:

**Para o gestor do estabelecimento:** A gestão de um lava-jato ou estética automotiva ainda é feita de forma manual — agendamentos em papel, cadernos de anotação e planilhas desconexas. Isso gera perda de tempo, erros de agendamento, conflitos de horário e nenhuma visibilidade financeira do negócio.

**Para o cliente:** Encontrar um lava-jato de confiança, verificar disponibilidade de horários e fazer um agendamento ainda exige ligações telefônicas ou deslocamento físico até o estabelecimento.

O Lava-Me centraliza toda a operação em uma única plataforma, oferecendo um **painel de gestão web** para a gerência, um **aplicativo mobile B2B** focado na operação do **funcionário** (lavadores, atendentes), e um **aplicativo mobile B2C** focado na jornada do **cliente final** (agendamento e acompanhamento).

> 📌 Projeto desenvolvido na disciplina de **Projeto de Sistemas** — Curso de Ciência da Computação, Universidade Federal do Tocantins (UFT), sob orientação do Prof. Dr. Edeilson Milhomem da Silva.

---

## ✅ Funcionalidades

### 🏢 Módulo do Estabelecimento (Web)

| Funcionalidade | Descrição | RF Relacionado |
|---|---|---|
| Kanban de Pista | Visualização em colunas (Pátio, Execução, Liberação) para gestão em tempo real | RF-14 |
| Gestão de Serviços | Cadastro de tipos de lavagem, preços e tempos estimados | RF-11 |
| Administração de Equipe | Controle de acesso e permissões para funcionários da pista | RF-12 |
| Configurações | Personalização de logotipo e dados do estabelecimento | RF-13 |
| Central de Incidentes | Auditoria fotográfica side-by-side e resolução de sinistros | RF-15, RF-31 |
| Histórico e Auditoria | Consulta detalhada de OS passadas com galeria de vistorias | RF-17, RF-18 |
| Dashboard Executivo | Indicadores de faturamento, volume de serviços e eficiência da equipe | RF-19, RF-20 |
| Saneamento de Dados | Unificação de APIs de histórico para performance e segurança | RF-31 |
| Painel Financeiro | Relatório simples de faturamento com filtros e exportação PDF | RF-32 |

### 📱 Módulo do Funcionário (Mobile)

| Funcionalidade | Descrição | RF Relacionado |
|---|---|---|
| Esteira de Produção | Fluxo guiado por abas (Vistoria -> Execução -> Entrega) | RF-05 |
| Vistoria e Avarias | Registro obrigatório de fotos e grid de danos prévios | RF-06 |
| Entrada Rápida | Check-in expresso de veículos sem agendamento prévio | RF-08, RF-30 |
| Registro de Incidente | Botão de pânico para reportar danos durante a operação | RF-09 |
| Sincronização Offline | Upload de fotos em background para lidar com sinal oscilante | RF-10 |
| Otimização de Fluxo | Pulo automático da etapa de acabamento para ganho de agilidade | RF-30 |

### 🌐 Módulo do Cliente (App Mobile B2C)

| Funcionalidade | Descrição | RF Relacionado |
|---|---|---|
| Busca e Mapa | Localização de estabelecimentos próximos via integração com Maps | RF-28 |
| Agendamento Mobile | Fluxo de reserva (Veículo, Serviço, Horário) via aplicativo | RF-23, RF-29 |
| Login via OTP | Autenticação simplificada e segura via código no WhatsApp | RF-29 |
| Acompanhamento Real-Time | Barra de progresso animada baseada na etapa atual do serviço | RF-29 |
| Histórico de Veículos | Gestão de frotas pessoais e consulta de lavagens passadas | RF-25 |
| Galeria de Qualidade | Visualização das fotos do veículo pronto antes da retirada | RF-26 |
| Cancelamento Autônomo | Gestão de agendamentos futuros com liberação automática de vaga | RF-24 |

---

## 🤖 Engenharia de Software Assistida por IA

Este projeto adota práticas avançadas de desenvolvimento auxiliado por agentes de Inteligência Artificial, utilizando tecnologias modernas para garantir escala e qualidade:

- **Agentes Autônomos de IA**: Utilizamos agentes (como o *Antigravity*) atuando como engenheiros de software autônomos dentro da IDE, auxiliando em code reviews complexos, auditorias de segurança e implementação de código.
- **RAG (Retrieval-Augmented Generation)**: Um banco de conhecimento vetorial (ChromaDB) é mantido localmente com as regras de negócio, glossário e documentação do projeto. Os agentes de IA consultam esse banco para tomarem decisões contextuais precisas antes de gerar código.
- **MCP (Model Context Protocol)**: Uma camada de servidores (como o `lava-me-context-server`) que expõe de forma padronizada os recursos do projeto (como o schema do banco de dados, logs e padrões CSS/UI) diretamente para a IA, conectando o raciocínio do modelo ao estado real da aplicação em tempo de execução.

---

## 🏗️ Arquitetura

O sistema segue uma arquitetura de **três camadas** com separação clara entre backend, frontend web e aplicativo mobile:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                CLIENTES                                 │
│  App B2B (Staff)   │   App B2C (Cliente)   │   Painel Web (Gestão)      │
└─────────┬──────────┴───────────┬───────────┴───────────┬─────────────────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │  REST API (JSON)
                      ┌──────────▼───────────┐
                      │   Backend Django      │
                      │   (API REST)          │
                      └──────────┬───────────┘
                                 │
                      ┌──────────▼───────────┐
                      │   Banco de Dados      │
                      │   SQLite (Dev) / PG   │
                      └──────────────────────┘
```

---

## 🛠️ Stack Tecnológica

### Backend
- **Python 3.11+** — Linguagem principal
- **Django 5.x** — Framework web
- **Django REST Framework** — Construção da API REST
- **PostgreSQL** — Banco de dados relacional
- **JWT (SimpleJWT)** — Autenticação
 - **SQlite3** - Bando de dados relacional (desenvolvimento)

### Frontend Web
- **Angular 21** — Framework principal e interface do painel de gestão
- **HTML5 / CSS3** — Estrutura e estilização
- **RxJS** — Programação reativa e consumo da API

### Mobile
- **Ionic 8** — Framework mobile multiplataforma (iOS/Android)
- **React 19** — Biblioteca principal do app mobile
- **Google Maps API** — Mapa interativo de estabelecimentos

### DevOps & Ferramentas
- **GitHub** — Controle de versão e gestão do projeto
- **GitFlow** — Estratégia de branching
- **Trello** — Gestão de tarefas e sprints
- **Figma** — Prototipagem e design de interfaces

---
- [**write_feature**](./.agents/workflows/write_feature.md): Cria especificações técnicas blindadas (TDD-First).
- [**review_pr**](./.agents/workflows/review_pr.md): Auditoria técnica e semântica de código.
- [**audit_isolation**](./.agents/workflows/audit_isolation.md): Validação rigorosa de separação B2C/B2B e IDOR.
- [**audit_frontend**](./.agents/workflows/audit_frontend.md): Auditoria de UI, componentes B2C/B2B e testes unitários.
- [**audit_backend**](./.agents/workflows/audit_backend.md): Auditoria da unificação de rotas, banco de dados e testes pytest.

[Clique aqui para ir ao documento de planejamento e entregas](./Planejamento%20e%20Entregas.md)

---

## 📁 Estrutura do Repositório

```
lava-me/
├── backend/                  # API Django
│   ├── core/                 # Configurações do projeto
│   ├── accounts/             # Autenticação e multitenant
│   ├── operacao/             # Ordens de serviço e incidentes
│   └── ...
│
├── web/                      # Painel Web Angular (Gestão)
│
├── mobile/                   # App Mobile B2B (Operacional/Staff)
│
├── mobile-cliente/           # App Mobile B2C (Cliente Final)
│
├── docs/                     # Documentação do projeto
│   ├── 3_regras_negocio/     # RFs e Especificações (sprint_atual)
│   └── ...
│
└── README.md
```

---

## 👥 Equipe

| Nome | Papel | Contato |
|---|---|---|
| Lucas José | Desenvolvedor | [@yamatosz](https://github.com/yamatosz) |
| Heitor Fernandes | Desenvolvedor | [@HeitorFernandes04](https://github.com/HeitorFernandes04) |
| Letícia Lopes | Desenvolvedora | [@LeticiaGLopes-151](https://github.com/LeticiaGLopes-151) |
| Wanderson Mello | Desenvolvedor | [@WandersonAMello](https://github.com/WandersonAMello)|
| Maurício Monteiro | Desenvolvedor | [@MontDeP](https://github.com/MontDeP) |
| Marcos Barbosa | Desenvolvedor | [@eziors](https://github.com/eziors) |

<!-- > 📌 Papéis a serem definidos na reunião de kick-off da equipe. -->

---

## 📐 Metodologia

O projeto adota **metodologia ágil com Scrum** e práticas modernas de Engenharia de Software, seguindo as diretrizes da disciplina de Projeto de Sistemas (UFT):

- **Sprints** de 1 a 2 semanas com entregas incrementais.
- **Reuniões semanais** de acompanhamento com o professor.
- **GitFlow** para controle do fluxo de trabalho no repositório.

### 📚 Abordagem "Documentation-First"

Para garantir a qualidade em um ambiente com uso de IA, adotamos o método **Documentation-First**:
1. **Especificação**: Antes de qualquer linha de código, os Requisitos Funcionais (RFs) são descritos usando um template padrão (`TEMPLATE_FUNCIONALIDADE.md`).
2. **Validação e Auditoria**: A especificação é validada (frequentemente com auxílio de agentes IA via RAG) para encontrar lacunas de arquitetura e UX.
3. **Integração na Base de Conhecimento**: O requisito finalizado é alimentado no repositório, garantindo que o banco vetorial RAG aprenda as novas regras.
4. **Implementação**: Apenas após o processo acima o código começa a ser gerado e testado.

### 🔀 Fluxo de Branches (GitFlow)

```
main          ← versão de produção
develop       ← integração contínua
feature/*     ← novas funcionalidades
hotfix/*      ← correções urgentes
release/*     ← preparação para nova versão
```

---

## ▶️ Como Rodar

> ⚠️ Instruções completas serão adicionadas conforme o ambiente de desenvolvimento for configurado.

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

[Clique aqui para ir ao documento de como rodar o projeto](Como%20rodar.md)

### 🧪 Testes
Para garantir a estabilidade do sistema, o projeto conta com uma cobertura rigorosa de testes no Backend e no Mobile.
- **Backend:** `pytest`
- **Mobile:** `vitest` e `cypress`

[Veja como executar os testes no guia detalhado](Como%20rodar.md#%EF%B8%8F-testes)

<!-- ### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Web
```bash
cd web
npm install
npm start
```

### Mobile
```bash
cd mobile
npm install
ionic serve
``` -->

---

## 🗺️ Roadmap

- [x] **Sprint 1** — Experiência do Funcionário
- [x] **Sprint 2** — Gestão e Controle Operacional
- [x] **Sprint 3** — Experiência do Cliente (Portal Web)
- [ ] **Sprint 4** — Refatoração, Isolamento B2C/B2B e Qualidade
- [ ] **Evento Final** — Apresentação pública do produto

---

## 🖼️ Protótipos - Figma
[Clique aqui para ir para os protótipos no Figma](https://www.figma.com/make/vrqBsa4Glt9ktaAUHxxnya/Execute-request-in-file?fullscreen=1&t=286qd5DPhIsmrM3y-1)

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Desenvolvido com 💧 pela equipe <strong>Lava-Me</strong></p>
  <p>Universidade Federal do Tocantins — Ciência da Computação — 2026.1</p>
</div>
