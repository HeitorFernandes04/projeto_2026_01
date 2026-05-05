# Catalogo de Endpoints (API REST)

## Autenticacao (`/api/auth/`)
- `POST /api/auth/login/`: Obtem token JWT para Gestor/Funcionario via e-mail e senha.
- `GET /api/auth/meu_perfil/`: Dados do usuario logado e perfil (`GESTOR`, `FUNCIONARIO` ou `CLIENTE`).
- `GET /api/auth/estabelecimento/me/`: Dados da unidade do gestor autenticado.

## Autenticacao B2C (`/api/cliente/`)
- `POST /api/cliente/auth/setup/`: Primeiro acesso B2C. Valida telefone + placa, cria `User` com `username=b2c_[telefone]`, cria perfil `Cliente` e retorna JWT (RF-27).
- `POST /api/cliente/auth/token/`: Login recorrente B2C por telefone + PIN, retornando JWT no body da resposta (RF-27).
- `GET /api/cliente/painel/`: Painel do cliente autenticado, com ordens ativas e historico filtrados pela titularidade atual do cliente (RF-25/RF-27).

## Gestao de Unidade (`/api/gestao/`)
- `GET /api/gestao/estabelecimento/`: Retorna dados da unidade logada.
- `PATCH /api/gestao/estabelecimento/`: Atualiza dados da unidade (RF-13).
- `GET /api/gestao/funcionarios/`: Lista colaboradores da unidade (RF-12).
- `POST /api/gestao/funcionarios/`: Cadastra novo colaborador.
- `GET /api/gestao/dashboard/indicadores`: Dados para cards de metricas (RF-19).
- `GET /api/gestao/dashboard/eficiencia-equipe`: Relatorio de performance (RF-20).

## Operacao de Pista (`/api/ordens-servico/`)
- `GET /api/ordens-servico/hoje/`: Fila do patio para o operador (RF-04).
- `POST /api/ordens-servico/novo/`: Cria OS (Entrada Avulsa ou Agendada - RF-08).
- `GET /api/ordens-servico/kanban/`: Quadro Kanban para o gestor (RF-14).
- `GET /api/ordens-servico/historico/`: Historico com filtros para funcionario/gestao operacional (RF-17).
- `GET /api/ordens-servico/gestor/historico/`: Historico administrativo com paginacao.
- `GET /api/ordens-servico/<id>/`: Detalhes de uma OS especifica.
- `PATCH /api/ordens-servico/<id>/avancar-etapa/`: Transicao de status na esteira (RF-05).
- `PATCH /api/ordens-servico/<id>/finalizar/`: Check-out operacional (RF-07/RF-31).
- `POST /api/ordens-servico/<id>/fotos/`: Upload de midias categorizadas (RF-06/RF-10).
- `POST /api/ordens-servico/publico/agendamento/checkout/`: Checkout publico do autoagendamento, criando `Veiculo` e `OrdemServico` (RF-23).

## Incidentes (`/api/incidentes-os/`)
- `POST /api/ordens-servico/<id>/incidente/`: Relata dano e bloqueia OS (RF-09).
- `GET /api/incidentes-os/pendentes/`: Lista bloqueios para o gestor (RF-15).
- `GET /api/incidentes-os/<id>/auditoria/`: Dados cruzados para analise do gestor (RF-16).
- `PATCH /api/incidentes-os/<id>/resolver/`: Desbloqueio e nota de resolucao.

## Portal Publico (`/api/publico/`)
- `GET /api/publico/estabelecimento/<slug>/`: Dados publicos para autoagendamento (RF-21).
- `GET /api/publico/agendamento/disponibilidade/`: Consulta disponibilidade publica por `slug`, `servicoId` e `data` (RF-22).
