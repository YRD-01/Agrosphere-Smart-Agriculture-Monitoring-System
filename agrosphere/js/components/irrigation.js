/* ═══════════════════════════════════════════
   js/components/irrigation.js
═══════════════════════════════════════════ */
const IrrigationController = (() => {

  let isRunning   = Storage.get('irrRunning', false);
  let irrTimer    = null;

  // ── Open the irrigate sheet for a crop ────
  function openSheet(cropIndex) {
    document.getElementById('irr-idx').value = cropIndex;
    const crop = AppState.crops[cropIndex];
    if (crop) document.getElementById('irr-vol').value = crop.water;
    UI.openSheet('sh-irrigate');
  }

  // ── Trigger irrigation (from sheet) ───────
  function trigger() {
    const i   = parseInt(document.getElementById('irr-idx').value);
    const dur = parseInt(document.getElementById('irr-dur').value) || 30;
    const vol = parseFloat(document.getElementById('irr-vol').value) || 10;

    UI.closeSheet('sh-irrigate');
    on(dur, vol, i);
  }

  // ── Turn irrigation ON ────────────────────
  function on(durationMin = 30, volume = 10, cropIdx = null) {
    isRunning = true;
    Storage.set('irrRunning', true);
    _updateBar(true, durationMin);

    // Publish via MQTT if connected
    const payload = {
      command:  'irrigation_on',
      duration: durationMin,
      volume,
      crop:     cropIdx !== null ? AppState.crops[cropIdx]?.name : 'all',
      ts:       Date.now(),
    };

    const published = MQTTService.publish(payload);
    if (!published) {
      Helpers.toast('Irrigation started locally (MQTT offline)', 'warn');
    } else {
      Helpers.toast('Irrigation ON · ' + durationMin + 'min · ' + volume + 'L/m²', 'ok');
    }

    // Update crop moisture
    if (cropIdx !== null && AppState.crops[cropIdx]) {
      AppState.crops[cropIdx].moisture = Math.max(0, AppState.crops[cropIdx].moisture - 18);
      AppState.crops[cropIdx].status   = 'Healthy';
      AppState.persist();
      CropManager.render();
    }

    // Auto-stop after duration
    clearTimeout(irrTimer);
    irrTimer = setTimeout(() => off(true), durationMin * 60 * 1000);
  }

  // ── Turn irrigation OFF ───────────────────
  function off(auto = false) {
    isRunning = false;
    Storage.set('irrRunning', false);
    clearTimeout(irrTimer);
    _updateBar(false);

    const payload = { command: 'irrigation_off', ts: Date.now() };
    MQTTService.publish(payload);

    Helpers.toast(auto ? 'Irrigation cycle complete' : 'Irrigation stopped', auto ? 'ok' : '');
  }

  // ── Update the irrigation status bar ──────
  function _updateBar(running, minutesLeft = null) {
    const dot    = document.getElementById('irr-dot');
    const status = document.getElementById('irr-status-text');
    const btnOn  = document.getElementById('irr-on-btn');
    const btnOff = document.getElementById('irr-off-btn');

    if (dot) dot.classList.toggle('active', running);
    if (status) status.textContent = running ? (minutesLeft ? 'Running · ' + minutesLeft + 'min' : 'Running…') : 'Idle';
    if (btnOn)  btnOn.style.display  = running ? 'none' : '';
    if (btnOff) btnOff.style.display = running ? '' : 'none';
  }

  // ── Restore state on boot ─────────────────
  function restore() {
    if (isRunning) _updateBar(true);
  }

  return { openSheet, trigger, on, off, restore };
})();
