/* cd.js — Creative Direction gallery. Hover/tap a tile -> the full piece takes
   over the content area; the brain stays docked. Re-initializable for the SPA. */
(function () {
  let bound = false;

  function init() {
    const grid = document.querySelector(".cdg__grid");
    const takeover = document.querySelector(".cdg__takeover");
    if (!grid || !takeover) return;
    const big = takeover.querySelector(".cdg__big");
    const client = takeover.querySelector(".cdg__client");
    const tiles = Array.from(grid.querySelectorAll(".cdg__tile"));

    // preload full images so the takeover never pops
    tiles.forEach((t) => { const f = t.getAttribute("data-full"); if (f) { const i = new Image(); i.src = f; } });

    function show(tile) {
      big.style.backgroundImage = `url("${tile.getAttribute("data-full")}")`;
      client.textContent = tile.getAttribute("data-client") || "";
      takeover.classList.add("show");
      takeover.setAttribute("aria-hidden", "false");
    }
    function hide() {
      takeover.classList.remove("show");
      takeover.setAttribute("aria-hidden", "true");
    }

    tiles.forEach((t) => {
      t.addEventListener("mouseenter", () => show(t));
      t.addEventListener("focus", () => show(t));
      t.addEventListener("click", (e) => { e.preventDefault(); show(t); });   // touch
    });
    grid.addEventListener("mouseleave", hide);

    if (!bound) {
      bound = true;
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
      // tap anywhere on the takeover dismisses it (touch)
      document.addEventListener("click", (e) => {
        const tk = document.querySelector(".cdg__takeover.show");
        if (tk && !e.target.closest(".cdg__tile")) hide();
      });
    }
  }

  window.CDGallery = { init };
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
