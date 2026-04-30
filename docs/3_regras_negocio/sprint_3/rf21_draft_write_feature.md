# 🧱 Especificação Técnica Executável (rf21_autoagendamento)
*Documento gerado e validado pelo Workflow /write_feature*

---

## 1. Escopo Arquitetural: Portal de Autoagendamento (Web)

### 1.1 Contexto de Negócio
**Use Case:** Autoagendamento Público B2C
**Ator:** Cliente Final
**Objetivo:** Permitir agendamento mobile-first via navegador, acessando a URL pública do estabelecimento (sem login prévio).

### 1.2 Impacto no Banco de Dados (Django Models)
Através da inspeção `read_django_models_schema`, identificamos que a tabela `Estabelecimento` (app: `accounts`) atualmente possui apenas `id`, `nome_fantasia`, `cnpj`, `endereco_completo` e `is_active`. 

Para evitar vazamento de dados sequenciais via URL (IDOR reverso) e manter URLs amigáveis, **é obrigatório** criar uma migration:
*   **Ação:** Adicionar o campo `slug` na Model `Estabelecimento`.
*   **Código Exato:** `slug = models.SlugField(max_length=150, unique=True, null=True, blank=True)`
*   **Atenção:** Em produção, precisaremos rodar um script gerando slugs retroativos para os lava-jatos já cadastrados.

### 1.3 Mapeamento de UI (Angular/Web)
Com base na varredura `list_web_components`, o Front-end Web (Angular) atualmente foca apenas no Painel Administrativo.
*   **Nova Rota Angular:** Criar o módulo isolado `AutoagendamentoModule` fora de autenticação.
*   **Rota Alvo:** `/:slug` ou `/agendar/:slug`.
*   **Estilo:** Utilizar estritamente SCSS do Design System "Premium Industrial" (Glassmorphism e Dark Mode).

---

## 2. Contrato de API (Endpoints)

**Endpoint:** `GET /api/publico/estabelecimento/{slug}/`
*   **Regra Multi-Tenant:** Este é o **ÚNICO** endpoint do sistema onde o `request.user.perfil_gestor.estabelecimento` não é usado. O filtro é `Estabelecimento.objects.filter(slug=slug, is_active=True)`.
*   **Campos Permitidos (Strict):**
    ```json
    {
      "id": 1,
      "nome_fantasia": "Lava-Me Premium",
      "endereco_completo": "Rua das Flores, 123",
      "servicos": [
        {
          "id": 4,
          "nome": "Lavagem Completa",
          "preco": "80.00",
          "duracao_estimada_minutos": 90
        }
      ]
    }
    ```
*   **Filtro Interno:** A serialização de `servicos` DEVE incluir um filtro `is_active=True`.

---

## 3. Critérios de Aceite Automatizáveis (BDD / Gherkin)

A equipe de QA e a IA programadora deverão transcrever os cenários abaixo em testes E2E (`vitest` / `pytest`).

**Cenário 1: Consulta pública de estabelecimento válido (E Ocultação de Inativos)**
> **Dado** que existe um Estabelecimento com `slug="lava-me-premium"` e `is_active=True`
> **E** o estabelecimento possui o serviço "Ducha" ativo e "Polimento" inativo
> **Quando** o cliente fizer um GET na rota pública
> **Então** o HTTP Status deve ser `200 OK`
> **E** a payload NÃO deve conter campos sensíveis (`cnpj`, `faturamento`)
> **E** a lista de `servicos` NÃO deve conter o "Polimento".

**Cenário 2: Acesso a estabelecimento inexistente ou inativo**
> **Dado** que o slug informado na URL não existe no banco
> **Ou** o Estabelecimento foi inativado pelo Gestor
> **Quando** o cliente fizer a requisição
> **Então** o HTTP Status deve ser `404 Not Found`.

**Cenário 3: Limite de Requisições Excedido (Rate Limiting)**
> **Dado** que a rota possui um Limite de 60 requisições por minuto
> **Quando** um scraper malicioso disparar 61 requisições seguidas
> **Então** a API deve interceptar e retornar `429 Too Many Requests`.

**Cenário 4: Empty State (Lava-Jato sem serviços)**
> **Dado** que um estabelecimento ativo não possui nenhum serviço cadastrado (ou todos inativos)
> **Quando** o cliente acessar o portal
> **Então** a API retorna a lista vazia `[]`
> **E** o Frontend renderiza a mensagem amigável de *Empty State*.

**Cenário 5: Interface - Bloqueio de CTA sem seleção**
> **Dado** que o cliente está no primeiro passo do funil Web
> **Quando** nenhum serviço foi selecionado
> **Então** o botão "Continuar" deve estar travado (`disabled=true`).

---

## 4. Esboço de Usabilidade e UI (Wireframes B2C)

A abordagem para as RFs deste módulo deve ser estritamente **Mobile-First**, utilizando os tokens do `styles.scss` do projeto e os componentes listados via `list_web_components`.

### Tela 1: Portal Inicial & Seleção de Serviços (RF-21)
**Objetivo:** Mostrar credibilidade e permitir a escolha do serviço.
* **Cabeçalho:** Nome Fantasia do Lava-Jato e Endereço completo (com ícone de mapa).
* **Corpo da Tela:** 
  * Título: *"O que seu veículo precisa hoje?"*
  * **Card de Serviços (Iteração Angular `*ngFor`):**
    * Nome do serviço em destaque.
    * Preço formatado (ex: "R$ 80,00").
    * Tempo estimado com ícone de relógio (ex: "⏱ 90 min").
    * Input do tipo `radio` para seleção (apenas um serviço por vez).
