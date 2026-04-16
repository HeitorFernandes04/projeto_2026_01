# Guia de Qualidade e Testes Antiviés

Este guia estabelece os padrões para criação e execução de testes no projeto Lava-Me, com foco especial na eliminação de vieses lógicos e na garantia da integridade operacional.

## 🛠️ Frameworks Utilizados

*   **Backend:** `pytest` + `pytest-django` + `factory-boy`.
*   **Mobile:** `Cypress` (E2E) e `React Testing Library` (Unitários).

---

## 🚀 Como Rodar os Testes

### Backend (Django)
```bash
# Rodar todos os testes
pytest

# Rodar um arquivo específico
pytest atendimentos/tests/test_services.py

# Rodar com verbose e sem capturar warnings
pytest -v -W ignore
```

### Mobile (Cypress E2E)
```bash
# Modo Headless (mais rápido para CI/IA)
npx cypress run --project ./mobile

# Modo Interativo (Interface Visual)
npx cypress open --project ./mobile
```

---

## 🧠 Filosofia Antiviés (IA & Humanos)

### 1. Testar Contra a Matriz de Estado
Evite testar apenas o "caminho feliz". Testes agnósticos a viés devem mapear se uma ação permitida em um status é **proibida** em outro.
*   **Viés:** Testar se consigo subir foto na 'Liberação'.
*   **Antiviés:** Testar se consigo subir foto na 'Liberação' **E** garantir que o sistema bloqueia o upload de fotos de 'Vistoria' nesse mesmo status.

### 2. Mocks Realistas (Data Integrity)
Nunca utilize dados "dummy" (como `b"content"` ou `test@test.com`) para componentes que realizam processamento real.
*   **Dica:** Se o sistema comprime imagens, o teste deve fornecer um buffer de imagem válido (PIL) para garantir que o código do compressor não seja ignorado ou quebre em produção.

### 3. Independência de Fábricas
Utilize o `factory-boy` para gerar massa de dados. Evite criar objetos manualmente nos testes para não replicar lógica de criação que pode estar enviesada.

---

## 🤖 Dicas para Trabalho com IA

Ao pedir para uma IA (como Sonnet ou GPT) criar testes:
1.  **Peça Contexto de Negócio:** "Antes de escrever o teste, me diga quais as restrições de status para essa funcionalidade".
2.  **Negativa Primeiro:** Instrua a IA a escrever o `test_failure_scenario` antes do `test_success`. Isso quebra o viés de otimismo da IA.
3.  **Matriz de Permissão:** Peça para a IA gerar um caso de teste para cada status da Ordem de Serviço, validando o que deve e o que não deve acontecer em cada um.

---

> [!IMPORTANT]
> Um teste que passa "fácil demais" costuma ser um teste enviesado. Procure sempre o "porquê" ele deveria falhar.
