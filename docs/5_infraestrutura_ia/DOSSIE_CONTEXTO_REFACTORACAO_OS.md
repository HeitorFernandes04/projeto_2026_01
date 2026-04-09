# Dossiê de Contexto: Refatoração para Ordem de Serviço

**Branch:** `refatoracao-para-ordem-de-servico`  
**Data:** 09/04/2026  
**Escopo:** Mudanças profundas na arquitetura do sistema Lava-Me v2

---

## 1. Mapeamento de Fluxo de Dados: Ciclo de Vida do Atendimento

### 1.1. Evolução do Modelo Atendimento

**Modelo Original (antes da refatoração):**
- Status simples: `vistoria`, `agendado`, `em_andamento`, `finalizado`, `cancelado`
- Campos booleanos de checklist obrigatórios
- Fluxo linear inflexível

**Modelo Refatorado (pós-migration 0008):**
```python
class Atendimento(models.Model):
    STATUS_CHOICES = [
        ('vistoria', 'Vistoria'),
        ('agendado', 'Agendado'), 
        ('em_andamento', 'Em Andamento'),
        ('em_lavagem', 'Em Lavagem'),       
        ('em_acabamento', 'Em Acabamento'),
        ('pendente_gestao', 'Pendente Gestão'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]
    
    ETAPA_CHOICES = [
        (1, 'Vistoria'),
        (2, 'Lavagem'), 
        (3, 'Acabamento'),
        (4, 'Liberação'),
    ]
    
    etapa_atual = models.PositiveSmallIntegerField(choices=ETAPA_CHOICES, default=1)
    horario_inicio = models.DateTimeField(null=True, blank=True)
    horario_lavagem = models.DateTimeField(null=True, blank=True)
    horario_acabamento = models.DateTimeField(null=True, blank=True)
    horario_finalizacao = models.DateTimeField(null=True, blank=True)
    observacoes = models.TextField(blank=True, default='')
    laudo_vistoria = models.TextField(blank=True, default='')
    partes_avaria = models.JSONField(default=list, blank=True)
```

### 1.2. Máquina de Estados Implementada

**Transições Validadas (services.py):**
1. **Vistoria → Lavagem**: Exige 5 fotos obrigatórias (Frente, Trás, Lateral Motorista, Lateral Passageiro, Teto)
2. **Lavagem → Acabamento**: Salva laudo da lavagem
3. **Acabamento → Liberação**: Salva laudo do acabamento
4. **Liberação → Finalizado**: Registra vaga do pátio e observações finais

### 1.3. Ciclo de Vida Completo

```
Entrada no Pátio → Vistoria (etapa=1)
    ↓ (validação de 5 fotos + partes avaria)
Lavagem (etapa=2) 
    ↓ (laudo lavagem)
Acabamento (etapa=3)
    ↓ (laudo acabamento)  
Liberação (etapa=4)
    ↓ (vaga pátio + obs finais)
Finalizado
```

---

## 2. Mudança de Paradigma: Checklist vs. Agilidade

### 2.1. Arquitetura Antiga (Migration 0005)

**Campos Removidos (Migration 0008):**
- `checklist_lavagem`: JSONField com lista de itens obrigatórios
- `laudo_lavagem`: TextField específico para lavagem
- `laudo_acabamento`: TextField específico para acabamento  
- `notas_entrega`: TextField para notas de entrega
- `vaga_patio`: CharField para vaga no pátio

**Problemas da Abordagem Antiga:**
- Campos booleanos rígidos
- Validação complexa no frontend
- Dificuldade de extensão
- Acoplamento forte entre etapas

### 2.2. Nova Arquitetura Ágil

