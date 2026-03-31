erDiagram
    %% Hierarquia de Usuários e Perfis
    USER ||--|| CLIENTE : "possui perfil"
    USER ||--|| FUNCIONARIO : "possui perfil"
    USER ||--|| GESTOR : "possui perfil"

    %% Relacionamentos Principais
    ESTABELECIMENTO ||--o{ SERVICO : "oferece"
    ESTABELECIMENTO ||--o{ FUNCIONARIO : "contrata"
    CLIENTE ||--o{ VEICULO : "cadastra"
    VEICULO ||--o{ ATENDIMENTO : "recebe"
    SERVICO ||--o{ ATENDIMENTO : "vinculado_a"
    FUNCIONARIO ||--o{ ATENDIMENTO : "executa"
    ATENDIMENTO ||--o{ MIDIA_ATENDIMENTO : "contem"

    USER {
        int id PK
        string email "Login (RF-01, RF-02)"
        string password
        string nome_completo
        enum tipo_usuario "CLIENTE, FUNCIONARIO, GESTOR"
        boolean is_active
        datetime date_joined
    }

    CLIENTE {
        int id PK
        int user_id FK
        string telefone_whatsapp "Para notificações (RF-24, RF-25)"
        string endereco_padrao
    }

    FUNCIONARIO {
        int id PK
        int user_id FK
        int estabelecimento_id FK
        string cargo
        boolean status_ativo "Controle (RF-11)"
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
        float latitude "Para Mapa (Módulo Mobile)"
        float longitude "Para Mapa (Módulo Mobile)"
        string link_autoagendamento "URL única (RF-19)"
    }

    VEICULO {
        int id PK
        int cliente_id FK
        string placa "Busca (RF-26)"
        string modelo
        string marca
        string cor
        string ano
    }

    SERVICO {
        int id PK
        int estabelecimento_id FK
        string nome "Ex: Lavagem Simples (RF-12)"
        string descricao
        decimal preco "Valor base"
        int duracao_estimada_minutos
    }

    ATENDIMENTO {
        int id PK
        int veiculo_id FK
        int servico_id FK
        int funcionario_id FK "Opcional no agendamento"
        datetime data_hora_agendada "Agenda (RF-03, RF-09)"
        datetime horario_inicio_real "Registro (RF-04)"
        datetime horario_fim_real
        decimal valor_cobrado "Snapshot do preço no ato"
        enum status "AGENDADO, EM_ANDAMENTO, FINALIZADO, CANCELADO"
        text comentarios "Ocorrências (RF-07)"
    }

    MIDIA_ATENDIMENTO {
        int id PK
        int atendimento_id FK
        string arquivo_url "Caminho da imagem"
        enum momento "ANTES, DEPOIS (RF-05, RF-06)"
        datetime data_upload
    }