# 1. Funcionalidade: RF-25 Painel do Cliente (Histórico Global)

## 1.1 Use Case
- **Nome:** Consultar Histórico Multicentralizado (B2C)
- **Ator:** Cliente Final
- **Descrição:**  
Permite que o cliente visualize seu histórico completo de ordens de serviço realizadas em qualquer unidade da rede Lava-Me, com a visualização organizada e agrupada por Estabelecimento.

---

## 1.2 Requisitos Funcionais (RFs)

| Número  | Requisito                        | Descrição                                                                                  |
|---------|---------------------------------|--------------------------------------------------------------------------------------------|
| RF-25.1 | Autenticação Unificada          | Acesso via perfil CLIENTE (JWT) válido em todo o ecossistema Lava-Me                       |
| RF-25.2 | Visão Multicentralizada         | O histórico deve listar OSs de todas as unidades, agrupadas por nome do estabelecimento    |
| RF-25.3 | Isolamento por Propriedade      | O cliente visualiza apenas veículos vinculados ao seu CPF/ID, independente da unidade      |
| RF-25.4 | Detalhes Transparentes          | Exibição de Data, Serviço, Placa, Unidade e Status final no portal                         |

---

## 1.3 Requisitos Não Funcionais (RNFs)

| Número | Requisito            | Descrição                                                                                  |
|--------|---------------------|--------------------------------------------------------------------------------------------|
| RNF-01 | Prevenção de IDOR   | Filtro estrito de Titularidade: `where cliente_id = user.id`                               |
| RNF-02 | Agrupamento Lógico  | A UI deve separar claramente as manutenções por unidade para facilitar a conferência        |
| RNF-03 | Privacy by Design   | Dados financeiros internos do estabelecimento não são visíveis ao cliente                  |

---

## 1.4 Endpoints RESTful

### Endpoint: `/api/cliente/historico/`
- **Método:** GET  
- **Descrição:** Lista todas as OSs do cliente autenticado em toda a rede.

---

# 2. Funcionalidade: RF-26 Galeria Pós-Venda (Transparência Limitada)

## 2.1 Requisitos de Visibilidade de Mídias
Para proteger a auditoria interna e evitar exposição de falhas operacionais não resolvidas, a galeria do cliente é restrita:

- **Mídias Visíveis:** Apenas fotos categorizadas como `ENTRADA` (Vistoria Inicial) e `FINALIZACAO` (Entrega).
- **Mídias Ocultas:** Fotos de `INCIDENTE`, `ACABAMENTO` ou `PROCESSO` são estritamente para uso interno e auditoria de gestão.

---

## 2.2 Requisitos Funcionais (RFs)

| Número  | Requisito                  | Descrição                                                                                  |
|---------|---------------------------|--------------------------------------------------------------------------------------------|
| RF-26.1 | Filtro de Categorização   | A API de galeria deve filtrar mídias pelo campo `momento` in ('ENTRADA', 'FINALIZACAO')    |
| RF-26.2 | Condição de Status        | Galeria liberada apenas quando `status = 'FINALIZADO'`                                     |
| RF-26.3 | Ocultação de Incidentes   | Bloqueio total de qualquer metadado ou imagem de incidente operacional para o cliente final |

---

## 2.3 Modelagem de Dados Necessária

- **Entidade Cliente:** Necessário criar model `Cliente` (one-to-one com `User`) para gerenciar a titularidade dos veículos.
- **Vínculo Veículo:** Alterar `Veiculo.cor` para `ChoiceField` e adicionar `ForeignKey(Cliente)`.
- **Categorização de Mídia:** O campo `MidiaOrdemServico.momento` deve ser um `ChoiceField` para garantir o filtro da galeria.

---

# 3. Testes de Qualidade e Segurança

## 3.1 Teste de Privacidade de Mídia
- **Ação:** Cliente acessa galeria de uma OS finalizada que teve incidentes durante o processo.
- **Esperado:** O cliente visualiza as fotos do carro limpo e o estado inicial, mas não vê nenhuma evidência técnica do incidente que ocorreu no pátio.

## 3.2 Teste de Agrupamento por Unidade
- **Ação:** Cliente que lavou o carro nas unidades "Centro" e "Shopping" acessa o portal.
- **Esperado:** A lista exibe os blocos separados por unidade, facilitando a identificação de onde cada serviço foi feito.
