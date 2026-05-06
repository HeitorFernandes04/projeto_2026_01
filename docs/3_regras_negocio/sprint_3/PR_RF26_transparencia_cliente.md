# PR - RF-26 Galeria Pos-Venda e Transparencia do Cliente

## Resumo

Esta PR consolida a RF-26 no portal do cliente, garantindo que a galeria pos-venda seja acessivel a partir do historico do cliente e apresente as fotos e o laudo tecnico com uma linguagem visual mais clara para o usuario final.

Tambem foi corrigido um problema de titularidade que impedia ordens finalizadas de aparecerem no historico quando o telefone do veiculo estava salvo com mascara, como `(11) 99999-9999`.

## Contexto da RF-26

A RF-26 libera ao cliente uma galeria limitada de transparencia para ordens finalizadas, exibindo apenas midias publicas da OS:

- fotos de auditoria inicial;
- fotos do estado final;
- laudo tecnico resumido;
- bloqueio de midias internas ou incidentes operacionais.

## O que foi implementado

## Modelagem

- Nao houve alteracao de models nesta entrega.
- O projeto ja possuia `core.Veiculo.cliente` como `ForeignKey` opcional para `accounts.Cliente`.
- A documentacao da sprint foi atualizada para refletir que a RF-25/RF-26 usa o vinculo relacional `Veiculo.cliente` na consulta operacional, enquanto telefone normalizado permanece apenas como prova inicial de titularidade e reparo conservador de veiculos orfaos.

### Backend - suporte ao historico do cliente

- Ajustado o fluxo B2C para vincular veiculos orfaos ao perfil `Cliente` usando telefone normalizado.
- O painel do cliente passou a buscar ordens por `veiculo__cliente`, reduzindo fragilidade por diferenca de formato em `celular_dono`.
- O vinculo automatico e conservador: so preenche `cliente` quando o veiculo ainda nao esta associado a outro cliente.
- Adicionado teste cobrindo o bug real: cliente autenticado, telefone formatado no veiculo e OS `FINALIZADO` aparecendo no historico.

Arquivos principais:

- `backend/agendamento_publico/services.py`
- `backend/agendamento_publico/tests/test_api.py`
- `backend/agendamento_publico/tests/test_services.py`

### Web - RF-26 Galeria Pos-Venda

- Ajustado o label das fotos para nao exibir valores crus de enum como `VISTORIA_INICIAL`.
- Criado formatter de momento de foto:
  - `VISTORIA_INICIAL` -> `Vistoria inicial`
  - `VISTORIA_GERAL` -> `Vistoria inicial`
  - `FINALIZADO` / `FINALIZACAO` -> `Finalizacao`
  - fallback remove `_` e capitaliza o texto.
- Ajustado o card de `Status final`:
  - a caixa externa fica verde quando a OS esta finalizada;
  - o pill interno nao tem borda nem fundo proprio;
  - a fonte acompanha a cor semantica do card.
- Adicionada variavel global `--lm-success` para representar sucesso/finalizacao no design system.

Arquivos principais:

- `web/src/app/public/painel-cliente/componentes/galeria-transparencia/galeria-transparencia.component.ts`
- `web/src/app/public/painel-cliente/componentes/galeria-transparencia/galeria-transparencia.component.html`
- `web/src/app/public/painel-cliente/componentes/galeria-transparencia/galeria-transparencia.component.scss`
- `web/src/app/public/painel-cliente/componentes/galeria-transparencia/galeria-transparencia.component.spec.ts`
- `web/src/styles.scss`

## Testes executados

### Backend focado RF-25/RF-26

```bash
..\venv\Scripts\python -m pytest agendamento_publico/tests/test_api.py agendamento_publico/tests/test_services.py operacao/tests/test_cliente_historico.py operacao/tests/test_cliente_galeria_service.py operacao/tests/test_cliente_galeria_api.py -q -o addopts=""
```

Resultado:

```text
42 passed
```

### Web focado RF-26

```bash
npx vitest run src/app/public/painel-cliente/componentes/galeria-transparencia/galeria-transparencia.component.spec.ts
```

Resultado:

```text
1 passed
9 passed
```

### Web focado painel/galeria

```bash
npx vitest run src/app/services/painel-cliente.service.spec.ts src/app/public/painel-cliente/services/ordem-servico.service.spec.ts src/app/public/painel-cliente/componentes/card-historico/card-historico.component.spec.ts src/app/public/painel-cliente/componentes/galeria-transparencia/galeria-transparencia.component.spec.ts
```

Resultado:

```text
4 passed
34 passed
```

## Observacoes e riscos conhecidos

- A suite backend completa foi tentada, mas excedeu o timeout local de 180 segundos neste ambiente.
- O build web global ainda pode falhar por budgets SCSS preexistentes em telas fora da RF-26.
- Existem arquivos web ja modificados no workspace que nao fazem parte direta desta PR; revisar o diff antes de abrir a PR para evitar incluir mudancas acidentais.

## Checklist da PR

- [x] RF-26 mantem acesso apenas a galeria publica do cliente autenticado.
- [x] Historico do cliente lista OS finalizada mesmo com telefone formatado no cadastro do veiculo.
- [x] Labels de fotos nao exibem enums crus com underscore.
- [x] Status finalizado esta visualmente verde no card de status final.
- [x] Testes backend focados passaram.
- [x] Testes web focados passaram.
