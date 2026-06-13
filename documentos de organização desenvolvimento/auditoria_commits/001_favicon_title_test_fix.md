# Auditoria de Alterações - Commit #1

## Informações Gerais
* **Data/Hora:** 2026-06-12 15:20:00 (UTC-3)
* **Autor:** Antigravity (AI Coding Assistant) & Wanderson
* **Tipo de Commit:** `feat(web)/fix(tests)`
* **Objetivo:** Customização visual da guia do portal do gestor (ícone do Lava-Me e título) e correção de injeção de dependência na suíte de testes unitários do frontend.

---

## 1. Resumo das Alterações
Foram realizadas alterações no frontend Angular (`web`) para substituir o favicon e o título padrão do portal do gestor pelo padrão corporativo do Lava-Me. Adicionalmente, identificamos e corrigimos uma falha de testes existente no componente de redefinição de senha (`reset-password.ts`), configurando corretamente o mock do `AuthService` e adaptando as regras do Vitest para inlining de recursos do Angular em arquivos com nomenclatura fora do padrão `.component.ts`.

---

## 2. Inventário de Arquivos Modificados/Adicionados

| Caminho do Arquivo | Status | Descrição |
| :--- | :--- | :--- |
| `web/public/logo-lavame.png` | **Adicionado** | Imagem PNG da logo oficial do Lava-Me, copiada do backend. |
| `web/public/favicon.ico` | **Modificado** | Sobrescrito com a logo do Lava-Me para servir de fallback de favicon. |
| `web/src/index.html` | **Modificado** | Atualizado título da guia para "Painel Administrativo Lava-Me" e link do favicon para `logo-lavame.png`. |
| `web/vitest.config.ts` | **Modificado** | Ajuste no plugin customizado de inlining para processar o arquivo `reset-password.ts`. |
| `web/src/app/auth/reset-password/reset-password.spec.ts` | **Modificado** | Mock de `AuthService` injetado no TestBed para prevenir falhas de JIT na DI do Angular no ambiente Vitest. |

---

## 3. Detalhamento de Alterações (Diffs)

### `web/src/index.html`
```diff
@@ -5,5 +5,5 @@
-    <title>GestorWeb</title>
+    <title>Painel Administrativo Lava-Me</title>
     <base href="/" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />
-    <link rel="icon" type="image/x-icon" href="favicon.ico" />
+    <link rel="icon" type="image/png" href="logo-lavame.png" />
```

### `web/vitest.config.ts`
```diff
@@ -11,3 +11,3 @@
-      if (!id.endsWith('.component.ts')) {
+      if (!id.endsWith('.component.ts') && !id.endsWith('reset-password.ts')) {
         return null;
       }
```

### `web/src/app/auth/reset-password/reset-password.spec.ts`
```diff
@@ -1,8 +1,7 @@
 import { ComponentFixture, TestBed } from '@angular/core/testing';
 import { ResetPassword } from './reset-password';
 import { provideRouter } from '@angular/router';
-import { provideHttpClient } from '@angular/common/http';
-import { provideHttpClientTesting } from '@angular/common/http/testing';
+import { AuthService } from '../../services/auth.service';
 
 describe('ResetPassword', () => {
   let component: ResetPassword;
@@ -9,5 +9,9 @@
 
   beforeEach(async () => {
+    const authServiceSpy = {
+      confirmarRecuperacaoSenha: vi.fn(),
+    };
+
     await TestBed.configureTestingModule({
       imports: [ResetPassword],
       providers: [
@@ -14,5 +14,4 @@
-        provideHttpClient(),
-        provideHttpClientTesting()
+        { provide: AuthService, useValue: authServiceSpy }
       ]
     }).compileComponents();
```

---

## 4. Validação Técnica
As alterações foram submetidas aos processos de validação de build e testes unitários locais:

1. **Angular Build (`npm run build` em `/web`):**
   * **Resultado:** Sucesso (Exit Code: 0).
   * **Validação:** Confirmado que o arquivo compilado `dist/gestor-web/browser/index.html` possui o novo título e o favicon mapeado corretamente, e que `logo-lavame.png` e `favicon.ico` foram copiados com sucesso para a raiz do build.

2. **Vitest Unit Tests (`npx vitest run` em `/web`):**
   * **Resultado:** Sucesso (Exit Code: 0).
   * **Métricas:** 25 arquivos de teste executados e **215 testes passando** (0 falhas).
