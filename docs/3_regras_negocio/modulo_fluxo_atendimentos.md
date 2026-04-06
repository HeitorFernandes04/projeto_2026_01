Módulo de Fluxo de Atendimentos
===============================

Este documento centraliza as regras de negócio e Requisitos Funcionais (RFs) relacionados com a operação principal, agendamentos, gestão de serviços, comunicação com o cliente e controlo do ciclo de vida das lavagens da plataforma Lava-Me.

### RF-03 · Visualizar Atendimentos do Dia

**Como** funcionário,**quero** visualizar os atendimentos agendados para o dia,**para que** eu possa me organizar melhor.

**Critérios de Aceitação:**

*   \[ \] Lista de atendimentos exibida por data atual
    
*   \[ \] Informações do veículo e serviço visíveis
    
*   \[ \] Ordenação por horário
    

### RF-04 · Iniciar Atendimento

**Como** funcionário,**quero** iniciar um atendimento,**para que** o sistema registre o início do serviço.

**Critérios de Aceitação:**

*   \[ \] Botão de iniciar atendimento disponível
    
*   \[ \] Registro de horário de início salvo
    
*   \[ \] Status do atendimento atualizado
    

### RF-05 · Registrar Fotos Antes do Atendimento

**Como** funcionário,**quero** tirar fotos do veículo antes do serviço,**para** registrar o estado inicial.

**Critérios de Aceitação:**

*   \[ \] Upload de múltiplas fotos permitido
    
*   \[ \] Fotos vinculadas ao atendimento
    
*   \[ \] Pré-visualização disponível
    

### RF-06 · Registrar Fotos Após o Atendimento

**Como** funcionário,**quero** tirar fotos depois do serviço,**para** demonstrar o resultado final.

**Critérios de Aceitação:**

*   \[ \] Upload de fotos após finalização
    
*   \[ \] Fotos organizadas como “depois”
    
*   \[ \] Associação automática ao atendimento
    

### RF-07 · Adicionar Comentários no Atendimento

**Como** funcionário,**quero** adicionar comentários,**para** registrar ocorrências durante o serviço.

**Critérios de Aceitação:**

*   \[ \] Campo de texto disponível
    
*   \[ \] Comentários salvos no atendimento
    
*   \[ \] Histórico visível
    

### RF-08 · Criar Atendimento Manual

**Como** funcionário,**quero** cadastrar um atendimento na hora,**para** atender clientes sem agendamento.

**Critérios de Aceitação:**

*   \[ \] Formulário com dados do veículo
    
*   \[ \] Seleção de serviço disponível
    
*   \[ \] Salvamento imediato
    

### RF-09 · Agendar Atendimento em Horário Vago

**Como** funcionário,**quero** agendar um atendimento,**para** organizar horários disponíveis.

**Critérios de Aceitação:**

*   \[ \] Visualização de horários livres
    
*   \[ \] Bloqueio de conflitos
    
*   \[ \] Confirmação de agendamento
    

### RF-10 · Visualizar Histórico de Atendimentos

**Como** funcionário,**quero** ver meus atendimentos realizados,**para** acompanhar meu desempenho.

**Critérios de Aceitação:**

*   \[ \] Filtro por período
    
*   \[ \] Lista com atendimentos realizados
    
*   \[ \] Informações resumidas
    

### RF-12 · Gerenciar Serviços

**Como** gestor,**quero** gerenciar os serviços oferecidos,**para** manter o catálogo atualizado.

**Critérios de Aceitação:**

*   \[ \] Criar, editar e excluir serviços
    
*   \[ \] Definir preço e descrição
    
*   \[ \] Listagem disponível
    

### RF-18 · Agendamento de Serviço

**Como** cliente,**quero** agendar um serviço,**para** garantir atendimento.

**Critérios de Aceitação:**

*   \[ \] Escolha de data e horário
    
*   \[ \] Seleção de serviço
    
*   \[ \] Confirmação do agendamento
    

### RF-19 · Autoagendamento via Link

**Como** cliente,**quero** agendar por link,**para** facilitar o acesso.

**Critérios de Aceitação:**

*   \[ \] Link funcional
    
*   \[ \] Interface simples
    
*   \[ \] Confirmação automática
    

### RF-21 · Enviar Fotos no Agendamento

**Como** cliente,**quero** enviar fotos do veículo,**para** informar o estado antes do serviço.

**Critérios de Aceitação:**

*   \[ \] Upload de imagens
    
*   \[ \] Associação ao agendamento
    
*   \[ \] Visualização prévia
    

### RF-22 · Visualizar Histórico de Serviços

**Como** cliente,**quero** ver meu histórico,**para** acompanhar serviços realizados.

**Critérios de Aceitação:**

*   \[ \] Lista de serviços
    
*   \[ \] Filtro por período
    
*   \[ \] Informações detalhadas
    

### RF-23 · Visualizar Fotos do Atendimento

**Como** cliente,**quero** ver fotos do antes e depois,**para** validar o serviço.

**Critérios de Aceitação:**

*   \[ \] Exibição de fotos
    
*   \[ \] Separação antes/depois
    
*   \[ \] Disponível por até 60 dias
    

### RF-24 · Notificação de Confirmação

**Como** sistema,**quero** notificar o cliente,**para** confirmar o agendamento.

**Critérios de Aceitação:**

*   \[ \] Notificação via app
    
*   \[ \] Mensagem via WhatsApp
    
*   \[ \] Confirmação registrada
    

### RF-25 · Lembrete de Atendimento

**Como** sistema,**quero** enviar lembretes,**para** reduzir faltas.

**Critérios de Aceitação:**

*   \[ \] Envio automático
    
*   \[ \] Configuração de horário
    
*   \[ \] Registro de envio
    

### RF-26 · Busca de Atendimentos por Veículo

**Como** gestor,**quero** buscar atendimentos por veículo,**para** localizar registros rapidamente.

**Critérios de Aceitação:**

*   \[ \] Busca por placa
    
*   \[ \] Resultados filtrados
    
*   \[ \] Exibição clara
    

### RF-27 · Busca por Serviço

**Como** gestor,**quero** buscar por serviço,**para** analisar execução.

**Critérios de Aceitação:**

*   \[ \] Filtro por tipo de serviço
    
*   \[ \] Resultados organizados
    
*   \[ \] Dados relevantes exibidos
    

### RF-28 · Busca por Data

**Como** gestor,**quero** buscar atendimentos por data,**para** análises temporais.

**Critérios de Aceitação:**

*   \[ \] Filtro por período
    
*   \[ \] Resultados corretos
    
*   \[ \] Performance adequada
    

### RF-29 · Acesso a Fotos por Período

**Como** gestor,**quero** acessar fotos de atendimentos,**para** auditoria e controle de qualidade.

**Critérios de Aceitação:**

*   \[ \] Disponível por 60 dias
    
*   \[ \] Associação correta com atendimento
    
*   \[ \] Visualização organizada