/* ═══════════════════════════════════════════
   js/components/ui.js  —  Core UI helpers
═══════════════════════════════════════════ */

const UI = (() => {

  // ── Navigation ───────────────────────────
  function navTo(page, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('pg-' + page).classList.add('active');
    el.classList.add('active');

    // Lazy-render page-specific content
    if (page === 'crops')   CropManager.render();
    if (page === 'devices') DeviceManager.render();
    if (page === 'network') NetworkManager.renderSummary();
  }

  // ── Sheet (bottom drawer) ─────────────────
  function openSheet(id) {
    if (id === 'sh-addcrop') _populateDeviceSelect();
    document.getElementById(id).classList.add('open');
  }

  function closeSheet(id) {
    document.getElementById(id).classList.remove('open');
  }

  // ── Sensor tiles ─────────────────────────
  function renderTiles() {
    const keys = ['moisture', 'temp', 'humidity', 'light'];
    const el   = document.getElementById('sensor-tiles');
    if (!el) return;

    el.innerHTML = keys.map(k => {
      const s     = SensorService.sensors[k];
      const val   = Helpers.formatValue(s.v, s.unit);
      const cls   = _statusClass(s.status);
      return `<div class="tile">
        <div class="tile-icon" style="background:${s.iconBg}">${s.icon}</div>
        <div class="tile-label">${s.label}</div>
        <div class="tile-value">${val}<span class="tile-unit">${s.unit}</span></div>
        <div class="tile-status ${cls}">${_capitalize(s.status)}</div>
      </div>`;
    }).join('');
  }

  // ── System status card ────────────────────
  function renderStatus() {
    const el     = document.getElementById('home-status');
    if (!el) return;
    const active = NetworkManager.getActive();
    const online = AppState.devices.filter(d => d.online).length;
    const mqConn = MQTTService.isConnected() ? '<span class="pill pill-green">Connected</span>' : '<span class="pill pill-gray">Disconnected</span>';

    el.innerHTML = `
      <div class="detail-row"><span class="detail-key">Active devices</span><span class="detail-val">${online} / ${AppState.devices.length}</span></div>
      <div class="detail-row"><span class="detail-key">Active network</span><span class="detail-val">${active ? active.toUpperCase() : '<span style="color:var(--amber)">None</span>'}</span></div>
      <div class="detail-row"><span class="detail-key">MQTT</span><span class="detail-val">${mqConn}</span></div>
      <div class="detail-row"><span class="detail-key">Data rate</span><span class="detail-val">${AppState.devices.length * 14} pts/min</span></div>
      <div class="detail-row"><span class="detail-key">Last refresh</span><span class="detail-val">${Helpers.timeAgo(AppState.lastRefresh)}</span></div>`;
  }

  // ── Private helpers ───────────────────────
  function _statusClass(status) {
    if (['optimal', 'normal', 'good'].includes(status)) return 's-good';
    if (['high', 'fair', 'low'].includes(status))       return 's-warn';
    return 's-bad';
  }

  function _capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  function _populateDeviceSelect() {
    const sel = document.getElementById('fc-device');
    if (!sel) return;
    sel.innerHTML = '<option value="">None</option>' +
      AppState.devices.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  }

  // ── Sheet overlay click to close ──────────
  document.addEventListener('click', e => {
    if (e.target.classList.contains('sheet-overlay')) {
      e.target.classList.remove('open');
    }
  });

  return { navTo, openSheet, closeSheet, renderTiles, renderStatus };
})();
