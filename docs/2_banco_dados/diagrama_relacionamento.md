# Diagrama Entidade-Relacionamento (ERD)\n\n*Gerado automaticamente pelo Agente MCP.*\n\n```mermaid\n20 objects imported automatically (use -v 2 for details).

erDiagram
  ResetPasswordToken }|--|| User : user
  IncidenteOS }|--|| User : gestor_resolucao
  IncidenteOS }|--|| TagPeca : tag_peca
  IncidenteOS }|--|| OrdemServico : ordem_servico
  MidiaOrdemServico }|--|| OrdemServico : ordem_servico
  OrdemServico }|--|| User : funcionario
  OrdemServico }|--|| Servico : servico
  OrdemServico }|--|| Veiculo : veiculo
  OrdemServico }|--|| Estabelecimento : estabelecimento
  OrdemServico }|--|| IncidenteOS : incidentes
  OrdemServico }|--|| MidiaOrdemServico : midias
  OrdemServico }|--|| VistoriaItem : vistoria_items
  VistoriaItem }|--|| TagPeca : tag_peca
  VistoriaItem }|--|| OrdemServico : ordem_servico
  TagPeca }|--|| Estabelecimento : estabelecimento
  TagPeca }|--|| IncidenteOS : incidenteos
  TagPeca }|--|| VistoriaItem : vistoriaitem
  Veiculo }|--|| Cliente : cliente
  Veiculo }|--|| Estabelecimento : estabelecimento
  Veiculo }|--|| OrdemServico : ordemservico
  Servico }|--|| Estabelecimento : estabelecimento
  Servico }|--|| OrdemServico : ordemservico
  Gestor }|--|| Estabelecimento : estabelecimento
  Gestor }|--|| User : user
  Funcionario }|--|| Estabelecimento : estabelecimento
  Funcionario }|--|| User : user
  Cliente }|--|| User : user
  Cliente }|--|| Veiculo : veiculos
  User }|--|| Permission : user_permissions
  User }|--|| Group : groups
  User }|--|| ResetPasswordToken : password_reset_tokens
  User }|--|| IncidenteOS : incidentes_resolvidos
  User }|--|| OrdemServico : ordemservico
  User }|--|| Gestor : perfil_gestor
  User }|--|| Funcionario : perfil_funcionario
  User }|--|| Cliente : perfil_cliente
  User }|--|| Token : auth_token
  User }|--|| LogEntry : logentry
  Estabelecimento }|--|| OrdemServico : ordemservico
  Estabelecimento }|--|| TagPeca : tagpeca
  Estabelecimento }|--|| Veiculo : veiculo
  Estabelecimento }|--|| Servico : servicos
  Estabelecimento }|--|| Gestor : gestores
  Estabelecimento }|--|| Funcionario : funcionarios
  TokenProxy }|--|| User : user
  Token }|--|| User : user
  ContentType }|--|| Permission : permission
  ContentType }|--|| LogEntry : logentry
  Group }|--|| Permission : permissions
  Group }|--|| User : user
  Permission }|--|| ContentType : content_type
  Permission }|--|| User : user
  Permission }|--|| Group : group
  LogEntry }|--|| ContentType : content_type
  LogEntry }|--|| User : user
  LogEntry {
    AutoField id
    DateTimeField action_time
    TextField object_id
    CharField object_repr
    PositiveSmallIntegerField action_flag
    TextField change_message
  }
  Permission {
    AutoField id
    CharField name
    CharField codename
  }
  Group {
    AutoField id
    CharField name
  }
  ContentType {
    AutoField id
    CharField app_label
    CharField model
  }
  Session {
    CharField session_key
    TextField session_data
    DateTimeField expire_date
  }
  Token {
    CharField key
    DateTimeField created
  }
  TokenProxy {
    CharField key
    DateTimeField created
  }
  Estabelecimento {
    BigAutoField id
    CharField nome_fantasia
    CharField cnpj
    CharField endereco_completo
    BooleanField is_active
    SlugField slug
    ImageField logo
    TimeField horario_abertura
    TimeField horario_fechamento
    FloatField latitude
    FloatField longitude
    DecimalField avaliacao_media
  }
  User {
    BigAutoField id
    CharField password
    DateTimeField last_login
    BooleanField is_superuser
    CharField username
    CharField first_name
    CharField last_name
    BooleanField is_staff
    BooleanField is_active
    DateTimeField date_joined
    EmailField email
    CharField name
  }
  Cliente {
    BigAutoField id
    CharField telefone_whatsapp
    CharField endereco_padrao
  }
  Funcionario {
    BigAutoField id
    CharField cargo
  }
  Gestor {
    BigAutoField id
  }
  Servico {
    BigAutoField id
    CharField nome
    DecimalField preco
    PositiveIntegerField duracao_estimada_minutos
    BooleanField is_active
  }
  Veiculo {
    BigAutoField id
    CharField placa
    CharField modelo
    CharField marca
    CharField cor
    CharField nome_dono
    CharField celular_dono
  }
  TagPeca {
    BigAutoField id
    CharField nome
    CharField categoria
  }
  VistoriaItem {
    BigAutoField id
    BooleanField possui_avaria
    ImageField foto_url
  }
  OrdemServico {
    BigAutoField id
    CharField status
    DateTimeField data_hora
    DecimalField valor_cobrado
    TextField laudo_vistoria
    DateTimeField horario_lavagem
    TextField comentario_lavagem
    CharField vaga_patio
    DateTimeField horario_finalizacao
    TextField observacoes
    BooleanField is_pausado
    IntegerField tempo_acumulado_segundos
    PositiveSmallIntegerField etapa_atual
    UUIDField slug_cancelamento
    DateTimeField cancelado_em
    TextField motivo_cancelamento
    CharField cancelado_por
    IntegerField avaliacao_estrelas
  }
  MidiaOrdemServico {
    BigAutoField id
    ImageField arquivo
    CharField momento
  }
  IncidenteOS {
    BigAutoField id
    TextField descricao
    ImageField foto_url
    CharField status_anterior_os
    BooleanField resolvido
    DateTimeField data_registro
    DateTimeField data_resolucao
    TextField observacoes_resolucao
  }
  ResetPasswordToken {
    AutoField id
    DateTimeField created_at
    CharField key
    GenericIPAddressField ip_address
    CharField user_agent
  }
\n```