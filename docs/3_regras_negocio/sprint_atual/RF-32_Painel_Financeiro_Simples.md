# 🧱 Modelo de Documentação de Funcionalidade
---

## 1. Funcionalidade: RF-32 - Painel Financeiro Básico (Web)

### 1.1 Use Case
**Nome:** Relatório Simples de Faturamento
**Ator:** Gestor
**Descrição:** O gestor acessa uma página dedicada no portal Web (Angular) para visualizar, de forma clara e direta, o total de ganhos do lava-jato em um determinado período e a lista detalhada dos serviços que geraram essa receita.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-32.1** | Card de Totalização | Exibir um card em destaque (ex: cor verde) mostrando a soma total em Reais (R$) do faturamento das Ordens de Serviço `FINALIZADAS`. |
| **RF-32.2** | Listagem de Transações | Tabela simples listando as OS que geraram receita, mostrando: Data de Finalização, Placa/Veículo, Nome do Serviço e Valor Cobrado. |
| **RF-32.3** | Filtro de Período | Formulário simples com "Data Inicial" e "Data Final" (por padrão, carregar o mês atual). Ao alterar as datas, o totalizador e a tabela devem ser atualizados. |
| **RF-32.4** | Exportação PDF | Botão de "Exportar PDF" que gera um relatório visual limpo contendo o valor total do período e a tabela listada. |

> [!IMPORTANT]
> **Checklist Técnico - RF-32 (Financeiro Simples):**
> Para garantir que a entrega seja o "mais simples possível" e não atrase a Sprint, as seguintes abordagens devem ser tomadas:
> - **Cálculo no Banco de Dados (Backend):** A soma total (Faturamento) **NÃO DEVE** ser feita com um `reduce` no Frontend. O backend Django deve usar a função de agregação (`Sum('valor_total')`) do ORM para retornar o valor já calculado, garantindo performance.
> - **Geração de PDF Leve:** O desenvolvedor não deve criar fluxos complexos no backend (como Celery + WeasyPrint) se não houver tempo. É totalmente aceitável gerar o PDF via Frontend (usando bibliotecas como `jspdf` / `html2canvas` ou até configurando um CSS rigoroso para `@media print` e invocando a impressão nativa do navegador em modo PDF).
> - **Sem Paginação Complexa Inicialmente:** Como o foco é a simplicidade, a tabela pode exibir todas as transações do mês em uma única view, ou adotar a paginação nativa simples do Angular Material/Componente atual.
> - **Proteção de Rota (Guard):** No Angular, esta rota (`/financeiro`) deve obrigatoriamente estar protegida por um Guard que verifique se o `role` do usuário logado é estritamente `GESTOR`.

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Privacidade / Isolamento | Dados financeiros não devem em hipótese alguma ser trafegados em respostas de API se o token requisitante pertencer a um "Funcionário" ou "Cliente". |
| **RNF-02** | Formatação de Moeda | Os valores devem ser exibidos formatados no padrão BRL (`R$ 0,00`) usando o *Pipe* nativo de moeda do Angular. |

### 1.4 Endpoints RESTful e Dependências de Backend
- **GET** `/api/gestao/financeiro/resumo/?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD`
  - **Retorno Esperado:** Payload com chave `total_faturado` e a lista `transacoes`.
- **Dependência:** Nenhuma dependência direta, além do funcionamento do fluxo de conclusão de OS.

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | A tela carrega exibindo corretamente a soma dos serviços finalizados no mês vigente. |
| **CA-02** | Ao mudar o filtro para a data de "Ontem", a tabela e o totalizador são atualizados para refletir apenas aquele dia. |
| **CA-03** | Ordens de Serviço que estão em status `PATIO` ou `EM_EXECUCAO` não entram na soma financeira, pois ainda não foram pagas/entregues. |
| **CA-04** | Um usuário com perfil de Funcionário que tentar digitar a URL de financeiro será barrado pelo Angular Guard e redirecionado. |

---

> [!IMPORTANT]
> **Mandato TDD:** Escreva os testes abaixo antes de iniciar a implementação da lógica. Eles devem falhar inicialmente (Red) e guiar o desenvolvimento até o sucesso (Green).

## 2. Testes Esperados

### 2.1 Teste 1: Totalização Correta (Backend)
**Descrição:** Criar no banco de dados de teste 2 OS finalizadas de R$ 50,00 e 1 OS em andamento de R$ 30,00.
**Esperado:** O endpoint `/api/gestao/financeiro/resumo/` deve retornar `total_faturado: 100.00` (ignorando a OS não finalizada).

### 2.2 Teste 2: Proteção de Rota Financeira (Frontend)
**Descrição:** Renderizar o componente Web logado com mock de perfil `Funcionario`.
**Esperado:** O Guard da rota deve impedir o carregamento do componente e redirecionar para a visualização da Pista (Esteira).

---

## 3. Esboço de Usabilidade (Web)
### Página: Gestão Financeira
- **Cabeçalho:** Filtro de "Data Inicial" e "Data Final" com botões "Filtrar" e "Gerar PDF".
- **Destaque:** Um Card grande (Verde/Primário) com o título "Total Faturado no Período" e o valor gigante (ex: **R$ 4.500,00**).
- **Corpo:** Uma tabela minimalista exibindo: `Data | Veículo | Serviço | Valor`. Sem gráficos complexos neste MVP.
---
