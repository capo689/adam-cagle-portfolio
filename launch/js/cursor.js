/* cursor.js — precise reticle cursor. A thin crosshair that tracks the pointer
   exactly (no lag, no trail), and snaps into a corner-bracket target with a label
   over anything clickable. Desktop fine-pointer only; bails on touch / reduced
   motion. Works with SPA-injected content (state resolved per event via closest()). */
(function () {
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(pointer: coarse)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.documentElement.classList.add("has-cursor");
  const cur = document.createElement("div"); cur.className = "cur";
  cur.innerHTML =
    '<span class="cur-in">' +
      '<i class="cur-t"></i><i class="cur-b"></i><i class="cur-l"></i><i class="cur-r"></i>' +
      '<i class="cur-d"></i>' +
      '<span class="cur-fr"><i></i><i></i><i></i><i></i></span>' +
      '<span class="cur-lb"></span>' +
    '</span>';
  document.body.appendChild(cur);
  const label = cur.querySelector(".cur-lb");

  let mx = innerWidth / 2, my = innerHeight / 2, raf = 0;
  function place() { cur.style.transform = "translate(" + mx + "px," + my + "px)"; raf = 0; }
  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(place); }, { passive: true });
  addEventListener("pointerdown", () => cur.classList.add("press"));
  addEventListener("pointerup", () => cur.classList.remove("press"));
  document.addEventListener("mouseleave", () => cur.classList.add("hide"));
  document.addEventListener("mouseenter", () => cur.classList.remove("hide"));

  const VIEW = '.ux-tile, .tw-card, .cdw__tile, .cdw__tile--book, .work-cover, .hf-cover-wrap, .skill-view, [data-skill-view], [data-paper], [data-ux-open], [data-flip], [data-cursor="view"], .sample-card';
  function resolve(t) {
    if (!t || !t.closest) return null;
    if (t.closest('a[href^="mailto:"]')) return ["email", "Email"];
    if (t.closest(VIEW)) return ["view", "View"];
    if (t.closest('a[target="_blank"]')) return ["ext", "Open"];
    if (t.closest('a[href], button, summary, label, .stack, [data-stack], [role="button"], input, textarea, select')) return ["link", ""];
    return null;
  }
  function apply(s) {
    if (s) { cur.classList.add("on"); cur.dataset.state = s[0]; label.textContent = s[1]; }
    else { cur.classList.remove("on"); cur.removeAttribute("data-state"); label.textContent = ""; }
  }
  addEventListener("pointerover", (e) => apply(resolve(e.target)), { passive: true });
  addEventListener("pointerout", (e) => { if (!e.relatedTarget) apply(null); }, { passive: true });
})();
