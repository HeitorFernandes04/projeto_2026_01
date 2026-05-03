# 🔌 Catálogo de Endpoints (API REST)

## Autenticação (`/api/auth/`)
- `POST /login/`: Obtém token JWT.
- `POST /refresh/`: Atualiza token JWT.
- `GET /me/`: Dados do usuário logado e perfil (Gestor/Funcionário/Cliente).

## Gestão de Unidade (`/api/gestao/`)
- `GET /estabelecimento/`: Retorna dados da unidade logada (incluindo logo e slug).
- `PATCH /estabelecimento/`: Atualiza dados (RF-13).
- `GET /funcionarios/`: Lista colaboradores da unidade (RF-12).
- `POST /funcionarios/`: Cadastra novo colaborador.
- `GET /dashboard/indicadores`: Dados para cards de métricas (RF-19).
- `GET /dashboard/eficiencia-equipe`: Relatório de performance (RF-20).

## Operação de Pista (`/api/ordens-servico/`)
- `GET /hoje/`: Fila do pátio para o operador (RF-04).
- `POST /novo/`: Cria OS (Entrada Avulsa ou Agendada - RF-08).
- `GET /kanban/`: Quadro Kanban para o gestor (RF-14).
- `GET /historico/`: Histórico com filtros para o funcionário (RF-17).
- `GET /gestor/historico/`: Histórico administrativo com paginação.
- `GET /<id>/`: Detalhes de uma OS específica.
- `PATCH /<id>/avancar-etapa/`: Transição de status na esteira (RF-05).
- `PATCH /<id>/finalizar/`: Check-out operacional (RF-07/RF-31).
- `POST /<id>/fotos/`: Upload de mídias categorizadas (RF-06/RF-10).

## Incidentes (`/api/incidentes-os/`)
- `POST /<id>/incidente/`: Relata dano e bloqueia OS (RF-09).
- `GET /pendentes/`: Lista bloqueios para o gestor (RF-15).
- `GET /<id>/auditoria/`: Dados cruzados para análise do gestor (RF-16).
- `PATCH /<id>/resolver/`: Desbloqueio e nota de resolução.

## Portal Público & Cliente (`/api/publico/` & `/api/cliente/`)
- `GET /api/publico/unidade/<slug>/`: Dados públicos para autoagendamento (RF-21).
- `GET /api/ordens-servico/horarios-livres/`: Consulta disponibilidade (RF-22).
- `GET /api/cliente/historico/`: [EM DESENVOLVIMENTO] Histórico multicentralizado do cliente (RF-25).
