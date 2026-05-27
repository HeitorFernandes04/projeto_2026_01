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
| **RF-32.2** | Listagem de Transações | Tabela simples listando as OS que geraram receita, mostrando: Data de Finalização, Placa/Veículo, Nome do Serviço e Valor Cobrado. Deve incluir uma opção (Toggle/Switch) para ocultar ou exibir os dados do veículo (Placa/Modelo) do relatório em tempo real. |
| **RF-32.3** | Filtro de Período | Formulário simples com "Data Inicial" (inicializar no 1º dia do mês corrente) e "Data Final" (hoje). Ao alterar as datas, o totalizador e a tabela devem ser atualizados. |
| **RF-32.4** | Exportação PDF | Botão de "Exportar PDF" que gera um relatório visual de alta qualidade contendo o valor total do período e a tabela de transações usando a biblioteca `jsPDF` no frontend. Se a opção de ocultar veículos estiver ativa, o PDF gerado também não deve exibir os veículos. |

> [!IMPORTANT]
> **Checklist Técnico - RF-32 (Financeiro Simples):**
> Para garantir a qualidade e corretude da entrega, as seguintes abordagens devem ser tomadas:
> - **Cálculo no Banco de Dados (Backend):** A soma total (Faturamento) **NÃO DEVE** ser feita com um `reduce` no Frontend. O backend Django deve usar a função de agregação (`Sum('servico__preco')` ou similar) do ORM para retornar o valor já calculado, garantindo performance.
> - **Geração de PDF com Alta Qualidade:** Utilizar a biblioteca `jsPDF` no Frontend para construir programaticamente e baixar o relatório.
> - **Sem Paginação Complexa Inicialmente:** Como o foco é a simplicidade, a tabela pode exibir todas as transações do mês em uma única view, ou adotar a paginação nativa simples do Angular Material/Componente atual.
> - **Proteção de Rota (Guard Estrito):** A área de gestão administrativa (`/gestao/**`) deve ser de acesso estritamente restrito a usuários com `tipo_perfil === 'GESTOR'`. Qualquer acesso por parte de perfis não autorizados (como funcionários) deve invalidar a sessão (limpar localStorage) e redirecionar imediatamente para a tela de login (`/login`).
> - **Navegação Fluida:** O acesso à parte financeira é feito por um botão lateral na sidebar do gestor, posicionado abaixo de "Histórico" e acima de "Configurações". A transição deve ser fluida e ocorrer na mesma guia/página através do roteador Single Page Application (SPA) do Angular (sem recarregamento total da página).

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
| **CA-01** | A tela carrega exibindo corretamente a soma dos serviços finalizados a partir do 1º dia do mês corrente. |
| **CA-02** | Ao mudar o filtro para a data de "Ontem", a tabela e o totalizador são atualizados para refletir apenas aquele dia. |
| **CA-03** | Ordens de Serviço que estão em status `PATIO` ou `EM_EXECUCAO` não entram na soma financeira, pois ainda não foram pagas/entregues. |
| **CA-04** | Qualquer usuário sem perfil cadastrado de GESTOR que tentar acessar rotas da área de gestão será desconectado e redirecionado para a tela de login. |
| **CA-05** | Ao desmarcar a opção "Exibir dados dos veículos no relatório", os dados de placa/modelo desaparecem da tabela e não são impressos no PDF gerado pela biblioteca `jsPDF`. |

---

> [!IMPORTANT]
> **Mandato TDD:** Escreva os testes abaixo antes de iniciar a implementação da lógica. Eles devem falhar inicialmente (Red) e guiar o desenvolvimento até o sucesso (Green).

## 2. Testes Esperados

### 2.1 Teste 1: Totalização Correta (Backend)
**Descrição:** Criar no banco de dados de teste 2 OS finalizadas de R$ 50,00 e 1 OS em andamento de R$ 30,00.
**Esperado:** O endpoint `/api/gestao/financeiro/resumo/` deve retornar `total_faturado: 100.00` (ignorando a OS não finalizada).

### 2.2 Teste 2: Proteção de Rota Financeira / Gestão (Frontend)
**Descrição:** Renderizar a área de gestão logado com mock de perfil `Funcionario`.
**Esperado:** O Guard da rota deve impedir o acesso, limpar o localStorage contendo o token de acesso e redirecionar o usuário para a tela de login.

---

## 3. Esboço de Usabilidade (Web)
### Página: Gestão Financeira
- **Cabeçalho:** Título da página, filtro de "Data Inicial" e "Data Final", botão "Gerar PDF" e o switch reativo de visibilidade de veículos.
- **Destaque:** Um Card grande (Verde/Primário) com o título "Total Faturado no Período" e o valor gigante formatado (ex: **R$ 4.500,00**).
- **Corpo:** Uma tabela minimalista exibindo: `Data | Veículo (Se ativado) | Serviço | Valor`.
---
