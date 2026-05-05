/* ═══════════════════════════════════════════
   js/components/settings.js
═══════════════════════════════════════════ */
const SettingsManager = (() => {

  // ── Load saved settings into form fields ──
  function load() {
    const settings = Storage.get('settings', {});

    const farmName = Storage.get('farmName', 'Green Valley Farm');
    const location = Storage.get('location', 'Kolkata, West Bengal, India');

    const fn = document.getElementById('s-farmname');
    const lc = document.getElementById('s-location');
    if (fn) fn.value = farmName;
    if (lc) lc.value = location;

    const farmDisplay = document.getElementById('farm-name-display');
    if (farmDisplay) farmDisplay.textContent = farmName;

    // MQTT settings
    const mqttConf = MQTTService.getConfig();
    const hostEl   = document.getElementById('s-host');
    const portEl   = document.getElementById('s-port');
    const subEl    = document.getElementById('s-topic-sub');
    const pubEl    = document.getElementById('s-topic-pub');
    if (hostEl) hostEl.value = mqttConf.host;
    if (portEl) portEl.value = mqttConf.port;
    if (subEl)  subEl.value  = mqttConf.topicSub;
    if (pubEl)  pubEl.value  = mqttConf.topicPub;

    // Toggle switches
    const notif     = document.getElementById('s-notif');
    const moistAlert= document.getElementById('s-moist-alert');
    const tempAlert = document.getElementById('s-temp-alert');
    if (notif)      notif.checked      = settings.notif      !== false;
    if (moistAlert) moistAlert.checked = settings.moistAlert !== false;
    if (tempAlert)  tempAlert.checked  = settings.tempAlert  !== false;

    // Polling interval
    const intervalEl = document.getElementById('s-interval');
    if (intervalEl) intervalEl.value = Storage.get('interval', 10);
  }

  // ── Save a single setting toggle ──────────
  function save(key, value) {
    const settings = Storage.get('settings', {});
    settings[key]  = value;
    Storage.set('settings', settings);

    // Apply live effects
    if (key === 'interval') {
      SensorService.setInterval(parseInt(value));
    }
    Helpers.toast('Setting saved', 'ok');
  }

  // ── Save farm info ─────────────────────────
  function saveFarm() {
    const name = document.getElementById('s-farmname').value.trim();
    const loc  = document.getElementById('s-location').value.trim();
    Storage.set('farmName', name || 'Green Valley Farm');
    Storage.set('location', loc);
    const display = document.getElementById('farm-name-display');
    if (display) display.textContent = name || 'Green Valley Farm';
    Helpers.toast('Farm info saved', 'ok');
  }

  // ── Save MQTT / connection settings ───────
  function saveConn() {
    const host = document.getElementById('s-host').value.trim();
    const port = parseInt(document.getElementById('s-port').value) || 8884;
    const sub  = document.getElementById('s-topic-sub').value.trim() || 'agro/sensor';
    const pub  = document.getElementById('s-topic-pub').value.trim() || 'agro/control';

    if (!host) { Helpers.toast('Enter broker host', 'err'); return; }

    MQTTService.updateConfig({ host, port, topicSub: sub, topicPub: pub });

    // Update broker display in network page
    const brokerVal = document.getElementById('mqtt-broker-val');
    if (brokerVal) brokerVal.textContent = host + ':' + port;

    Helpers.toast('Reconnecting to ' + host + '…', '');
    setTimeout(() => MQTTService.connect(), 600);
  }

  // ── Clear all localStorage data ───────────
  function clearAll() {
    if (!confirm('Clear ALL saved data? This will reset crops, devices, settings and sensor history.')) return;
    Storage.clearAll();
    Helpers.toast('All data cleared — reloading…', 'warn');
    setTimeout(() => location.reload(), 1200);
  }

  return { load, save, saveFarm, saveConn, clearAll };
})();
