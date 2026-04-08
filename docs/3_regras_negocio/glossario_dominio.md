# Glossário de Domínio: Lava-Me

Este documento serve como a **Fonte da Verdade Semântica** para o projeto. Garanta que a IA use os termos corretos para evitar inconsistências no código.

## 📌 Termos Principais

*   **Atendimento (Service/Attendance):** A execução do serviço automotivo. O ciclo de vida compreende: *Agendado -> Em Andamento -> Finalizado*.
*   **Serviço (Service Type):** O tipo de lavagem ou tratamento (ex: Lavagem Simples, Polimento) com duração estimada vinculada.
*   **Veículo:** Registrado via placa, mantém sempre os dados do portador mais recente.
*   **Funcionário:** Usuário do sistema com permissão de executar atendimentos. Apenas um funcionário pode ser atrelado a um atendimento.
*   **Mídia (Fotos):** Evidências do estado do veículo. Requisito legal do sistema para provar o estado do carro.
    *   **Momento ANTES:** O estado de entrada do veículo.
    *   **Momento DEPOIS:** O estado do veículo concluído, obrigatório para finalizar o atendimento.
*   **Claim (Assumir Atendimento):** A transição de status em que um funcionário ociosono "toma posse" do atendimento, alterando do status agendado para "em andamento". Em um mesmo dia, é bloqueado "multitarefa" simultânea.
