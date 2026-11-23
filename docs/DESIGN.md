# AMAZCARE — Diretrizes de Design e Tokens (DESIGN.md)

<!-- impeccable:design-tokens 1 -->

Este documento estabelece o sistema de design do **AMAZCARE**, calibrado de acordo com as diretrizes da skill `impeccable` e as exigências estritas de acessibilidade para idosos (WCAG AAA).

---

## 1. Filosofia e Direção de Design

- **Modo:** `Operate` (aplicativo utilitário de saúde diária, clareza e previsibilidade absolutas).
- **Tom de voz:** Calmo, acolhedor, doméstico, confiável, com um toque discreto da identidade amazônica (verde-floresta, fauna e flora). Não se assemelha a um prontuário hospitalar frio nem a um dashboard corporativo/SaaS.
- **Metáfora mental:** Caderneta/receita médica impressa em papel fosco, rótulo de remédio de fácil leitura e relógio de parede de cozinha com algarismos nítidos.
- **Anti-padrões banidos:**
  - ❌ Sem gradientes decorativos, fundos transparentes (*glassmorphism*) ou brilhos (*glow*).
  - ❌ Sem caixas dentro de caixas ou linhas de "cards de métricas" com números sem contexto legível.
  - ❌ Sem cantos excessivamente arredondados (`rounded-3xl` em tudo) ou espaçamentos desiguais.
  - ❌ Sem emojis em substituição a ícones de sistema consistentes.
  - ❌ Sem textos informativos menores que 16 sp.
  - ❌ Sem gestos complexos (arrastar, deslizar para apagar, manter pressionado).
  - ❌ Sem status comunicados apenas por cor.

---

## 2. Paleta de Cores (Calibrada para WCAG AAA)

A paleta baseia-se na identidade da marca (arara-azul-e-amarela, floresta e saúde) e foi calibrada para alcançar proporções de contraste estritas (≥ 7:1 para texto normal e ≥ 4,5:1 para elementos de controle e ícones).

### Modo Claro (Padrão — Fundo quente, evitando branco puro ofuscante)

| Token | Hex | OKLCH aprox. | Finalidade / Contraste |
|---|---|---|---|
| `bg-canvas` | `#F4F7F4` | `oklch(0.97 0.008 140)` | Fundo principal da aplicação (off-white quente esverdeado) |
| `bg-surface` | `#FFFFFF` | `oklch(1.00 0 0)` | Superfície de cartões, diálogo e gavetas |
| `border-subtle` | `#CBD7CD` | `oklch(0.86 0.018 140)` | Bordas divisórias de cartões e inputs |
| `border-strong` | `#334E39` | `oklch(0.38 0.05 140)` | Bordas com alto contraste (foco e gavetas ativas) |
| `text-primary` | `#0A1C10` | `oklch(0.18 0.035 140)` | Texto principal (Contraste 13.8:1 sobre canvas — AAA) |
| `text-muted` | `#2D4233` | `oklch(0.35 0.04 140)` | Texto secundário/apoio (Contraste 7.4:1 sobre canvas — AAA) |
| `primary` (Verde Floresta) | `#0B5A25` | `oklch(0.41 0.12 142)` | Cor de ação principal, botões de confirmação e sucesso |
| `primary-contrast` | `#FFFFFF` | `oklch(1.00 0 0)` | Texto em botões primários (Contraste 8.1:1 — AAA) |
| `secondary` (Azul Arara) | `#0D47A1` | `oklch(0.38 0.17 260)` | Elementos de apoio, conexões e navegação secundária |
| `accent-gold` (Amarelo Ouro) | `#8F5300` | `oklch(0.48 0.14 70)` | Alertas de atenção / doses em andamento (com texto claro) |
| `accent-gold-bg` | `#FFF3D6` | `oklch(0.96 0.04 85)` | Fundo para badges de atenção (com texto `#5E3600`) |
| `urgent` (Vermelho Alerta) | `#A31610` | `oklch(0.42 0.18 28)` | Alertas urgentes, atrasos, esquecimentos e erros |
| `urgent-bg` | `#FDE8E7` | `oklch(0.94 0.03 25)` | Fundo de destaque para doses atrasadas |
| `box-cabinet` | `#1A3B28` | `oklch(0.30 0.07 145)` | Representação física da carcaça do gaveteiro no mini-mapa |

