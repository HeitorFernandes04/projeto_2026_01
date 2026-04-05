erDiagram
    %% Relacionamentos Operacionais
    CLIENTE ||--o{ VEICULO : "cadastra"
    VEICULO ||--o{ ATENDIMENTO : "recebe"
    SERVICO ||--o{ ATENDIMENTO : "vinculado_a"
    FUNCIONARIO ||--o{ ATENDIMENTO : "executa"
    ATENDIMENTO ||--o{ MIDIA_ATENDIMENTO : "contem evidências"
    ATENDIMENTO ||--o{ INCIDENTE_OS : "pode registrar (exceção)"

    ATENDIMENTO {
        int id PK
        int veiculo_id FK
        int servico_id FK
        datetime horario_inicio_real
        datetime horario_fim_real
        enum status "AGENDADO, VISTORIA_INICIAL, EM_EXECUCAO, LIBERACAO, FINALIZADO, BLOQUEADO_INCIDENTE"
    }

    MIDIA_ATENDIMENTO {
        int id PK
        int atendimento_id FK
        string arquivo_url "S3 / Local Storage"
        enum momento "VISTORIA_GERAL, AVARIA_PREVIA, FINALIZADO"
        string tag_peca "Ex: capo, porta_diant_esq (se aplicável)"
    }
    
    INCIDENTE_OS {
        int id PK
        int atendimento_id FK
        string tag_peca "Peça danificada"
        string descricao "Relato do operador"
        string foto_url
        boolean resolvido "Controle do Gestor"
    }