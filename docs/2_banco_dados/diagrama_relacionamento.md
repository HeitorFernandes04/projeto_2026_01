erDiagram
    %% Hierarquia de Usuários e Perfis
    USER ||--o| CLIENTE : "possui perfil"
    USER ||--o| FUNCIONARIO : "possui perfil"
    USER ||--o| GESTOR : "possui perfil"

    %% Relacionamentos Principais
    ESTABELECIMENTO ||--o{ SERVICO : "oferece"
    ESTABELECIMENTO ||--o{ FUNCIONARIO : "contrata"
    ESTABELECIMENTO ||--o{ GESTOR : "gerenciado_por"
    ESTABELECIMENTO ||--o{ VEICULO : "registra"
    ESTABELECIMENTO ||--o{ TAG_PECA : "define"
    VEICULO ||--o{ ORDEM_SERVICO : "recebe"
    SERVICO ||--o{ ORDEM_SERVICO : "vinculado_a"
    FUNCIONARIO ||--o{ ORDEM_SERVICO : "executa"
    ESTABELECIMENTO ||--o{ ORDEM_SERVICO : "pertence_a"

    ORDEM_SERVICO ||--o{ VISTORIA_ITEM : "possui avarias (check-in)"
    ORDEM_SERVICO ||--o{ MIDIA_ORDEM_SERVICO : "contem evidencias"
    ORDEM_SERVICO ||--o{ INCIDENTE_OS : "registra excecao (sinistro)"

    TAG_PECA ||--o{ VISTORIA_ITEM : "classifica"
    TAG_PECA ||--o{ INCIDENTE_OS : "referencia"

    USER {
        int id PK
        string email "Login (único)"
        string password
        string name
        string username
        boolean is_active
        datetime date_joined
    }

    CLIENTE {
        int id PK
        int user_id FK
        string telefone_whatsapp
        string endereco_padrao
    }

    FUNCIONARIO {
        int id PK
        int user_id FK
        int estabelecimento_id FK
        enum cargo "GESTOR, LAVADOR, DETALHISTA"
    }

    GESTOR {
        int id PK
        int user_id FK
        int estabelecimento_id FK
    }

    ESTABELECIMENTO {
        int id PK
        string nome_fantasia
        string cnpj "14 dígitos, único"
        string endereco_completo
        boolean is_active
    }

    VEICULO {
        int id PK
        int estabelecimento_id FK
        string placa "único, 7 chars (antigo ou Mercosul)"
        string modelo
        string marca
        string cor
        string nome_dono "opcional"
        string celular_dono "opcional"
    }

    SERVICO {
        int id PK
        int estabelecimento_id FK
        string nome
        decimal preco
        int duracao_estimada_minutos
        boolean is_active "Soft Delete"
    }

    %% CORE DO SISTEMA
    ORDEM_SERVICO {
        int id PK
        int estabelecimento_id FK
        int veiculo_id FK
        int servico_id FK
        int funcionario_id FK

        enum status "PATIO, VISTORIA_INICIAL, EM_EXECUCAO, LIBERACAO, FINALIZADO, BLOQUEADO_INCIDENTE, CANCELADO"
        datetime data_hora "criação automática"

        text laudo_vistoria "opcional"
        text comentario_lavagem "opcional"
        text comentario_acabamento "opcional"
        text observacoes "opcional"
        string vaga_patio "obrigatório na finalização"

        datetime horario_lavagem "preenchido ao iniciar execução"
        datetime horario_acabamento "preenchido ao concluir acabamento"
        datetime horario_finalizacao "preenchido ao finalizar"
    }

    %% VISTORIA E TAGS
    TAG_PECA {
        int id PK
        int estabelecimento_id FK
        string nome "Ex: Capô, Porta Dianteira Esq"
        enum categoria "INTERNO, EXTERNO"
    }

    VISTORIA_ITEM {
        int id PK
        int ordem_servico_id FK
        int tag_peca_id FK
        boolean possui_avaria
        string foto_url "opcional"
    }

    %% MÍDIAS
    MIDIA_ORDEM_SERVICO {
        int id PK
        int ordem_servico_id FK
        string arquivo "caminho no storage"
        enum momento "VISTORIA_GERAL, AVARIA_PREVIA, EXECUCAO, FINALIZADO"
    }

    %% EXCEÇÕES / INCIDENTES
    %% ⚠️ PENDENTE: campo status_anterior_os ainda não foi adicionado via migration.
    %% Necessário para restaurar o status correto da OS ao resolver o incidente (CA-08).
    INCIDENTE_OS {
        int id PK
        int ordem_servico_id FK
        int tag_peca_id FK
        string descricao "Relato detalhado do operador"
        string foto_url "Evidência do dano causado"
        boolean resolvido "Controle para liberação pelo Gestor"
        text observacoes_resolucao "Justificativa do Gestor para o desbloqueio"
        datetime data_registro
        datetime data_resolucao
    }