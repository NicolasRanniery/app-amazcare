# PROMPT — App AMAZCARE (React Native + TypeScript + Tailwind)

> Antes de colar: coloque na raiz do workspace `reference/esqueleto.html` (o .html do protótipo) e `assets/logo-amazcare.png` (logo da Entrega 2). Abra o Antigravity em modo **Planning** e peça o plano antes de codar.

---

## 0. Como trabalhar (leia primeiro)

1. **Carregue a skill `impeccable`** antes de qualquer decisão visual. Se ela não estiver instalada no workspace, pare e me avise em vez de seguir sem ela. Rode o setup de contexto da skill (ex.: `/teach-impeccable`) usando a seção 7 deste prompt como contexto de design.
2. **Produza primeiro um plano de implementação** (arquitetura, árvore de pastas, lista de telas, ordem de trabalho) e só depois escreva código.
3. Trabalhe em etapas pequenas e verificáveis (seção 9). Ao fim de cada etapa: rode `tsc --noEmit`, lint e testes, e corrija antes de seguir.
4. Em dúvida entre "bonito" e "legível por um idoso", **escolha legível**.
5. Quando houver conflito entre fontes, a ordem de autoridade é: **(1) requisitos do plano do projeto → (2) Entrega 2 → (3) esqueleto HTML**. O esqueleto é referência de fluxo e de ideias, **não de código nem de visual**.

---

## 1. Contexto do produto

**AMAZCARE** é uma empresa fictícia (trabalho de Laboratório de Circuitos Elétricos, UFPA/FCT). O produto é um **gaveteiro inteligente de medicamentos para idosos com polifarmácia** (uso simultâneo de 5+ remédios), composto por:

- Caixa retangular com **6 gavetas independentes**, dispostas em **2 colunas × 3 linhas**. Numeração física: **gavetas 1, 2, 3 na coluna esquerda (de cima para baixo) e 4, 5, 6 na coluna direita**. Buzzer no topo.
- Cada gaveta tem **1 LED** e **1 sensor de fim de curso** (aberta/fechada).
- **ESP32** + **RTC DS3231** (hora própria) + Wi‑Fi.
- **Este app** cadastra a prescrição, acompanha a rotina, controla o estoque e mostra o histórico, conversando com a caixa por Wi‑Fi.

Público: o **idoso é o usuário principal**; familiar/cuidador pode usar o mesmo app para cadastrar e acompanhar. A interface precisa funcionar para uma pessoa de 75+ anos, com baixa acuidade visual, memória de curto prazo reduzida e pouca destreza motora.

### Máquina de estados da caixa (Entrega 2 — respeitar)

| Estado | O que acontece |
|---|---|
| `AGUARDANDO` | LEDs apagados. Se alguma gaveta abrir sem dose ativa → **buzzer** (uso fora do horário). |
| `TOCANDO_ALARME` | Chegou o horário: **LED da gaveta correta aceso + buzzer intermitente**. Se abrir gaveta errada → sinal sonoro de erro. |
| `GAVETA_ABERTA_OK` | Gaveta correta aberta: **buzzer para, LED passa a piscar** até fechar. |
| (fechou) | LED apaga, bipe curto de confirmação, volta a `AGUARDANDO`. |

O app deve refletir esses estados em tempo real (tela de alerta ativo) e registrar os eventos.

---

## 2. Requisitos obrigatórios (rastreabilidade com o plano do projeto)

Crie `docs/REQUISITOS.md` com esta tabela preenchida com o **caminho do arquivo/tela** que cumpre cada item. É material para o relatório técnico.

### 2.1 Alertas exigidos pelo plano (Figura 1.a)

