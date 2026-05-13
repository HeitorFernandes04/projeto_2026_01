# 🏁 Plano de Execução Unificado: Sprint 4 (Lava-Me Produção)

Este documento consolida a estratégia, as diretrizes e o cronograma de execução da Sprint 4, servindo como guia único para os 5 desenvolvedores.

---

## 🎯 1. Objetivos da Sprint
1.  **Reestruturação Core (Dev 1):** Banco de dados limpo e preparado para geolocalização.
2.  **Arquitetura B2C (Dev 2):** Setup do app mobile e interface de descoberta (Mapa).
3.  **Jornada B2C (Dev 3):** Fluxo completo de agendamento, checkout e acompanhamento RT.
4.  **Eficiência B2B (Dev 4):** Simplificação da esteira industrial e entrada rápida.
5.  **Unificação e Segurança (Dev 5):** Saneamento de APIs e correção de vulnerabilidades críticas.

---

## 🛠️ 2. Diretrizes de Desenvolvimento (TDD & Docs-First)
Para garantir a blindagem do sistema, todos devem seguir estas regras:
1.  **Documentation-First:** A codificação só começa após a leitura completa da RF. Inconsistências devem ser resolvidas na doc antes do código.
2.  **Test-Driven Development (TDD):** Escreva os testes da **Seção 2** da RF antes da lógica. O status deve ser *Red* (falha) antes de se tornar *Green* (sucesso).
3.  **Validação RAG:** Contratos de API devem ser validados contra o schema atual para evitar quebras de integração.

---

## 👥 3. Matriz de Responsabilidade (1 RF por Desenvolvedor)

| Desenvolvedor | Bloco de Entrega (RF) | Descrição Resumida |
| :--- | :--- | :--- |
| **DEV 1** | **RF-27** | Core e Banco de Dados (Modelos e Reset). |
| **DEV 2** | **RF-28** | Arquitetura B2C e Mapa (Setup e Leaflet). |
| **DEV 3** | **RF-29** | Jornada B2C (Login, Checkout e Painel RT). |
| **DEV 4** | **RF-30** | Operacional B2B (Esteira Otimizada). |
| **DEV 5** | **RF-31** | Unificação de APIs e Segurança (npm audit). |

---

## 📅 4. Cronograma e Dependências

### Fase 1: Fundação (Dias 1-3)
| ID | Tarefa | Dependência | Pode ser feita em paralelo com: |
| :--- | :--- | :--- | :--- |
| **RF-27** | Core e Dados | - | RF-28, RF-30, RF-31 |
| **RF-31** | APIs e Segurança | - | RF-27, RF-28, RF-30 |
| **RF-28** | Setup e Mapa | RF-27 (Campos) | RF-31, RF-30 |

### Fase 2: Jornada e UX (Dias 4-8)
| ID | Tarefa | Dependência | Pode ser feita em paralelo com: |
| :--- | :--- | :--- | :--- |
| **RF-30** | Refatoração B2B | - | RF-27, RF-28, RF-31 |
| **RF-29** | Jornada B2C | RF-28, RF-27 | RF-31 |

### Fase 3: Validação (Dias 9-10)
- QA Integrado e Geração da Release v4.0.0.

---

## 🚀 5. Estratégia de PRs e Qualidade
- **1 PR por Desenvolvedor:** Cada dev é dono da sua PR vinculada à sua RF.
- **Reuso:** Blocos B2C (RF-28/29) devem consumir a lógica do portal web (`autoagendamento.component.ts`).
- **Review:** Nenhuma PR será aceita sem cobertura de testes condizente com a RF.

---
