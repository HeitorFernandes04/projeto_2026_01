# Ordem de Serviço
---
*Este documento define a funcionalidade de Ordem de Serviço (OS) que estende o conceito de Atendimento para incluir controle de custos, materiais e etapas detalhadas do serviço.*

## 1. Funcionalidade: Ordem de Serviço

### 1.1 Use Case
**Nome:** Gestão de Ordens de Serviço
**Ator:** Funcionário
**Descrição:** Criar, gerenciar e finalizar ordens de serviço detalhadas para atendimentos automotivos, incluindo controle de materiais, custos e etapas do serviço.

### 1.2 Requisitos Funcionais (RFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF-01** | Criação de OS | Funcionário pode criar uma OS vinculada a um atendimento existente |
| **RF-02** | Controle de Etapas | OS deve ter etapas configuráveis (ex: Lavagem, Aspiração, Polimento) |
| **RF-03** | Gestão de Materiais | Permitir adicionar materiais utilizados com quantidade e custo |
| **RF-04** | Cálculo Automático | Sistema deve calcular custo total automaticamente |
| **RF-05** | Vinculação com Atendimento | OS deve estar sempre vinculada a um atendimento existente |
| **RF-06** | Status da OS | OS deve seguir fluxo: Aberta -> Em Execução -> Finalizada -> Cancelada |

### 1.3 Requisitos Não Funcionais (RNFs)
| Número | Requisito | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Performance | Listagem de OS deve carregar em menos de 500ms |
| **RNF-02** | Integridade | Não permitir exclusão de OS com materiais lançados |
| **RNF-03** | Auditoria | Todas as alterações devem ser registradas com usuário e timestamp |

### 1.4 Endpoints RESTful

**Endpoint:** `/api/ordens-servico/`
- **Método:** `GET`
- **Camada:** `OrdemServicoViewSet`
- **Descrição:** Listar todas as ordens de serviço
- **Requisição:** Query params: `status`, `atendimento_id`, `data_inicio`, `data_fim`
- **Resposta:**
  - Sucesso: `200 OK` + Array de OS
  - Falha: `400 Bad Request` + Mensagem de erro

**Endpoint:** `/api/ordens-servico/`
- **Método:** `POST`
- **Camada:** `OrdemServicoViewSet`
- **Descrição:** Criar nova ordem de serviço
- **Requisição:** JSON com campos: `atendimento_id`, `descricao`, `etapas`, `materiais`
- **Resposta:**
  - Sucesso: `201 Created` + OS criada
  - Falha: `400 Bad Request` + Mensagem de erro

**Endpoint:** `/api/ordens-servico/{id}/`
- **Método:** `GET`
- **Camada:** `OrdemServicoViewSet`
- **Descrição:** Obter detalhes de uma OS específica
- **Resposta:**
  - Sucesso: `200 OK` + OS detalhada
  - Falha: `404 Not Found` + Mensagem de erro

**Endpoint:** `/api/ordens-servico/{id}/`
- **Método:** `PATCH`
- **Camada:** `OrdemServicoViewSet`
- **Descrição:** Atualizar status ou campos de uma OS
- **Requisição:** JSON com campos a serem atualizados
- **Resposta:**
  - Sucesso: `200 OK` + OS atualizada
  - Falha: `400 Bad Request` + Mensagem de erro

**Endpoint:** `/api/ordens-servico/{id}/finalizar/`
- **Método:** `POST`
- **Camada:** `OrdemServicoViewSet.finalizar`
- **Descrição:** Finalizar uma OS (calcula custos finais)
- **Requisição:** JSON opcional com observações
- **Resposta:**
  - Sucesso: `200 OK` + OS finalizada com custos
  - Falha: `400 Bad Request` + Mensagem de erro

### 1.5 Critérios de Aceitação
| Critério | Descrição |
| :--- | :--- |
| **CA-01** | Funcionário consegue criar OS a partir de um atendimento existente |
| **CA-02** | Sistema calcula custo total automaticamente baseado em materiais |
| **CA-03** | OS não pode ser finalizada sem todas as etapas marcadas como concluídas |
| **CA-04** | Listagem de OS permite filtrar por status e período |
| **CA-05** | Fotos do atendimento vinculadas aparecem na OS |

---

## 2. Testes Esperados

### 2.1 Teste 1: Criação de OS com Sucesso
**Descrição:** Funcionário cria OS para atendimento agendado
**Esperado:**
- Resposta HTTP: `201 Created`
- OS criada com status "Aberta"
- Vinculação correta com atendimento existente

### 2.2 Teste 2: Validação de Atendimento Inexistente
**Descrição:** Tentar criar OS com atendimento_id inválido
**Esperado:**
- Resposta HTTP: `400 Bad Request`
- Mensagem: "Atendimento não encontrado"

### 2.3 Teste 3: Finalização com Etapas Pendentes
**Descrição:** Tentar finalizar OS com etapas não concluídas
**Esperado:**
- Resposta HTTP: `400 Bad Request`
- Mensagem: "Existem etapas pendentes"

### 2.4 Teste 4: Cálculo de Custo
**Descrição:** Adicionar materiais e verificar cálculo automático
**Esperado:**
- Custo total = soma(materiais.quantidade * materiais.custo_unitario)
- Resposta HTTP: `200 OK` com custo calculado

---

## 3. Modelo de Dados

### 3.1 Entidade Principal: OrdemServico
```python
class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('execucao', 'Em Execução'),
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
    ]
    
    atendimento = models.ForeignKey(Atendimento, on_delete=models.PROTECT)
    funcionario = models.ForeignKey(Funcionario, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberta')
    descricao = models.TextField()
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_finalizacao = models.DateTimeField(null=True, blank=True)
    custo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
```

### 3.2 Entidades Auxiliares
```python
class EtapaOS(models.Model):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE)
    nome = models.CharField(max_length=100)
    concluida = models.BooleanField(default=False)
    tempo_estimado = models.TimeField()  # HH:MM:SS

class MaterialOS(models.Model):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE)
    nome = models.CharField(max_length=100)
    quantidade = models.DecimalField(max_digits=8, decimal_places=2)
    unidade = models.CharField(max_length=20)  # ex: 'L', 'kg', 'un'
    custo_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    custo_total = models.DecimalField(max_digits=8, decimal_places=2)
```

---

> [!TIP]
> **Dica para a IA:** Ao implementar, priorize a integração com o sistema de Atendimentos existente e reutilize o componente `<GaleriaFotos>` para exibir as fotos vinculadas ao atendimento.