| Alerta | Comportamento esperado no app |
|---|---|
| **Hora** | Na hora da dose, abrir tela de alerta ativo (tela cheia) + notificação local. |
| **Medicamento** | Mostrar nome do remédio e **qual gaveta abrir**, com mini‑mapa 2×3 da caixa destacando a gaveta. |
| **Dosagem** | Mostrar dosagem e quantidade ("500 mg · 1 comprimido") em tamanho grande. |
| **Repetição indevida** | Se a gaveta de uma dose **já registrada** for aberta de novo, ou o usuário tentar registrar a mesma dose duas vezes: alerta claro "Você já tomou este remédio hoje às HH:MM", pedindo confirmação explícita. |
| **Esquecimento** | Dose não confirmada após uma **janela de tolerância configurável (padrão 60 min)** vira `esquecida` **automaticamente**, é registrada no histórico e mostrada em destaque. (O esqueleto só marca esquecimento manualmente — corrigir.) |
| **Fim de rotina** | Ao chegar a data de término do tratamento, avisar "O tratamento de X terminou", arquivar o remédio (sem apagar histórico) e oferecer liberar a gaveta. |
| **Fim de estoque** | Estoque baixo (≤ mínimo) e esgotado, com **estimativa de dias restantes** ("dá para ~6 dias"). |

### 2.2 Requisitos mínimos da caixa que o app suporta (item 1.a–f do plano)

- a) Disposição separada → mapa de gavetas (1–6) e vínculo remédio↔gaveta (uma gaveta por remédio; um remédio pode ter vários horários).
- b) **Detecção da quantidade** → ver limitação em 4.3. O app deve ser transparente: é **estimativa**.
- c) **Cadastro conforme a prescrição**: nome, dosagem, quantidade por dose, **horários**, **frequência**, **data de início e duração/término**, gaveta, observações (ex.: "tomar com comida").
- d) Indicar **hora e qual remédio** tomar.
- e) **Controle da rotina** (pendente / em andamento / registrada / atrasada / esquecida) e histórico com adesão.
- f) **Controle de estoque** (adicionar unidades, ajustar, mínimo de aviso).

### 2.3 Opcionais do plano que vamos implementar

- **Notificações** para gestão remota/continuidade: notificações locais agendadas como redundância (a caixa é o alarme principal; o app é apoio).
- **Relatório para profissionais de saúde** (Figura 1.c): exportar o histórico do período em **PDF** (`expo-print` + `expo-sharing`), com adesão %, doses esquecidas e movimentos de estoque.

### 2.4 Pontos do esqueleto HTML que NÃO atendem ao plano (corrigir, não copiar)

1. **Numeração das gavetas** está em ordem de linha (1‑2 / 3‑4 / 5‑6). A caixa real é **coluna-esquerda 1‑3, coluna-direita 4‑6**.
2. **Só uma dose por vez** (`if(A) return` bloqueia alertas simultâneos). Na polifarmácia vários remédios caem no **mesmo horário**: agrupar em um único "momento" (ex.: 08:00 → 3 remédios, gavetas 1, 2 e 4) com **vários LEDs acesos** e checklist gaveta a gaveta.
3. **Alerta dispara só se o app estiver aberto no minuto exato.** Corrigir: a lógica de status deve ser **derivada do relógio** (função pura `statusAt(now)`), e doses não confirmadas devem virar `atrasada` → `esquecida` mesmo se o app foi aberto depois.
4. Esquecimento manual apenas; sem **repetição indevida**; sem **fim de rotina**.
5. Quantidade por dose é string (`"1 comprimido"` + `parseInt`). Usar `{ amount: number; unit: DoseUnit }`.
6. Mensagens de erro/aviso em **toast de 4,5 s** — inaceitável para informação crítica para idosos. Usar banners/diálogos persistentes.
7. Ícones são emojis. Substituir por conjunto de ícones consistente **sempre acompanhado de texto**.
8. Persistência em `localStorage`, sem versionamento de dados.
9. O painel "Caixa" do esqueleto mistura simulação e produção. Separar (ver seção 5).

---

## 3. Stack e arquitetura

- **Expo (managed)**, SDK estável mais recente, **Expo Router**, **TypeScript `strict: true`**.
- **Tailwind via NativeWind v4** (classes `className`). Tokens de design no `tailwind.config.js` (cores, tipografia, espaçamento, raios) — nada de valores mágicos espalhados.
- Estado: **Zustand** com `persist` (AsyncStorage) e **migrações de versão**. Se o histórico crescer, `expo-sqlite`.
- Datas: `date-fns` com locale `pt-BR`. Validação: `zod`.
- Libs de plataforma: `expo-notifications`, `expo-haptics`, `expo-speech`, `expo-print`, `expo-sharing`, `expo-font` (Atkinson Hyperlegible via `@expo-google-fonts`).
- Rodar em Android/iOS (Expo Go) e **web** (para demonstração rápida em projetor).
- Idioma único: **pt‑BR**. Strings centralizadas em `src/i18n/pt-BR.ts`.

