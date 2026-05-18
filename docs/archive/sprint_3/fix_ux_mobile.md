# Requisitos de Melhoria e UX: Mobile

Este documento centraliza os ajustes necessários na interface e na lógica do aplicativo Mobile para melhorar a
usabilidade e a integridade dos dados de formulários. Estas alterações são independentes das correções de
bugs da PR #26 e da lógica de agenda (RF-22).

## 1. Interface e Identidade Visual

## 1.1 Renomeação de Fluxo (Entrada)

```
Onde: Tela NovaOrdemServico.tsx e Painel Administrativo.
Ajuste: Alterar o título de "Novo OrdemServico" para "Entrada rápida de veículos".
Consistência: Esta nomenclatura deve ser adotada também no Histórico e Dashboard para manter a
unidade terminológica do sistema.
UX: Remover o texto explicativo redundante que aparece logo abaixo do título para limpar a
interface.
```
## 1.2 Limpeza de Estado (Formulários)

```
Problema: Ao iniciar uma OS ou sair da página, os dados permanecem preenchidos nos campos.
Ajuste: Implementar o reset dos estados (formulário limpo) sempre que uma OS for criada com
sucesso ou quando o usuário navegar para fora da página (hook useIonViewWillLeave).
```
## 2. Padronização de Dados

## 2.1 Seleção de Cores

```
Ajuste Frontend: Substituir o campo de texto livre por um componente de seleção (IonSelect) com
cores pré-definidas (Preto, Branco, Prata, Cinza, Vermelho, Azul, Amarelo, Verde, Bege, "Outra").
Ajuste Backend: O model Veiculo deve ser atualizado para incluir COLOR_CHOICES, garantindo que
a API valide os dados enviados.
Objetivo: Evitar erros de digitação e inconsistências (ex: "Vermelho" vs "Verm."), além de permitir
filtros precisos em relatórios futuros.
```

## 3. Impacto em Outros Módulos

```
- API/Backend: Necessário criar migration para o model Veiculo.
- Dashboard Web: Os filtros de busca por cor devem ser atualizados para Dropdown, refletindo
os novos padrões do banco de dados.
```

## 4. Próximos Passos

```
[!NOTE] Os requisitos de Agendamento e Horários foram movidos para o documento da RF-22. O fluxo de
Acabamento/Detalhista foi removido do projeto para simplificação operacional (ver
ORIENTACAO_ATUALIZACAO_DOCS.md).
```

