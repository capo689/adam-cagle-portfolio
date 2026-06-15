/* work-flipbook.js — Hotel Figueroa brand book, realistic 3D page turn.
   A leaf (two-faced sheet) rotates around the spine to reveal the next spread,
   with a sweeping shadow for depth. Lives in the fullscreen lightbox viewer
   with prev / next / close + keyboard. Re-initializable: WorkFlipbook.init().
   Vanilla, no libraries. */
(function () {
  // spreads: [leftPageNum, rightPageNum]; cover sits alone on the right
  const spreads = [[null, 62]];
  for (let f = 63; f <= 122; f += 2) spreads.push([f, f + 1 <= 122 ? f + 1 : null]);
  const total = spreads.length;

  let cur = 0, flipping = false, aspect = 0.72, keysBound = false, sized = false;
  let viewer, book, leftSide, rightSide, counter;

  const src = (n) => (n == null ? "" : `/img/HF/HotelFigueroa%20${n}.jpeg`);
  function setFace(el, n) {
    if (n == null) { el.style.backgroundImage = "none"; el.classList.add("blank"); }
    else { el.style.backgroundImage = `url("${src(n)}")`; el.classList.remove("blank"); }
  }

  function sizeBook() {
    const maxH = window.innerHeight - 150;
    const maxW = window.innerWidth - 110;
    let h = Math.max(240, maxH), w = h * aspect * 2;
    if (w > maxW) { w = maxW; h = (w / 2) / aspect; }
    book.style.width = w + "px";
    book.style.height = h + "px";
    book.style.setProperty("--pw", (w / 2) + "px");
    book.style.setProperty("--ph", h + "px");
  }

  function label(i) { return i === 0 ? "Cover" : i === total - 1 ? "Back Cover" : `Spread ${i} of ${total - 1}`; }
  function render() {
    setFace(leftSide, spreads[cur][0]);
    setFace(rightSide, spreads[cur][1]);
    counter.textContent = `${label(cur)}  ·  ${cur + 1} / ${total}`;
    [cur - 1, cur + 1].forEach((i) => { if (i >= 0 && i < total) spreads[i].forEach((n) => { if (n != null) new Image().src = src(n); }); });
  }

  function preloadAll() {
    spreads.forEach((s) => s.forEach((n) => { if (n != null) { const i = new Image(); i.src = src(n); } }));
  }

  function flip(dir) {
    if (flipping) return;
    const ni = cur + dir;
    if (ni < 0 || ni >= total) return;
    flipping = true;

    const fwd = dir > 0;
    const frontN  = fwd ? spreads[cur][1] : spreads[cur][0];   // current outer page (leaf front)
    const backN   = fwd ? spreads[ni][0]  : spreads[ni][1];    // next inner page (leaf back)
    const revealSide = fwd ? rightSide : leftSide;             // page uncovered as the leaf lifts
    const revealN    = fwd ? spreads[ni][1] : spreads[ni][0];

    // 1) leaf starts flat over the page it will turn, showing the CURRENT page
    //    (identical to what's already there, so nothing changes on screen)
    const leaf = document.createElement("div");
    leaf.className = "hf-leaf " + (fwd ? "fwd" : "bwd");
    leaf.innerHTML =
      `<div class="hf-face hf-front"></div><div class="hf-face hf-back"></div><div class="hf-shade"></div>`;
    setFace(leaf.querySelector(".hf-front"), frontN);
    setFace(leaf.querySelector(".hf-back"), backN);
    leaf.style.transform = "rotateY(0deg)";
    book.appendChild(leaf);

    // 2) commit the leaf covering the page, THEN swap the page behind it
    //    (so the destination never flashes in the margin before the turn)
    void leaf.offsetWidth;
    setFace(revealSide, revealN);

    // 3) enable the transition and turn — one continuous motion
    void leaf.offsetWidth;
    leaf.classList.add("turning");
    leaf.style.transform = `rotateY(${fwd ? -180 : 180}deg)`;

    let done = false;
    const finish = () => {
      if (done) return; done = true;
      cur = ni; render();
      if (leaf.parentNode) leaf.parentNode.removeChild(leaf);
      flipping = false;
    };
    leaf.addEventListener("transitionend", (e) => { if (e.propertyName === "transform") finish(); }, { once: true });
    setTimeout(finish, 1200); // failsafe
  }

  function openViewer() {
    if (!sized) { sizeBook(); sized = true; }
    preloadAll();
    cur = 0; render();
    viewer.classList.add("open"); viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("lb-open");
    setTimeout(() => viewer.classList.add("visible"), 20);  // timer, not rAF (survives bg tabs)
  }
  function closeViewer() {
    viewer.classList.remove("open", "visible"); viewer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lb-open");
  }

  function init() {
    const cover = document.getElementById("hf-cover");
    viewer = document.getElementById("hf-viewer");
    if (!cover || !viewer) return;
    book = document.getElementById("hf-book");
    leftSide = viewer.querySelector(".hf-left");
    rightSide = viewer.querySelector(".hf-right");
    counter = document.getElementById("hf-counter");
    sized = false;

    // measure the real page aspect once, then (re)size if open
    const probe = new Image();
    probe.onload = () => { if (probe.naturalWidth) { aspect = probe.naturalWidth / probe.naturalHeight; if (viewer.classList.contains("open")) { sizeBook(); render(); } } };
    probe.src = src(63);

    cover.addEventListener("click", openViewer);
    viewer.querySelector(".hf-close-btn").addEventListener("click", closeViewer);
    viewer.querySelector(".hf-prev").addEventListener("click", (e) => { e.stopPropagation(); flip(-1); });
    viewer.querySelector(".hf-next").addEventListener("click", (e) => { e.stopPropagation(); flip(1); });
    viewer.addEventListener("click", (e) => { if (e.target === viewer || e.target.classList.contains("hf-stage")) closeViewer(); });

    if (!keysBound) {
      keysBound = true;
      window.addEventListener("resize", () => { if (viewer && viewer.classList.contains("open")) sizeBook(); });
      document.addEventListener("keydown", (e) => {
        const v = document.getElementById("hf-viewer");
        if (!v || !v.classList.contains("open")) return;
        if (e.key === "Escape") closeViewer();
        else if (e.key === "ArrowLeft") flip(-1);
        else if (e.key === "ArrowRight") flip(1);
      });
    }
  }

  window.WorkFlipbook = { init };
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
