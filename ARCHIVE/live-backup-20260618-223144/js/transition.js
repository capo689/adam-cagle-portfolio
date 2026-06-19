/* transition.js — tech-side page-to-page curtain.
   On a same-origin link click, slide the blue curtain down to cover (masking
   the brain re-init), then navigate. Arrival reveal is handled by CSS so the
   page is never left covered if this script does not run. */
(function () {
  const body = document.body;
  if (!body.classList.contains("interior")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // arrival: pin the curtain open once the reveal finishes, with a timeout
  // backstop so a missed CSS animation never leaves the page covered
  const xf = document.querySelector(".xfade");
  if (xf) {
    const open = () => xf.classList.add("x-open");
    xf.addEventListener("animationend", open, { once: true });
    setTimeout(open, 1000);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") || "";
    if (!href || href[0] === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // same-page anchor
    e.preventDefault();
    if (body.classList.contains("xfade-cover")) return;
    body.classList.add("xfade-cover");
    setTimeout(() => { location.href = a.href; }, 470);
  });
})();
