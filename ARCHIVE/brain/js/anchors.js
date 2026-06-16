/* In-page anchor links (the wins, the case-study index) point at on-page ids
   like #killer. Because the page sets <base href="/brain/">, the browser would
   resolve #killer to /brain/#killer and jump to the home page. This intercepts
   those clicks and smooth-scrolls to the section instead. Idempotent for SPA. */
(function () {
  function onClick(e) {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const i = href.indexOf("#");
    const id = i >= 0 ? href.slice(i + 1) : "";
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;            // not an on-page target; leave it alone
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function init() {
    const scope = document.querySelector(".work");
    if (!scope || scope.__anchorsBound) return;
    scope.__anchorsBound = true;
    scope.addEventListener("click", onClick);
  }
  window.Anchors = { init };
  if (document.querySelector(".work")) init();
})();
