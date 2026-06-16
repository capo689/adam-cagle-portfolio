/* cursor.js — the NEURAL cursor. Precise dot + lerping ring that morphs to
   labeled states over interactives, plus an electric-blue synapse trail.
   Desktop fine-pointer only; bails on touch / reduced motion. Works with
   SPA-injected content (state is resolved per pointer event via closest()). */
(function () {
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(pointer: coarse)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.documentElement.classList.add("has-cursor");
  const ring = document.createElement("div"); ring.className = "cur-ring";
  const label = document.createElement("span"); label.className = "cur-label"; ring.appendChild(label);
  const dot = document.createElement("div"); dot.className = "cur-dot";
  const canvas = document.createElement("canvas"); canvas.className = "cur-trail";
  document.body.append(canvas, ring, dot);

  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  function size() { W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener("resize", size);

  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, dx = mx, dy = my;
  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener("pointerdown", () => ring.classList.add("press"));
  addEventListener("pointerup", () => ring.classList.remove("press"));
  document.addEventListener("mouseleave", () => document.body.classList.add("cur-hide"));
  document.addEventListener("mouseenter", () => document.body.classList.remove("cur-hide"));

  const VIEW = '.ux-tile, .tw-card, .cdw__tile, .cdw__tile--book, .work-cover, .hf-cover-wrap, .skill-view, [data-skill-view], [data-paper], [data-ux-open], [data-flip], [data-cursor="view"], .sample-card';
  function resolve(t) {
    if (!t || !t.closest) return null;
    if (t.closest('a[href^="mailto:"]')) return ["email", "Email"];
    if (t.closest(VIEW)) return ["view", "View"];
    if (t.closest('a[target="_blank"]')) return ["ext", "↗"];
    if (t.closest('a[href], button, summary, label, .stack, [data-stack], [role="button"], input, textarea, select')) return ["link", ""];
    return null;
  }
  function apply(s) {
    if (s) { ring.classList.add("on"); ring.dataset.state = s[0]; label.textContent = s[1];
      document.body.classList.toggle("cur-dot-hide", s[0] !== "link"); }
    else { ring.classList.remove("on"); ring.removeAttribute("data-state"); label.textContent = ""; document.body.classList.remove("cur-dot-hide"); }
  }
  addEventListener("pointerover", (e) => apply(resolve(e.target)), { passive: true });
  addEventListener("pointerout", (e) => { if (!e.relatedTarget) apply(null); }, { passive: true });

  const trail = [];
  function frame() {
    requestAnimationFrame(frame);
    rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
    dx += (mx - dx) * 0.55; dy += (my - dy) * 0.55;
    ring.style.transform = "translate(" + rx + "px," + ry + "px)";
    dot.style.transform = "translate(" + dx + "px," + dy + "px)";
    // synapse trail: track recent positions, draw a fading blue comet
    trail.push({ x: dx, y: dy }); if (trail.length > 20) trail.shift();
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (let i = 1; i < trail.length; i++) {
      const a = i / trail.length, p = trail[i], q = trail[i - 1];
      ctx.strokeStyle = "rgba(77,139,232," + (a * a * 0.5).toFixed(3) + ")";
      ctx.lineWidth = a * 3.2;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  }
  frame();
})();
