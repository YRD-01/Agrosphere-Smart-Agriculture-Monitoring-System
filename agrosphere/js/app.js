/* ═══════════════════════════════════════════
   js/app.js  —  App entry point & global state
═══════════════════════════════════════════ */

// ── Global application state ─────────────
const AppState = (() => {

  const DEFAULT_CROPS = [
    {
      id: 'c1', name: 'Wheat', field: 'Field A', area: 2.4, stage: 'Tillering',
      day: 42, device: 'ESP32-FieldA-01', water: 12, pest: 2.4,
      moisture: 75, pestLvl: 40, nutrients: 82, status: 'Healthy',
      planting: '2025-01-23',
    },
    {
      id: 'c2', name: 'Rice', field: 'Field B', area: 1.8, stage: 'Vegetative',
      day: 18, device: 'ESP32-FieldB-02', water: 18, pest: 1.8,
      moisture: 92, pestLvl: 60, nutrients: 55, status: 'Needs water',
      planting: '2025-03-17',
    },
  ];

  const DEFAULT_DEVICES = [
    { id: 'd1', name: 'ESP32-FieldA-01', mac: 'A4:CF:12:3E:FF:01', sensors: ['Soil','Temp','Humidity'], conn: 'wifi',      ip: '192.168.1.42', signal: -51, online: true  },
    { id: 'd2', name: 'ESP32-FieldB-02', mac: 'A4:CF:12:4F:AB:22', sensors: ['Soil','Moisture','Light'], conn: 'wifi',      ip: '192.168.1.45', signal: -74, online: true  },
    { id: 'd3', name: 'ESP32-Weather-03',mac: 'A4:CF:12:5A:CD:33', sensors: ['Wind','Rain','Pressure'],  conn: 'lora',      ip: '0x3E00',       signal: -60, online: false },
  ];

  let crops       = Storage.get('crops',   DEFAULT_CROPS);
  let devices     = Storage.get('devices', DEFAULT_DEVICES);
  let lastRefresh = null;

  function persist() {
    Storage.set('crops',   crops);
    Storage.set('devices', devices);
  }

  return {
    get crops()   { return crops; },
    get devices() { return devices; },
    get lastRefresh() { return lastRefresh; },
    set lastRefresh(v) { lastRefresh = v; },
    persist,
  };
})();

// ── Boot sequence ────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // 1. Load settings into forms
  SettingsManager.load();

  // 2. Set default planting date
  const fcDate = document.getElementById('fc-date');
  if (fcDate) fcDate.valueAsDate = new Date();

  // 3. Render initial home page tiles + alerts + status
  UI.renderTiles();
  AlertManager.renderAlerts();
  UI.renderStatus();

  // 4. Init main chart after a tick (DOM must be ready)
  setTimeout(() => {
    ChartManager.initMain();
  }, 80);

  // 5. Restore network state (toggle visuals, sync devices)
  NetworkManager.restoreState();

  // 6. Start sensor polling (REST + drift simulation)
  SensorService.startPolling();

  // 7. Restore irrigation state
  IrrigationController.restore();

  // 8. Auto-connect MQTT (delay to let page settle)
  setTimeout(() => {
    MQTTService.connect();
  }, 2000);

  // 9. Periodic status refresh (every 15s)
  setInterval(() => {
    AppState.lastRefresh = Date.now();
    UI.renderStatus();

    // Update 'last message' time in network page
    const lastMsgEl = document.getElementById('mqtt-last-msg');
    if (lastMsgEl && lastMsgEl.textContent !== 'Never') {
      // Reformat relative time from stored timestamp
      const count = parseInt(document.getElementById('mqtt-msg-count')?.textContent || '0');
      if (count > 0) lastMsgEl.textContent = Helpers.timeAgo(Date.now() - 5000);
    }
  }, 15000);

  console.info('[AgroSphere] Boot complete ✓');
});
