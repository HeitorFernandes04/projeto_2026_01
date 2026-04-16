# Glossário de Domínio: Lava-Me

Este documento serve como a **Fonte da Verdade Semântica** para o projeto. Garanta que a IA use os termos corretos para evitar inconsistências no código.

## 📌 Termos Principais

*   **Ordem de Serviço (Service Order / OS):** O ciclo de vida da execução do serviço automotivo. Substitui o termo legado "Atendimento".
*   **Serviço (Service Type):** O tipo de lavagem ou tratamento (ex: Lavagem Simples, Polimento) com duração estimada e preço vinculados.
*   **Veículo:** Registrado via placa, mantém sempre os dados do portador mais recente.
*   **Pátio (Fila):** Estado inicial dos veículos que possuem OS agendada mas ainda não iniciaram a execução.
*   **Mídia (Fotos):** Evidências do estado do veículo. Requisito técnico para provar o estado do carro.
    *   **Vistoria Geral:** Fotos de entrada (VISTORIA_GERAL). Exige **5 fotos** obrigatórias.
    *   **Liberação / Entrega:** Fotos de saída (FINALIZADO). Exige **5 fotos** obrigatórias.
*   **Incidente:** Dano reportado durante a execução que bloqueia o fluxo da OS até auditoria do Gestor.
*   **Esteira de Produção:** O fluxo progressivo de abas (Vistoria -> Lavagem -> Acabamento -> Liberação).
