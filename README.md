# AMAZCARE — Aplicativo Companheiro do Gaveteiro Inteligente

> **Projeto Acadêmico:** Laboratório de Circuitos Elétricos — Faculdade de Engenharia de Computação e Telecomunicações (FCT / ITEC / UFPA).  
> **Tema:** Gaveteiro inteligente de 6 gavetas com RTC DS3231, ESP32 e controle de rotina para idosos sob polifarmácia (5+ remédios diários).

---

## 1. Visão Geral da Solução

O **AMAZCARE** é uma solução completa projetada para garantir adesão medicamentosa e segurança no ambiente doméstico de pessoas idosas (70+ anos). 

O sistema é formado por:
- **Caixa Física 2×3:** Estrutura retangular com 6 gavetas independentes (coluna esquerda: 1, 2, 3; coluna direita: 4, 5, 6). Cada gaveta possui 1 LED bicolor e 1 microswitch (sensor de fim de curso). Buzzer no topo.
- **ESP32 + RTC DS3231:** O hardware guarda a agenda de forma autônoma na memória interna e alarme mesmo se a casa estiver sem Wi-Fi ou com o celular desligado.
- **Aplicativo Móvel Acessível (este app):** Interface em React Native + Expo Router + TypeScript + Tailwind (NativeWind v4) com alto contraste (WCAG AAA), Atkinson Hyperlegible, síntese de voz em português e navegação segura sem gestos complexos.

---

## 2. Instruções de Instalação e Execução

### Pré-requisitos
- Node.js (versão 18 ou superior).
- npm ou yarn.
- Para rodar no celular: aplicativo **Expo Go** (Android/iOS).
- Para rodar no computador: qualquer navegador moderno (Chrome, Edge, Firefox).

### Passo a Passo

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar a suíte de testes unitários do domínio:**
   ```bash
   npm test
   ```

3. **Verificar a tipagem estrita do TypeScript:**
   ```bash
   npm run typecheck
   ```

4. **Iniciar o aplicativo:**
   ```bash
   npm start
   ```
   - Pressione `w` no terminal para abrir diretamente no **navegador Web** (ideal para demonstração em projetor).
   - Escaneie o QR Code com o aplicativo **Expo Go** para rodar no dispositivo Android ou iOS.

---

## 3. Chaveamento: Simulador (Mock) vs. Hardware Real (ESP32)

O aplicativo foi projetado sob o padrão de arquitetura `DeviceGateway`, permitindo alternar de forma transparente entre o simulador completo de bancada e o hardware físico real.

- **Modo Padrão (Simulador / Apresentação Comercial):**
  Não requer configuração. O aplicativo inicializa com o `MockDeviceGateway`, simulando a máquina de estados completa da caixa, abertura/fechamento de gavetas, buzzer e LEDs.
  
