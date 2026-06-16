/* skill-cloud.js — interactive pixel-cloud wordmarks for the Skills cards.
   Each <canvas class="skill-cloud" data-word="AIC" data-font="..."> renders its
   word out of tiny floating pixels. Move the cursor through them and they scatter,
   then spring back and reform the word. Pauses offscreen; reduced-motion = static.
   Vanilla 2D canvas, no libraries. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PALETTE = [[45,226,230], [77,139,232], [139,92,246]]; // cyan, blue, violet

  function build(canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const word = canvas.getAttribute("data-word") || "SKILL";
    const font = canvas.getAttribute("data-font") || "700 120px 'Space Grotesk', sans-serif";
    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, particles = [], mouse = { x: -9999, y: -9999, on: false };

    function sample() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return false;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // render the word to an offscreen buffer, fit to width
      const off = document.createElement("canvas");
      off.width = canvas.width; off.height = canvas.height;
      const o = off.getContext("2d");
      o.setTransform(DPR, 0, 0, DPR, 0, 0);
      o.clearRect(0, 0, W, H);
      o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
      // shrink font size until the word fits ~86% of width
      let size = Math.min(H * 0.6, 200);
      o.font = font.replace(/\d+px/, size + "px");
      let tw = o.measureText(word).width;
      const target = W * 0.86;
      if (tw > 0) { size = Math.max(20, Math.floor(size * target / tw)); }
      o.font = font.replace(/\d+px/, size + "px");
      o.fillText(word, W / 2, H / 2 + size * 0.02);
      const img = o.getImageData(0, 0, canvas.width, canvas.height).data;
      const gap = Math.max(3, Math.round(3 * DPR));
      const pts = [];
      for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
          if (img[(y * canvas.width + x) * 4 + 3] > 130) {
            pts.push([x / DPR, y / DPR]);
          }
        }
      }
      // (re)build particles, keeping count sane
      particles = pts.map((p) => {
        const c = PALETTE[Math.floor((p[0] / W) * PALETTE.length) % PALETTE.length];
        // start at home with a touch of jitter: word reads instantly, mouse scatters it
        return { hx: p[0], hy: p[1], x: p[0] + (Math.random() - 0.5) * 8, y: p[1] + (Math.random() - 0.5) * 8, vx: 0, vy: 0, c };
      });
      return true;
    }

    let raf = 0, visible = true, settled = false;
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      const sq = Math.max(1.4, 1.7);
      let moving = false;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // spring home
        let ax = (p.hx - p.x) * 0.045;
        let ay = (p.hy - p.y) * 0.045;
        // mouse repulsion
        if (mouse.on) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          const R = 70;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * 5.5;
            ax += (dx / d) * f; ay += (dy / d) * f;
          }
        }
        p.vx = (p.vx + ax) * 0.82; p.vy = (p.vy + ay) * 0.82;
        // idle shimmer
        p.x += p.vx + (Math.random() - 0.5) * 0.25;
        p.y += p.vy + (Math.random() - 0.5) * 0.25;
        if (Math.abs(p.vx) + Math.abs(p.vy) > 0.08) moving = true;
        ctx.fillStyle = `rgb(${p.c[0]},${p.c[1]},${p.c[2]})`;
        ctx.fillRect(p.x, p.y, sq, sq);
      }
    }

    function renderStatic() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) { ctx.fillStyle = `rgb(${p.c[0]},${p.c[1]},${p.c[2]})`; ctx.fillRect(p.hx, p.hy, 1.7, 1.7); }
    }

    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
    });
    canvas.addEventListener("pointerleave", () => { mouse.on = false; mouse.x = -9999; mouse.y = -9999; });

    if (!sample()) {
      // not laid out yet; retry shortly
      const t = setInterval(() => { if (sample()) { clearInterval(t); start(); } }, 200);
      return;
    }
    start();

    function start() {
      renderStatic(); // guaranteed first paint so the card is never blank before rAF
      if (reduced) { visible = true; return; }
      // visible defaults true so it animates even if IO never delivers; IO only pauses offscreen
      try {
        const io = new IntersectionObserver((es) => { es.forEach((e) => { visible = e.isIntersecting; }); }, { rootMargin: "200px" });
        io.observe(canvas);
      } catch (e) { /* keep animating */ }
      if (!raf) raf = requestAnimationFrame(frame);
    }
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { DPR = Math.min(window.devicePixelRatio || 1, 2); sample(); }, 200); });
  }

  function init() {
    document.querySelectorAll("canvas.skill-cloud").forEach((c) => {
      if (c.__cloud) return; c.__cloud = true; build(c);
    });
  }
  window.SkillCloud = { init };
  if (document.querySelector("canvas.skill-cloud")) init();
})();
