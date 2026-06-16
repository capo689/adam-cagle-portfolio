/* flipbook.js — generic realistic 3D page-turn, ported from the Figueroa book.
   Any element with [data-flipbook] and data-pages="url|url|..." opens a book.
   One viewer lives on <body> and survives SPA swaps; state hangs off it.
   Call Flipbook.init() after content is injected to (re)bind triggers. */
(function () {
  function build() {
    let fb = document.querySelector(".fb");
    if (fb) return fb;
    fb = document.createElement("div");
    fb.className = "fb";
    fb.setAttribute("aria-hidden", "true");
    fb.innerHTML =
      '<button class="fb-btn fb-close" type="button" aria-label="Close">&#215;</button>' +
      '<button class="fb-btn fb-prev" type="button" aria-label="Previous">&#8249;</button>' +
      '<button class="fb-btn fb-next" type="button" aria-label="Next">&#8250;</button>' +
      '<div class="fb-stage"><div class="fb-book"><div class="fb-side fb-left"></div><div class="fb-side fb-right"></div></div></div>' +
      '<div class="fb-counter"></div>';
    document.body.appendChild(fb);

    const stage = fb.querySelector(".fb-stage");
    const book = fb.querySelector(".fb-book");
    const leftSide = fb.querySelector(".fb-left");
    const rightSide = fb.querySelector(".fb-right");
    const counter = fb.querySelector(".fb-counter");
    fb.__pages = []; fb.__spreads = []; fb.__cur = 0; fb.__aspect = 0.7; fb.__flipping = false;

    const src = (n) => (n == null ? "" : fb.__pages[n]);
    function setFace(el, n) {
      if (n == null) { el.style.backgroundImage = "none"; el.classList.add("blank"); }
      else { el.style.backgroundImage = `url("${src(n)}")`; el.classList.remove("blank"); }
    }
    function sizeBook() {
      const narrow = window.innerWidth < 760;
      const padX = narrow ? 16 : 72, chrome = narrow ? 120 : 150;
      const maxW = Math.max(220, window.innerWidth - padX * 2);
      const maxH = Math.max(220, window.innerHeight - chrome);
      let w = maxW, h = (w / 2) / fb.__aspect;
      if (h > maxH) { h = maxH; w = h * fb.__aspect * 2; }
      stage.style.perspective = Math.round(w * 1.6) + "px";
      book.style.width = w + "px"; book.style.height = h + "px";
      book.style.setProperty("--pw", (w / 2) + "px");
      book.style.setProperty("--ph", h + "px");
    }
    function render() {
      const s = fb.__spreads, cur = fb.__cur;
      setFace(leftSide, s[cur][0]); setFace(rightSide, s[cur][1]);
      counter.textContent = (cur === 0 ? "Cover" : cur === s.length - 1 ? "Back" : `Spread ${cur} of ${s.length - 1}`) + `  ·  ${cur + 1} / ${s.length}`;
      [cur - 1, cur + 1].forEach((i) => { if (i >= 0 && i < s.length) s[i].forEach((n) => { if (n != null) new Image().src = src(n); }); });
    }
    function flip(dir) {
      if (fb.__flipping) return;
      const s = fb.__spreads, cur = fb.__cur, ni = cur + dir;
      if (ni < 0 || ni >= s.length) return;
      fb.__flipping = true;
      const fwd = dir > 0;
      const frontN = fwd ? s[cur][1] : s[cur][0];
      const backN = fwd ? s[ni][0] : s[ni][1];
      const revealSide = fwd ? rightSide : leftSide;
      const revealN = fwd ? s[ni][1] : s[ni][0];
      const leaf = document.createElement("div");
      leaf.className = "fb-leaf " + (fwd ? "fwd" : "bwd");
      leaf.innerHTML = '<div class="fb-face fb-front"></div><div class="fb-face fb-back"></div><div class="fb-shade"></div>';
      setFace(leaf.querySelector(".fb-front"), frontN);
      setFace(leaf.querySelector(".fb-back"), backN);
      leaf.style.transform = "rotateY(0deg)";
      book.appendChild(leaf);
      void leaf.offsetWidth; setFace(revealSide, revealN);
      void leaf.offsetWidth; leaf.classList.add("turning");
      leaf.style.transform = `rotateY(${fwd ? -180 : 180}deg)`;
      let done = false;
      const finish = () => { if (done) return; done = true; fb.__cur = ni; render(); if (leaf.parentNode) leaf.parentNode.removeChild(leaf); fb.__flipping = false; };
      leaf.addEventListener("transitionend", (e) => { if (e.propertyName === "transform") finish(); }, { once: true });
      setTimeout(finish, 1200);
    }
    fb.open = function (pages) {
      if (!pages || !pages.length) return;
      fb.__pages = pages;
      const sp = [[null, 0]];
      for (let i = 1; i < pages.length; i += 2) sp.push([i, i + 1 < pages.length ? i + 1 : null]);
      fb.__spreads = sp; fb.__cur = 0;
      const probe = new Image();
      probe.onload = () => { if (probe.naturalWidth) { fb.__aspect = probe.naturalWidth / probe.naturalHeight; if (fb.classList.contains("open")) { sizeBook(); render(); } } };
      probe.src = pages[0];
      pages.forEach((u) => { const i = new Image(); i.src = u; });
      sizeBook(); render();
      fb.classList.add("open"); fb.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("fb-lock");
      setTimeout(() => fb.classList.add("visible"), 20);
    };
    fb.close = function () {
      fb.classList.remove("open", "visible"); fb.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("fb-lock");
    };
    fb.querySelector(".fb-close").addEventListener("click", fb.close);
    fb.querySelector(".fb-prev").addEventListener("click", (e) => { e.stopPropagation(); flip(-1); });
    fb.querySelector(".fb-next").addEventListener("click", (e) => { e.stopPropagation(); flip(1); });
    fb.addEventListener("click", (e) => { if (e.target === fb || e.target === stage) fb.close(); });
    window.addEventListener("resize", () => { if (fb.classList.contains("open")) sizeBook(); });
    document.addEventListener("keydown", (e) => {
      if (!fb.classList.contains("open")) return;
      if (e.key === "Escape") fb.close();
      else if (e.key === "ArrowLeft") flip(-1);
      else if (e.key === "ArrowRight") flip(1);
    });
    return fb;
  }

  function init() {
    const triggers = document.querySelectorAll("[data-flipbook]");
    if (!triggers.length) return;
    const fb = build();
    triggers.forEach((t) => {
      if (t.__fbBound) return;
      t.__fbBound = true;
      t.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const pages = (t.getAttribute("data-pages") || "").split("|").map((s) => s.trim()).filter(Boolean);
        fb.open(pages);
      });
    });
  }

  window.Flipbook = { init };
  if (document.querySelector("[data-flipbook]")) init();
})();
