/* ═══════════════════════════════════════════
   js/services/api.js  —  REST API + sensor state
═══════════════════════════════════════════ */

const SensorService = (() => {

  // ── Config ──────────────────────────────
  const API_BASE   = '';          // Same origin (set to http://your-esp32-ip if needed)
  const ENDPOINT   = '';
  const POLL_KEY   = 'interval';

  // ── Live sensor state ────────────────────
  // Initialise from localStorage or use defaults
  const defaultSensors = {
    moisture: { v: 68, unit: '%',   label: 'Soil Moisture', icon: '💧', iconBg: '#E3F2FD', status: 'optimal', min: 0, max: 100 },
    temp:     { v: 27, unit: '°C',  label: 'Temperature',   icon: '🌡', iconBg: '#FFF3E0', status: 'normal',  min: -10, max: 60 },
    humidity: { v: 74, unit: '%',   label: 'Humidity',      icon: '🌫', iconBg: '#E8EAF6', status: 'high',    min: 0,  max: 100 },
    light:    { v: 4200, unit: 'lux', label: 'Light',       icon: '☀', iconBg: '#FFFDE7', status: 'good',    min: 0,  max: 100000 },
  };

  let sensors = Storage.get('sensors', defaultSensors);

  // ── History (last 50 readings per sensor) ─
  let history = Storage.get('sensorHistory', {
    moisture: [], temp: [], humidity: [], light: [], labels: []
  });

  let pollTimer    = null;
  let fetchPending = false;

  // ── Save state ───────────────────────────
  function persist() {
    Storage.set('sensors', sensors);
    Storage.set('sensorHistory', history);
  }

  // ── Push a reading into history ──────────
  function pushHistory(data) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const MAX = 50;

    history.labels.push(now);
    if (history.labels.length > MAX) history.labels.shift();

    ['moisture', 'temp', 'humidity', 'light'].forEach(k => {
      if (!history[k]) history[k] = [];
      if (data[k] !== undefined) history[k].push(Helpers.round(data[k], 1));
      if (history[k].length > MAX) history[k].shift();
    });

    persist();
  }

  // ── Merge incoming data into sensor state ─
  function merge(data) {
    if (!data) return;

    // Accept both { moisture: 68 } and { sensors: { moisture: 68 } } formats
    const d = data.sensors || data;

    if (d.moisture !== undefined) {
      sensors.moisture.v = Helpers.clamp(parseFloat(d.moisture), 0, 100);
      sensors.moisture.status = sensors.moisture.v < 40 ? 'low' : sensors.moisture.v < 50 ? 'fair' : 'optimal';
    }
    if (d.temperature !== undefined || d.temp !== undefined) {
      sensors.temp.v = parseFloat(d.temperature ?? d.temp);
      sensors.temp.status = sensors.temp.v > 35 ? 'high' : sensors.temp.v < 10 ? 'low' : 'normal';
    }
    if (d.humidity !== undefined) {
      sensors.humidity.v = Helpers.clamp(parseFloat(d.humidity), 0, 100);
      sensors.humidity.status = sensors.humidity.v > 85 ? 'high' : 'normal';
    }
    if (d.light !== undefined) {
      sensors.light.v = parseFloat(d.light);
      sensors.light.status = sensors.light.v < 500 ? 'low' : 'good';
    }

    pushHistory({
      moisture: sensors.moisture.v,
      temp:     sensors.temp.v,
      humidity: sensors.humidity.v,
      light:    sensors.light.v,
    });

    persist();

    // Notify UI
    UI.renderTiles();
    ChartManager.updateMainChart();
    AlertManager.checkRules();
  }

  // ── Fetch from REST endpoint ─────────────
  async function fetchAndUpdate() {
    if (fetchPending) return;
    fetchPending = true;

    try {
      const res = await fetch(API_BASE + ENDPOINT, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();
      merge(data);
      Helpers.toast('Sensors updated', 'ok');

    } catch (err) {
      // If no real backend — simulate with small random drift
      simulateDrift();
      // Uncomment to see error: Helpers.toast('API: ' + err.message, 'err');
    } finally {
      fetchPending = false;
    }
  }

  // ── Simulate sensor drift (demo mode) ────
  function simulateDrift() {
    const noise = { moisture: 1.5, temp: 0.4, humidity: 1, light: 150 };
    const fake = {};
    Object.keys(sensors).forEach(k => {
      const s = sensors[k];
      const drift = (Math.random() - 0.5) * 2 * noise[k];
      fake[k] = Helpers.clamp(Helpers.round(s.v + drift, 1), s.min, s.max);
    });
    // Map keys to API format
    merge({ moisture: fake.moisture, temperature: fake.temp, humidity: fake.humidity, light: fake.light });
  }

  // ── Start / stop polling ─────────────────
  function startPolling() {
    const interval = parseInt(Storage.get(POLL_KEY, 10)) * 1000;
    stopPolling();
    pollTimer = setInterval(fetchAndUpdate, interval);
    fetchAndUpdate(); // immediate first fetch
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function setInterval2(sec) {
    stopPolling();
    pollTimer = setInterval(fetchAndUpdate, sec * 1000);
  }

  return {
    sensors,
    history,
    merge,
    fetchAndUpdate,
    startPolling,
    stopPolling,
    setInterval: setInterval2,
    simulateDrift,
  };
})();
