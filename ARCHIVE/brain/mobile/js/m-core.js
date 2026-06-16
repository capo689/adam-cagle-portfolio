/* m-core.js — the mobile engine.
   Boots every page: quality tier + live FPS governor, shared gyro, haptics,
   full-screen menu, fail-safe reveals, page-transition curtain, image lightbox,
   the kinetic reel + scroll-velocity warp, and lazy-loads the GL scenes by DOM. */

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- quality tier ---------- */
function webglOK() {
  try { const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
  catch (e) { return false; }
}
function pickTier() {
  if (reduced || !webglOK()) return "C";
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (mem <= 3 || cores <= 3) return "B";
  return "A";
}

export const MFX = {
  tier: pickTier(),
  dpr() { return this.tier === "A" ? Math.min(devicePixelRatio || 1, 2) : 1.5; },
  haptic(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} },
  _scenes: new Set(),
  add(scene) { this._scenes.add(scene); return scene; },
  remove(scene) { this._scenes.delete(scene); },
  _gyroSubs: new Set(),
  onGyro(fn) { this._gyroSubs.add(fn); },
};
window.MFX = MFX;

/* ---------- shared rAF governor (one loop, all scenes) ---------- */
(function governor() {
  if (MFX.tier === "C") return; // no animation loop in static tier
  let last = performance.now(), acc = 0, frames = 0, lowStreak = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    // fps sampling over ~1s windows
    acc += dt; frames++;
    if (acc >= 1) {
      const fps = frames / acc; acc = 0; frames = 0;
      if (fps < 32) { lowStreak++; } else { lowStreak = 0; }
      if (lowStreak >= 2 && MFX.tier === "A") { MFX.tier = "B"; document.body.classList.add("tier-b"); }
      else if (lowStreak >= 4 && MFX.tier === "B") { MFX.tier = "C"; demoteToStatic(); }
    }
    MFX._scenes.forEach((s) => { try { if (s.visible !== false) s.tick(dt); } catch (e) {} });
  }
  requestAnimationFrame(loop);
})();

function demoteToStatic() {
  // last-resort: stop scenes, drop in the static fallback gradient
  MFX._scenes.forEach((s) => { try { s.dispose && s.dispose(); } catch (e) {} });
  MFX._scenes.clear();
  document.querySelectorAll(".m-stage").forEach((st) => { st.innerHTML = ""; st.classList.add("m-fallbg"); });
}

/* ---------- gyroscope (single listener, fan-out; permission on first tap) ---------- */
(function gyro() {
  if (reduced) return;
  let started = false;
  function start() {
    if (started) return; started = true;
    addEventListener("deviceorientation", (e) => {
      const gx = Math.max(-1, Math.min(1, (e.gamma || 0) / 35));
      const gy = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 35));
      MFX._gyroSubs.forEach((fn) => { try { fn(gx, gy); } catch (err) {} });
    }, true);
  }
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    const ask = () => { DOE.requestPermission().then((s) => s === "granted" && start()).catch(() => {}); removeEventListener("pointerdown", ask); };
    addEventListener("pointerdown", ask, { once: true });
  } else if (DOE) { start(); }
})();

/* ---------- menu ---------- */
function menu() {
  const b = document.querySelector(".m-burger"), p = document.querySelector(".m-menu");
  if (!b || !p) return;
  const open = () => { p.classList.add("is-open"); document.body.classList.add("m-lock"); MFX.haptic(8); };
  const shut = () => { p.classList.remove("is-open"); document.body.classList.remove("m-lock"); };
  b.addEventListener("click", open);
  const x = p.querySelector(".m-menu__close"); if (x) x.addEventListener("click", shut);
  p.querySelectorAll("a").forEach((a) => a.addEventListener("click", shut));
}

/* ---------- reveals (fail-safe) ---------- */
function reveals() {
  const items = [...document.querySelectorAll(".reveal")];
  if (!items.length) return;
  if (reduced || !("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("in")); return; }
  document.body.classList.add("m-armed");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  items.forEach((el) => io.observe(el));
  setTimeout(() => items.forEach((el) => el.classList.add("in")), 1800); // backstop
}

/* ---------- page transition curtain ---------- */
function transitions() {
  if (reduced) return;
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") || "";
    if (!href || href[0] === "#" || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    let url; try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin || url.pathname.indexOf("/mobile/") === -1) return;
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    document.body.classList.add("m-leaving"); MFX.haptic(6);
    setTimeout(() => { location.href = a.href; }, 430);
  });
}

