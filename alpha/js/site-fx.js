/* ──────────────────────────────────────────────────────────────────────
   SiteFX — orchestration layer
   ──────────────────────────────────────────────────────────────────────
   The single source of truth for animation/effect lifecycle. Every
   plugin (cursor, smooth-scroll, page transitions, hero reveals, etc.)
   registers here so we can guarantee init order, prevent two effects
   from owning the same element, and broadcast page lifecycle events.

   Usage:
     SiteFX.register('cursor', { init, destroy, owns: ['.cursor'] });
     SiteFX.on('page:enter', (ctx) => { ... });
     SiteFX.emit('page:enter', { from, to });
   ────────────────────────────────────────────────────────────────────── */

(() => {
  if (window.SiteFX) return; // singleton

  const plugins = new Map();      // name -> { init, destroy, owns, ready }
  const ownership = new Map();    // selector -> plugin name
  const listeners = new Map();    // event -> Set<fn>

  let phase = 'boot'; // boot → ready → page-enter → page-leave → page-enter ...

  function log(...args) {
    if (window.SITE_FX_DEBUG) console.log('[SiteFX]', ...args);
  }

  const SiteFX = {
    get phase() { return phase; },

    register(name, plugin) {
      if (plugins.has(name)) {
        console.warn(`[SiteFX] plugin "${name}" already registered`);
        return;
      }
      // claim ownership of any selectors the plugin reserves
      const owns = plugin.owns || [];
      for (const sel of owns) {
        if (ownership.has(sel)) {
          console.warn(`[SiteFX] selector "${sel}" already owned by "${ownership.get(sel)}", "${name}" will not claim it`);
          continue;
        }
        ownership.set(sel, name);
      }
      plugins.set(name, { ...plugin, ready: false });
      log('registered', name);

      // if we're already past boot, init this plugin now
      if (phase !== 'boot') this._initPlugin(name);
    },

    owns(selector) {
      return ownership.get(selector) || null;
    },

    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event)?.delete(fn);
    },

    emit(event, payload) {
      log('emit', event, payload);
      const set = listeners.get(event);
      if (!set) return;
      for (const fn of set) {
        try { fn(payload); }
        catch (err) { console.error(`[SiteFX] listener for "${event}" threw:`, err); }
      }
    },

    _initPlugin(name) {
      const p = plugins.get(name);
      if (!p || p.ready) return;
      try {
        p.init?.();
        p.ready = true;
        log('init', name);
      } catch (err) {
        console.error(`[SiteFX] init for "${name}" failed:`, err);
      }
    },

    boot() {
      if (phase !== 'boot') return;
      log('boot start, plugins:', [...plugins.keys()]);
      for (const name of plugins.keys()) this._initPlugin(name);
      phase = 'ready';
      this.emit('ready');
      // first page-enter fires immediately on first paint
      this.emit('page:enter', { from: null, to: location.pathname });
    },

    destroy(name) {
      const p = plugins.get(name);
      if (!p) return;
      try { p.destroy?.(); } catch (err) { console.error(err); }
      // release ownership
      for (const [sel, owner] of ownership) {
        if (owner === name) ownership.delete(sel);
      }
      plugins.delete(name);
      log('destroyed', name);
    },
  };

  window.SiteFX = SiteFX;

  // auto-boot once DOM is parsed; effects can register before this fires
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SiteFX.boot(), { once: true });
  } else {
    queueMicrotask(() => SiteFX.boot());
  }
})();
