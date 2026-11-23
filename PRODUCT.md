# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Expo (managed), Expo Router, TypeScript strict, NativeWind v4 (Tailwind CSS), Zustand with AsyncStorage persist, date-fns (pt-BR), Zod, Atkinson Hyperlegible (@expo-google-fonts), expo-notifications, expo-haptics, expo-speech, expo-print, expo-sharing.

## Users

- **Usuário principal:** Idoso(a) com 70 a 75+ anos, apresentando polifarmácia (uso simultâneo de 5 ou mais medicamentos), baixa acuidade visual, eventual tremor fino e memória de curto prazo reduzida. O uso é doméstico e diário, frequentemente sob momentos de ansiedade ou pressa ("será que já tomei?").
- **Usuário secundário:** Familiar ou cuidador que realiza o cadastro das prescrições, reabastece gavetas e acompanha a adesão através de relatórios.

## Product Purpose

O **AMAZCARE** é o aplicativo companheiro de um gaveteiro inteligente de medicamentos de 6 gavetas independentes (projeto acadêmico de Laboratório de Circuitos Elétricos, UFPA/FCT). Ele cadastra prescrições médicas, sincroniza a agenda com a caixa via Wi-Fi, acompanha a rotina diária em tempo real, monitora o estoque estimado de comprimidos e gera históricos de adesão e relatórios clínicos em PDF para profissionais de saúde.

## Positioning

Diferente de aplicativos genéricos de lembrete de remédios, o AMAZCARE é fisicamente vinculado a um hardware dedicado:
1. **Caixa física 2×3:** 6 gavetas com sensores de fim de curso e LEDs individuais, com buzzer no topo.
2. **Independência operacional:** O ESP32 com RTC DS3231 alarma mesmo sem celular ou Wi-Fi. O app funciona como central de controle, visualizador de estado e reconciliador de eventos.
3. **Agrupamento de múltiplos medicamentos no mesmo horário:** Trata polifarmácia real abrindo e monitorando múltiplas gavetas em um mesmo horário, com checklist guiado.
4. **Design anti-confusão para idosos:** Alta legibilidade (Atkinson Hyperlegible, WCAG AAA), alvos grandes de toque, sem gestos complexos e réplica visual idêntica da caixa física.

## Operating Context

- Ambiente doméstico, uso na mesa ou cabeceira onde o gaveteiro fica instalado.
- O idoso consulta o app na hora da dose ou quando a caixa apita/acende os LEDs.
- O cuidador consulta e cadastra novas receitas periodicamente e envia relatórios em PDF para médicos ou geriatras.

## Capabilities and Constraints

- **6 Gavetas independentes:** Disposição física em 2 colunas × 3 linhas:
  * Coluna esquerda: Gavetas 1, 2 e 3 (de cima para baixo).
  * Coluna direita: Gavetas 4, 5 e 6 (de cima para baixo).
- **Alertas mandatórios (Figura 1.a do plano):**
  1. *Hora:* Alerta em tela cheia na hora exata + notificação local redundante.
  2. *Medicamento:* Nome do medicamento e destaque visual no mini-mapa 2×3 da caixa.
  3. *Dosagem:* Dosagem e quantidade ("500 mg · 1 comprimido") em destaque.
  4. *Repetição indevida:* Proteção contra dupla dosagem se a gaveta já tomada for aberta ou acionada de novo.
  5. *Esquecimento automático:* Transição automática para `esquecida` após tolerância configurável (padrão 60 min), derivado do relógio puro.
  6. *Fim de rotina:* Detecção do término de tratamento, arquivamento sem perda de histórico e liberação de gaveta.
  7. *Fim de estoque:* Alerta de estoque baixo e esgotado com cálculo de dias restantes com base na posologia.
- **Limitação de contagem física:** O hardware possui microswitches (aberto/fechado), não células de carga. O app é 100% transparente: a contagem é **estimada**, decresce a cada dose confirmada e aceita adição de unidades e calibração manual.
- **Arquitetura offline-first & DeviceGateway:**
  * `MockDeviceGateway`: Simulação local interativa completa de Wi-Fi, sensores, LEDs, buzzer e relógio para demonstração de 15 minutos e testes.
  * `HttpDeviceGateway`: Integração HTTP/WebSocket com ESP32 real (mDNS `amazcare.local`).
  * Modo selecionável por flag `EXPO_PUBLIC_DEVICE_MODE`.

## Brand Commitments

- **Nome:** AMAZCARE.
- **Identidade:** Arara-azul-e-amarela, folhas verde-floresta e cruz da saúde.
- **Paleta semente:** Verde-floresta profundo (`#0B5A25`), azul vivo (`#1565C0`), amarelo-ouro (`#FFB800`), calibrados em OKLCH para contraste WCAG AAA.
- **Tom de voz:** Calmo, acolhedor, doméstico, claro, seguro e respeitoso. Sem jargão técnico e sem linguagem infantilizada.

## Evidence on Hand

- Logo oficial da Entrega 2 em `assets/logo-amazcare.png`.
- Esqueleto de protótipo funcional em `reference/esqueleto.html` e `AMAZCARE.html`.
- Especificação detalhada de requisitos e arquitetura em `PROMPT_ANTIGRAVITY_AMAZCARE.md`.

## Product Principles

1. **Legibilidade acima de ornamentação:** Atkinson Hyperlegible como fonte única, texto base ≥ 20 sp, títulos ≥ 28 sp, nenhum texto < 16 sp. Contraste mínimo WCAG AAA (≥ 7:1 para texto).
2. **O mini-mapa 2×3 é a âncora cognitiva:** A réplica visual exata da caixa física conecta o mundo digital ao físico em todas as telas chave (Hoje, Alerta, Remédios, Estoque).
3. **Toque seguro e motor amigável:** Alvos de toque grandes (≥ 56 dp a 64 dp) com espaçamento de segurança (≥ 12 dp). Zero dependência de gestos (sem swipe, sem long-press, sem pinça).
4. **Tempo e status derivados do relógio:** Toda a lógica de status e transições é uma função pura `(schedule, events, now) => status`, permitindo simulação temporal precisa e tolerância a atrasos de abertura do app.
5. **Comunicação multimodal:** Alertas com estímulo visual claro, sinal sonoro, vibração tátil (`expo-haptics`) e síntese de voz (`expo-speech` em pt-BR).

## Accessibility & Inclusion

- Compatibilidade total com TalkBack (Android) e VoiceOver (iOS), com rótulos semânticos e live regions.
- Suporte a ampliação de texto do sistema de até 200% sem sobreposições ou quebras de layout.
- Respeito integral a `reduceMotion`: LEDs piscantes têm fallback estático com indicador textual explícito.
- Status nunca comunicado exclusivamente por cor: sempre acompanhado de ícone nítido e palavra descritiva em português.
