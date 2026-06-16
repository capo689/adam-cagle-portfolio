/* ux.js — UX / UI showcase behaviour.
   - scroll reveals (fail-safe: content shows even if IntersectionObserver never fires)
   - pointer-driven 3D tilt on the browser-framed mockups
   - a full-screen lightbox gallery with prev/next, dots, keyboard, per-page scroll
   Vanilla, no libraries. Idempotent for SPA re-init. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ---- lightbox (built once on body) ---- */
  function buildLightbox() {
    let lb = document.querySelector(".uxlb");
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "uxlb";
    lb.setAttribute("aria-hidden", "true");
    lb.innerHTML =
      '<div class="uxlb__top">' +
        '<span class="uxlb__title"></span>' +
        '<span class="uxlb__role"></span>' +
        '<span class="uxlb__count"></span>' +
        '<button class="uxlb__close" type="button" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="uxlb__stage">' +
        '<button class="uxlb__nav uxlb__nav--prev" type="button" aria-label="Previous">&#8249;</button>' +
        '<div class="uxlb__viewport"><img alt=""></div>' +
        '<button class="uxlb__nav uxlb__nav--next" type="button" aria-label="Next">&#8250;</button>' +
      "</div>" +
      '<div class="uxlb__foot"><span class="uxlb__cap"></span><div class="uxlb__dots"></div></div>';
    document.body.appendChild(lb);

    const img = lb.querySelector(".uxlb__viewport img");
    const vp = lb.querySelector(".uxlb__viewport");
    const titleEl = lb.querySelector(".uxlb__title");
    const roleEl = lb.querySelector(".uxlb__role");
    const countEl = lb.querySelector(".uxlb__count");
    const capEl = lb.querySelector(".uxlb__cap");
    const dotsEl = lb.querySelector(".uxlb__dots");
    const prev = lb.querySelector(".uxlb__nav--prev");
    const next = lb.querySelector(".uxlb__nav--next");

    let pages = [], idx = 0;

    function render() {
      const p = pages[idx];
      img.src = p.src; img.alt = (titleEl.textContent + " — " + (p.cap || ""));
      vp.scrollTop = 0;
      capEl.textContent = p.cap || "";
      countEl.textContent = (idx + 1).toString().padStart(2, "0") + " / " + pages.length.toString().padStart(2, "0");
      const multi = pages.length > 1;
      prev.hidden = !multi; next.hidden = !multi;
      [...dotsEl.children].forEach((d, i) => d.classList.toggle("is-on", i === idx));
    }
    function go(n) { idx = (n + pages.length) % pages.length; render(); }

    lb.open = function (proj) {
      pages = proj.pages || [];
      if (!pages.length) return;
      idx = 0;
      titleEl.textContent = proj.title || "";
      roleEl.textContent = proj.role || "";
      dotsEl.innerHTML = "";
      pages.forEach((p, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", "Page " + (i + 1));
        b.addEventListener("click", () => go(i));
        dotsEl.appendChild(b);
      });
      render();
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("uxlb-lock");
    };
    lb.close = function () {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("uxlb-lock");
      setTimeout(() => { if (!lb.classList.contains("is-open")) img.src = ""; }, 250);
    };

    prev.addEventListener("click", () => go(idx - 1));
    next.addEventListener("click", () => go(idx + 1));
    lb.querySelector(".uxlb__close").addEventListener("click", lb.close);
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("uxlb__stage")) lb.close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") lb.close();
      else if (e.key === "ArrowRight") go(idx + 1);
      else if (e.key === "ArrowLeft") go(idx - 1);
    });
    return lb;
  }

  /* ---- read the JSON manifest of project pages ---- */
  function manifest() {
    const el = document.getElementById("ux-data");
    if (!el) return {};
    try { return JSON.parse(el.textContent); } catch (e) { return {}; }
  }

  /* ---- pointer tilt ---- */
  function bindTilt(frame) {
    if (reduced || coarse) return;
    const wrap = frame.closest(".ux-framewrap") || frame;
    wrap.addEventListener("pointermove", (e) => {
      const r = frame.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = "rotateX(" + (-py * 6).toFixed(2) + "deg) rotateY(" + (px * 8).toFixed(2) + "deg) translateY(-4px)";
    });
    wrap.addEventListener("pointerleave", () => { frame.style.transform = ""; });
  }

  /* ---- reveals (fail-safe) ---- */
  function reveals(root) {
    const items = [...root.querySelectorAll(".reveal")];
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
    root.classList.add("ux--anim");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
    // safety: if IO never delivers (some embedded webviews), reveal everything
    setTimeout(() => items.forEach((el) => el.classList.add("is-in")), 1600);
  }

  function init() {
    const root = document.querySelector(".ux");
    if (!root || root.__uxInit) return;
    root.__uxInit = true;

    const data = manifest();
    const lb = buildLightbox();

    root.querySelectorAll("[data-ux-key]").forEach((card) => {
      const key = card.getAttribute("data-ux-key");
      const proj = data[key];
      const frame = card.querySelector(".ux-frame");
      if (frame) bindTilt(frame);
      if (!proj) return;
      const triggers = card.querySelectorAll("[data-ux-open]");
      (triggers.length ? triggers : [frame]).forEach((t) => {
        if (t) t.addEventListener("click", (e) => { e.preventDefault(); lb.open(proj); });
      });
    });

    reveals(root);
  }

  window.UX = { init };
  if (document.querySelector(".ux")) init();
})();
