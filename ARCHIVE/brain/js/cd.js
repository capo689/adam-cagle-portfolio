/* cd.js — Creative Direction gallery. The cursor maps directly to whatever tile
   it's over: that piece fills the space behind the grid while every other tile
   fades to a ghost. Roll across to change pieces; roll off the grid to reset.
   Re-initializable for the SPA. */
(function () {
  let bound = false;

  function init() {
    const cdg = document.querySelector(".cdg");
    const grid = cdg && cdg.querySelector(".cdg__grid");
    const takeover = cdg && cdg.querySelector(".cdg__takeover");
    if (!cdg || !grid || !takeover) return;
    const big = takeover.querySelector(".cdg__big");
    const client = takeover.querySelector(".cdg__client");
    const tiles = Array.from(grid.querySelectorAll(".cdg__tile"));

    tiles.forEach((t) => { const f = t.getAttribute("data-full"); if (f) { const i = new Image(); i.src = f; } });

    let active = null;
    function show(tile) {
      if (!tile || tile === active) return;
      if (active) active.classList.remove("on");
      active = tile;
      tile.classList.add("on");
      big.style.backgroundImage = `url("${tile.getAttribute("data-full")}")`;
      client.textContent = tile.getAttribute("data-client") || "";
      cdg.classList.add("is-active");
    }
    function hide() {
      cdg.classList.remove("is-active");
      if (active) { active.classList.remove("on"); active = null; }
    }

    // map the cursor position to the tile under it (handles rolling between tiles)
    grid.addEventListener("pointermove", (e) => {
      const t = e.target.closest(".cdg__tile");
      if (t) show(t);
    });
    grid.addEventListener("pointerleave", hide);

    // keyboard
    tiles.forEach((t) => t.addEventListener("focus", () => show(t)));
    // touch: tap a tile to feature it, tap again (or the active one) to clear
    tiles.forEach((t) => t.addEventListener("click", (e) => { e.preventDefault(); active === t ? hide() : show(t); }));

    if (!bound) {
      bound = true;
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
    }
  }

  window.CDGallery = { init };
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
