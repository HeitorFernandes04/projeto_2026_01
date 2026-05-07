# 🚗 Lava-Me

> **Plataforma inteligente de gestão e agendamento para lava-jatos e estéticas automotivas**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Versão](https://img.shields.io/badge/versão-2.0.0-blue)
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

O Lava-Me centraliza toda a operação em uma única plataforma, oferecendo um **painel de gestão web** para a gerência, um **aplicativo mobile** focado exclusivamente na operação do **funcionário** (lavadores, atendentes), e um **portal de autoagendamento via link** para o cliente final, dispensando a necessidade de instalação de aplicativos.

> 📌 Projeto desenvolvido na disciplina de **Projeto de Sistemas** — Curso de Ciência da Computação, Universidade Federal do Tocantins (UFT), sob orientação do Prof. Dr. Edeilson Milhomem da Silva.

---

## ✅ Funcionalidades

### 🏢 Módulo do Estabelecimento (Web)

| Funcionalidade | Descrição | Prioridade |
|---|---|---|
| Agenda de Serviços | Visualização e gestão de todos os agendamentos do dia/semana | Alta |
| Cadastro de Serviços | Registro de tipos de serviço, duração estimada e valores | Alta |
| Gestão de Clientes | Histórico de veículos e atendimentos por cliente | Alta |
| Dashboard Financeiro | Faturamento diário, semanal e mensal com gráficos | Alta |
| Controle de Status | Atualização do status do serviço em tempo real (Aguardando / Em andamento / Finalizado) | Média |
| Gestão de Incidentes | Registro, auditoria com evidências e aprovação de avarias e retrabalhos | Alta |
| Identidade Visual | Upload de logo e sincronização reativa global (Web/Mobile/Portal) | Alta |
| Notificações | Alertas de novos agendamentos e confirmações automáticas | Média |
| Avaliações | Visualização e resposta às avaliações recebidas dos clientes | Baixa |

### 📱 Módulo do Funcionário (Mobile)

| Funcionalidade | Descrição | Prioridade |
|---|---|---|
| Execução de Serviços | Acesso às ordens de serviço designadas, com checklist de tarefas | Alta |
| Apontamento e Avarias | Registro fotográfico do veículo antes e durante o serviço | Alta |
| Status Operacional | Alteração de status (Iniciado, Pausado, Concluído) em tempo real | Alta |

### 🌐 Módulo do Cliente (Portal Web B2C)

| Funcionalidade | Descrição | Prioridade |
|---|---|---|
| Autoagendamento | Interface acessível via link (ex: `/agendar/meu-lava-jato`) para marcar serviços | Alta |
| Perfil do Estabelecimento | Visualização dos serviços disponíveis, preços e informações do local | Alta |
| Acompanhamento | Verificação do status do agendamento (Confirmado, Finalizado) | Média |

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
┌─────────────────────────────────────────────────────────┐
│                      CLIENTES                           │
│         App Mobile (Ionic)   │   Painel Web (Angular)   │
└──────────────────┬──────────────────────┬───────────────┘
                   │                      │
                   └──────────┬───────────┘
                              │  REST API (JSON)
                   ┌──────────▼───────────┐
                   │   Backend Django      │
                   │   (API REST)          │
                   │   Django REST         │
                   │   Framework           │
                   └──────────┬───────────┘
                              │
                   ┌──────────▼───────────┐
                   │   Banco de Dados      │
                   │   PostgreSQL          │
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
## 📋 User Stories — Documentação do Projeto

[Clique aqui para ir ao documento de planejamento e entregas](./Planejamento%20e%20Entregas.md)

---

## 📁 Estrutura do Repositório

```
lava-me/
├── backend/                  # API Django
│   ├── core/                 # Configurações do projeto
│   ├── accounts/             # Autenticação e multitenant
│   ├── operacao/             # Ordens de serviço e incidentes
│   ├── mensageria/           # Notificações e comunicação
│   ├── agendamento_publico/  # Módulo de autoagendamento
│   └── requirements.txt
│
├── web/                      # Painel Web Angular
│   ├── src/
│   │   ├── app/              # Componentes, serviços e páginas
│   │   └── assets/           # Imagens e arquivos estáticos
│   └── package.json
│
├── mobile/                   # App Ionic (React)
│   ├── src/
│   │   ├── pages/
│   │   └── components/
│   └── package.json
│
├── docs/                     # Documentação do projeto
│   ├── 3_regras_negocio/     # RFs, glossário e especificações
│   │   ├── sprint_1/         # Planejamentos da Sprint 1
│   │   ├── sprint_2/         # Planejamentos da Sprint 2
│   │   └── sprint_3/         # Planejamentos da Sprint 3
│   ├── 6_banco_dados/        # Diagramas e schemas
│   └── templates/            # Templates Markdown para RFs e PRs
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
- [ ] **Sprint 3** — Experiência do Cliente
- [ ] **Sprint 4** — Comunicação, Relatórios e Recursos Avançados
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