### Estrutura sugerida

```
app/                      # rotas (Expo Router)
  (tabs)/hoje.tsx remedios.tsx estoque.tsx historico.tsx
  alerta.tsx              # tela cheia de dose ativa
  remedio/[id].tsx  remedio/novo.tsx
  ajustes.tsx  ajustes/demonstracao.tsx
src/
  domain/                 # PURO, sem React, 100% testado
    types.ts schedule.ts status.ts stock.ts adherence.ts report.ts
  device/
    DeviceGateway.ts      # interface
    MockDeviceGateway.ts  # padrão (simulador da caixa)
    HttpDeviceGateway.ts  # real (ESP32), atrás de flag
  store/ services/ components/ theme/ i18n/
docs/REQUISITOS.md  docs/ACESSIBILIDADE.md  docs/PROTOCOLO_ESP32.md
```

**Regra de ouro:** toda regra de negócio (horários, status, estoque, repetição, esquecimento, fim de rotina, adesão) vive em `src/domain` como **funções puras que recebem `now` como parâmetro**. Nada chama `new Date()` direto fora de um `Clock` injetável. Isso permite testar e permite o botão "simular chegada do horário" na demonstração.

### Modelo de dados (ponto de partida)

```ts
type DrawerId = 1 | 2 | 3 | 4 | 5 | 6;
type DoseUnit = 'comprimido' | 'cápsula' | 'gota' | 'ml' | 'outro';

interface Medication {
  id: string; name: string; strength: string;          // "500 mg"
  dose: { amount: number; unit: DoseUnit };
  times: string[];                                      // ["08:00","20:00"]
  startDate: string; endDate: string | null;            // ISO date
  drawer: DrawerId; notes?: string;
  stock: { estimated: number; minAlert: number; updatedAt: string };
  archivedAt?: string;
}
type DoseStatus = 'pendente' | 'andamento' | 'registrada' | 'atrasada' | 'esquecida';
interface DoseEvent {
  id: string; medicationId: string; scheduledFor: string; // ISO
  status: DoseStatus; takenAt?: string; source: 'caixa' | 'app';
  drawerOpenedAt?: string; drawerClosedAt?: string;
}
```

---

## 4. Integração com a caixa (ESP32)

### 4.1 Quem manda em quê (decisão de arquitetura)

A caixa precisa **alarmar mesmo com o celular desligado ou fora do Wi‑Fi**. Portanto:

- O **ESP32 guarda a agenda localmente** (usa o RTC DS3231) e dispara LED/buzzer sozinho.
- O **app é o configurador e o painel**: envia a agenda (`syncSchedule`), recebe eventos e mostra tudo.
- Se o Wi‑Fi cair, a caixa **enfileira eventos com timestamp** e o app os importa ao reconectar. O app mostra "Última sincronização: HH:MM" e um aviso claro (texto + ícone) quando a caixa está offline.

### 4.2 Abstração `DeviceGateway`

```ts
interface DeviceGateway {
  status$: Observable<{ online: boolean; lastSyncAt?: string; clockOk: boolean }>;
  events$: Observable<DeviceEvent>;
  syncSchedule(meds: Medication[]): Promise<void>;
  // Só no Mock/diagnóstico:
  setLed?(drawer: DrawerId, mode: 'off' | 'on' | 'blink'): Promise<void>;
}
type DeviceEvent =
  | { type: 'ALARM_STARTED'; drawers: DrawerId[]; at: string }
  | { type: 'DRAWER_OPENED'; drawer: DrawerId; at: string; correct: boolean; scheduled: boolean }
  | { type: 'DRAWER_CLOSED'; drawer: DrawerId; at: string }
  | { type: 'WRONG_DRAWER'; drawer: DrawerId; at: string }
  | { type: 'OUT_OF_SCHEDULE_OPEN'; drawer: DrawerId; at: string };
```

