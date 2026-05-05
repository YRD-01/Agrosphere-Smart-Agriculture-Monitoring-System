/* ═══════════════════════════════════════════
   js/components/devices.js
═══════════════════════════════════════════ */
const DeviceManager = (() => {

  function render() {
    const el = document.getElementById('device-list');
    if (!el) return;
    const devices = AppState.devices;

    if (!devices.length) {
      el.innerHTML = `<div class="empty-state">
        <div class="empty-text">No devices registered</div>
        <div class="empty-sub">Add your first ESP32 to start collecting data</div>
        <button class="btn btn-primary" onclick="UI.openSheet('sh-adddev')">+ Add device</button>
      </div>`;
      _updateStats(0, 0);
      return;
    }

    el.innerHTML = devices.map((d, i) => {
      const pc = d.online ? (d.signal > -65 ? 'pill-green' : 'pill-amber') : 'pill-gray';
      const pt = d.online ? (d.signal > -65 ? 'Online' : 'Weak signal') : 'Offline';
      const iconColor = d.online ? '#2E7D32' : '#9E9E9E';
      return `<div class="dev-row">
        <div class="dev-left">
          <div class="dev-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="6" width="14" height="8" rx="2" stroke="${iconColor}" stroke-width="1.4"/>
              <path d="M7 6V5M10 6V4M13 6V5" stroke="${iconColor}" stroke-width="1.4" stroke-linecap="round"/>
              <circle cx="10" cy="10" r="1.5" fill="${iconColor}"/>
            </svg>
          </div>
          <div>
            <div class="dev-name">${d.name}</div>
            <div class="dev-meta">${d.sensors.join(' · ')} · ${d.conn.toUpperCase()} · ${d.signal} dBm</div>
          </div>
        </div>
        <div class="dev-right">
          <span class="pill ${pc}">${pt}</span>
          <button class="btn-icon" onclick="DeviceManager.showDetail(${i})">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M7 6.5v3.5M7 5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </button>
          <label class="ios-toggle">
            <input type="checkbox" ${d.online ? 'checked' : ''} onchange="DeviceManager.toggle(${i}, this.checked)">
            <span class="ios-track"></span>
          </label>
        </div>
      </div>`;
    }).join('');

    const online = devices.filter(d => d.online).length;
    _updateStats(devices.length, online);
    ChartManager.initThroughput(devices);
  }

  function _updateStats(total, online) {
    const t  = document.getElementById('d-total');
    const o  = document.getElementById('d-online');
    const r  = document.getElementById('d-rate');
    const sb = document.getElementById('dev-count-sub');
    if (t)  t.textContent  = total;
    if (o)  o.textContent  = online;
    if (r)  r.textContent  = total * 14;
    if (sb) sb.textContent = total + ' ESP32 node' + (total !== 1 ? 's' : '');
  }

  function toggle(i, val) {
    AppState.devices[i].online = val;
    AppState.persist();
    render();
    UI.renderStatus();
    Helpers.toast(AppState.devices[i].name + (val ? ' online' : ' offline'));
  }

  function save() {
    const name = Helpers.required('fd-name', 'Device name');
    if (!name) return;

    const sensors = [];
    if (document.getElementById('s-soil').checked)  sensors.push('Soil');
    if (document.getElementById('s-temp').checked)  sensors.push('Temp');
    if (document.getElementById('s-hum').checked)   sensors.push('Humidity');
    if (document.getElementById('s-light').checked) sensors.push('Light');
    if (document.getElementById('s-wind').checked)  sensors.push('Wind');
    if (document.getElementById('s-rain').checked)  sensors.push('Rain');

    const conn = document.getElementById('fd-conn').value;

    AppState.devices.push({
      id:      Helpers.uid(),
      name:    name.trim(),
      mac:     document.getElementById('fd-mac').value.trim() || 'XX:XX:XX:XX:XX:XX',
      sensors: sensors.length ? sensors : ['Soil'],
      conn,
      ip:      document.getElementById('fd-ip').value.trim() || '—',
      signal:  -60,
      online:  false,
    });

    AppState.persist();
    UI.closeSheet('sh-adddev');
    ['fd-name', 'fd-mac', 'fd-ip'].forEach(id => document.getElementById(id).value = '');
    render();
    UI.renderStatus();
    Helpers.toast(name + ' registered', 'ok');
  }

  function showDetail(i) {
    const d = AppState.devices[i];
    document.getElementById('dd-title').textContent = d.name;
    document.getElementById('dd-body').innerHTML = `
      <div class="detail-row"><span class="detail-key">MAC</span><span class="detail-val">${d.mac}</span></div>
      <div class="detail-row"><span class="detail-key">IP / Address</span><span class="detail-val">${d.ip}</span></div>
      <div class="detail-row"><span class="detail-key">Connection</span><span class="detail-val">${d.conn.toUpperCase()}</span></div>
      <div class="detail-row"><span class="detail-key">Signal</span><span class="detail-val">${d.signal} dBm</span></div>
      <div class="detail-row"><span class="detail-key">Sensors</span><span class="detail-val">${d.sensors.join(', ')}</span></div>
      <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val">
        <span class="pill ${d.online ? 'pill-green' : 'pill-gray'}">${d.online ? 'Online' : 'Offline'}</span>
      </span></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-secondary btn-sm" style="flex:1"
          onclick="Helpers.toast('Ping → ${d.name} · 12ms','ok');UI.closeSheet('sh-devdetail')">Ping</button>
        <button class="btn btn-outline btn-sm" style="flex:1"
          onclick="Helpers.toast('Restarting ${d.name}…');UI.closeSheet('sh-devdetail')">Restart</button>
        <button class="btn btn-danger btn-sm" style="flex:1"
          onclick="DeviceManager.delete(${i});UI.closeSheet('sh-devdetail')">Remove</button>
      </div>`;
    UI.openSheet('sh-devdetail');
  }

  function deleteDevice(i) {
    const name = AppState.devices[i].name;
    if (!confirm('Remove ' + name + '?')) return;
    AppState.devices.splice(i, 1);
    AppState.persist();
    render();
    UI.renderStatus();
    Helpers.toast(name + ' removed');
  }

  return { render, toggle, save, showDetail, delete: deleteDevice };
})();
