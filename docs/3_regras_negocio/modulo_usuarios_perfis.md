Módulo de Usuários e Perfis
===========================

Este documento centraliza as regras de negócio e Requisitos Funcionais (RFs) relacionados à gestão de identidades, acesso, perfis de usuários e suas entidades diretamente vinculadas (como veículos) na plataforma Lava-Me.

### RF-01 · Cadastro de Usuário

**Como** usuário,**quero** me cadastrar no sistema,**para** acessar as funcionalidades disponíveis.

**Critérios de Aceitação:**

*   \[ \] Cadastro com nome, email e senha
    
*   \[ \] Validação de dados obrigatórios
    
*   \[ \] Usuário salvo no sistema
    

### RF-02 · Login de Usuário

**Como** usuário,**quero** fazer login no sistema,**para** acessar minha conta.

**Critérios de Aceitação:**

*   \[ \] Login com email e senha
    
*   \[ \] Validação de credenciais
    
*   \[ \] Redirecionamento após login (direcionamento correto conforme o perfil e emissão de tokens seguros)
    

### RF-11 · Gerenciar Funcionários

**Como** gestor,**quero** gerenciar funcionários,**para** manter a equipe organizada.

**Critérios de Aceitação:**

*   \[ \] Criar, editar e remover funcionários
    
*   \[ \] Listagem com dados básicos
    
*   \[ \] Status ativo/inativo
    

### RF-20 · Cadastro de Veículo

**Como** cliente,**quero** cadastrar meu veículo,**para** agilizar futuros agendamentos.

**Critérios de Aceitação:**

*   \[ \] Cadastro com placa e modelo
    
*   \[ \] Salvamento persistente
    
*   \[ \] Seleção em novos agendamentos