/* ---------- image lightbox ([data-mfull]) ---------- */
function lightbox() {
  let lb = null;
  function build() {
    lb = document.createElement("div"); lb.className = "m-lb";
    lb.innerHTML = '<button class="m-x" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(lb);
    const close = () => { lb.classList.remove("open"); document.body.classList.remove("m-lock"); };
    lb.addEventListener("click", (e) => { if (e.target.tagName !== "IMG") close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-mfull]"); if (!t) return;
    e.preventDefault(); if (!lb) build();
    lb.querySelector("img").src = t.getAttribute("data-mfull") || t.getAttribute("src");
    lb.classList.add("open"); document.body.classList.add("m-lock"); MFX.haptic(8);
  });
}

/* ---------- scroll-velocity warp ([data-warp]) ---------- */
function velocityWarp() {
  if (MFX.tier === "C") return;
  const els = [...document.querySelectorAll("[data-warp]")];
  if (!els.length) return;
  let lastY = scrollY, vel = 0, raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    const y = scrollY; vel += ((y - lastY) - vel) * 0.4; lastY = y;
    const skew = Math.max(-6, Math.min(6, vel * 0.12));
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      el.style.transform = "skewY(" + skew.toFixed(2) + "deg) scaleY(" + (1 + Math.abs(skew) * 0.004).toFixed(3) + ")";
    });
  }
  frame();
}

/* ---------- the creative-direction kinetic reel ---------- */
function reel() {
  const host = document.querySelector("[data-reel]");
  if (!host || !window.CD_TILES) return;
  const tiles = window.CD_TILES.slice();
  // 3 rows, shuffled differently, each a marquee track; drag to scrub
  const rows = 3, perRow = Math.ceil(tiles.length / rows);
  function webp(s) { return s.replace("/img/cd/work/", "/mobile/img/cd/").replace("/img/cd/logos/", "/mobile/img/cd/").replace(/\.(jpg|jpeg|png)$/, ".webp"); }
  for (let r = 0; r < rows; r++) {
    const row = document.createElement("div"); row.className = "m-reel__row";
    const track = document.createElement("div"); track.className = "m-reel__track";
    const slice = tiles.slice(r * perRow, (r + 1) * perRow);
    const seq = slice.concat(slice); // duplicate for seamless loop
    seq.forEach((t) => {
      const tile = document.createElement("button"); tile.type = "button"; tile.className = "m-reel__tile";
      tile.setAttribute("data-mfull", t.s); // lightbox uses original (sharp on zoom)
      const im = new Image(); im.loading = "lazy"; im.decoding = "async"; im.alt = t.l || "";
      im.src = webp(t.s); im.onerror = () => { im.onerror = null; im.src = t.s; };
      const l = document.createElement("span"); l.className = "l"; l.textContent = t.l || "";
      tile.appendChild(im); tile.appendChild(l); track.appendChild(tile);
    });
    row.appendChild(track); host.appendChild(row);
    // marquee via governor (alternate direction), drag to nudge
    let x = -(r * 60), dir = r % 2 === 0 ? -1 : 1, speed = 14 + r * 3, half = 0, dragging = false, px = 0;
    const measure = () => { half = track.scrollWidth / 2; };
    setTimeout(measure, 400); addEventListener("resize", measure);
    const scene = MFX.add({ visible: true, tick(dt) {
      if (dragging || !half) return;
      x += dir * speed * dt;
      if (x < -half) x += half; if (x > 0) x -= half;
      track.style.transform = "translateX(" + x + "px)";
    }});
    row.addEventListener("pointerdown", (e) => { dragging = true; px = e.clientX; row.setPointerCapture(e.pointerId); });
    row.addEventListener("pointermove", (e) => { if (!dragging) return; x += e.clientX - px; px = e.clientX; if (half){ if (x < -half) x += half; if (x > 0) x -= half; } track.style.transform = "translateX(" + x + "px)"; });
    row.addEventListener("pointerup", () => { dragging = false; });
    row.addEventListener("pointercancel", () => { dragging = false; });
    const io = new IntersectionObserver((es) => es.forEach((e) => { scene.visible = e.isIntersecting; }), { rootMargin: "120px" });
    io.observe(row);
  }
}

/* ---------- boot ---------- */
async function boot() {
  menu(); reveals(); transitions(); lightbox(); velocityWarp(); reel();

  if (MFX.tier !== "C") {
    if (document.querySelector("[data-brain]")) (await import("./m-brain.js")).initBrain();
    if (document.querySelector("[data-bgscene]")) (await import("./m-fx.js")).initBgScene();
    if (document.querySelector("canvas[data-shader]")) (await import("./m-shaders.js")).initShaders();
    if (document.querySelector("canvas[data-skillcloud]")) (await import("./m-skillcloud.js")).initSkillClouds();
  } else {
    // tier C: paint static fallbacks
    document.querySelectorAll(".m-stage").forEach((st) => st.classList.add("m-fallbg"));
  }
  if (document.querySelector("[data-reader],[data-paper],[data-flip]")) (await import("./m-reader.js")).initReader();
}
if (document.readyState === "loading") addEventListener("DOMContentLoaded", boot); else boot();