- **Modo Hardware Real (ESP32 via Wi-Fi):**
  Defina a variável de ambiente antes de iniciar:
  ```bash
  # Windows PowerShell
  $env:EXPO_PUBLIC_DEVICE_MODE="http"; npm start

  # Linux / macOS / Bash
  EXPO_PUBLIC_DEVICE_MODE=http npm start
  ```
  O aplicativo utilizará o `HttpDeviceGateway`, conectando-se ao ESP32 via mDNS (`http://amazcare.local`) e WebSocket (`ws://amazcare.local/ws`). Veja o contrato completo em [docs/PROTOCOLO_ESP32.md](file:///c:/CodingPrograms/app-amazcare/docs/PROTOCOLO_ESP32.md).

---

## 4. Roteiro para a Apresentação Comercial de 15 Minutos (Banca)

Para apresentar o projeto aos avaliadores de forma didática e cronometrada:

1. **Abertura e Contextualização (2 minutos):**
   - Apresente a tela **Hoje**: destaque a saudação amigável, o **Próximo Momento** e a réplica física do **Mini-mapa 2×3** com a disposição correta das gavetas (1-3 na esquerda, 4-6 na direita).
   - Mostre o banner de conexão da caixa (indicando status Wi-Fi e última sincronização).

2. **Simulação da Hora do Remédio e Polifarmácia (4 minutos):**
   - Acesse **Ajustes → Modo Demonstração** e clique em **"Disparar Alarme Simultâneo (08:00)"**.
   - Mostre a abertura automática da **Tela de Alerta em Tela Cheia**.
   - Destaque o tratamento de múltiplos remédios no mesmo horário (Medicamento A e Medicamento D com Gavetas 1 e 4 acesas simultaneamente).
   - Toque em **"Ouvir orientação em voz alta"** para demonstrar a síntese de voz (TTS em pt-BR).
   - No bloco de simulação, clique em "Abrir Gaveta 3" para demonstrar o alarme de **gaveta errada aberta** (`WRONG_DRAWER`).
   - Clique em "Abrir Gaveta 1" e "Abrir Gaveta 4": o LED passa a piscar e o buzzer para. Feche as gavetas e confirme no botão **"Já tomei"**.

3. **Prevenção de Repetição Indevida (2 minutos):**
   - Na tela inicial, tente tocar em "Já tomei" novamente para o Medicamento A.
   - Demonstre o alerta de bloqueio: *"Atenção: Você já tomou este remédio hoje às 08:00. Deseja confirmar novamente?"*, prevenindo risco de overdose por esquecimento.

4. **Cadastro de Novo Remédio com Mapa Interativo (3 minutos):**
   - Vá na aba **Remédios** e clique em **"＋ Adicionar Novo Remédio"**.
   - Percorra o fluxo passo a passo: nome, dosagem, seleção da quantidade por dose via stepper (− / +), seleção de horários comuns via chips de preset.
   - No Passo 5, mostre a escolha de gaveta diretamente no mini-mapa 2×3, evidenciando que as gavetas já ocupadas ficam desabilitadas com aviso visual claro.

5. **Controle de Estoque e Transparência Técnica (2 minutos):**
   - Abra a aba **Estoque**. Aponte a nota explicativa de que a contagem é **estimada** (baseada na abertura/fechamento das gavetas, documentada em [docs/REQUISITOS.md](file:///c:/CodingPrograms/app-amazcare/docs/REQUISITOS.md)).
   - Mostre a previsão em dias restantes ("dá para ~6 dias") e o reabastecimento fácil pelo botão "Coloquei mais remédios".

6. **Relatório Clínico para Médicos em PDF (2 minutos):**
   - Abra a aba **Histórico**. Apresente a taxa de adesão em destaque (ex: 88%) e o gráfico em barras dos últimos 7 dias.
   - Toque em **"Gerar Relatório Médico em PDF"** para abrir o relatório diagramado para impressão e compartilhamento com geriatras e familiares.

---

## 5. Documentação Técnica do Projeto

- [docs/REQUISITOS.md](file:///c:/CodingPrograms/app-amazcare/docs/REQUISITOS.md): Mapeamento de rastreabilidade dos 7 alertas e requisitos da caixa.
- [docs/ACESSIBILIDADE.md](file:///c:/CodingPrograms/app-amazcare/docs/ACESSIBILIDADE.md): Auditoria WCAG AAA, decisões tipográficas (Atkinson Hyperlegible), suporte a 200% de escala e protocolo de teste com idosos.
- [docs/DESIGN.md](file:///c:/CodingPrograms/app-amazcare/docs/DESIGN.md): Tokens de cores OKLCH/Hex, escalas de tipografia e ergonomia motora.
- [docs/PROTOCOLO_ESP32.md](file:///c:/CodingPrograms/app-amazcare/docs/PROTOCOLO_ESP32.md): Especificação dos endpoints HTTP REST e WebSocket para o microcontrolador ESP32.
