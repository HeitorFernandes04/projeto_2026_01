# Padrões de Desenvolvimento Backend (Django)

Este documento define as regras absolutas que a equipe e a IA devem seguir ao gerar ou modificar código no projeto backend do Lava-Me.

## 📌 1. Padrão de Camadas (Architecture)
O Lava-Me utiliza uma arquitetura baseada em serviços para manter as lógicas de negócio testáveis e independentes das requisições HTTP.

*   `models.py`: Define exclusivamente as tabelas do banco, relacionamentos, limites estruturais e constantes de escolhas limitadas (Choices).
*   `serializers.py`: Responsável apenas por _parsing_ de JSON para objetos Python, validação de tipos primários (ex: formato de email, datas vazias) e roteamento de dados pre-existentes. **Nunca** deve conter lógica de negócio (ex: checagem de horários em conflito).
*   `views.py`: Ponto de entrada (Controllers). As views validam quem o usuário é (Permissions), invocam o serializador e **delegam a execução real para o `services.py`**.
*   `services.py`: O coração da regra de negócio. Toda validação de estado (ex: "um carro não pode iniciar serviço sem agendamento") vive aqui, preferencialmente disparando `ValidationError`.

## 📌 2. Segurança e Permissões
1.  **Isolamento Mútuo**: Requisições de listagem (RF-10) sempre filtram em nível de query pelo `request.user`. Jamais devolva todos os itens livremente.
2.  **Travas de Concorrência**: Endpoints que alteram estado crítico (iniciar atendimento) devem consultar ativamente os estados simultâneos (prevenindo dois funcionários iniciarem a mesma lavagem).

## 📌 3. Upload de Mídia (Pillow e Capacitor)
*   **Armazenamento**: Nenhuma imagem é upada de forma bruta. Serviços devem utilizar processamento Pillow (`MidiaAtendimentoService._comprimir_imagem`) para gerar JPEGs otimizados, removendo transparências se preciso (RGBA->RGB).
*   **Regulamentação**: Há um limite máximo de 5 fotos por momento (ANTES/DEPOIS).
