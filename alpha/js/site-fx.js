// js/site-fx.js (ALPHA · LAYER 1)
//
// SiteFX — the animation orchestrator. Lives at window.SiteFX. Every
// effect on the site (hero reveal, scroll triggers, lightbox, page
// transitions, lightboxes, custom cursor, etc.) can register here so
// they don't collide. This file alone changes zero behavior; effects
// only feel its presence once they opt in.
//
// API:
//   SiteFX.phase                  // 'idle' | 'preloading' | 'transitioning' | 'lightbox' | <custom>
//   SiteFX.setPhase(name)         // change phase, fires phase:change + phase:<name>
//   SiteFX.on(event, fn)          // subscribe; returns unsubscribe()
//   SiteFX.off(event, fn)         // unsubscribe explicitly
//   SiteFX.claim(selector, owner) // register exclusive ownership of matching els
//   SiteFX.release(owner)         // drop all claims held by owner
//   SiteFX.isOwnedBy(el, owner)   // true if el is claimed by owner
//   SiteFX.isOwned(el)            // true if el has any claim
//   SiteFX.isIdle()               // shorthand for phase === 'idle'
//   SiteFX.isBusy()               // shorthand for phase !== 'idle'
//   SiteFX.debug(true|false)      // log every phase change + claim
//
// Standard events:
//   phase:change      → { from, to }
//   phase:<name>      → no payload
//   claim             → { element, owner }
//   release           → { owner }

(function () {
  if (window.SiteFX) return; // already installed

  const listeners = new Map(); // eventName -> Set<fn>
  const claims    = new WeakMap(); // element -> ownerId (string)
  const claimList = []; // [{el, owner}] for release()/iteration
  let phase = 'idle';
  let debugOn = false;

  function log() {
    if (!debugOn) return;
    const args = Array.prototype.slice.call(arguments);
    args.unshift('[SiteFX]');
    console.log.apply(console, args);
  }

  function emit(event, data) {
    const fns = listeners.get(event);
    if (!fns) return;
    fns.forEach(function (fn) {
      try { fn(data); } catch (e) { console.error('[SiteFX] listener error on ' + event + ':', e); }
    });
  }

  function on(event, fn) {
    if (typeof fn !== 'function') return function () {};
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return function () { off(event, fn); };
  }

  function off(event, fn) {
    const fns = listeners.get(event);
    if (fns) fns.delete(fn);
  }

  function setPhase(next) {
    if (typeof next !== 'string' || !next) return;
    if (next === phase) return;
    const prev = phase;
    phase = next;
    log('phase:', prev, '→', next);
    emit('phase:change', { from: prev, to: next });
    emit('phase:' + next, undefined);
  }

  function claim(selector, owner) {
    if (!owner) { console.warn('[SiteFX] claim() requires an owner id'); return []; }
    const els = (typeof selector === 'string')
      ? Array.prototype.slice.call(document.querySelectorAll(selector))
      : (selector instanceof Element ? [selector] : Array.prototype.slice.call(selector || []));
    els.forEach(function (el) {
      claims.set(el, owner);
      claimList.push({ el: el, owner: owner });
      emit('claim', { element: el, owner: owner });
      log('claim:', owner, el);
    });
    return els;
  }

  function release(owner) {
    if (!owner) return;
    let removed = 0;
    for (let i = claimList.length - 1; i >= 0; i--) {
      if (claimList[i].owner === owner) {
        claims.delete(claimList[i].el);
        claimList.splice(i, 1);
        removed++;
      }
    }
    if (removed) {
      emit('release', { owner: owner });
      log('release:', owner, '(' + removed + ' claims)');
    }
  }

  function isOwnedBy(el, owner) {
    return el ? claims.get(el) === owner : false;
  }

  function isOwned(el) {
    return el ? claims.has(el) : false;
  }

  window.SiteFX = {
    get phase() { return phase; },
    setPhase: setPhase,
    on: on,
    off: off,
    claim: claim,
    release: release,
    isOwnedBy: isOwnedBy,
    isOwned: isOwned,
    isIdle: function () { return phase === 'idle'; },
    isBusy: function () { return phase !== 'idle'; },
    debug: function (v) { debugOn = !!v; }
  };
})();
