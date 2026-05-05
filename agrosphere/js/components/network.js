/* ═══════════════════════════════════════════
   js/components/network.js
═══════════════════════════════════════════ */
const NetworkManager = (() => {

  let netState    = Storage.get('netState', { wifi: false, bt: false, lora: false });
  let loraConfig  = Storage.get('loraConfig', { freq: '915', sf: 'SF10', bw: '250', tx: '14' });
  let savedWifi   = Storage.get('savedWifi', [
    { ssid: 'FarmNet_2G', signal: -52, connected: false },
    { ssid: 'FarmNet_5G', signal: -65, connected: false },
  ]);
  let btPaired = 0;

  // ── Toggle a network on/off ───────────────
  function toggle(key) {
    const tog      = document.getElementById('tog-' + key);
    const turningOn = tog ? tog.checked : !netState[key];

    // Enforce single-active: turn off others
    if (turningOn) {
      ['wifi', 'bt', 'lora'].forEach(k => {
        if (k !== key && netState[k]) {
          netState[k] = false;
          _applyUIState(k, false);
          _syncDevices(k, false);
        }
      });
    }

    netState[key] = turningOn;
    Storage.set('netState', netState);
    _applyUIState(key, turningOn);

    if (turningOn) {
      _simulateConnect(key);
    } else {
      _syncDevices(key, false);
      DeviceManager.render();
      UI.renderStatus();
      renderSummary();
      Helpers.toast(_keyName(key) + ' disconnected');
    }
  }

  // ── Apply visual state for a network key ──
  function _applyUIState(key, on) {
    const card   = document.getElementById('net-' + key);
    const pill   = document.getElementById(key + '-pill');
    const panel  = document.getElementById('detail-' + key);
    const togEl  = document.getElementById('tog-' + key);

    if (togEl) togEl.checked = on;
    if (card)  card.classList.toggle('on', on);
    if (panel) panel.classList.toggle('show', on);

    if (pill) {
      if (on) {
        pill.textContent = 'On';
        pill.className   = key === 'wifi' ? 'pill pill-blue' : 'pill pill-purple';
      } else {
        pill.textContent = 'Off';
        pill.className   = 'pill pill-gray';
      }
    }
  }

  // ── Restore UI from saved state on boot ───
  function restoreState() {
    ['wifi', 'bt', 'lora'].forEach(k => {
      _applyUIState(k, netState[k]);
      if (netState[k]) _syncDevices(k, true);
    });
    renderSummary();
  }

  // ── Simulate connect animation + details ──
  function _simulateConnect(key) {
    Helpers.toast('Connecting via ' + _keyName(key) + '…');
    setTimeout(() => {
      _syncDevices(key, true);
      DeviceManager.render();
      UI.renderStatus();
      renderSummary();

      if (key === 'wifi') {
        document.getElementById('d-wifi-ip').textContent  = '192.168.1.42';
        document.getElementById('d-wifi-sig').textContent = '-52 dBm';
        const wifiDesc = document.getElementById('wifi-desc');
        if (wifiDesc) wifiDesc.textContent = 'FarmNet_2G · -52 dBm';
        Helpers.toast('Wi-Fi connected · 192.168.1.42', 'ok');
      } else if (key === 'bt') {
        const paired = AppState.devices.filter(d => d.conn === 'bluetooth').length;
        document.getElementById('d-bt-paired').textContent = paired;
        Helpers.toast('Bluetooth active · ' + paired + ' device(s)', 'ok');
      } else {
        document.getElementById('d-lora-freq').textContent = loraConfig.freq + ' MHz';
        document.getElementById('d-lora-sf').textContent   = loraConfig.sf;
        document.getElementById('d-lora-tx').textContent   = loraConfig.tx + ' dBm';
        const loraDesc = document.getElementById('lora-desc');
        if (loraDesc) loraDesc.textContent = loraConfig.freq + ' MHz · ' + loraConfig.sf;
        const loraDev = AppState.devices.filter(d => d.conn === 'lora').length;
        Helpers.toast('LoRa connected · ' + loraDev + ' node(s)', 'ok');
      }
    }, 1500);
  }

  // ── Set online flag for devices on a given interface ──
  function _syncDevices(key, on) {
    AppState.devices.forEach(d => {
      const match =
        (key === 'wifi' && d.conn === 'wifi') ||
        (key === 'bt'   && d.conn === 'bluetooth') ||
        (key === 'lora' && d.conn === 'lora');
      if (match) d.online = on;
    });
    AppState.persist();
  }

  // ── Active interface summary card ─────────
  function renderSummary() {
    const el = document.getElementById('active-net-summary');
    if (!el) return;

    const active = getActive();
    if (!active) {
      el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px">No network active — toggle one above</div>';
      return;
    }

    const connected = AppState.devices.filter(d => {
      if (active === 'wifi') return d.conn === 'wifi'      && d.online;
      if (active === 'bt')   return d.conn === 'bluetooth' && d.online;
      return d.conn === 'lora' && d.online;
    });

    const pillCls = active === 'wifi' ? 'pill-blue' : 'pill-purple';

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span class="pill ${pillCls}">${_keyName(active)}</span>
        <span style="font-size:13px;color:var(--muted)">${connected.length} device(s) connected</span>
      </div>
      ${connected.length ? connected.map(d => `
        <div class="detail-row">
          <span class="detail-key">${d.name}</span>
          <span class="detail-val">${d.ip}</span>
        </div>`).join('') : '<div style="color:var(--muted);font-size:13px;padding:8px 0">No matched devices yet</div>'}`;
  }

  // ── WiFi sheet ────────────────────────────
  function openWifi() {
    UI.openSheet('sh-wifi');
    _scanWifi();
  }

  function _scanWifi() {
    const el = document.getElementById('wifi-scan-list');
    if (!el) return;
    el.innerHTML = '<div class="scanning"><div class="scan-dot"></div><div class="scan-dot"></div><div class="scan-dot"></div><span>Scanning…</span></div>';
    setTimeout(() => {
      el.innerHTML = savedWifi.map((n, i) => `
        <div class="wifi-item ${n.connected ? 'connected' : ''}" onclick="NetworkManager.connectToSSID(${i})">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="signal-bars">
              ${[1,2,3,4].map(j => `<div class="sbar ${(-n.signal) < (50 + j * 8) ? 'on' : ''}" style="height:${j * 4}px"></div>`).join('')}
            </div>
            <span style="font-size:14px;font-weight:500">${n.ssid}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11px;color:var(--muted);font-family:ui-monospace,'SF Mono',monospace">${n.signal} dBm</span>
            ${n.connected ? '<span class="pill pill-green">Active</span>' : ''}
          </div>
        </div>`).join('');
    }, 1200);
  }

  function connectToSSID(i) {
    savedWifi.forEach(n => n.connected = false);
    savedWifi[i].connected = true;
    Storage.set('savedWifi', savedWifi);
    UI.closeSheet('sh-wifi');
    const wifiDesc = document.getElementById('wifi-desc');
    if (wifiDesc) wifiDesc.textContent = savedWifi[i].ssid + ' · ' + savedWifi[i].signal + ' dBm';
    Helpers.toast('Connected to ' + savedWifi[i].ssid, 'ok');
  }

  function connectWifi() {
    const ssid = document.getElementById('wf-ssid').value.trim();
    if (!ssid) { Helpers.toast('Enter network name', 'err'); return; }

    const statusEl = document.getElementById('wf-status');
    const btn      = document.getElementById('wf-btn');
    statusEl.style.display = 'block';
    statusEl.className     = 'status-msg info';
    statusEl.textContent   = 'Connecting to ' + ssid + '…';
    btn.disabled = true;

    setTimeout(() => {
      statusEl.className   = 'status-msg ok';
      statusEl.textContent = 'Connected! IP: 192.168.1.42';
      btn.disabled = false;

      if (!savedWifi.find(n => n.ssid === ssid)) {
        savedWifi.forEach(n => n.connected = false);
        savedWifi.push({ ssid, signal: -58, connected: true });
      } else {
        savedWifi.forEach(n => n.connected = (n.ssid === ssid));
      }
      Storage.set('savedWifi', savedWifi);

      const wifiDesc = document.getElementById('wifi-desc');
      if (wifiDesc) wifiDesc.textContent = ssid + ' · -58 dBm';
      Helpers.toast('Connected to ' + ssid, 'ok');
      setTimeout(() => UI.closeSheet('sh-wifi'), 900);
    }, 2000);
  }

  // ── Bluetooth scan ────────────────────────
  function runBtScan() {
    const el = document.getElementById('bt-scan-list');
    if (!el) return;
    el.innerHTML = '<div class="scanning"><div class="scan-dot"></div><div class="scan-dot"></div><div class="scan-dot"></div><span>Scanning for BLE devices…</span></div>';
    setTimeout(() => {
      const found = [
        { name: 'ESP32_BLE_FieldA', rssi: -55 },
        { name: 'ESP32_BLE_FieldB', rssi: -72 },
        { name: 'AgriSensor_BT01',  rssi: -68 },
      ];
      el.innerHTML = found.map(d => `
        <div class="wifi-item" onclick="NetworkManager.pairBt('${d.name}')">
          <div style="display:flex;align-items:center;gap:10px">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 6l8 5.5-8 5.5V6zM7 11.5l5.5-5.5" stroke="#3949AB" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span style="font-size:14px;font-weight:500">${d.name}</span>
          </div>
          <span style="font-size:11px;color:var(--muted);font-family:ui-monospace,'SF Mono',monospace">${d.rssi} dBm</span>
        </div>`).join('') + '<p style="font-size:12px;color:var(--muted);margin-top:10px">Tap a device to pair</p>';
    }, 1400);
  }

  function pairBt(name) {
    btPaired++;
    const el = document.getElementById('d-bt-paired');
    if (el) el.textContent = btPaired;
    UI.closeSheet('sh-bt');
    Helpers.toast('Paired with ' + name, 'ok');
  }

  // ── LoRa config ───────────────────────────
  function saveLora() {
    loraConfig.freq = document.getElementById('lora-freq').value;
    loraConfig.sf   = document.getElementById('lora-sf').value;
    loraConfig.bw   = document.getElementById('lora-bw').value;
    loraConfig.tx   = document.getElementById('lora-tx').value;
    Storage.set('loraConfig', loraConfig);

    const statusEl = document.getElementById('lora-status');
    statusEl.style.display = 'block';
    statusEl.className     = 'status-msg info';
    statusEl.textContent   = 'Applying LoRa configuration…';

    setTimeout(() => {
      statusEl.className   = 'status-msg ok';
      statusEl.textContent = 'LoRa configured at ' + loraConfig.freq + ' MHz · ' + loraConfig.sf;

      const loraDesc = document.getElementById('lora-desc');
      if (loraDesc) loraDesc.textContent = loraConfig.freq + ' MHz · ' + loraConfig.sf;
      document.getElementById('d-lora-freq').textContent = loraConfig.freq + ' MHz';
      document.getElementById('d-lora-sf').textContent   = loraConfig.sf;
      document.getElementById('d-lora-tx').textContent   = loraConfig.tx + ' dBm';

      Helpers.toast('LoRa settings applied', 'ok');
      setTimeout(() => UI.closeSheet('sh-lora'), 900);
    }, 1500);
  }

  // ── Scan all networks ─────────────────────
  function scanAll() {
    Helpers.toast('Scanning for networks…');
    setTimeout(() => {
      ['AgriNet_5G', 'SmartFarm_IoT', 'FieldNet_2G'].forEach(ssid => {
        if (!savedWifi.find(n => n.ssid === ssid)) {
          savedWifi.push({ ssid, signal: -70 - Math.floor(Math.random() * 15), connected: false });
        }
      });
      Storage.set('savedWifi', savedWifi);
      Helpers.toast('Found ' + savedWifi.length + ' networks', 'ok');
    }, 1500);
  }

  // ── Ping ─────────────────────────────────
  function ping(label) {
    Helpers.toast('Ping → ' + label + '… 12ms ✓', 'ok');
  }

  // ── Helpers ──────────────────────────────
  function _keyName(k) {
    return k === 'wifi' ? 'Wi-Fi' : k === 'bt' ? 'Bluetooth' : 'LoRa';
  }

  function getActive() {
    return Object.keys(netState).find(k => netState[k]) || null;
  }

  return {
    toggle, restoreState, renderSummary,
    openWifi, connectToSSID, connectWifi,
    runBtScan, pairBt, saveLora,
    scanAll, ping, getActive,
  };
})();
