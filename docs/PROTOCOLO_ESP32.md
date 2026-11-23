# AMAZCARE — Especificação do Protocolo de Comunicação ESP32

Este documento estabelece o protocolo de comunicação de rede local entre o aplicativo móvel **AMAZCARE** e o firmware do **ESP32** instalado no gaveteiro inteligente de 6 gavetas.

---

## 1. Descoberta e Transporte

- **Descoberta:** mDNS sob o nome `amazcare.local` (ou configuração direta de IP nas configurações do app).
- **Transporte:** HTTP REST para sincronização e diagnósticos pontuais; WebSocket para transmissão de eventos de hardware em tempo real e baixa latência.
- **Portas padrão:**
  - HTTP REST: Porta `80` (ou `8080`).
  - WebSocket: `ws://amazcare.local:80/ws`.

---

## 2. Endpoints HTTP REST

### `GET /status`
Retorna a saúde geral do hardware, sincronização de relógio e estado atual das gavetas.

**Resposta de Exemplo (JSON):**
```json
{
  "online": true,
  "rtc": {
    "datetime": "2026-11-23T12:00:00-03:00",
    "synced": true
  },
  "wifi": {
    "ssid": "RedeDomestica",
    "rssi": -58
  },
  "drawers": [
    { "id": 1, "open": false, "led": "off" },
    { "id": 2, "open": true, "led": "blink" },
    { "id": 3, "open": false, "led": "off" },
    { "id": 4, "open": false, "led": "off" },
    { "id": 5, "open": false, "led": "off" },
    { "id": 6, "open": false, "led": "off" }
  ],
  "buzzer": false,
  "lastSyncAt": "2026-11-23T11:59:30-03:00"
}
```

---

### `PUT /schedule`
Sincroniza a programação completa de alarmes no ESP32. O ESP32 armazena a agenda em sua memória não-volátil (EEPROM/Flash/NVS) para garantir que alarme mesmo sem Wi-Fi ou com o celular desligado.

**Corpo da Requisição (JSON):**
```json
{
  "syncAt": "2026-11-23T12:00:00-03:00",
  "schedules": [
    {
      "drawer": 1,
      "medicationId": "med-1",
      "times": ["08:00", "20:00"]
    },
    {
      "drawer": 2,
      "medicationId": "med-2",
      "times": ["12:00"]
    }
  ]
}
```

---

### `GET /events?since={ISO_TIMESTAMP}`
Recupera a fila de eventos armazenada localmente na caixa durante períodos em que a conexão Wi-Fi esteve indisponível.

**Resposta de Exemplo (JSON):**
```json
{
  "events": [
    {
      "type": "ALARM_STARTED",
      "drawers": [2],
      "at": "2026-11-23T12:00:01-03:00"
    },
    {
      "type": "DRAWER_OPENED",
      "drawer": 2,
      "correct": true,
      "scheduled": true,
      "at": "2026-11-23T12:01:15-03:00"
    },
    {
      "type": "DRAWER_CLOSED",
      "drawer": 2,
      "at": "2026-11-23T12:01:40-03:00"
    }
  ]
}
```

---

## 3. Fluxo WebSocket (`/ws`)

Assim que conectado, o ESP32 emite eventos conforme ocorrem nos sensores e temporizadores:

- **Alarme iniciado:**
  `{"type": "ALARM_STARTED", "drawers": [1, 4], "at": "2026-11-23T08:00:00-03:00"}`
- **Abertura de gaveta correta:**
  `{"type": "DRAWER_OPENED", "drawer": 1, "correct": true, "scheduled": true, "at": "..."}`
- **Abertura de gaveta incorreta:**
  `{"type": "WRONG_DRAWER", "drawer": 3, "expected": [1, 4], "at": "..."}`
- **Abertura fora de horário:**
  `{"type": "OUT_OF_SCHEDULE_OPEN", "drawer": 5, "at": "..."}`
- **Fechamento de gaveta:**
  `{"type": "DRAWER_CLOSED", "drawer": 1, "at": "..."}`