**Validação Backend (services.py):**
```python
def avancar_etapa(atendimento, novos_dados):
    etapa_atual = atendimento.etapa_atual
    
    if etapa_atual == 1:
        # Validação crítica: 5 fotos obrigatórias
        qtd_fotos_vistoria = atendimento.midias.filter(momento='ANTES').count()
        if qtd_fotos_vistoria < 5:
            raise ValidationError(
                f"Impossível avançar para Lavagem: A vistoria exige 5 fotos obrigatórias "
                f"(Frente, Trás, Lateral Motorista, Lateral Passageiro, Teto). "
                f"Fotos capturadas: {qtd_fotos_vistoria}/5."
            )
```

**Benefícios da Nova Abordagem:**
- Transições flexíveis baseadas em regras de negócio
- Validação centralizada no backend
- Frontend mais leve e responsivo
- Fácil extensão de novas etapas

---

## 3. Arquitetura de API: Novos Endpoints e Actions

### 3.1. ViewSets Refatorados

**AtendimentoViewSet (viewsets.py):**
```python
@action(detail=True, methods=['patch'])
def proxima_etapa(self, request, pk=None):
    """Avança para próxima etapa (1->2, 2->3, 3->4)"""
    
@action(detail=True, methods=['patch'])  
def finalizar(self, request, pk=None):
    """Finaliza atendimento na etapa 4 (Liberação)"""
```

**OrdemServicoViewSet (viewsets.py):**
```python
@action(detail=True, methods=['post'])
def finalizar(self, request, pk=None):
    """Finaliza uma OS com observações opcionais"""

@action(detail=True, methods=['post'])
def materiais(self, request, pk=None):
    """Adiciona material à OS"""

@action(detail=True, methods=['patch'], url_path='etapas/(?P<etapa_id>[^/.]+)')
def atualizar_etapa(self, request, pk=None, etapa_id=None):
    """Atualiza status de uma etapa específica"""
```

### 3.2. Views Clássicas Mantidas

**API de Atendimentos:**
- `GET /api/atendimentos/hoje/` - Lista atendimentos do dia
- `GET /api/atendimentos/historico/` - Histórico com filtros
- `POST /api/atendimentos/` - Criar novo atendimento
- `GET /api/atendimentos/{id}/` - Detalhes
- `PATCH /api/atendimentos/{id}/iniciar/` - Iniciar atendimento
- `POST /api/atendimentos/{id}/fotos/` - Upload fotos
- `PATCH /api/atendimentos/{id}/comentario/` - Adicionar observações

**API de Ordem de Serviço:**
- `GET /api/atendimentos/ordens-servico/` - Listar OS
- `POST /api/atendimentos/ordens-servico/` - Criar OS
- `GET /api/atendimentos/ordens-servico/{id}/` - Detalhes OS
- `PATCH /api/atendimentos/ordens-servico/{id}/` - Atualizar OS
- `POST /api/atendimentos/ordens-servico/{id}/finalizar/` - Finalizar OS
- `POST /api/atendimentos/ordens-servico/{id}/materiais/` - Adicionar material
- `PATCH /api/atendimentos/ordens-servico/{id}/etapas/{etapa_id}/` - Atualizar etapa

### 3.3. Formatos JSON Esperados

**Avanço de Etapa:**
```json
{
  "partes_avaria": ["para-choque-direito", "porta-motorista"],
  "laudo_vistoria": "Veículo com pequenas avarias laterais"
}
```

**Finalização:**
```json
{
  "vaga_patio": "A-15",
  "observacoes": "Cliente satisfeito, pagamento confirmado"
}
```

**Criação de OS:**
```json
{
  "atendimento_id": 123,
  "descricao": "OS complementar para polimento",
  "etapas": [
    {"nome": "Polimento", "tempo_estimado": "01:00:00", "ordem": 1},
    {"nome": "Proteção", "tempo_estimado": "00:30:00", "ordem": 2}
  ],
  "materiais": [
    {"nome": "Cera", "quantidade": "2", "unidade": "un", "custo_unitario": "45.00"}
  ]
}
```

---

## 4. Integração Frontend-Backend

### 4.1. Serviços API (api.ts)

