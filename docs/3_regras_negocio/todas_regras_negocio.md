# Regras de Negócio e Requisitos Funcionais (Lava-Me)

Este documento centraliza as principais regras de negócio (RN), requisitos funcionais (RF) e critérios de aceite (CA) mapeados diretamente a partir da base de código do sistema e das integrações de arquitetura.

## 1. Operacional e Fluxo de Serviço (Kanban)
* **RF-04 (Criação de OS)**: A criação de OS via aplicativo do funcionário possui validação rigorosa de data/hora (não permitindo agendamento para o passado fora da margem de tolerância).
* **RF-05 / RF-06 (Upload de Fotos e Galeria)**: Valida limites de arquivos e aplica a Matriz de Status vs Momento. Certas etapas exigem o envio de fotos categóricas (ex: avarias).
* **RF-14 (Quadro Kanban)**: Agrupa OSs operacionais em colunas com os campos mínimos de identificação do cliente e veículo (CA-02). 
* **RN-01 (Trava de Incidentes)**: Bloqueio estrito — é impossível concluir (avançar para `FINALIZADO`) uma OS que possua incidentes (avarias detectadas durante lavagem) não resolvidos pelo gestor.
* **RN-09 (Validação de Vistoria)**: A OS apenas pode transicionar de `PATIO` para `VISTORIA_INICIAL` se o sistema confirmar que existem pelo menos 5 fotos de vistoria geral associadas.
* **RF-27 / RF-30 (State Machine da OS)**: Fluxo simplificado — `PATIO` → `VISTORIA_INICIAL` → `EM_EXECUCAO` → `LIBERACAO` → `FINALIZADO`. A etapa antiga de *Acabamento* foi removida (RF-30).
* **CA-01 (Filtros do Kanban)**: OSs com status `CANCELADO` não são exibidas no Kanban. OSs `FINALIZADO` apenas aparecem se tiverem sido concluídas no próprio dia da consulta.
* **CA-03 (Indicador de Atraso)**: Qualquer OS em `EM_EXECUCAO` que ultrapassar a `duracao_estimada_minutos` estipulada para seu serviço ganha a flag `is_atrasado=True`, mudando a UI para alerta.

## 2. Agendamento B2C e Validação de Disponibilidade
* **RF-21 (Autoagendamento B2C)**: Portal web com rotas públicas que não exigem pré-autenticação para consulta de serviços (Fricção Zero).
* **RF-22 (Grace Period de Horário)**: Implementa uma tolerância de 5 minutos de atraso (Grace Period) caso a operação seja "iniciada agora", mas a validação de milissegundos jogue o timestamp sutilmente para o passado.
* **RF-23 (Integridade de Agendamento)**: Criação de OS para cliente final usa bloqueios no banco de dados (`SELECT FOR UPDATE` / Pessimistic Lock) para evitar Race Conditions de horários simultâneos.
* **RF-24 (Cancelamento Autônomo)**: Clientes podem cancelar suas próprias OSs antes do início do serviço utilizando um UUID (slug) seguro enviado via WhatsApp, sem necessitar de senha/login.
* **RF-27.1 (Proteção de Geo-Coordinates)**: Coordenadas malformadas ou vazias acusam erro no nível do `full_clean` do ORM ao manipular cadastros de estabelecimentos.
* **RF-27.2 (Progresso B2C)**: Acompanhamento em tempo real para o cliente utiliza o campo de porcentagem progressiva (`etapa_atual`).

## 3. Gestão de Clientes e Histórico (B2B e B2C)
* **RF-17 / RF-18 (Histórico Gestor)**: Telas de histórico no painel administrativo consolidam auditoria de incidentes, galeria temporal da OS (fotos de entrada vs saída) e filtragem completa.
* **RF-25 (Painel do Cliente Multicentralizado)**: O sistema identifica OSs atreladas ao cliente consultando `veiculo__cliente`. Se o usuário agendar usando um celular que já existe na base, o sistema vincula o veículo automaticamente. O histórico cruza dados da "Rede", podendo ver OSs de diferentes franquias usando a mesma conta.
* **RF-26 (Transparência Pós-Venda)**: O cliente possui acesso restrito à "Galeria Pública" da OS finalizada, com foco no recibo, avaliação e laudo.
* **RF-31 (Centralização de Auditoria)**: Endpoint único (`/api/shared/historico/`) aplica regras de RLS (Row-Level Security) para exibir a mesma OS de forma diferente caso o requisitante seja Gestor ou Cliente.
* **Avaliação de OS**: Após a finalização, permite a inserção de nota do cliente de 1 a 5 estrelas.

## 4. Financeiro e Multi-Tenancy
* **Axioma 5 (Multi-Tenancy por Estabelecimento)**: O banco de dados é desenhado para abrigar múltiplas lojas/franquias na mesma infraestrutura. Todas as queries do backend obrigatoriamente herdam o `estabelecimento_id` do requisitante.
* **Snapshot de Preços (Integridade Financeira)**: No momento em que uma Ordem de Serviço é criada, o `servico.preco` atual é copiado para a OS como `valor_cobrado`. Mudanças futuras nos preços do catálogo não alteram relatórios retroativos, preservando o balanço histórico da unidade.