- **Implemente completo o `MockDeviceGateway`** (substitui o painel "Caixa" do esqueleto): simula Wi‑Fi, abrir/fechar cada gaveta, LED apagado/aceso/piscando, buzzer, e a máquina de estados da seção 1. Deve funcionar com **vários remédios no mesmo horário**.
- **`HttpDeviceGateway`**: implementar tipado, atrás de flag `EXPO_PUBLIC_DEVICE_MODE=mock|http`. Contrato **proposto** (ajustável com o time de hardware) em `docs/PROTOCOLO_ESP32.md`: descoberta por mDNS (`amazcare.local`), `GET /status`, `PUT /schedule`, `GET /events?since=`, e WebSocket `/ws` para eventos em tempo real; JSON com timestamps ISO.

### 4.3 Limitação que o plano exige documentar

O plano pede "detecção da quantidade de cada medicamento", mas **o hardware definido só detecta abrir/fechar gaveta**, não conta comprimidos. O app trata o estoque como **estimativa**: decrementa `dose.amount` a cada dose registrada, permite **ajuste manual** e **adição de unidades**, e deixa explícito na tela "Quantidade estimada". Registre isso em `docs/REQUISITOS.md` (motivo da limitação + solução adotada + evolução possível: célula de carga/sensor de peso por gaveta).

### 4.4 Modo demonstração

`Ajustes → Modo demonstração` (visível no build de apresentação) contém: simular chegada do horário (um ou vários remédios), abrir/fechar gavetas, derrubar/restaurar Wi‑Fi, avançar o relógio (+1 h, +1 dia) e resetar dados de exemplo. Os dados de exemplo usam nomes fictícios ("Medicamento A/B/C…", como no esqueleto), nunca remédios reais. Isso é essencial para a **apresentação comercial de 15 min**.

---

## 5. Telas e fluxos

Navegação inferior com **no máximo 4 abas, sempre ícone + texto (≥ 16 sp)**: **Hoje · Remédios · Estoque · Histórico**. **Ajustes** fica no cabeçalho como botão com texto "Ajustes" (contém status da caixa, tamanho do texto, alto contraste, tolerância de esquecimento, modo demonstração). Se achar melhor outra divisão, justifique no plano.

1. **Hoje** — Cabeçalho com saudação e data por extenso. Bloco principal: **próximo momento** ("Às 12:00 · Medicamento B · gaveta 2"), com o mini‑mapa 2×3 da caixa. Depois, linha do tempo do dia (cada dose: horário, remédio, dose, status em texto+ícone). Faixa discreta com status da caixa (online/offline, última sincronização). Sem "cards de estatística" decorativos.
2. **Alerta ativo (tela cheia)** — Abre automaticamente quando a caixa dispara o alarme ou ao tocar a notificação. Mostra, em ordem: horário → **nome do remédio** → dosagem/quantidade → **"Abra a gaveta N"** com o número gigante e o mini‑mapa → progresso em passos simples (Alerta · Gaveta aberta · Fechada · Confirmar) refletindo o estado real da caixa. Botões grandes: **"Li em voz alta"** (TTS), **"Já tomei"** (com confirmação Sim/Não) e **"Não vou tomar agora"**. Vários remédios no mesmo horário = lista com checklist por gaveta.
3. **Remédios** — Lista com nome, dosagem, horários, gaveta e estoque resumido. Adicionar/editar em **fluxo passo a passo, um assunto por tela** (nome e dosagem → quantidade por dose → horários → início/duração → gaveta [escolha visual no mapa 2×3, gavetas ocupadas desativadas] → observações → revisão). Excluir/arquivar com confirmação em linguagem simples e consequência explícita.
4. **Estoque** — Por remédio: quantidade estimada, mínimo, dias restantes, barra de nível **com texto** ("Estoque baixo: restam 4"). Ações: "Coloquei mais comprimidos" e "Corrigir quantidade". Aviso fixo explicando que é estimativa.
5. **Histórico** — Filtro por remédio e período (Hoje / 7 dias / 30 dias), adesão %, gráfico diário simples e legível (não depender de cor), lista de eventos, botão **"Gerar relatório em PDF"**.
6. **Ajustes** — Conexão com a caixa (diagnóstico simples), tamanho do texto, alto contraste, voz, tolerância de esquecimento, modo demonstração.

Primeiro uso: no máximo 3 telas de boas‑vindas, puláveis, explicando só o essencial.

---

## 6. Acessibilidade para idosos (requisito de primeira classe)

Escreva `docs/ACESSIBILIDADE.md` com cada decisão e como foi verificada. Regras mínimas:

