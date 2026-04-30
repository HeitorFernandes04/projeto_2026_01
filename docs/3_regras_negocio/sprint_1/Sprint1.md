# 🧱 Documentação de Funcionalidades - Sprint 1 (Lava-Me)

## 1. Visão Geral da Sprint
**Objetivo:** Estabelecer a fundação do sistema, adequar a linguagem de domínio e garantir que o operador de pista registre o ciclo de vida da Ordem de Serviço com segurança.

---

## 2. Detalhamento dos Requisitos Funcionais (RFs)

| ID    | Funcionalidade                | Ator        | Descrição e Critérios de Aceitação |
|-------|-----------------------------|------------|-----------------------------------|
| RF-01 | Cadastro de Usuário         | Usuário     | Registro com nome, e-mail e senha com validação de dados obrigatórios. |
| RF-02 | Login de Usuário            | Usuário     | Autenticação segura via JWT e redirecionamento pós-login. |
| RF-03 | Refatoração Ubíqua          | Desenvolvedor | Renomear "Atendimento" para "OrdemServico" e atualizar Enums de status (PATIO, EM_EXECUCAO, etc.). |
| RF-04 | Visualizar Pátio            | Operador    | Listagem de Ordens de Serviço do dia com status PATIO, exibindo Placa e Modelo. |
| RF-05 | OS em Abas Progressivas     | Operador    | Gerenciamento via abas (Vistoria Inicial → Em Execução → Liberação) com gravação de timestamp de início real. |
| RF-06 | Vistoria Inicial e Avarias  | Operador    | Exigência de **5 fotos** gerais (`VISTORIA_GERAL`) e grid de tags de avarias prévias por setor com foto do dano (`AVARIA_PREVIA`). |
| RF-07 | Liberação (Check-out)       | Operador    | Registro de fotos do veículo limpo, laudo técnico opcional e gravação do `horario_fim_real`. |
| RF-08 | Entrada Avulsa              | Operador    | Fluxo expresso via formulário minimalista (Placa, Modelo, Cor e Serviço) com direcionamento imediato para Vistoria. |
| RF-09 | Registro de Incidente       | Operador    | Reportar dano causado pela equipe. Altera status para `BLOQUEADO_INCIDENTE`, travando a OS para o operador. |
| RF-10 | Sincronização em Background | Operador    | Upload de mídias assíncrono para evitar travamento da interface, permitindo iniciar o serviço mesmo com upload pendente. |

---

## 3. Especificações Técnicas e Restrições (RNFs)

### 3.1 Requisitos Não Funcionais (RNFs)

| ID     | Descrição |
|--------|----------|
| RNF-01 | (Segurança) Validação de credenciais e permissões estritas para operadores e usuários via JWT. |
| RNF-02 | (Performance) Sincronização assíncrona de mídias para garantir fluidez na navegação do operador. |
| RNF-03 | (Linguagem) Adequação semântica total aos termos de pátio industrial. |

### 3.2 Regras de Negócio Críticas (RNs)

| ID    | Descrição |
|-------|----------|
| RN-01 | (Bloqueio) Um operador não pode finalizar uma OS que possua o status `BLOQUEADO_INCIDENTE`. |
| RN-02 | (Imutabilidade) Informações da "Vistoria Inicial" ficam somente leitura após o avanço para "Em Execução". |
| RN-03 | (Obrigatoriedade) É impossível avançar da Vistoria Inicial sem o envio das **5 fotos** obrigatórias do momento `VISTORIA_GERAL`. |

---

## 4. Testes Esperados (Baseado no Template)

- **Sucesso (OS Progressiva):** Criar OS avulsa e verificar se o sistema redireciona automaticamente para a aba de Vistoria.  
- **Erro (Validação de Fotos):** Tentar avançar a Vistoria Inicial com menos de 5 fotos e confirmar o erro `400 Bad Request` na API.  
- **Negócio (Incidente):** Registrar um incidente e validar se o status da OS mudou para bloqueado, impedindo o checkout.