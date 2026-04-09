# Fluxo de Atendimento - Máquina de Estados

**VERDADE ABSOLUTA** - Este documento define as regras estritas da esteira de produção. Qualquer manutenção deve seguir estas regras sem exceção.

## Fluxo Linear Obrigatório

O atendimento segue uma ordem **ESTRITAMENTE LINEAR** e **OBRIGATÓRIA**:

```
1 (Vistoria) → 2 (Lavagem) → 3 (Acabamento) → 4 (Liberação)
```

**Regra Fundamental**: Não é permitido pular etapas, voltar etapas ou executar em paralelo. Cada etapa deve ser concluída para avançar à próxima.

---

## Etapa 1 - Vistoria

### Requisitos Obrigatórios
- **Mínimo de 5 fotos obrigatórias**:
  - Frente
  - Trás  
  - Lateral Motorista
  - Lateral Passageiro
  - Teto

### Funcionalidades
- Interface para captura das 5 fotos obrigatórias
- Campo de observações do laudo de vistoria
- Botão "Finalizar Vistoria" **desabilitado** até todas as fotos serem registradas

### Ação no Backend
```python
# Salva observações no campo específico
atendimento.laudo_vistoria = request.data.get('observacoes', '')
atendimento.etapa_atual = 2
atendimento.status = 'em_lavagem'
```

### Validação Frontend
```typescript
const podeConcluir = fotosTiradas.length >= 5 // Todas as obrigatórias
```

---

## Etapa 2 - Lavagem

### Funcionalidades
- **Cronômetro ativo** que inicia automaticamente ao carregar componente
- **Botão de Pausa/Retomar** para controle do tempo
- **Botão de Ocorrência** (funcionalidade estática por enquanto)
- Campo de observações da lavagem

### Ação no Backend
```python
# Concatena observações ao histórico
novas_observacoes = request.data.get('observacoes', '')
if novas_observacoes:
    if atendimento.observacoes:
        atendimento.observacoes += f"\n\n[Etapa Lavagem]\n{novas_observacoes}"
    else:
        atendimento.observacoes = f"[Etapa Lavagem]\n{novas_observacoes}"
        
atendimento.etapa_atual = 3
atendimento.status = 'em_acabamento'
```

---

## Etapa 3 - Acabamento

### Funcionalidades
- **Cronômetro ativo** que inicia automaticamente ao carregar componente
- **Botão de Pausa/Retomar** para controle do tempo
- **Botão de Ocorrência** (funcionalidade estática por enquanto)
- Campo de localização no pátio (vaga_patio)
- Campo de notas de acabamento

### Ação no Backend
```python
# Concatena observações ao histórico
novas_observacoes = request.data.get('observacoes', '')
if novas_observacoes:
    if atendimento.observacoes:
        atendimento.observacoes += f"\n\n[Etapa Acabamento]\n{novas_observacoes}"
    else:
        atendimento.observacoes = f"[Etapa Acabamento]\n{novas_observacoes}"
        
atendimento.etapa_atual = 4
atendimento.status = 'aguardando_liberacao'
```

---

## Etapa 4 - Liberação

### Requisitos Obrigatórios
- **Campo vaga_patio** preenchido
- **Mínimo de 1 foto** do momento 'DEPOIS' (opcional para UX)

### Funcionalidades
- Interface de conclusão de serviço
- Campo para informar vaga do pátio onde veículo ficará
- Campo de comentário final
- Upload de fotos finais (DEPOIS)

### Ação Final no Backend
```python
# Registra vaga do pátio nas observações
vaga_patio = request.data.get('vaga_patio', '')
if vaga_patio:
    if atendimento.observacoes:
        atendimento.observacoes += f"\n\n[Liberação]\nVaga: {vaga_patio}"
    else:
        atendimento.observacoes = f"[Liberação]\nVaga: {vaga_patio}"

# Finalização definitiva do ciclo
atendimento.status = 'finalizado'
atendimento.horario_finalizacao = timezone.now()
```

### Navegação Frontend
```typescript
// Após sucesso com status 'finalizado'
if (data.status === 'finalizado') {
    history.push('/atendimentos/hoje'); // Retorna ao pátio principal
}
```

---

## Regras de Negócio Estritas

### 1. Validação de Transição
- Cada etapa só pode avançar se os requisitos obrigatórios forem cumpridos
- Backend deve validar o estado atual antes de permitir transição

### 2. Persistência de Dados
- **Etapa 1**: Dados vão para `laudo_vistoria`
- **Etapa 2-3**: Comentários são concatenados em `observacoes` com etiqueta
- **Etapa 4**: Vaga vai para `observacoes` e status finaliza o atendimento

### 3. Controle de Tempo
- Etapas 2 e 3 possuem cronômetro obrigatório
- Tempo deve ser registrado para controle de produtividade

### 4. Tratamento de Erros
- Falha em qualquer etapa mantém o atendimento no estado atual
- Logs detalhados para auditoria e debugging

### 5. Interface Consistente
- Todas as etapas seguem o mesmo padrão visual
- Feedback claro para o usuário sobre progresso e próximos passos

---

## Endpoint API: proxima_etapa

**URL**: `POST /api/atendimentos/{id}/proxima_etapa/`

**Corpo da Requisição** (dinâmico por etapa):
```json
// Etapa 1
{
  "observacoes": "Laudo da vistoria..."
}

// Etapa 2-3
{
  "observacoes": "Observações da etapa..."
}

// Etapa 4
{
  "vaga_patio": "Vaga A-12",
  "observacoes": "Comentário final..."
}
```

**Resposta**:
```json
{
  "id": 123,
  "etapa_atual": 2,
  "status": "em_lavagem",
  "laudo_vistoria": "Laudo salvo...",
  "observacoes": "Histórico completo...",
  "horario_finalizacao": null // ou timestamp quando finalizado
}
```

---

## VALIDAÇÃO DE PRODUÇÃO

Este documento serve como **VERDADE ABSOLUTA** para:

✅ Desenvolvimento de novas funcionalidades  
✅ Correção de bugs na esteira  
✅ Auditoria de qualidade  
✅ Treinamento de equipe  
✅ Documentação técnica  

**Qualquer divergência em relação a este documento deve ser considerada BUG e corrigida imediatamente.**