**Leitura**
- Fonte: **Atkinson Hyperlegible** (desenhada para baixa visão; já usada no esqueleto — manter). Texto base **≥ 20 sp**, títulos **≥ 28 sp**, **nenhum texto abaixo de 16 sp**, nem em abas e chips.
- Respeitar a escala de fonte do sistema **até 200 %** sem cortar nem sobrepor (teste obrigatório) e oferecer em Ajustes **Texto: Normal / Grande / Extra grande**.
- **Contraste ≥ 7:1 (WCAG AAA)** para texto e ≥ 4,5:1 para ícones/bordas de controles. Validar cada par de cores dos tokens e registrar a tabela.
- **Nunca só cor**: status = cor + ícone + palavra ("Esquecida", "Atrasada").
- Linguagem simples e direta, sem jargão: "Hora de tomar", "Já tomei", "Falta pouco remédio". Horário em 24 h com apoio em palavras ("08:00 · de manhã"). Data por extenso.

**Toque e motricidade**
- Alvos de toque **≥ 56 dp (ação principal 64 dp)**, com **≥ 12 dp** entre alvos vizinhos. Ações destrutivas nunca ao lado de ações frequentes.
- **Sem gestos**: nada de deslizar para excluir, pressionar e segurar, arrastar ou pinça. Tudo por toque simples.
- Entrada de dados com o mínimo de digitação: **steppers (− / +)** para números, **presets de horário** ("Manhã 08:00", "Almoço 12:00", "Noite 20:00") + seletor grande para horário livre, escolha de gaveta no mapa visual.
- Rótulos sempre visíveis (nunca só placeholder). Erros em frase curta, junto ao campo, anunciados por leitor de tela.

**Cognição e segurança**
- **Uma ação principal por tela**; tela de alerta sem distrações.
- Sem timeouts e sem informação crítica que desapareça sozinha. Confirmar "Já tomei" e qualquer exclusão com **Sim / Não grandes** e verbo claro.
- Navegação previsível e igual em todas as telas; voltar sempre visível, com texto.
- Feedback **multimodal** nos alertas: visual + **som** + **vibração** (`expo-haptics`) + **voz opcional** (`expo-speech`, pt‑BR: "São oito horas. Tome o Medicamento A, quinhentos miligramas, um comprimido. Abra a gaveta um.").
- Notificações locais redundantes: canal de alta prioridade, repetir a cada 5 min até confirmar (limite razoável).

**Tecnologia assistiva**
- `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`, `accessibilityState` em tudo que é interativo; `accessibilityLiveRegion`/anúncio ao abrir a tela de alerta; ordem de foco correta; foco movido para o título ao abrir telas/modais.
- Funcionar com **TalkBack e VoiceOver**. Respeitar `reduceMotion`: nada de piscar mais de 1 Hz; o "LED piscando" vira indicador estático com texto "piscando" quando reduzir movimento estiver ativo.
- Tema **claro por padrão** (fundo off‑white quente, sem branco puro ofuscante), **alto contraste** opcional e escuro seguindo o sistema.
- Orientação retrato; em tablet, coluna central com largura máxima e tipografia maior (idosos usam muito tablet).

**Validação**: ao fim, rode a auditoria de acessibilidade da skill e escreva um **roteiro de teste de usabilidade** (3 tarefas: "tomar a dose do meio-dia", "cadastrar um remédio novo", "ver se está acabando") para aplicar com 2–3 idosos reais.

---

## 7. Direção de design (para a skill `impeccable`)

**Contexto a informar na skill**
- Usuário: idoso(a) 70+, possível baixa visão e tremor leve; segundo usuário: familiar/cuidador mais jovem. Uso diário, em casa, muitas vezes sob pressa ou ansiedade ("será que já tomei?").
- Marca: **AMAZCARE** — logo com **arara‑azul‑e‑amarela, folhas verde‑floresta e cruz de saúde**. Paleta‑semente: verde‑floresta profundo (~`#0B5A25`), azul vivo (~`#1565C0`), amarelo‑ouro (~`#FFB800`). Calibrar em **OKLCH** para cumprir AAA; amarelo só com texto escuro por cima. Definir também vermelho (urgência) e neutros **levemente esverdeados/quentes**.
- Tom: **calmo, acolhedor, doméstico, confiável**; um traço de identidade amazônica discreto. Não é app de hospital frio nem startup de tecnologia.
- Referências mentais: caderneta/receita impressa bem diagramada, rótulo de remédio, relógio de parede legível. **Anti‑referências:** dashboard de SaaS, "app de bem‑estar" genérico, fintech.

