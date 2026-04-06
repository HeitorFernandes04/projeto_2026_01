CONTEXTO E DIRETRIZES DE ARQUITETURA
====================================

Este documento atua como um Registro de Decisão Arquitetural (ADR) para o backend do projeto "Lava-Me" (um sistema SaaS multi-perfil para gestão de lava-jatos).

A arquitetura do backend é **API-First** (Monólito Orientado a Serviços). Os dados são servidos via JSON para clientes React (Web) e Ionic (Mobile). O desenvolvimento das funcionalidades deve respeitar ESTRITAMENTE as seguintes regras inegociáveis:

1\. Metodologia: Test-Driven Development (TDD)
----------------------------------------------

*   **Padrão Red-Green-Refactor:** Os testes unitários e de integração devem ser escritos ANTES da implementação do código funcional.
    
*   **Cobertura de Testes:** Devem ser definidos testes claros em tests/test\_services.py (para a lógica de negócio) e tests/test\_api.py (para o contrato HTTP). Os testes devem cobrir "Caminhos Felizes", "Casos Limite" (Edge Cases) e falhas de segurança (ex: usuário tentando acessar recurso de outro perfil).
    
*   **Mocks e Factories:** Utiliza-se factory\_boy para gerar dados de teste. As factories devem ser definidas em tests/factories.py dentro do respectivo app. Deve-se evitar acoplamento excessivo com o banco de dados quando a lógica puder ser testada isoladamente.
    

2\. Regras de Arquitetura (Camada de Serviço)
---------------------------------------------

*   **Zero Lógica nas Views:** As Views (APIs) servem exclusivamente para roteamento HTTP, validação básica via Serializer e retorno da resposta. Toda regra de negócio (cálculos, transações, alterações de status) DEVE residir no arquivo services.py.
    
*   **Permissões Explícitas:** Toda View deve ter suas classes de permissão explicitamente declaradas. A lógica de verificação de hierarquia fica no arquivo permissions.py (onde se avalia request.user quando aplicável).
    

3\. Regras de Desempenho e Boas Práticas
----------------------------------------

*   **Otimização do ORM (N+1):** É OBRIGATÓRIO o uso de select\_related (ForeignKeys) e prefetch\_related (ManyToMany/Reversos) em qualquer View ou Serviço que liste múltiplos objetos.
    
*   **Tarefas Assíncronas:** Qualquer operação de I/O de rede (ex: envio de e-mails, notificações via WhatsApp) DEVE ser implementada como uma task do Celery (ex: @shared\_task). Nenhuma View pode ser bloqueada por esses processos.
    
*   **Arquivos e Mídia:** Upload de arquivos é feito via ImageField/FileField do Django com armazenamento local (MEDIA\_ROOT). Em ambiente de produção, será migrado para S3 via django-storages.
    
*   **URLs e Rotas:** NUNCA faça hardcode de URLs. Utilize o sistema de roteamento dinâmico do Django. As rotas seguem o padrão api//... (ex: api/atendimentos/).
    

4\. Fluxo de Trabalho e Estrutura de Código
-------------------------------------------

O fluxo de desenvolvimento de uma funcionalidade deve seguir a seguinte ordem de artefatos:

1.  **Testes (test\_services.py e test\_api.py):** Estabelecem o contrato do que será implementado.
    
2.  **Models:** Alterações ou criações estruturais de banco de dados.
    
3.  **Services (services.py):** A lógica de negócio puramente em Python.
    
4.  **Permissions (permissions.py):** As regras de controle de acesso.
    
5.  **Serializers (serializers.py):** A camada de transformação de dados e validação de input/output.
    
6.  **Views (views.py):** A exposição final do serviço via endpoint.