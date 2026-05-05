/* ═══════════════════════════════════════════
   js/utils/helpers.js  —  Shared utilities
═══════════════════════════════════════════ */

const Helpers = (() => {

  /* Round to N decimal places */
  function round(val, decimals = 1) {
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  }

  /* Format sensor value for display */
  function formatValue(val, unit) {
    if (val === null || val === undefined) return '—';
    if (unit === 'lux' && val >= 1000) return round(val / 1000, 1) + 'k';
    return round(val, 1);
  }

  /* Generate a short unique ID */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* Format timestamp to readable string */
  function timeAgo(ts) {
    if (!ts) return 'Never';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5)  return 'Just now';
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* Clamp value between min and max */
  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  /* Debounce */
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* Show toast notification */
  function toast(msg, type = '') {
    const stack = document.getElementById('toasts');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
    setTimeout(() => el.remove(), 3100);
  }

  /* Validate required form field */
  function required(id, label) {
    const el = document.getElementById(id);
    if (!el) return false;
    const val = el.value.trim();
    if (!val) { toast(label + ' is required', 'err'); el.focus(); return false; }
    return val;
  }

  return { round, formatValue, uid, timeAgo, clamp, debounce, toast, required };
})();
