/* Creative Direction studio wall — click a piece to zoom it large.
   The lightbox lives on <body> and survives SPA section swaps, so all of its
   state (list, index, active wall) hangs off the element, not a closure. */
(function () {
  const NS = "cdwlb";

  function buildLightbox() {
    let lb = document.querySelector("." + NS);
    if (lb) return lb;

    lb = document.createElement("div");
    lb.className = NS;
    lb.setAttribute("aria-hidden", "true");
    lb.innerHTML =
      '<button class="cdwlb__close" type="button" aria-label="Close">&#215;</button>' +
      '<button class="cdwlb__arrow cdwlb__prev" type="button" aria-label="Previous work">&#8249;</button>' +
      '<figure class="cdwlb__fig">' +
        '<img class="cdwlb__img" alt="">' +
        '<figcaption class="cdwlb__cap"></figcaption>' +
      "</figure>" +
      '<button class="cdwlb__arrow cdwlb__next" type="button" aria-label="Next work">&#8250;</button>';
    document.body.appendChild(lb);

    const imgEl = lb.querySelector(".cdwlb__img");
    const capEl = lb.querySelector(".cdwlb__cap");
    lb.__list = [];
    lb.__i = 0;

    lb.show = function (n) {
      const list = lb.__list;
      if (!list.length) return;
      lb.__i = (n + list.length) % list.length;
      const item = list[lb.__i];
      imgEl.src = item.full;
      imgEl.alt = item.client + " creative direction";
      capEl.textContent = item.client;
      [lb.__i + 1, lb.__i - 1].forEach((k) => {
        const p = new Image();
        p.src = list[(k + list.length) % list.length].full;
      });
    };
    lb.open = function (full) {
      const idx = lb.__list.findIndex((x) => x.full === full);
      lb.show(idx < 0 ? 0 : idx);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      if (lb.__wall) lb.__wall.classList.add("cdw--frozen");
      document.documentElement.classList.add("cdwlb-lock");
    };
    lb.close = function () {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      if (lb.__wall) lb.__wall.classList.remove("cdw--frozen");
      document.documentElement.classList.remove("cdwlb-lock");
    };

    lb.querySelector(".cdwlb__close").addEventListener("click", lb.close);
    lb.querySelector(".cdwlb__prev").addEventListener("click", (e) => { e.stopPropagation(); lb.show(lb.__i - 1); });
    lb.querySelector(".cdwlb__next").addEventListener("click", (e) => { e.stopPropagation(); lb.show(lb.__i + 1); });
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.classList.contains("cdwlb__fig")) lb.close();
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") lb.close();
      else if (e.key === "ArrowRight") lb.show(lb.__i + 1);
      else if (e.key === "ArrowLeft") lb.show(lb.__i - 1);
    });
    return lb;
  }

  function init() {
    const wall = document.querySelector(".cdw");
    if (!wall) return;
    const lb = buildLightbox();
    lb.__wall = wall;

    // (re)build the unique work list — tiles are doubled for the loop
    const list = [];
    const seen = new Set();
    wall.querySelectorAll(".cdw__tile").forEach((t) => {
      const full = t.getAttribute("data-full");
      if (!full || seen.has(full)) return;
      seen.add(full);
      list.push({ full, client: t.getAttribute("aria-label") || "" });
    });
    lb.__list = list;

    // each SPA swap injects a fresh wall element, so bind on the new one
    if (!wall.__cdwBound) {
      wall.__cdwBound = true;
      wall.addEventListener("click", (e) => {
        const tile = e.target.closest(".cdw__tile");
        if (!tile) return;
        e.preventDefault();
        lb.open(tile.getAttribute("data-full"));
      });
    }
  }

  window.CDWall = { init };
  if (document.querySelector(".cdw")) init();
})();