**Funções de Máquina de Estados:**
```typescript
// RF-07 - Avança para a próxima etapa da máquina de estados
export async function avancarEtapa(id: number, dados: any) {
  return request(`/api/atendimentos/${id}/proxima_etapa/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
    signal: AbortSignal.timeout(30000),
  });
}

// RF-07 - Finaliza atendimento na etapa 4 (Liberação)  
export async function finalizarAtendimentoEtapa4(id: number, dados: {
  vaga_patio: string;
  observacoes?: string;
}) {
  return request(`/api/atendimentos/${id}/finalizar/`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
    signal: AbortSignal.timeout(30000),
  });
}
```

**Funções de Ordem de Serviço:**
```typescript
export async function criarOrdemServico(dados: {
  atendimento_id: number;
  descricao?: string;
  etapas?: Array<{nome: string; tempo_estimado: string; ordem?: number;}>;
  materiais?: Array<{nome: string; quantidade: string; unidade: string; custo_unitario: string;}>;
}) {
  return request('/api/atendimentos/ordens-servico/', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
```

### 4.2. Sincronização de Estado em Tempo Real

**DetalhesAtendimento.tsx:**
```typescript
const carregar = useCallback(() => {
  getAtendimento(Number(id))
    .then(d => setAtendimento(d as unknown as Atendimento))
    .finally(() => setLoading(false));
}, [id]);

useIonViewWillEnter(() => carregar());
```

**Extração de Comentários Segmentados:**
```typescript
const extrairComentario = (chave: string): string | null => {
  if (!atendimento?.observacoes) return null;
  const regex = new RegExp(`\\[${chave}\\](.*?)(?=\\[|$)`, 's');
  const match = atendimento.observacoes.match(regex);
  return match ? match[1].trim() : null;
};
```

### 4.3. Componentes de Estado

**EstadoLavagem.tsx, EstadoAcabamento.tsx, EstadoLiberacao.tsx:**
- Componentes específicos para cada etapa
- Validação de pré-requisitos (fotos obrigatórias)
- Interface adaptada para cada contexto

---

## 5. Histórico de Estabilização e Correções

### 5.1. Correções de Infraestrutura

**Imports do Rest Framework (views.py):**
```python
# Correção: Importações faltantes causavam 500 errors
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import viewsets, status
```

**Sintaxe Python (viewsets.py):**
```python
# Correção: Linha 349 fora da classe
@action(detail=False, methods=['get'])
def hoje(self, request):  # Movido para dentro da classe
```

**Limpeza de Cache e Lifecycle:**
```typescript
// Centralização de configuração e uso de useIonViewWillEnter
useIonViewWillEnter(() => carregar()); // Em vez de useEffect
```

### 5.2. Correções de Lógica de Negócio

**Trava de Atendimento (commit 26f80535):**
```python
# Bug: Trava aplicada a todos os atendimentos passados
# Fix: Restringir apenas ao dia atual
hoje = timezone.localdate()
if Atendimento.objects.filter(
    funcionario=request.user, 
    status='em_andamento',
    data_hora__date=hoje  # <-- Adicionado filtro de data
).exists():
```

**Sintaxe onClick (commit b9fe4da2):**
```typescript
// Bug: Sintaxe incorreta no botão iniciar
// Fix: Correção do handler de eventos
onClick={() => iniciarAtendimento(atendimento.id)}
```

### 5.3. Padrões de Erro Resolvidos

1. **ValidationError em strings**: Uso de `str(e)` vs `e.messages[0]`
2. **Timeout de requisições**: Implementação de `AbortSignal.timeout(30000)`
3. **Cache de API**: Uso de `cache: 'no-store'` para dados em tempo real
4. **Permissões**: Verificação `is_staff` para endpoints administrativos

---

## 6. Arquitetura de Ordem de Serviço

### 6.1. Modelos Implementados

**OrdemServico:**
```python
class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('aberta', 'Aberta'),
        ('execucao', 'Em Execução'), 
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
    ]
    
    atendimento = models.ForeignKey(Atendimento, on_delete=models.PROTECT)
    funcionario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='aberta')
    descricao = models.TextField(blank=True, default='')
    custo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