* **Rodapé Fixo (Sticky):** Botão de ação "Continuar" (Validado pelo Cenário 5).

### Tela 2: Disponibilidade de Horários (RF-22)
**Objetivo:** Evitar overbooking cruzando duração com a agenda.
* **Cabeçalho:** Resumo da escolha (ex: "Lavagem Completa - 90 min").
* **Corpo:** 
  * Seletor de Data (Carrossel horizontal dos próximos 7 dias).
  * Grid de Blocos de Tempo (Chips gerados pela API, ex: `09:00`, `14:00`). Botões bloqueados não devem renderizar.
* **Rodapé Fixo:** Botão "Voltar" e Botão "Confirmar Horário".

### Tela 3: Checkout Integrado B2C (RF-23)
**Objetivo:** Coleta mínima de dados (sem senha) para check-in no pátio.
* **Sessões do Formulário:**
  * **Resumo:** Data, Horário, Serviço, Valor Total.
  * **Sobre o Veículo:** Placa (com máscara) e Modelo (ex: "Civic Branco").
  * **Seus Dados:** Nome Completo e WhatsApp (com máscara).
* **Rodapé:** Botão principal "Agendar Lavagem" (Trigga a criação de OS).

### Tela 4: Painel do Cliente e Transparência (RF-24 a RF-26)
**Objetivo:** Autoatendimento pós-venda.
* **Card do Agendamento Atual:** Placa, Data, Hora, Serviço e Status (`PATIO`, `EXECUCAO`, `FINALIZADO`).
* Se status for `PATIO`: Exibir botão secundário **"Cancelar Agendamento"**.
* Se status for `FINALIZADO`: Exibir botão **"Ver Resultado (Fotos)"**, que abre um Modal com a Galeria de Transparência (RF-26) ocultando fotos de incidentes/avarias internas.

---

## 5. Testes de Validação (Implementação Obrigatória)

Os scripts abaixo refletem 100% da realidade do projeto, utilizando as suítes de testes oficiais já configuradas no MCP (`run_backend_tests` com **Pytest** e `run_web_tests` com **Vitest**).

### 4.1 Pytest (Backend Django)
Arquivo: `backend/agendamento_publico/tests/test_views.py`

```python
import pytest
from rest_framework.test import APIClient
from accounts.models import Estabelecimento
from core.models import Servico

@pytest.mark.django_db
def test_consulta_publica_e_ocultacao_de_inativos():
    # Testes 1 e 2 Originais
    est = Estabelecimento.objects.create(nome_fantasia="Lava", slug="lava", is_active=True)
    Servico.objects.create(estabelecimento=est, nome="Ativo", preco=50, duracao_estimada_minutos=30, is_active=True)
    Servico.objects.create(estabelecimento=est, nome="Inativo", preco=50, duracao_estimada_minutos=30, is_active=False)
    
    client = APIClient()
    response = client.get(f'/api/publico/estabelecimento/{est.slug}/')
    
    assert response.status_code == 200
    assert len(response.data['servicos']) == 1
    assert response.data['servicos'][0]['nome'] == "Ativo"
    assert 'cnpj' not in response.data

@pytest.mark.django_db
def test_estabelecimento_inexistente_retorna_404():
    # Teste 3 Original
    est = Estabelecimento.objects.create(nome_fantasia="Falido", slug="falido", is_active=False)
    client = APIClient()
    response = client.get(f'/api/publico/estabelecimento/{est.slug}/')
    assert response.status_code == 404

@pytest.mark.django_db
def test_empty_state_sem_servicos():
    # Teste 5 Original (Parte Backend)
    est = Estabelecimento.objects.create(nome_fantasia="Lava", slug="vazio", is_active=True)
    client = APIClient()
    response = client.get(f'/api/publico/estabelecimento/{est.slug}/')
    assert response.status_code == 200
    assert response.data['servicos'] == []
```
*(Nota Técnica: O Teste 4 - Rate Limiting será testado via mock do Throttling do DRF durante a implementação, garantindo o status 429).*

### 4.2 Vitest (Frontend Angular)
Arquivo: `web/src/app/public/autoagendamento.component.spec.ts`

```typescript
import { test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { AutoagendamentoComponent } from './autoagendamento.component';

test('Teste 5 (Front): Deve exibir Empty State quando não houver serviços', async () => {
  await render(AutoagendamentoComponent, { 
    componentProperties: { servicos: [] } 
  });
  
  const emptyMessage = screen.getByText(/Nenhum serviço disponível no momento/i);
  expect(emptyMessage).toBeTruthy();
});

test('Teste 6: CTA Continuar deve iniciar desabilitado e ser ativado após seleção', async () => {
  await render(AutoagendamentoComponent, { 
    componentProperties: { servicos: [{id: 1, nome: 'Ducha'}] } 
  });
  
  const btnContinuar = screen.getByRole('button', { name: /Continuar/i });
  expect(btnContinuar.disabled).toBeTruthy();
  
  const radioDucha = screen.getByLabelText(/Ducha/i);
  fireEvent.click(radioDucha);
  
  expect(btnContinuar.disabled).toBeFalsy();
});
```
