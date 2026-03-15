# 🚗 Lava-Me

> **Plataforma inteligente de gestão e agendamento para lava-jatos e estéticas automotivas**

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Versão](https://img.shields.io/badge/versão-0.1.0-blue)
![Licença](https://img.shields.io/badge/licença-MIT-green)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![Django](https://img.shields.io/badge/Django-5.x-green?logo=django)
![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![Ionic](https://img.shields.io/badge/Ionic-7.x-purple?logo=ionic)

---

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Equipe](#-equipe)
- [Metodologia](#-metodologia)
- [Como Executar](#-como-executar)
- [Roadmap](#-roadmap)
- [Licença](#-licença)

---

## 💡 Sobre o Projeto

O **Lava-Me** é uma plataforma completa que conecta proprietários de lava-jatos e estéticas automotivas aos seus clientes, resolvendo dois problemas centrais do setor:

**Para o gestor do estabelecimento:** A gestão de um lava-jato ou estética automotiva ainda é feita de forma manual — agendamentos em papel, cadernos de anotação e planilhas desconexas. Isso gera perda de tempo, erros de agendamento, conflitos de horário e nenhuma visibilidade financeira do negócio.

**Para o cliente:** Encontrar um lava-jato de confiança, verificar disponibilidade de horários e fazer um agendamento ainda exige ligações telefônicas ou deslocamento físico até o estabelecimento.

O Lava-Me centraliza toda a operação em uma única plataforma, oferecendo um **painel de gestão web** para o estabelecimento e um **aplicativo mobile** para o cliente final.

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
| Notificações | Alertas de novos agendamentos e confirmações automáticas | Média |
| Avaliações | Visualização e resposta às avaliações recebidas dos clientes | Baixa |

### 📱 Módulo do Cliente (Mobile)

| Funcionalidade | Descrição | Prioridade |
|---|---|---|
| Mapa Interativo | Localização de estabelecimentos próximos via geolocalização | Alta |
| Perfil do Estabelecimento | Informações, serviços disponíveis, avaliações e fotos | Alta |
| Agendamento Online | Seleção de serviço, data e horário disponível | Alta |
| Histórico de Serviços | Registro de todos os agendamentos anteriores do usuário | Média |
| Avaliação Pós-Serviço | Nota e comentário após a conclusão do atendimento | Média |
| Notificações Push | Lembretes de agendamento e confirmação de serviço | Média |

---

## 🏗️ Arquitetura

O sistema segue uma arquitetura de **três camadas** com separação clara entre backend, frontend web e aplicativo mobile:

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTES                           │
│         App Mobile (Ionic)   │   Painel Web (React)     │
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

### Frontend Web
- **React 18** — Interface do painel de gestão
- **HTML5 / CSS3** — Estrutura e estilização
- **Axios** — Consumo da API

### Mobile
- **Ionic 7** — Framework mobile multiplataforma (iOS/Android)
- **Google Maps API** — Mapa interativo de estabelecimentos

### DevOps & Ferramentas
- **GitHub** — Controle de versão e gestão do projeto
- **GitFlow** — Estratégia de branching
- **GitHub Projects** — Gestão de tarefas e sprints
- **Figma** — Prototipagem e design de interfaces

---

## 📁 Estrutura do Repositório

```
lava-me/
├── backend/                  # API Django
│   ├── core/                 # Configurações do projeto
│   ├── accounts/             # Autenticação e usuários
│   ├── establishments/       # Módulo de estabelecimentos
│   ├── scheduling/           # Módulo de agendamentos
│   ├── financial/            # Módulo financeiro
│   └── requirements.txt
│
├── frontend/                 # Painel Web React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── mobile/                   # App Ionic
│   ├── src/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── docs/                     # Documentação do projeto
│   ├── requisitos/
│   ├── diagramas/
│   └── sprints/
│
└── README.md
```

---

## 👥 Equipe

| Nome | Papel | Contato |
|---|---|---|
| Lucas José | — | — |
| Heitor Fernandes | — | — |
| Letícia Mello | — | — |
| Maurício Monteiro | — | — |

> 📌 Papéis a serem definidos na reunião de kick-off da equipe.

---

## 📐 Metodologia

O projeto adota **metodologia ágil com Scrum**, seguindo as diretrizes da disciplina:

- **Sprints** de 1 a 2 semanas com entregas incrementais
- **Reuniões semanais** de acompanhamento com o professor
- **Retrospectivas** ao final de cada sprint
- **GitFlow** para controle do fluxo de trabalho no repositório
- **GitHub Projects** para gestão do backlog e kanban das tarefas
- Ciclo **PDCA** mantido durante todo o desenvolvimento

### Fluxo de Branches (GitFlow)

```
main          ← versão de produção
develop       ← integração contínua
feature/*     ← novas funcionalidades
hotfix/*      ← correções urgentes
release/*     ← preparação para nova versão
```

---

## ▶️ Como Executar

> ⚠️ Instruções completas serão adicionadas conforme o ambiente de desenvolvimento for configurado.

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend
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
cd frontend
npm install
npm start
```

### Mobile
```bash
cd mobile
npm install
ionic serve
```

---

## 🗺️ Roadmap

- [ ] **Sprint 0** — Configuração do ambiente, repositório e definição de requisitos
- [ ] **Sprint 1** — Autenticação, cadastro de estabelecimentos e estrutura base
- [ ] **Sprint 2** — Módulo de agendamento (backend + web)
- [ ] **Sprint 3** — Dashboard financeiro e painel de gestão
- [ ] **Sprint 4** — App mobile: mapa e busca de estabelecimentos
- [ ] **Sprint 5** — App mobile: agendamento e histórico
- [ ] **Sprint 6** — Avaliações, notificações e ajustes finais
- [ ] **Evento Final** — Apresentação pública do produto

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Desenvolvido com 💧 pela equipe <strong>Lava-Me</strong></p>
  <p>Universidade Federal do Tocantins — Ciência da Computação — 2025.1</p>
</div>
