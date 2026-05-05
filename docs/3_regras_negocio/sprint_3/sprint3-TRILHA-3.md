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
| RNF-01 | Prevencao de IDOR    | Filtro estrito de titularidade. Na implementacao atual, telefone normalizado.              |
| RNF-02 | Agrupamento Logico   | A UI deve separar claramente as manutencoes por unidade quando houver dados multicentro.    |
| RNF-03 | Privacy by Design    | Dados financeiros internos do estabelecimento nao sao visiveis ao cliente.                 |

---

## 1.3.1 Nota de Implementacao Atual (Auth B2C)
A autenticacao B2C por telefone e PIN foi implementada na Auth B2C sem alterar o modelo de dados. Portanto, neste momento a titularidade do cliente e resolvida por `Cliente.telefone_whatsapp` e `Veiculo.celular_dono` normalizados.

O filtro ideal `where cliente_id = user.id`, citado em rascunhos anteriores da RF-25, permanece como diretriz futura caso o projeto evolua para adicionar um vinculo relacional direto entre `Veiculo` e `Cliente` via migration. Ate essa evolucao, a API deve continuar aplicando filtro estrito por telefone normalizado para evitar IDOR.

Endpoints implementados pela Auth B2C:
- `POST /api/cliente/auth/setup/`
- `POST /api/cliente/auth/token/`
- `GET /api/cliente/painel/`

---

## 1.4 Endpoints RESTful

### Endpoint: `/api/cliente/painel/`
- **Metodo:** GET  
- **Descricao:** Lista ordens ativas e historico do cliente autenticado. Na implementacao atual, a titularidade e filtrada por telefone normalizado (`Cliente.telefone_whatsapp` x `Veiculo.celular_dono`).

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

---

## 2.3 Modelagem de Dados Necessaria / Evolucao Futura

- **Entidade Cliente:** O model `Cliente` (one-to-one com `User`) ja existe e foi reutilizado pela Auth B2C.
- **Vinculo Veiculo:** A Auth B2C nao criou migration. Hoje o vinculo B2C e feito por telefone normalizado. Adicionar `ForeignKey(Cliente)` em `Veiculo` permanece como evolucao futura para uma RF propria.
- **Categorizacao de Midia:** O campo `MidiaOrdemServico.momento` deve ser um `ChoiceField` para garantir o filtro da galeria.

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
- **Esperado:** A API retorna apenas OSs de veiculos cujo `celular_dono` normalizado corresponda ao `telefone_whatsapp` do perfil `Cliente`.

