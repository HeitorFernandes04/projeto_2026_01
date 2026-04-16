erDiagram
    %% Hierarquia de Usuários e Perfis
    USER ||--|| CLIENTE : "possui perfil"
    USER ||--|| FUNCIONARIO : "possui perfil"
    USER ||--|| GESTOR : "possui perfil"

    %% Relacionamentos Principais
    ESTABELECIMENTO ||--o{ SERVICO : "oferece"
    ESTABELECIMENTO ||--o{ FUNCIONARIO : "contrata"
    CLIENTE ||--o{ VEICULO : "cadastra"
    VEICULO ||--o{ ORDEM_SERVICO : "recebe"
    SERVICO ||--o{ ORDEM_SERVICO : "vinculado_a"
    FUNCIONARIO ||--o{ ORDEM_SERVICO : "executa"
    
    ORDEM_SERVICO ||--o{ VISTORIA_ITEM : "possui avarias (check-in)"
    ORDEM_SERVICO ||--o{ MIDIA_ORDEM_SERVICO : "contem evidencias"
    ORDEM_SERVICO ||--o{ INCIDENTE_OS : "registra excecao (sinistro)"
    
    TAG_PECA ||--o{ VISTORIA_ITEM : "classifica"
    TAG_PECA ||--o{ INCIDENTE_OS : "referencia"

    USER {
        int id PK
        string email "Login"
        string password
        string nome_completo
        enum tipo_usuario "CLIENTE, FUNCIONARIO, GESTOR"
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
        string cargo
    }

    GESTOR {
        int id PK
        int user_id FK
        int estabelecimento_id FK
    }

    ESTABELECIMENTO {
        int id PK
        string nome_fantasia
        string cnpj
        string endereco_completo
        float latitude
        float longitude
        string link_autoagendamento
    }

    VEICULO {
        int id PK
        int cliente_id FK
        string placa
        string modelo
        string marca
        string cor
        string ano
    }

    SERVICO {
        int id PK
        int estabelecimento_id FK
        string nome
        string descricao
        decimal preco
        int duracao_estimada_minutos
    }

    %% CORE DO SISTEMA
    ORDEM_SERVICO {
        int id PK
        int veiculo_id FK
        int servico_id FK
        int funcionario_id FK
        
        datetime data_hora_agendada
        datetime horario_inicio_real
        datetime horario_fim_real
        decimal valor_cobrado
        
        enum status "PATIO, VISTORIA_INICIAL, EM_EXECUCAO, PAUSADO, LIBERACAO, FINALIZADO, BLOQUEADO_INCIDENTE, CANCELADO"
        enum origem "AGENDADO, AVULSO"
        
        text comentarios "Laudo Técnico / Observações"
    }

    %% VISTORIA E TAGS
    TAG_PECA {
        int id PK
        string nome "Ex: Capô, Porta Dianteira Esq"
        string categoria "frente, lateral_esq, lateral_dir, traseira, interior"
    }

    VISTORIA_ITEM {
        int id PK
        int ordem_servico_id FK
        int tag_peca_id FK
        boolean possui_avaria
        string foto_url
    }

    %% MÍDIAS
    MIDIA_ORDEM_SERVICO {
        int id PK
        int ordem_servico_id FK
        string arquivo_url "S3 / Local Storage"
        enum momento "VISTORIA_GERAL, AVARIA_PREVIA, EXECUCAO, FINALIZADO"
        datetime data_upload
    }

    %% EXCEÇÕES / INCIDENTES
    INCIDENTE_OS {
        int id PK
        int ordem_servico_id FK
        int tag_peca_id FK
        string descricao "Relato detalhado do operador"
        string foto_url "Evidência do dano causado"
        boolean resolvido "Controle para liberação pelo Gestor"
        int resolvido_por_gestor_id FK
        string nota_resolucao "Justificativa/Nota do Gestor para o desbloqueio"
        datetime data_registro
        datetime data_resolucao
    }