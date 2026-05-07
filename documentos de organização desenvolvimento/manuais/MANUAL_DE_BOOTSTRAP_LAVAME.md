# 🚀 Manual de Bootstrap: Sistema Lava-Me

Este guia orienta o fluxo completo para inicializar o sistema a partir de um banco de dados vazio (Day Zero), cobrindo desde a criação administrativa da unidade até a execução operacional no app mobile.

---

## 🏗️ Hierarquia Multi-tenant
O sistema do **Lava-Me** é isolado por **Estabelecimentos** (Unidades). Todo colaborador e todo serviço nasce dentro de uma unidade específica.

### Fluxo de Inicialização (Bootstrap Flow)

#### 1. Fase Mestre (Sistema Central)
**Ação:** Um administrador do sistema (Superuser) cria a infraestrutura básica.
- **Como fazer:** Via Django Admin (`/admin`) ou script de seed (`backend/scripts/setup_dev.py`).
- **O que é criado:** 
    - Um **Estabelecimento** (CNPJ, Nome, Endereço).
    - Um **Usuário Gestor** (Email e Senha) vinculado a este estabelecimento.

#### 2. Fase de Configuração (Portal Web)
**Ação:** O novo **Gestor** loga no Portal Web para "equipar" sua casa.
- **Onde:** `http://localhost:4200/login`
- **Passos Essenciais (Setup):**
    - **Serviços (RF-11):** Criar os nomes, preços e tempos de execução (Ex: Lavagem de Moto, Polimento).
    - **Equipe (RF-12):** Criar os logins dos colaboradores (Lavadores, Detalhistas).

#### 3. Fase Operacional (Mobile & Web)
**Ação:** O Operador recebe o veículo e inicia a "Esteira Industrial".
- **Onde:** `http://localhost:8100/login` (App Mobile).
- **Fluxo:**
    - Registro do veículo (Placa, Modelo).
    - Início das etapas (Vistoria -> Lavagem -> Acabamento -> Liberação).
    - Registro de fotos e incidentes pelo celular.

---

## 🛠️ Guia de Desenvolvimento (Local)

### Credenciais Já Prontas (via `setup_dev.py`)
Para testes imediatos no seu ambiente, utilize os dados abaixo:

| Perfil | Login | Senha |
| :--- | :--- | :--- |
| **Gestor Mestre** | `admin@lavame.com.br` | `adminpassword123` |
| **Lava-jato** | Lava-Me Matriz | (ID: 1) |

### Comandos Rápidos de Execução
Para colocar o ecossistema no ar:

1. **Backend**: `cd backend && python manage.py runserver`
2. **Portal Web**: `cd web && npm start`
3. **App Mobile**: `cd mobile && npm run dev`

---

> [!IMPORTANT]
> **Privacidade de Dados**: Lembre-se que um Gestor de uma Unidade A **nunca** terá acesso aos serviços, funcionários ou ordens de serviço da Unidade B. O sistema garante esse isolamento por padrão (RNF-01).
