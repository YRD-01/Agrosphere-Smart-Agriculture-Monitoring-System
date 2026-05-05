/* ═══════════════════════════════════════════
   js/components/alerts.js  —  Smart alert rules
═══════════════════════════════════════════ */

const AlertManager = (() => {

  // ── State ─────────────────────────────────
  // Built-in system rules (always active)
  const SYSTEM_RULES = [
    { id: 'sys_moisture', sensor: 'moisture', cond: 'below', val: 50,  sev: 'warn', msg: 'Soil moisture critically low — irrigate now', auto: true },
    { id: 'sys_temp',     sensor: 'temp',     cond: 'above', val: 35,  sev: 'warn', msg: 'Temperature exceeds safe crop threshold (35°C)', auto: true },
    { id: 'sys_humidity', sensor: 'humidity', cond: 'above', val: 90,  sev: 'info', msg: 'Humidity is very high — check for fungal risk', auto: true },
  ];

  let userRules  = Storage.get('alertRules', []);
  let activeAlerts = Storage.get('activeAlerts', [
    { id: 'a1', sev: 'warn', msg: 'Field B: Soil moisture below 50%', time: Date.now() },
    { id: 'a2', sev: 'ok',   msg: 'Field A: All parameters optimal',  time: Date.now() },
    { id: 'a3', sev: 'info', msg: 'Pesticide due in 3 days for wheat', time: Date.now() },
  ]);

  function _persist() {
    Storage.set('alertRules',    userRules);
    Storage.set('activeAlerts',  activeAlerts);
  }

  // ── Auto-check rules on new sensor data ───
  function checkRules() {
    const settings = Storage.get('settings', {});
    if (settings.notif === false) return;

    const allRules = [
      ...(settings.moistAlert !== false ? [SYSTEM_RULES[0]] : []),
      ...(settings.tempAlert  !== false ? [SYSTEM_RULES[1]] : []),
      SYSTEM_RULES[2],
      ...userRules,
    ];

    const s = SensorService.sensors;

    allRules.forEach(rule => {
      const key = rule.sensor === 'Soil Moisture' ? 'moisture'
                : rule.sensor === 'Temperature'   ? 'temp'
                : rule.sensor === 'Humidity'       ? 'humidity'
                : rule.sensor === 'Light'          ? 'light'
                : rule.sensor; // already normalized key

      const sval = s[key] ? s[key].v : null;
      if (sval === null) return;

      const triggered = rule.cond === 'below' ? sval < rule.val : sval > rule.val;
      const existing  = activeAlerts.find(a => a.ruleId === rule.id);

      if (triggered && !existing) {
        activeAlerts.push({
          id: Helpers.uid(),
          ruleId: rule.id,
          sev:  rule.sev,
          msg:  rule.msg,
          time: Date.now(),
        });
        if (settings.notif !== false) {
          Helpers.toast('⚠ ' + rule.msg, rule.sev === 'warn' ? 'warn' : '');
        }
      } else if (!triggered && existing) {
        // Auto-clear when resolved
        activeAlerts = activeAlerts.filter(a => a.ruleId !== rule.id);
      }
    });

    _persist();
    renderAlerts();
  }

  // ── Save user rule ─────────────────────────
  function save() {
    const val = Helpers.required('al-val', 'Value');
    const msg = Helpers.required('al-msg', 'Message');
    if (!val || !msg) return;

    userRules.push({
      id:     'u_' + Helpers.uid(),
      sensor: document.getElementById('al-sensor').value,
      cond:   document.getElementById('al-cond').value,
      val:    parseFloat(val),
      sev:    document.getElementById('al-sev').value,
      msg:    msg.trim(),
    });

    UI.closeSheet('sh-addalert');
    document.getElementById('al-val').value = '';
    document.getElementById('al-msg').value = '';
    _persist();
    checkRules();
    Helpers.toast('Alert rule added', 'ok');
  }

  // ── Dismiss active alert ───────────────────
  function dismiss(id) {
    activeAlerts = activeAlerts.filter(a => a.id !== id);
    _persist();
    renderAlerts();
    Helpers.toast('Alert dismissed');
  }

  // ── Delete user rule ──────────────────────
  function deleteRule(id) {
    userRules = userRules.filter(r => r.id !== id);
    _persist();
    renderAlerts();
  }

  // ── Render alerts list ────────────────────
  function renderAlerts() {
    const el = document.getElementById('home-alerts');
    if (!el) return;

    if (!activeAlerts.length) {
      el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--muted);font-size:13px">No active alerts</div>';
      return;
    }

    el.innerHTML = activeAlerts.map(a => `
      <div class="alert-item a-${a.sev}">
        <span style="flex:1;font-size:13px">${a.msg}</span>
        <span style="font-size:10px;opacity:.6;flex-shrink:0;margin:0 4px">${Helpers.timeAgo(a.time)}</span>
        <button class="alert-close" onclick="AlertManager.dismiss('${a.id}')">×</button>
      </div>`).join('');
  }

  return { save, dismiss, deleteRule, checkRules, renderAlerts };
})();
