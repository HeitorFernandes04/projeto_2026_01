# Funcionalidade: Cancelamento Autônomo de Agendamento (RF-24)

## 1. Funcionalidade: Cancelamento Autônomo

### 1.1 Use Case
- **Nome:** Cancelar agendamento futuro
- **Ator:** Cliente final
- **Descrição:** Permitir que o cliente cancele sua Ordem de Serviço de forma autônoma, desde que respeite a antecedência mínima, liberando o horário na agenda automaticamente.

---

## 1.2 Requisitos Funcionais (RFs)

| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-24.1** | Cancelamento por Status | Permitido exclusivamente para agendamentos com status `PATIO`. |
| **RF-24.2** | Regra de Antecedência | O cancelamento só é permitido se houver **pelo menos 1 hora de antecedência** em relação ao horário agendado. |
| **RF-24.3** | Identificação Segura | O cancelamento deve ser feito via `slug_cancelamento` (UUID), nunca via ID sequencial. |
| **RF-24.4** | Liberação Automática | Ao cancelar, o horário deve ser liberado instantaneamente para o motor de agendamentos da RF-22. |
| **RF-24.5** | Notificação Interna | O sistema deve emitir um alerta/log para o gestor informando o cancelamento vindo do portal. |

---

## 1.3 Requisitos Não Funcionais (RNFs)

| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Atomicidade | A transição para `CANCELADO` deve usar lock de banco (`select_for_update`) para evitar conflitos com o início da operação. |
| **RNF-02** | Auditoria | O sistema deve registrar `cancelado_em` (data/hora) e o `motivo_cancelamento` no banco de dados. |
| **RNF-03** | Privacidade | O endpoint não deve retornar nenhum dado sensível do estabelecimento ou de funcionários. |

---

## 1.4 Endpoints RESTful

### Endpoint: `/api/agendamento/ordens-servico/{slug_cancelamento}/cancelar/`
- **Método:** `PATCH`
- **Validação:** 
  1. Verifica se o `slug_cancelamento` existe.
  2. Verifica se o status é `PATIO`.
  3. **Verifica a antecedência:** `data_hora_agendamento - now() >= 1 hora`.
- **Resposta Sucesso (200):** Agendamento cancelado e horário liberado.
- **Resposta Falha (400):** "O cancelamento só é permitido com 1 hora de antecedência."
- **Resposta Falha (403):** "Não é possível cancelar um serviço que já foi iniciado."

---

## 1.5 Modelagem de Dados Necessária

- **Campos em OrdemServico:**
  - `slug_cancelamento`: UUIDField (gerado na criação via Portal).
  - `cancelado_em`: DateTimeField (nulo por padrão).
  - `motivo_cancelamento`: TextField (opcional).
  - `cancelado_por`: CharField (padrão: "CLIENTE_PORTAL").

---

## 2. Testes de Aceitação (CAs)

- **CA-01 (Sucesso):** Cliente cancela com 2 horas de antecedência. Status vira `CANCELADO` e horário libera na RF-22.
- **CA-02 (Bloqueio por Tempo):** Cliente tenta cancelar faltando 45 minutos. Sistema rejeita com erro amigável.
- **CA-03 (Bloqueio por Status):** Cliente tenta cancelar uma OS que o operador já deu "Entrada" (Status mudou para `VISTORIA_INICIAL`). Sistema rejeita.