```

**EtapaOS:**
```python
class EtapaOS(models.Model):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE)
    nome = models.CharField(max_length=100)
    concluida = models.BooleanField(default=False)
    tempo_estimado = models.TimeField()
    ordem = models.PositiveIntegerField(default=0)
```

**MaterialOS:**
```python
class MaterialOS(models.Model):
    ordem_servico = models.ForeignKey(OrdemServico, on_delete=models.CASCADE)
    nome = models.CharField(max_length=100)
    quantidade = models.DecimalField(max_digits=8, decimal_places=2)
    unidade = models.CharField(max_length=20)
    custo_unitario = models.DecimalField(max_digits=8, decimal_places=2)
    custo_total = models.DecimalField(max_digits=8, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.custo_total = self.quantidade * self.custo_unitario
        super().save(*args, **kwargs)
        self.ordem_servico.atualizar_custo_total()
```

### 6.2. Regras de Negócio da OS

1. **Uma OS aberta por atendimento**: Validação em `CriarOrdemServicoSerializer`
2. **Cálculo automático de custos**: Método `atualizar_custo_total()`
3. **Finalização com todas as etapas concluídas**: Método `pode_finalizar()`
4. **Permissões por funcionário**: Apenas suas OS (admin vê todas)

---

## 7. Impactos e Melhorias

### 7.1. Performance
- **Select_related e prefetch_related**: Redução de N+1 queries
- **Cache control**: `no-store` para dados em tempo real
- **Timeouts**: 30 segundos para operações críticas

### 7.2. UX/UI
- **Máquina de estados visual**: Componentes por etapa
- **Validação em tempo real**: Feedback imediato
- **Cronômetros automáticos**: Cálculo de duração entre etapas

### 7.3. Manutenibilidade
- **Serviços centralizados**: Lógica de negócio isolada
- **Serializers especializados**: Entrada vs Saída
- **ViewSets reutilizáveis**: Actions customizadas

---

## 8. Próximos Passos e Recomendações

### 8.1. Para a RAG Aprender
1. **Padrões de migração**: Como evoluir modelos sem quebrar dados
2. **Validações em cascata**: Exemplo de validação de pré-requisitos
3. **Integração frontend-backend**: Padrão de sincronização de estado
4. **Tratamento de erros**: Padrões de ValidationError e timeouts

### 8.2. Para Desenvolvimento Futuro
1. **WebSocket integration**: Para sincronização real-time
2. **Offline support**: Cache inteligente no frontend
3. **Analytics**: Métricas de tempo por etapa
4. **API versioning**: Para evolução backward-compatible

---

## 9. Resumo Técnico

**Commits Principais:**
- `d85cfc94`: Refactor principal com novo frontend e funcionalidades
- `68bfda8e`: Centralização de API e melhoria de error handling
- `26f80535`: Fix de trava de atendimento para dia atual
- `b9fe4da2`: Correção de sintaxe onClick

**Arquivos Críticos Modificados:**
- `backend/atendimentos/models.py`: Nova arquitetura de estados
- `backend/atendimentos/services.py`: Máquina de estados
- `backend/atendimentos/viewsets.py`: Actions customizadas
- `mobile/src/services/api.ts`: Funções de integração
- `mobile/src/pages/atendimentos/DetalhesAtendimento.tsx`: Estado sincronizado

**Migrações de Banco:**
- `0005_*`: Adição dos campos de checklist (removidos depois)
- `0008_*`: Remoção dos campos obsoletos
- `0003_*`: Criação de OrdemServico, EtapaOS, MaterialOS

---

**Conclusão:** A refatoração transformou o sistema de uma abordagem rígida de checklists para uma máquina de estados flexível, mantendo compatibilidade com os dados existentes e adicionando uma camada completa de Ordem de Serviço para gestão de custos e materiais.
