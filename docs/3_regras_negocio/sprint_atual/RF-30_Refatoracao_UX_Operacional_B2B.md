# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: RF-30 - Refatoração de UX e Operacional B2B

### 1.1 Use Case
**Nome:** Fluxo de Pista Otimizado (Entrada Rápida)

**Ator:** Funcionário (Operador de Pista)

**Descrição:** O funcionário utiliza o aplicativo móvel B2B para realizar o check-in e a execução das lavagens. O fluxo foi simplificado para remover a etapa de acabamento e permitir uma entrada mais rápida de veículos.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-30.1** | Remoção do Estágio de Acabamento | A interface de "Esteira de Produção" deve pular do status `EM_EXECUCAO` diretamente para `LIBERACAO`. |
| **RF-30.2** | Renomeação de Fluxos | Alterar todos os textos de "Atendimento Avulso" para "Entrada Rápida" em botões e títulos. |
| **RF-30.3** | UI de Execução Única | Consolidar a tela de "Lavagem" para que inclua as notas finais (que antes ficavam no acabamento). |

> [!IMPORTANT]
> **Checklist Técnico - RF-30 (Refatoração de Máquina de Estados e UX B2B):**
> Para garantir que a remoção do "Acabamento" não deixe lixo no código ou gere bugs silenciosos (ex: tela em branco), as seguintes ações são mandatórias:
> - **Exclusão Física de Código Órfão:** Componentes e estilos antigos (ex: `EstadoAcabamento.tsx`) devem ser fisicamente **deletados** do repositório, e não apenas comentados ou deixados sem roteamento.
> - **Sanitização da "Entrada Rápida" (Resolução DT-015):** Ao alterar os fluxos de "Avulso" para "Entrada", o desenvolvedor deve substituir a digitação livre no campo **"Cor"** do veículo por um componente de múltipla escolha (`<IonSelect>` com dicionários predefinidos), impedindo erros de digitação ("Branco" vs "branco"). Os campos "Marca" e "Modelo" permanecem como texto livre.
> - **Ajuste de Geometria Visual (Stepper):** O componente visual de progresso (a barra horizontal) que antes calculava larguras para 4 passos precisará ter seu CSS/flexbox ajustado para 3 passos, garantindo um layout harmonioso.

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Coerência Visual | Garantir que o ícone de 'brilho' (sparkles) que representava o acabamento seja removido ou ressignificado. |
| **RNF-02** | Velocidade de Fluxo | A transição entre telas deve ser imediata (< 200ms). |

### 1.4 Endpoints RESTful e Dependências de Backend
- **PATCH** `/api/operacao/os/{id}/avancar/` - Deve pular o status `ACABAMENTO` na máquina de estados do Django.
- **Dependência:** RF-27 (Campos de acabamento removidos do banco).

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | O operador não consegue mais visualizar a aba "Acabamento", e os componentes de código relacionados a ela foram fisicamente deletados da base do App B2B. |
| **CA-02** | Ao finalizar a Lavagem, o veículo vai direto para "Aguardando Retirada" (Liberação). |
| **CA-03** | O botão de "Entrada Rápida" exibe a nova nomenclatura consistentemente por todo o App B2B. |
| **CA-04** | O formulário de "Entrada Rápida" utiliza seletor do Ionic (`<IonSelect>`) exclusivamente para a "Cor", enquanto "Marca" e "Modelo" aceitam texto livre. |

---

> [!IMPORTANT]
> **Mandato TDD:** Escreva os testes abaixo antes de iniciar a implementação da lógica. Eles devem falhar inicialmente (Red) e guiar o desenvolvimento até o sucesso (Green).

## 2. Testes Esperados

### 2.1 Teste 1: Fluxo Completo de Esteira
**Descrição:** Iniciar uma OS e avançar todas as etapas.
**Esperado:** 
1. Entrada -> 2. Execução (Lavagem) -> 3. Liberação. 
O sistema não deve travar pedindo campos de acabamento.

### 2.2 Teste 2: Consistência de Labels
**Descrição:** Navegar por todo o app procurando o texto "Avulso".
**Esperado:** Nenhum resultado encontrado; todos os locais exibem "Entrada Rápida".

---

## 3. Esboço de Usabilidade (Wireframes B2B)
### Tela de Esteira Ativa
- **Steps:** Indicador visual no topo mostrando apenas 3 fases (Check-in, Lavagem, Entrega).
- **Botão Principal:** "Finalizar e Liberar" (Destaque verde vibrante).
---
