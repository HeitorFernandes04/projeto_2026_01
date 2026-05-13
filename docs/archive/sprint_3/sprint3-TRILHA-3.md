# 1. Funcionalidade: RF-25 Painel do Cliente (Historico Global)

## 1.1 Use Case
- **Nome:** Consultar Historico Multicentralizado (B2C)
- **Ator:** Cliente Final
- **Descricao:**  
Permite que o cliente visualize seu historico completo de ordens de servico realizadas na rede Lava-Me, com visualizacao organizada e preparada para agrupamento por Estabelecimento.

---

## 1.2 Requisitos Funcionais (RFs)

| Numero  | Requisito                        | Descricao                                                                                  |
|---------|----------------------------------|--------------------------------------------------------------------------------------------|
| RF-25.1 | Autenticacao Unificada           | Acesso via perfil `CLIENTE` (JWT) valido no ecossistema Lava-Me.                           |
| RF-25.2 | Visao Multicentralizada          | O historico deve listar OSs do cliente, preparado para agrupamento por estabelecimento.     |
| RF-25.3 | Isolamento por Propriedade       | O cliente visualiza apenas veiculos vinculados a sua titularidade.                         |
| RF-25.4 | Detalhes Transparentes           | Exibicao de data, servico, placa, unidade e status no portal.                              |

---

## 1.3 Requisitos Nao Funcionais (RNFs)

| Numero | Requisito            | Descricao                                                                                  |
|--------|----------------------|--------------------------------------------------------------------------------------------|
| RNF-01 | Prevencao de IDOR    | Filtro estrito de titularidade via perfil `Cliente` vinculado ao `Veiculo`.               |
| RNF-02 | Agrupamento Logico   | A UI deve separar claramente as manutencoes por unidade quando houver dados multicentro.    |
| RNF-03 | Privacy by Design    | Dados financeiros internos do estabelecimento nao sao visiveis ao cliente.                 |

---

## 1.3.1 Nota de Implementacao Atual (Auth B2C + Vinculo Cliente/Veiculo)
A autenticacao B2C por telefone e PIN valida a posse inicial usando a combinacao `placa` + telefone normalizado (`Cliente.telefone_whatsapp` x `Veiculo.celular_dono`).

Apos a validacao, o backend vincula de forma conservadora os veiculos orfaos ao perfil `Cliente` (`Veiculo.cliente`). O painel passa a consultar ordens por `veiculo__cliente`, reduzindo fragilidade por mascara de telefone e mantendo prevencao de IDOR. O vinculo automatico nao sobrescreve veiculos que ja estejam associados a outro cliente.

Endpoints implementados pela Auth B2C:
- `POST /api/cliente/auth/setup/`
- `POST /api/cliente/auth/token/`
- `GET /api/cliente/painel/`

---

## 1.4 Endpoints RESTful

### Endpoint: `/api/cliente/painel/`
- **Metodo:** GET  
- **Descricao:** Lista ordens ativas e historico do cliente autenticado. A titularidade e filtrada por `Veiculo.cliente = request.user.perfil_cliente`; o telefone normalizado e usado apenas para reparar/vincular veiculos orfaos do proprio cliente.

### Endpoint: `/api/cliente/historico/{id}/galeria/`
- **Metodo:** GET
- **Descricao:** Integra RF-26 ao historico da RF-25. Retorna a galeria publica de transparencia somente para OS finalizada pertencente ao cliente autenticado.

---

# 2. Funcionalidade: RF-26 Galeria Pos-Venda (Transparencia Limitada)

## 2.1 Requisitos de Visibilidade de Midias
Para proteger a auditoria interna e evitar exposicao de falhas operacionais nao resolvidas, a galeria do cliente e restrita:

- **Midias Visiveis:** Apenas fotos categorizadas como `ENTRADA`/vistoria inicial e `FINALIZACAO`/entrega.
- **Midias Ocultas:** Fotos de `INCIDENTE`, `ACABAMENTO` ou `PROCESSO` sao estritamente para uso interno e auditoria de gestao.

---

## 2.2 Requisitos Funcionais (RFs)

| Numero  | Requisito                  | Descricao                                                                                  |
|---------|----------------------------|--------------------------------------------------------------------------------------------|
| RF-26.1 | Filtro de Categorizacao    | A API de galeria deve filtrar midias pelo campo `momento` conforme categorias permitidas.  |
| RF-26.2 | Condicao de Status         | Galeria liberada apenas quando `status = 'FINALIZADO'`.                                    |
| RF-26.3 | Ocultacao de Incidentes    | Bloqueio total de metadados ou imagens de incidente operacional para o cliente final.      |
| RF-26.4 | Integracao com Historico   | A galeria deve ser acessada a partir da OS finalizada exibida no historico RF-25.          |

---

## 2.3 Modelagem de Dados Necessaria / Evolucao Futura

- **Entidade Cliente:** O model `Cliente` (one-to-one com `User`) ja existe e foi reutilizado pela Auth B2C.
- **Vinculo Veiculo:** O model `Veiculo` possui `cliente = ForeignKey(Cliente, null=True, blank=True)`. A Auth B2C usa telefone normalizado para prova inicial de posse e, em seguida, vincula veiculos orfaos ao `Cliente`. A consulta do painel/historico usa o vinculo relacional `veiculo__cliente`.
- **Categorizacao de Midia:** O campo `MidiaOrdemServico.momento` deve ser um `ChoiceField` para garantir o filtro da galeria.
- **Integracao RF-25/RF-26:** A RF-25 lista OSs finalizadas no historico; a RF-26 abre a galeria publica pelo identificador da OS, mantendo validacao de titularidade e `status = FINALIZADO`.

---

# 3. Testes de Qualidade e Seguranca

## 3.1 Teste de Privacidade de Midia
- **Acao:** Cliente acessa galeria de uma OS finalizada que teve incidentes durante o processo.
- **Esperado:** O cliente visualiza as fotos permitidas, mas nao ve evidencia tecnica do incidente do patio.

## 3.2 Teste de Agrupamento por Unidade
- **Acao:** Cliente que lavou o carro nas unidades "Centro" e "Shopping" acessa o portal.
- **Esperado:** A lista exibe blocos separados por unidade, facilitando a identificacao de onde cada servico foi feito.

## 3.3 Teste de Titularidade Atual
- **Acao:** Cliente autenticado acessa `/api/cliente/painel/`.
- **Esperado:** A API retorna apenas OSs de veiculos vinculados ao perfil `Cliente`. Se houver veiculo orfao com telefone equivalente normalizado, o vinculo e reparado antes da listagem.

## 3.4 Teste de Integracao RF-25/RF-26
- **Acao:** Cliente acessa o historico RF-25, escolhe uma OS `FINALIZADO` e abre a galeria RF-26.
- **Esperado:** A API retorna apenas fotos publicas (`entrada` e `finalizacao`) e laudo tecnico resumido da OS pertencente ao cliente.

