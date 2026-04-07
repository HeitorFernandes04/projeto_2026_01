# Padrões de Desenvolvimento Mobile (Ionic + React)

Este documento define as regras absolutas que a IA deve seguir ao gerar, modificar ou analisar código no projeto mobile do Lava-Me.

## 📌 1. Design System e Estilização
O projeto utiliza um design system próprio. **NUNCA** gere CSS inline ou crie novas classes de cores. Sempre utilize o `lava-me.css`.

### Tokens Principais (CSS Variáveis)
Os tokens estão definidos globalmente e devem ser acessados no CSS estrutural dos componentes:
*   Fundo principal: `var(--lm-bg)`
*   Fundo de cards: `var(--lm-card)` e `var(--lm-card-hover)`
*   Cor Primária (Tema): `var(--lm-primary)`
*   Bordas: `var(--lm-border)`
*   Textos: `var(--lm-text)` e `var(--lm-text-muted)`

### Classes Utilitárias do Tema
*   `.lm-page`: Para o container principal da página (`<IonPage>`).
*   `.lm-card`: Para containers de informação.
*   `.lm-input`: Para campos de formulário (`<IonInput>`, `<IonTextarea>`).
*   `.lm-btn-primary`: Botão de ação primária (deve substituir as props nativas de cor do Ionic).
*   `.lm-badge-*`: Badges para os status `agendado`, `andamento`, `finalizado` e `cancelado`.

## 📌 2. Componentes Reutilizáveis Existentes
Sempre verifique as `props` dos componentes a seguir e faça a reutilização ao invés de codificá-los do zero.

### `<GaleriaFotos>`
**Localização:** `src/components/GaleriaFotos.tsx`
**Reponsabilidade:** Lida com a exibição, navegação em overlay modal e captura (via `@capacitor/camera`) de imagens para os atendimentos.
**Uso:** Deve ser instanciado agrupando as fotos por momento (ANTES e DEPOIS). Não tente utilizar APIs web puras (`input type='file'`), use sempre o capacitor através da implementação exposta neste componente ou seu Service acoplado.

## 📌 3. Componentes Estruturais e Nomenclatura
*   **Arquivos e Funcionalidades:** Use `PascalCase.tsx` para todas as views e components (Ex: `DetalhesAtendimento.tsx`).
*   **Encapsulamento de CSS:** Cada componente ou página deve ter seu próprio arquivo `.css` importado (Ex: `Home.tsx` importa `Home.css`).
*   **Estrutura de Página Ionic:** Sempre envolva as views completas na hierarquia correta:
    ```tsx
    <IonPage className="lm-page">
      <IonHeader>...</IonHeader>
      <IonContent>...</IonContent>
    </IonPage>
    ```

## 📌 4. Cuidados Técnicos (Anti-Patterns)
1. **Hooks de Efeito Perigoso:** Evite `useEffect` sem array de dependências, especialmente quando ativando subscrições do Capacitor (como listeners de teclado ou câmera).
2. **Ciclo de Vida do Ionic:** Em navegações de abas ou modais, prefira `useIonViewWillEnter` ao invés de `useEffect` para requests (API fetch), garantindo que os dados recarreguem ao voltar à tela.
3. **Limites da IA:** Se a funcionalidade envolver algo nativo (ex: Geolocation, Câmera), **NÃO** proponha soluções para web pura. Assegure que as chamadas sejam direcionadas aos plugins do `@capacitor/*`.
