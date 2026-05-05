/* ═══════════════════════════════════════════
   js/services/mqtt.js  —  MQTT via Paho over WSS
═══════════════════════════════════════════ */

const MQTTService = (() => {

  // ── Config (overridden by Settings) ─────
let config = {
  host: 'broker.hivemq.com',
  port: 8884,
  topicSub: 'agro/sensor',
  topicPub: 'agro/control',
  clientId: 'agrosphere_' + Math.random().toString(36).slice(2, 10),
};

  let client      = null;
  let isConnected = false;
  let msgCount    = 0;
  let lastMsgTime = null;
  let retryTimer  = null;
  let retryCount  = 0;
  const MAX_RETRY = 5;

  // ── Connect ──────────────────────────────
  function connect() {
    if (isConnected) { Helpers.toast('Already connected', ''); return; }

    _setStatus('connecting');
    Helpers.toast('Connecting to MQTT…');

    // Update client ID display
    const cidEl = document.getElementById('mqtt-client-id');
    if (cidEl) cidEl.textContent = config.clientId;

    try {
      client = new Paho.MQTT.Client(config.host, Number(config.port), "/mqtt", config.clientId);

      client.onConnectionLost = _onConnectionLost;
      client.onMessageArrived = _onMessage;

      client.connect({
        useSSL: true,
        timeout: 10,
        onSuccess: _onConnect,
        onFailure: _onFailure,
        keepAliveInterval: 30,
      });
    } catch (e) {
      _setStatus('error', e.message);
      Helpers.toast('MQTT init error: ' + e.message, 'err');
    }
  }

  // ── Disconnect ───────────────────────────
  function disconnect() {
    clearTimeout(retryTimer);
    retryCount = 0;
    if (client && isConnected) {
      try { client.disconnect(); } catch (_) {}
    }
    isConnected = false;
    _setStatus('disconnected');
    Helpers.toast('MQTT disconnected');
  }

  // ── Publish ──────────────────────────────
  function publish(payload) {
    if (!isConnected || !client) {
      Helpers.toast('MQTT not connected', 'err');
      return false;
    }
    try {
      const msg = new Paho.MQTT.Message(
        typeof payload === 'object' ? JSON.stringify(payload) : String(payload)
      );
      msg.destinationName = config.topicPub;
      msg.qos = 1;
      client.send(msg);
      return true;
    } catch (e) {
      Helpers.toast('Publish failed: ' + e.message, 'err');
      return false;
    }
  }

  // ── Callbacks ────────────────────────────
  function _onConnect() {
    isConnected = true;
    retryCount  = 0;
    clearTimeout(retryTimer);

    _setStatus('connected');
    Helpers.toast('MQTT connected ✓', 'ok');

    // Subscribe to sensor topic
    client.subscribe(config.topicSub, { qos: 1 });
    console.info('[MQTT] Subscribed to', config.topicSub);
  }

  function _onConnectionLost(resp) {
    isConnected = false;
    _setStatus('disconnected');

    if (resp.errorCode !== 0) {
      console.warn('[MQTT] Connection lost:', resp.errorMessage);
      _scheduleRetry();
    }
  }

  function _onFailure(err) {
    isConnected = false;
    const msg = err.errorMessage || 'Unknown error';
    _setStatus('error', msg);
    Helpers.toast('MQTT failed: ' + msg, 'err');
    console.error('[MQTT] Connection failed:', msg);
    _scheduleRetry();
  }

  function _onMessage(message) {
    msgCount++;
    lastMsgTime = Date.now();

    // Update UI counters
    const countEl = document.getElementById('mqtt-msg-count');
    const timeEl  = document.getElementById('mqtt-last-msg');
    if (countEl) countEl.textContent = msgCount;
    if (timeEl)  timeEl.textContent  = Helpers.timeAgo(lastMsgTime);

    // Parse payload
    let data = null;
    try {
      data = JSON.parse(message.payloadString);
    } catch (_) {
      console.warn('[MQTT] Non-JSON message:', message.payloadString);
      return;
    }

    console.info('[MQTT] Message on', message.destinationName, data);

    // Feed into sensor service
    SensorService.merge(data);
  }

  // ── Auto-retry ───────────────────────────
  function _scheduleRetry() {
    if (retryCount >= MAX_RETRY) {
      Helpers.toast('MQTT: max retries reached', 'err');
      return;
    }
    retryCount++;
    const delay = Math.min(30000, 2000 * retryCount);
    console.info('[MQTT] Retry in', delay / 1000, 's (attempt', retryCount, ')');
    retryTimer = setTimeout(connect, delay);
  }

  // ── Update config & reconnect ─────────────
  function updateConfig(newConf) {
    Object.assign(config, newConf);
    //Storage.set('mqtt_host', config.host);
    //Storage.set('mqtt_port', config.port);
    Storage.set('mqtt_sub',  config.topicSub);
    Storage.set('mqtt_pub',  config.topicPub);
    if (isConnected) { disconnect(); setTimeout(connect, 500); }
  }

  // ── UI status updater ─────────────────────
  function _setStatus(state, errMsg) {
    const pill = document.getElementById('mqtt-pill');
    const card = document.getElementById('mqtt-card');
    const conn = document.getElementById('mqtt-connect-btn');
    const disc = document.getElementById('mqtt-disconnect-btn');
    const errRow = document.getElementById('mqtt-error-row');
    const errVal = document.getElementById('mqtt-error-val');

    const states = {
      connecting:   { pill: 'Connecting…', cls: 'pill-amber', card: '' },
      connected:    { pill: 'Connected',   cls: 'pill-green', card: 'connected' },
      disconnected: { pill: 'Disconnected',cls: 'pill-gray',  card: 'disconnected' },
      error:        { pill: 'Error',        cls: 'pill-red',   card: 'error' },
    };

    const s = states[state] || states.disconnected;
    if (pill) { pill.textContent = s.pill; pill.className = 'pill ' + s.cls; }
    if (card) { card.className = 'card mqtt-status-card ' + s.card; }
    if (conn) conn.style.display = state === 'connected' ? 'none' : '';
    if (disc) disc.style.display = state === 'connected' ? ''     : 'none';

    if (errRow && errVal) {
      if (errMsg) { errRow.style.display = ''; errVal.textContent = errMsg; }
      else        { errRow.style.display = 'none'; }
    }
  }

  return {
    connect,
    disconnect,
    publish,
    updateConfig,
    isConnected: () => isConnected,
    getConfig:   () => ({ ...config }),
  };
})();
