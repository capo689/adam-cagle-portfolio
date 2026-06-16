/* m.js — mobile orchestration: brain touch/tap/gyro, scroll reveals (fail-safe),
   full-screen menu, light haptics. Module (imports the brain). */
import { initMobileBrain } from "./m-brain.js";

const haptic = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

/* ---- menu (works on every mobile page) ---- */
function menu() {
  const burger = document.querySelector(".m-burger");
  const panel = document.querySelector(".m-menu");
  if (!burger || !panel) return;
  const close = panel.querySelector(".m-menu__close");
  const open = () => { panel.classList.add("is-open"); document.body.classList.add("m-lock"); haptic(8); };
  const shut = () => { panel.classList.remove("is-open"); document.body.classList.remove("m-lock"); };
  burger.addEventListener("click", open);
  if (close) close.addEventListener("click", shut);
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", shut));
}

/* ---- scroll reveals (visible by default; armed only if we can observe) ---- */
function reveals() {
  const app = document.querySelector(".m-app") || document.body;
  const items = [...document.querySelectorAll(".reveal")];
  if (!items.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in")); return;
  }
  app.classList.add("armed");
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  items.forEach((el) => io.observe(el));
  setTimeout(() => items.forEach((el) => el.classList.add("in")), 1800); // backstop
}

/* ---- hero brain + gyro ---- */
function brain() {
  const canvas = document.querySelector("[data-mbrain]");
  if (!canvas) return;
  const fall = canvas.parentElement.querySelector(".fallimg");
  const api = initMobileBrain(canvas, { fallback: fall });
  if (!api) return;

  const rect = () => canvas.getBoundingClientRect();
  canvas.addEventListener("pointermove", (e) => {
    const r = rect(); api.touch((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
  }, { passive: true });
  canvas.addEventListener("pointerdown", (e) => {
    const r = rect(); api.tap((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    haptic(12);
    const hint = document.querySelector(".m-tap-hint"); if (hint) hint.classList.add("gone");
  }, { passive: true });

  // gyroscope: needs a user gesture to request permission on iOS
  let gyroOn = false;
  function startGyro() {
    if (gyroOn) return; gyroOn = true;
    const handler = (e) => {
      // gamma: left/right [-90,90], beta: front/back [-180,180]
      const gx = Math.max(-1, Math.min(1, (e.gamma || 0) / 35));
      const gy = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 35));
      api.tilt(gx, gy);
    };
    window.addEventListener("deviceorientation", handler, true);
  }
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    const ask = () => { DOE.requestPermission().then((s) => { if (s === "granted") startGyro(); }).catch(() => {}); document.removeEventListener("pointerdown", ask); };
    document.addEventListener("pointerdown", ask, { once: true });
  } else if (DOE) {
    startGyro();
  }
}

/* ---- fullscreen image lightbox (tap any [data-mfull]) ---- */
function lightbox() {
  let lb = null;
  function build() {
    lb = document.createElement("div");
    lb.className = "m-lb";
    lb.innerHTML = '<button class="m-lb__x" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(lb);
    const close = () => { lb.classList.remove("open"); document.body.classList.remove("m-lock"); };
    lb.addEventListener("click", (e) => { if (e.target !== lb.querySelector("img")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-mfull]");
    if (!t) return;
    e.preventDefault();
    if (!lb) build();
    const src = t.getAttribute("data-mfull") || t.getAttribute("src");
    lb.querySelector("img").src = src;
    lb.classList.add("open"); document.body.classList.add("m-lock");
    haptic(8);
  });
}

/* ---- creative-direction gallery from the shared manifest ---- */
function cdGallery() {
  const host = document.querySelector("[data-cd-gallery]");
  if (!host || !window.CD_TILES) return;
  const frag = document.createDocumentFragment();
  window.CD_TILES.forEach((tile) => {
    const fig = document.createElement("button");
    fig.className = "m-cd"; fig.type = "button"; fig.setAttribute("data-mfull", tile.s);
    fig.innerHTML = '<img loading="lazy" decoding="async" alt="' + (tile.l || "") + '" src="' + tile.s + '"><span class="m-cd__l">' + (tile.l || "") + "</span>";
    frag.appendChild(fig);
  });
  host.appendChild(frag);
}

function init() {
  menu();
  reveals();
  brain();
  lightbox();
  cdGallery();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