**Para não parecer feito por IA**
- Nada de gradiente de fundo, "glassmorphism", brilho/glow decorativo, sombras difusas por toda parte, roxo/azul‑violeta, ou todo elemento com o mesmo `rounded-2xl`.
- Sem emojis como ícones. Conjunto de ícones único (ex.: Phosphor ou Lucide) **sempre com rótulo**.
- Sem linha de "cards de métricas" com número grande + rótulo pequeno (o `grid3` do esqueleto) e sem card dentro de card.
- Hierarquia por **tipografia, espaço e alinhamento**, não por caixas. Alinhamento à esquerda; evitar centralizar tudo.
- **Elemento‑assinatura:** o **mapa 2×3 da caixa** (réplica da frente física, numeração 1‑3 / 4‑6) reaparece em Hoje, Alerta, Cadastro e Estoque. É a ponte entre o app e o objeto físico.
- Textos de interface com voz humana e específica ("Sua próxima dose é às 12:00"), não frases de template ("Tudo em dia ✔").
- Movimento mínimo e funcional; respeitar `reduceMotion`.

**Ciclo com a skill**: aplicar o contexto → construir → rodar `critique`, `audit` e `polish` (e `clarify`, `adapt`, `harden` quando fizer sentido; use os comandos que a versão instalada oferecer) → corrigir → repetir até passar. Registre em `docs/DESIGN.md` os tokens finais e as decisões.

---

## 8. Fora de escopo

Backend próprio, login/conta, push remoto, firmware do ESP32 (só o contrato e o gateway), integração com farmácia, leitura de receita por câmera, dispensação motorizada (descartada na Entrega 2: o texto do MVP e do cronograma que citam motor/"gaveta de saída" são resquício da concepção antiga — **ignorar**).

---

## 9. Ordem de trabalho e entregáveis

1. **Plano** (arquitetura, pastas, telas). Parar e mostrar.
2. **Setup**: Expo + TS strict + NativeWind + fontes + tokens + lint + testes. Contexto da `impeccable`.
3. **Domínio puro + testes** (agenda, status derivado do relógio, doses simultâneas, esquecimento automático, repetição indevida, fim de rotina, estoque e dias restantes, adesão). Cobertura alta nessa camada.
4. **`MockDeviceGateway`** com a máquina de estados e vários remédios no mesmo horário.
5. **Telas** na ordem: Hoje → Alerta → Remédios (cadastro) → Estoque → Histórico (+ PDF) → Ajustes/Demonstração.
6. **`HttpDeviceGateway`** + `docs/PROTOCOLO_ESP32.md`.
7. **Passe final de acessibilidade e design** (seções 6 e 7), teste com fonte a 200 % e leitor de tela.
8. **README** com como rodar, como alternar mock/http e roteiro de demonstração; gerar **screenshots das telas** (servem para a seção "Simulação do APP" da Entrega 2 e para o relatório final).

### Critérios de aceite

- [ ] Todos os 7 alertas do plano funcionam no Mock e estão mapeados em `docs/REQUISITOS.md`.
- [ ] Vários remédios no mesmo horário funcionam (LEDs múltiplos, checklist).
- [ ] Gavetas numeradas como a caixa real (1‑3 esquerda, 4‑6 direita).
- [ ] Esquecimento automático e status independentes de o app estar aberto no minuto exato.
- [ ] Nenhum texto < 16 sp, alvos ≥ 56 dp, contraste AAA registrado, tela a 200 % sem quebra.
- [ ] Funciona com TalkBack/VoiceOver nas telas Hoje, Alerta e Cadastro.
- [ ] Sem gestos obrigatórios e sem informação crítica em toast temporário.
- [ ] `tsc`, lint e testes passando; `HttpDeviceGateway` compila e é selecionável por flag.
- [ ] Limitação da contagem de comprimidos documentada.
- [ ] Auditoria da `impeccable` sem pendências críticas.
