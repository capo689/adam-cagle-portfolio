/* Creative Direction studio wall — built from the full work manifest.
   Order is shuffled every load; images lazy-load as the reel scrolls; clicking
   a piece flies it to the centre (GSAP) instead of popping. The AMD comic tile
   opens the 3D flipbook. Idempotent: CDWall.init() rebuilds after SPA swaps. */
(function () {
  const GS = () => (typeof gsap !== "undefined" ? gsap : null);

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ── lazy image loader: set src from data-src as tiles approach view ── */
  let io;
  function lazyObserver() {
    if (io) return io;
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const img = e.target, ds = img.getAttribute("data-src");
        if (ds) { img.src = ds; img.removeAttribute("data-src"); }
        io.unobserve(img);
      });
    }, { root: null, rootMargin: "300px 1200px", threshold: 0.01 });
    return io;
  }

  /* ── lightbox with a fly-to-centre open/close ── */
  function buildLB() {
    let lb = document.querySelector(".cdwlb");
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "cdwlb";
    lb.setAttribute("aria-hidden", "true");
    lb.innerHTML =
      '<button class="cdwlb__close" type="button" aria-label="Close">&#215;</button>' +
      '<button class="cdwlb__arrow cdwlb__prev" type="button" aria-label="Previous">&#8249;</button>' +
      '<figure class="cdwlb__fig"><img class="cdwlb__img" alt=""><figcaption class="cdwlb__cap"></figcaption></figure>' +
      '<button class="cdwlb__arrow cdwlb__next" type="button" aria-label="Next">&#8250;</button>';
    document.body.appendChild(lb);
    const imgEl = lb.querySelector(".cdwlb__img");
    const capEl = lb.querySelector(".cdwlb__cap");
    lb.__list = []; lb.__i = 0; lb.__wall = null; lb.__tile = null; lb.__animating = false;

    function targetRect(aspect) {
      const maxW = innerWidth * 0.9, maxH = innerHeight * 0.82;
      let w = maxW, h = w / aspect;
      if (h > maxH) { h = maxH; w = h * aspect; }
      return { w, h, x: (innerWidth - w) / 2, y: (innerHeight - h) / 2 };
    }
    function paint(i) {
      lb.__i = (i + lb.__list.length) % lb.__list.length;
      const it = lb.__list[lb.__i];
      imgEl.src = it.s; imgEl.alt = it.l; capEl.textContent = it.l;
    }
    lb.show = function (i) {                 // prev/next: quick crossfade
      const g = GS();
      if (g) { g.to(imgEl, { opacity: 0, duration: .12, onComplete: () => { paint(i); g.fromTo(imgEl, { opacity: 0 }, { opacity: 1, duration: .22 }); } }); }
      else paint(i);
    };
    lb.openFromTile = function (tile) {
      if (lb.__animating) return;
      const srcImg = tile.querySelector("img");
      if (!srcImg) return;
      if (!srcImg.getAttribute("src") && srcImg.dataset.src) srcImg.src = srcImg.dataset.src;
      const full = tile.getAttribute("data-full");
      const idx = lb.__list.findIndex((x) => x.s === full);
      lb.__tile = tile;
      if (lb.__wall) lb.__wall.classList.add("cdw--frozen");
      document.documentElement.classList.add("cdwlb-lock");
      paint(idx < 0 ? 0 : idx);
      const r = srcImg.getBoundingClientRect();
      const aspect = r.width / r.height || 1;
      const t = targetRect(aspect);
      const g = GS();
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
      if (!g) { imgEl.style.opacity = 1; return; }
      lb.__animating = true;
      imgEl.style.opacity = 0;
      const clone = document.createElement("img");
      clone.src = srcImg.currentSrc || srcImg.src;
      Object.assign(clone.style, { position: "fixed", top: r.top + "px", left: r.left + "px", width: r.width + "px", height: r.height + "px", objectFit: "cover", borderRadius: "3px", zIndex: 10001, margin: 0, pointerEvents: "none", boxShadow: "0 40px 80px -30px rgba(0,0,0,.6)" });
      document.body.appendChild(clone);
      g.to(clone, { top: t.y, left: t.x, width: t.w, height: t.h, duration: .55, ease: "power3.inOut", onComplete: () => { imgEl.style.opacity = 1; if (clone.parentNode) clone.remove(); lb.__animating = false; } });
    };
    lb.close = function () {
      if (lb.__animating) return;
      const g = GS();
      const tile = lb.__tile;
      const finish = () => { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); if (lb.__wall) lb.__wall.classList.remove("cdw--frozen"); document.documentElement.classList.remove("cdwlb-lock"); imgEl.style.opacity = ""; };
      if (!g || !tile || !document.body.contains(tile)) { finish(); return; }
      const ir = imgEl.getBoundingClientRect();
      const tr = tile.querySelector("img").getBoundingClientRect();
      lb.__animating = true;
      imgEl.style.opacity = 0;
      const clone = document.createElement("img");
      clone.src = imgEl.src;
      Object.assign(clone.style, { position: "fixed", top: ir.top + "px", left: ir.left + "px", width: ir.width + "px", height: ir.height + "px", objectFit: "cover", borderRadius: "3px", zIndex: 10001, margin: 0, pointerEvents: "none" });
      document.body.appendChild(clone);
      lb.classList.add("is-closing");
      g.to(clone, { top: tr.top + "px", left: tr.left + "px", width: tr.width + "px", height: tr.height + "px", duration: .45, ease: "power3.inOut", onComplete: () => { if (clone.parentNode) clone.remove(); lb.classList.remove("is-closing"); finish(); lb.__animating = false; } });
    };
    lb.querySelector(".cdwlb__close").addEventListener("click", lb.close);
    lb.querySelector(".cdwlb__prev").addEventListener("click", (e) => { e.stopPropagation(); lb.show(lb.__i - 1); });
    lb.querySelector(".cdwlb__next").addEventListener("click", (e) => { e.stopPropagation(); lb.show(lb.__i + 1); });
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("cdwlb__fig")) lb.close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") lb.close();
      else if (e.key === "ArrowRight") lb.show(lb.__i + 1);
      else if (e.key === "ArrowLeft") lb.show(lb.__i - 1);
    });
    return lb;
  }

  /* ── build the reel from the shuffled manifest ── */
  function tileEl(t) {
    const b = document.createElement("button");
    b.className = "cdw__tile";
    b.setAttribute("data-full", t.s);
    b.setAttribute("aria-label", t.l);
    b.innerHTML = `<img data-src="${t.s}" alt="${t.l} creative direction" decoding="async" style="aspect-ratio:${t.w}/${t.h}"><span class="cdw__name">${t.l}</span>`;
    return b;
  }
  function bearEl(n) {
    const s = document.createElement("span");
    s.className = "cdw__bear"; s.setAttribute("aria-hidden", "true");
    s.innerHTML = `<img data-src="/DEV/img/cd/bears/bear${n}.png" alt="" decoding="async">`;
    return s;
  }
  function amdEl() {
    const pages = (window.CD_AMD || []);
    const b = document.createElement("button");
    b.className = "cdw__tile cdw__tile--book";
    b.setAttribute("data-flipbook", "");
    b.setAttribute("data-pages", pages.join("|"));
    b.setAttribute("aria-label", "AMD Comic-Con book");
    b.innerHTML = `<img data-src="${pages[0]}" alt="AMD Comic-Con comic book" decoding="async" style="aspect-ratio:517/800"><span class="cdw__name">AMD &middot; Comic-Con</span>`;
    return b;
  }

  function init() {
    const wall = document.querySelector(".cdw");
    if (!wall || wall.dataset.built === "1") return;
    const tiles = (window.CD_TILES || []).slice();
    if (!tiles.length) return;
    wall.dataset.built = "1";

    const lb = buildLB();
    lb.__wall = wall;
    const shuffled = shuffle(tiles.slice());
    lb.__list = shuffled;

    const rowcls = ["cdw__row--a", "cdw__row--b", "cdw__row--c"];
    const rows = [[], [], []];
    shuffled.forEach((t, i) => rows[i % 3].push(t));

    let bear = 1;
    rows.forEach((items, ri) => {
      const frag = document.createDocumentFragment();
      items.forEach((t, i) => {
        frag.appendChild(tileEl(t));
        if (i % 5 === 4) { frag.appendChild(bearEl(((bear++ - 1) % 11) + 1)); }
      });
      if (ri === 0) frag.insertBefore(amdEl(), frag.children[2] || null);
      const track = document.createElement("div");
      track.className = "cdw__track";
      track.appendChild(frag.cloneNode(true));   // two identical halves → seamless loop
      track.appendChild(frag);
      const row = document.createElement("div");
      row.className = "cdw__row " + rowcls[ri];
      row.appendChild(track);
      wall.appendChild(row);
    });

    // lazy-load every tile/bear image as it nears the viewport
    const obs = lazyObserver();
    wall.querySelectorAll("img[data-src]").forEach((img) => obs.observe(img));

    // delegated click → fly-zoom (skip the flipbook tile; that is flipbook.js)
    if (!wall.__cdwBound) {
      wall.__cdwBound = true;
      wall.addEventListener("click", (e) => {
        const tile = e.target.closest(".cdw__tile");
        if (!tile || tile.hasAttribute("data-flipbook") || !tile.getAttribute("data-full")) return;
        e.preventDefault();
        lb.openFromTile(tile);
      });
    }
  }

  window.CDWall = { init };
  if (document.querySelector(".cdw")) init();
})();
