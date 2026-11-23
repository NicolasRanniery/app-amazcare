# AMAZCARE — Matriz de Rastreabilidade de Requisitos

Este documento formaliza o cumprimento de todos os requisitos do projeto **AMAZCARE** (Laboratório de Circuitos Elétricos — UFPA / FCT), mapeando cada especificação com o respectivo componente de software e documentando as soluções técnicas adotadas.

---

## 1. Mapeamento dos 7 Alertas Exigidos pelo Plano (Figura 1.a)

| Alerta | Descrição do Requisito | Comportamento Implementado | Arquivo / Tela Responsável |
|---|---|---|---|
| **1. Alerta de Hora** | Notificação pontual no momento exato da dose prescrita. | Abertura imediata de tela cheia com alarme audiovisual, vibração contínua e notificação local agendada como redundância. | [app/alerta.tsx](file:///c:/CodingPrograms/app-amazcare/app/alerta.tsx), [src/services/notificationService.ts](file:///c:/CodingPrograms/app-amazcare/src/services/notificationService.ts) |
| **2. Alerta de Medicamento** | Identificação clara de qual remédio deve ser ingerido e onde ele está. | Apresentação do nome do remédio em fonte grande (28 sp) e destaque visual da gaveta no mini-mapa 2×3 da caixa física. | [app/alerta.tsx](file:///c:/CodingPrograms/app-amazcare/app/alerta.tsx), [src/components/BoxCabinetMap.tsx](file:///c:/CodingPrograms/app-amazcare/src/components/BoxCabinetMap.tsx) |
| **3. Alerta de Dosagem** | Exibição da quantidade e posologia sem ambiguidades. | Exibição em destaque de dosagem e unidades (ex: *"500 mg · 1 comprimido"*), evitando qualquer necessidade de cálculo mental pelo idoso. | [app/alerta.tsx](file:///c:/CodingPrograms/app-amazcare/app/alerta.tsx), [src/domain/types.ts](file:///c:/CodingPrograms/app-amazcare/src/domain/types.ts) |
| **4. Repetição Indevida** | Prevenção contra overdose ou ingestão duplicada por esquecimento. | Bloqueio imediato se a gaveta for reaberta ou dose for registrada novamente no mesmo dia: diálogo de aviso *"Você já tomou este remédio hoje às HH:MM"*, exigindo confirmação explícita. | [src/domain/status.ts](file:///c:/CodingPrograms/app-amazcare/src/domain/status.ts), [app/alerta.tsx](file:///c:/CodingPrograms/app-amazcare/app/alerta.tsx) |
| **5. Esquecimento** | Detecção de dose não tomada dentro de período seguro. | Função pura de relógio que transiciona doses não tomadas para status `esquecida` automaticamente após tolerância de 60 minutos (configurável). Não depende de app aberto no minuto exato. | [src/domain/status.ts](file:///c:/CodingPrograms/app-amazcare/src/domain/status.ts), [src/store/useMedicationStore.ts](file:///c:/CodingPrograms/app-amazcare/src/store/useMedicationStore.ts) |
| **6. Fim de Rotina** | Notificação de encerramento do tratamento prescrito. | Ao alcançar a data de término (`endDate`), o app notifica *"O tratamento de X terminou"*, arquiva o medicamento no histórico e sugere a liberação da gaveta. | [src/domain/schedule.ts](file:///c:/CodingPrograms/app-amazcare/src/domain/schedule.ts), [app/(tabs)/remedios.tsx](file:///c:/CodingPrograms/app-amazcare/app/(tabs)/remedios.tsx) |
| **7. Fim de Estoque** | Notificação de reposição necessária e falta iminente de medicamento. | Cálculo de dias restantes com base no estoque e frequência diária. Alertas em texto e barras visuais de *"Estoque baixo"* e *"Estoque esgotado"*. | [src/domain/stock.ts](file:///c:/CodingPrograms/app-amazcare/src/domain/stock.ts), [app/(tabs)/estoque.tsx](file:///c:/CodingPrograms/app-amazcare/app/(tabs)/estoque.tsx) |

---

## 2. Requisitos Mínimos da Caixa Suportados pelo App (Item 1.a–f)

- **a) Disposição separada:** Representação e controle das 6 gavetas físicas dispostas em 2 colunas × 3 linhas (Coluna Esquerda: 1, 2, 3; Coluna Direita: 4, 5, 6). Cada remédio é vinculado a uma gaveta específica.
- **b) Detecção de quantidade (Documentação da Limitação Técnica):**
  - *Limitação do Hardware:* O circuito eletrônico atual possui apenas sensores de fim de curso (aberto/fechado) em cada gaveta, sem sensores de peso ou câmeras para contagem unitária de comprimidos.
  - *Solução Adotada:* O aplicativo gerencia o estoque como uma **estimativa matemática precisa**, decrementando automaticamente a posologia (`dose.amount`) a cada confirmação de dose tomada.
  - *Transparência:* Todas as telas de estoque exibem explicitamente o rótulo *"Quantidade estimada"* e oferecem botões rápidos de *Adicionar comprimidos* e *Corrigir quantidade*.
  - *Evolução Futura:* Inclusão de microcélulas de carga (strain gauges) sob o berço de cada gaveta no ESP32 para pesagem contínua.
- **c) Cadastro conforme prescrição:** Nome, dosagem, quantidade por dose, múltiplos horários diários, data de início, data de término opcional, gaveta e observações.
- **d) Indicação de hora e medicamento:** Apresentação clara do próximo momento no topo da tela inicial e alarme dedicado.
- **e) Controle da rotina e histórico:** Registro de doses em 5 estados (`pendente`, `andamento`, `registrada`, `atrasada`, `esquecida`) e cálculo de adesão percentual.
- **f) Controle de estoque:** Alertas de nível crítico com projeção de dias de autonomia.

---

## 3. Requisitos Opcionais Implementados

1. **Notificações Locais Redundantes:** Agendamento local via `expo-notifications` para garantir que o idoso seja alertado mesmo quando o aplicativo estiver em segundo plano ou fechado.
2. **Relatório Clínico em PDF (Figura 1.c):** Geração de relatório com diagramação para impressão em PDF (`expo-print` + `expo-sharing`), apresentando taxa de adesão, doses tomadas e esquecidas por medicamento e histórico de estoque para apresentação a médicos e geriatras.
