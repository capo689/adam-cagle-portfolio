// js/site-fx.js
// SiteFX — animation orchestrator. Lives at window.SiteFX.
// Every effect on the site (hero reveals, scroll triggers, lightbox, page
// transitions, cursor states) registers here so they don't collide.
//
// API:
//   SiteFX.phase                    'idle' | 'preloading' | 'transitioning' | 'lightbox' | <custom>
//   SiteFX.setPhase(name)           change phase, fires phase:change + phase:<name>
//   SiteFX.on(event, fn)            subscribe; returns unsubscribe()
//   SiteFX.off(event, fn)           unsubscribe explicitly
//   SiteFX.claim(target, owner)     register exclusive ownership of element(s)
//   SiteFX.release(owner)           drop all claims by owner
//   SiteFX.isOwnedBy(el, owner)     true if el is claimed by owner
//   SiteFX.isOwned(el)              true if el has any claim
//   SiteFX.canAct(el, owner)        true if owner is allowed to manipulate el
//   SiteFX.isIdle() / isBusy()      shorthand
//   SiteFX.debug(true|false)        log every phase change + claim
//
// Events:
//   phase:change   { from, to }
//   phase:<name>   no payload
//   claim          { element, owner }
//   release        { owner }

(function () {
  if (window.SiteFX) return;

  const listeners = new Map();
  const claimMap  = new WeakMap();
  const claimList = [];
  let phase   = 'idle';
  let logging = false;

  function log() {
    if (!logging) return;
    const args = ['[SiteFX]'].concat(Array.prototype.slice.call(arguments));
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
    if (typeof next !== 'string' || !next || next === phase) return;
    const prev = phase;
    phase = next;
    log('phase', prev, '→', next);
    emit('phase:change', { from: prev, to: next });
    emit('phase:' + next);
  }

  function claim(target, owner) {
    if (!owner) { console.warn('[SiteFX] claim() requires an owner id'); return []; }
    let els;
    if (typeof target === 'string')      els = Array.prototype.slice.call(document.querySelectorAll(target));
    else if (target instanceof Element)  els = [target];
    else if (target && target.length)    els = Array.prototype.slice.call(target);
    else                                 els = [];
    els.forEach(function (el) {
      claimMap.set(el, owner);
      claimList.push({ el: el, owner: owner });
      emit('claim', { element: el, owner: owner });
      log('claim', owner, el);
    });
    return els;
  }

  function release(owner) {
    if (!owner) return;
    let removed = 0;
    for (let i = claimList.length - 1; i >= 0; i--) {
      if (claimList[i].owner === owner) {
        claimMap.delete(claimList[i].el);
        claimList.splice(i, 1);
        removed++;
      }
    }
    if (removed) {
      emit('release', { owner: owner });
      log('release', owner, '(' + removed + ' claims)');
    }
  }

  function isOwnedBy(el, owner) { return el ? claimMap.get(el) === owner : false; }
  function isOwned(el)          { return el ? claimMap.has(el) : false; }
  function canAct(el, owner)    { return !el ? false : (!claimMap.has(el) || claimMap.get(el) === owner); }

  window.SiteFX = {
    get phase() { return phase; },
    setPhase: setPhase,
    on: on,
    off: off,
    claim: claim,
    release: release,
    isOwnedBy: isOwnedBy,
    isOwned: isOwned,
    canAct: canAct,
    isIdle: function () { return phase === 'idle'; },
    isBusy: function () { return phase !== 'idle'; },
    debug: function (v) { logging = !!v; }
  };
})();
