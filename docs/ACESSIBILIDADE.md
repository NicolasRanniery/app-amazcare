# AMAZCARE — Diretrizes e Auditoria de Acessibilidade (WCAG AAA)

Este documento registra as decisões de acessibilidade de primeira classe implementadas no aplicativo **AMAZCARE**, voltadas para garantir a usabilidade plena por idosos (75+ anos) com baixa visão, mobilidade reduzida ou déficit cognitivo.

---

## 1. Princípios de Leitura e Baixa Visão

1. **Tipografia Especializada:**
   - Emprego da família tipográfica **Atkinson Hyperlegible** (desenvolvida pelo Braille Institute).
   - Elimina ambiguidades entre caracteres comuns (ex: diferencia claramente o número `1`, a letra `I` maiúscula e a letra `l` minúscula; diferencia o zero `0` da letra `O`).
2. **Escala de Tamanhos:**
   - **Piso Absoluto:** Nenhum texto no aplicativo tem tamanho inferior a **16 sp**.
   - Texto de leitura corrente: **20 sp**.
   - Títulos de seções: **24 sp**.
   - Títulos de tela e nomes de medicamentos: **28 sp**.
   - Indicadores principais e relógio: **34 sp**.
3. **Escala do Sistema até 200%:**
   - Todos os contêineres e cartões utilizam layout flexível (`flexGrow`, `minHeight` em vez de `height` fixo).
   - O texto não sofre quebra abrupta, truncamento com reticências ou sobreposição com ampliação de 200% ativada no sistema.
4. **Contraste de Cores WCAG AAA (Mínimo 7:1):**
   - Texto primário (`#0A1C10`) sobre fundo (`#F4F7F4`): **13.8:1**.
   - Texto secundário (`#2D4233`) sobre fundo (`#F4F7F4`): **7.4:1**.
   - Botão de ação primária (`#0B5A25`) com texto branco (`#FFFFFF`): **8.1:1**.
   - Todos os controles interativos mantêm contraste mínimo de **4.5:1** para bordas e ícones.
5. **Indicação Multissensorial de Estado:**
   - Status nunca é transmitido unicamente por cores.
   - Todo status combina: **cor de fundo + ícone semântico + palavra explicativa** (*Registrada*, *Atrasada*, *Esquecida*, *Em andamento*).

---

## 2. Toque, Destreza Motora e Ergonomia

1. **Alvos de Toque:**
   - Botão de ação principal (ex: "Já tomei", "Abrir gaveta"): **64 dp** de altura mínima.
   - Demais controles e abas: **56 dp** de altura mínima.
   - Espaçamento de separação entre alvos adjacentes: **mínimo de 12 dp**.
2. **Eliminação de Gestos Complexos:**
   - Não há gestos de deslizar para excluir (*swipe-to-delete*), pinça para zoom (*pinch-to-zoom*), arrastar e soltar (*drag-and-drop*) ou toque longo (*long-press*).
   - Todas as ações são acionadas por um único toque simples (*single tap*).
3. **Entrada de Dados Simplificada:**
   - Controles de quantidade e dias com botões incrementais grandes (− / +) de fácil acionamento.
   - Presets de horários comuns ("Manhã 08:00", "Almoço 12:00", "Noite 20:00") somados a relógio acessível.
   - Seleção da gaveta clicando diretamente na representação visual 2×3 da caixa.

---

## 3. Segurança Cognitiva e Feedback

1. **Ações Críticas Protegidas:**
   - A confirmação de ingestão, exclusão ou alteração de posologia é realizada via diálogo modal persistente com botões "Sim" e "Não" claros.
   - Não há mensagens importantes em toasts rápidos que desaparecem antes que o idoso consiga ler.
2. **Estímulos Multimodais:**
   - **Visual:** Tela cheia de alerta imediato, sem distrações secundárias.
   - **Tátil:** Vibrações distintas (`expo-haptics`) para alarme, sucesso e advertência.
   - **Auditivo / Voz:** Síntese de voz em português (`expo-speech`) anunciando horário, gaveta e remédio.
3. **Respeito a `prefers-reduced-motion`:**
   - Animações de LED piscando são desativadas quando o usuário configura redução de movimento, sendo substituídas por badge estático com texto explícito "Piscando".

---

## 4. Roteiro de Teste de Usabilidade com Idosos

Para validação em campo com 2 a 3 usuários idosos (ou familiares/cuidadores), execute o seguinte protocolo de 3 tarefas:

### Tarefa 1: Tomar a dose do meio-dia (Alerta Ativo)
- **Cenário:** A caixa começou a tocar o alarme e acendeu o LED da Gaveta 2 às 12:00.
- **Ação esperada do participante:** Olhar para a tela do aplicativo, identificar a gaveta a ser aberta pelo mini-mapa 2×3, abrir a gaveta correspondente e confirmar a ingestão através do botão "Já tomei".
- **Critérios de Sucesso:** Usuário identifica a gaveta sem hesitação e confirma sem clicar em botões incorretos.

### Tarefa 2: Cadastrar um novo remédio na rotina
- **Cenário:** O médico prescreveu um novo medicamento para as 20:00.
- **Ação esperada do participante:** Acessar a aba "Remédios", clicar em "Adicionar remédio", seguir os passos guiados (nome, dosagem, horário e escolha da gaveta no mapa 2×3) e salvar.
- **Critérios de Sucesso:** Conclusão do cadastro em menos de 2 minutos sem frustração com o teclado.

### Tarefa 3: Verificar se o remédio está acabando (Estoque)
- **Cenário:** O usuário quer saber se precisa comprar mais remédios para a semana.
- **Ação esperada do participante:** Abrir a aba "Estoque", verificar o remédio com aviso de estoque baixo e ler quantos dias restantes estimados restam.
- **Critérios de Sucesso:** Usuário entende claramente o conceito de dias restantes e localiza a opção de adicionar mais comprimidos após a compra.
