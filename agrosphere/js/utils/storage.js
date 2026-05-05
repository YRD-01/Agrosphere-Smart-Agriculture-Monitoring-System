/* ═══════════════════════════════════════════
   js/utils/storage.js  —  localStorage wrapper
═══════════════════════════════════════════ */

const Storage = (() => {
  const PREFIX = 'agro_';
  const VERSION = '2';

  // Migrate old data if version changed
  function init() {
    const v = localStorage.getItem(PREFIX + 'version');
    if (v !== VERSION) {
      console.info('[Storage] Version changed, migrating…');
      localStorage.setItem(PREFIX + 'version', VERSION);
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage] set failed:', e);
      return false;
    }
  }

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }

  init();
  return { set, get, remove, clearAll };
})();
