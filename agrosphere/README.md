# 🌿 AgroSphere — Smart Farm IoT Dashboard

A fully modular, real-time IoT web app for ESP32-based smart farming.
Connects via MQTT over WebSocket + REST API. Works on mobile as a PWA.

---

## 📁 Project Structure

```
agrosphere/
│
├── index.html                  ← Main HTML (all sheets/modals defined here)
│
├── css/
│   ├── main.css                ← Design tokens, layout, topbar, nav, toasts
│   ├── components.css          ← Cards, buttons, forms, tiles, modals, etc.
│   └── mobile.css              ← Responsive breakpoints, safe-area fixes
│
├── js/
│   ├── utils/
│   │   ├── storage.js          ← localStorage wrapper (prefix + versioning)
│   │   └── helpers.js          ← Formatters, toast, uid, debounce
│   │
│   ├── services/
│   │   ├── api.js              ← REST fetch /api/sensors + sensor state + history
│   │   └── mqtt.js             ← Paho MQTT over WSS, publish/subscribe, auto-retry
│   │
│   ├── components/
│   │   ├── ui.js               ← Navigation, sheets, sensor tiles, status card
│   │   ├── charts.js           ← Chart.js: main (live 50pt), schedule, throughput
│   │   ├── alerts.js           ← Smart rule engine, auto-check on new data
│   │   ├── crops.js            ← CRUD crops, recommendations render
│   │   ├── devices.js          ← CRUD ESP32 devices, online toggle
│   │   ├── network.js          ← WiFi/BT/LoRa toggle, sync devices, scan
│   │   ├── irrigation.js       ← Start/stop irrigation, MQTT publish
│   │   └── settings.js         ← Load/save all settings, clear data
│   │
│   └── app.js                  ← AppState (global), boot sequence
│
├── netlify.toml                ← Netlify deploy config + API proxy
└── README.md
```

---

## 🚀 How to run locally

### Option 1 — VS Code Live Server (recommended)
1. Install the **Live Server** extension in VS Code
2. Open the `agrosphere/` folder
3. Right-click `index.html` → **Open with Live Server**
4. App opens at `http://127.0.0.1:5500`

### Option 2 — Python simple server
```bash
cd agrosphere
python3 -m http.server 8080
# Open http://localhost:8080
```

### Option 3 — Node.js
```bash
cd agrosphere
npx serve .
# Open the URL shown in terminal
```

> ⚠️ Must run via a server (not `file://`) — MQTT over WSS requires HTTP/HTTPS context.

---

## 📡 ESP32 Setup

### 1. REST API endpoint
Your ESP32 must serve JSON at `GET /api/sensors`:

```json
{
  "moisture": 68.4,
  "temperature": 27.1,
  "humidity": 74.0,
  "light": 4200
}
```

Arduino sketch (ESP32):
```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

WebServer server(80);
float soilMoisture, temperature, humidity, light;

void handleSensors() {
  StaticJsonDocument<200> doc;
  doc["moisture"]    = soilMoisture;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["light"]       = light;
  String json;
  serializeJson(doc, json);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void setup() {
  WiFi.begin("YOUR_SSID", "YOUR_PASS");
  while (WiFi.status() != WL_CONNECTED) delay(500);
  server.on("/api/sensors", handleSensors);
  server.begin();
}

void loop() {
  server.handleClient();
  // read your sensors here
}
```

Then in `js/services/api.js` change:
```js
const API_BASE = 'http://192.168.1.42';  // your ESP32 IP
```

---

### 2. MQTT publishing from ESP32

Install **PubSubClient** library in Arduino IDE.

```cpp
#include <PubSubClient.h>
#include <ArduinoJson.h>

WiFiClient espClient;
PubSubClient mqtt(espClient);

void publishSensors() {
  StaticJsonDocument<200> doc;
  doc["moisture"]    = soilMoisture;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["light"]       = light;
  char buf[200];
  serializeJson(doc, buf);
  mqtt.publish("agro/sensor", buf);
}

void setup() {
  mqtt.setServer("broker.hivemq.com", 1883);
  // ...
}

void loop() {
  if (!mqtt.connected()) mqtt.connect("esp32_agro");
  mqtt.loop();
  // publish every 10 seconds
  publishSensors();
  delay(10000);
}
```

> The dashboard subscribes to `agro/sensor` and publishes commands to `agro/control`.

---

## 🌐 Deploy to Netlify

### Method 1 — Drag & drop (easiest)
1. Go to [netlify.com](https://netlify.com) → Log in
2. Drag the entire `agrosphere/` folder onto the **"Deploy manually"** drop zone
3. Done! You get a live HTTPS URL

### Method 2 — GitHub
1. Push the `agrosphere/` folder to a GitHub repo
2. In Netlify: **New site → Import from Git → select repo**
3. Build command: *(leave empty)*
4. Publish directory: `.`
5. Click **Deploy site**

### After deploying
- Your site runs at `https://your-site.netlify.app`
- MQTT connects over **WSS port 8884** (works on HTTPS)
- To proxy your ESP32 API, edit `netlify.toml`:
  ```toml
  [[redirects]]
    from   = "/api/*"
    to     = "http://YOUR-ESP32-IP/:splat"
    status = 200
  ```

---

## 📱 Use on Mobile (PWA)

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the **⋮ menu → "Add to Home screen"**
3. App opens fullscreen like a native app

### iPhone (Safari)
1. Open the app URL in Safari
2. Tap the **Share button → "Add to Home Screen"**
3. App opens fullscreen with no browser bar

---

## 🔧 Key features & how they work

| Feature | File | How |
|---|---|---|
| Live sensor data | `js/services/api.js` | `fetch('/api/sensors')` every N seconds |
| MQTT real-time | `js/services/mqtt.js` | Paho WSS to HiveMQ, subscribe `agro/sensor` |
| Smart alerts | `js/components/alerts.js` | Rules engine checks on every sensor update |
| Irrigation control | `js/components/irrigation.js` | Publishes `irrigation_on/off` to `agro/control` |
| Live chart (50 pts) | `js/components/charts.js` | Circular buffer in `sensorHistory` localStorage |
| localStorage | `js/utils/storage.js` | Prefixed keys, versioned, used by all modules |
| Network toggle | `js/components/network.js` | Mutually exclusive, syncs device online state |
| Settings save | `js/components/settings.js` | Persists to localStorage, hot-applies changes |

---

## 💡 Tips

- **No backend?** The app runs in **demo mode** automatically — sensors drift realistically.
- **CORS issues?** Add `Access-Control-Allow-Origin: *` header in your ESP32 sketch.
- **MQTT not connecting?** HiveMQ public broker allows WSS on port **8884**. Make sure you're on HTTPS or localhost.
- **Want your own broker?** Install Mosquitto locally and use `ws://localhost:9001`.