### Modo Alto Contraste (Opcional em Ajustes)

- Fundo: `#000000` ou `#FFFFFF` puro.
- Bordas: `#000000` / `#FFFFFF` de 3px a 4px de espessura.
- Textos: `#000000` / `#FFFFFF` puros.
- Foco visual: contorno amarelo de 4px (`#FFD600` em fundo preto / `#000000` em fundo branco).

---

## 3. Tipografia

- **Família:** **Atkinson Hyperlegible** (desenvolvida especificamente pelo Braille Institute para maximizar a distinção entre caracteres como `I`, `l`, `1`, `O`, `0`).
- **Escala de Tamanhos:**
  - `text-display`: **34 sp** (Negrito) — Números gigantes de gaveta e relógio principal.
  - `text-title-lg`: **28 sp** (Negrito) — Títulos de páginas e cabeçalhos principais.
  - `text-title-md`: **24 sp** (Negrito) — Nomes de medicamentos e horários em destaque.
  - `text-body`: **20 sp** (Regular/Negrito) — Texto de leitura base, descrições e instruções.
  - `text-caption`: **17 sp** (Negrito) — Rótulos de apoio, abas, chips e metadados.
  - ⚠️ **Piso absoluto:** Nenhum elemento de texto pode ter tamanho inferior a **16 sp**.
- **Acessibilidade:** Escala de fonte do sistema operacional suportada até **200%** sem truncamento de texto (`numberOfLines` não deve esconder dados críticos). Em Ajustes, há controle rápido: *Texto Normal*, *Grande*, *Extra Grande*.

---

## 4. Layout e Ergonomia Motora

1. **Alvos de Toque:**
   - Botões principais: altura mínima de **64 dp**.
   - Botões secundários e controles interativos: altura mínima de **56 dp**.
   - Espaçamento de segurança entre alvos vizinhos: mínimo de **12 dp**.
2. **Entrada de Dados Simplificada:**
   - Utilização de seletores com botões incrementais grandes (− / +) para valores numéricos de estoque e doses.
   - Presets de horários comuns ("Manhã 08:00", "Almoço 12:00", "Noite 20:00") com seletor de relógio grande para horários customizados.
   - Escolha de gaveta através de clique direto no mapa 2×3 interativo.
3. **Elemento-Assinatura (Mini-mapa 2×3 da Caixa):**
   - Réplica fiel da frente do gaveteiro:
     - Coluna Esquerda: Gavetas 1, 2 e 3 (cima para baixo).
     - Coluna Direita: Gavetas 4, 5 e 6 (cima para baixo).
   - Indicador de estado em cada gaveta: aberta (linha tracejada / cor âmbar), fechada (borda sólida), LED aceso / piscando (ou estático quando `reduceMotion` estiver ativo), nome do remédio associado.

---

## 5. Feedback Multimodal e Segurança Cognitiva

- **Multimodalidade nos Alertas:**
  1. *Visual:* Tela cheia de alerta imediato com alto contraste e número da gaveta em destaque.
  2. *Tátil:* Padrões de vibração nítidos via `expo-haptics`.
  3. *Auditivo:* Sons dedicados do sistema e suporte à síntese de voz (`expo-speech` em pt-BR anunciando: "São oito horas. Tome o Medicamento X, quinhentos miligramas, um comprimido. Abra a gaveta um.").
- **Prevenção de Erros:**
  - Ações críticas e destrutivas (excluir remédio, registrar esquecimento, confirmar que tomou dose sem alarme) exigem confirmação explícita com botões "Sim" e "Não" grandes com texto claro.
  - Sem toasts temporários para informações essenciais de saúde. Todos os avisos de segurança são cartões ou diálogos persistentes.
