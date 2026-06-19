/* brain-cross.js — hemisphere switch on interior pages (DEV).
   Click the brain to cross to the other hemisphere. The brain is one continuous
   element the whole time (no reload): content fades, the brain drains to the
   plain engraving, glides across, re-colours on the far side, and that side's
   first page (AI Systems / Copywriting) swaps in underneath. A full-screen veil
   crossfades the cream<->dark background while the plain brain travels over it.

   Falls back to a normal navigation when reduced-motion is set, WebGL/brain is
   absent, or anything throws — so the link always works. */
(function () {
  var body = document.body;
  if (!body.classList.contains("interior")) return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LEFT_FIRST = "ai-systems.html";       // first page of the tech (left) side
  var RIGHT_FIRST = "copywriting.html";     // first page of the creative (right) side
  // content scripts each landing page needs that aren't already on every interior page
  var SIDE_SCRIPTS = {
    left:  ["js/skill-cloud.js?v=40", "js/tw-viewer.js?v=40"],
    right: ["js/work-lightbox.js?v=40", "js/work-flipbook.js?v=40", "js/cw-bears.js?v=40", "js/anchors.js?v=40"],
  };
  // the destination side's stylesheet must be present or the swapped content is unstyled
  var SIDE_CSS = {
    left:  ["css/ai.css?v=42"],     // AI Systems = dark tech theme
    right: ["css/work.css?v=40"],   // Copywriting = creative work theme
  };

  var brain = document.querySelector(".brain--float");
  var pageContent = document.querySelector(".page__content");
  var barNav = document.querySelector(".bar__nav");
  if (!brain || !pageContent) return;

  var busy = false;
  var curSide = function () { return body.classList.contains("interior--left") ? "left" : "right"; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // ── hover label + make the brain interactive ─────────────────────────────
  var label = document.createElement("span");
  label.className = "brain-cross__label";
  brain.appendChild(label);
  var setLabel = function () { label.textContent = curSide() === "left" ? "Go Right Brain" : "Go Left Brain"; };
  setLabel();
  brain.classList.add("brain-cross__hot");

  // ── helpers ──────────────────────────────────────────────────────────────
  function loadScript(src) {
    return new Promise(function (res) {
      var bare = src.split("?")[0];
      if ([].some.call(document.scripts, function (s) { return s.src.indexOf(bare) > -1; })) return res();
      var el = document.createElement("script");
      el.src = src; el.defer = false; el.onload = res; el.onerror = res;
      document.body.appendChild(el);
    });
  }
  function loadSide(side) { return Promise.all((SIDE_SCRIPTS[side] || []).map(loadScript)); }
  function loadCSS(href) {
    return new Promise(function (res) {
      var bare = href.split("?")[0];
      if ([].some.call(document.querySelectorAll("link[rel=stylesheet]"), function (l) { return l.href.indexOf(bare) > -1; })) return res();
      var el = document.createElement("link"); el.rel = "stylesheet"; el.href = href;
      el.onload = res; el.onerror = res; document.head.appendChild(el);
    });
  }
  function loadSideCSS(side) { return Promise.all((SIDE_CSS[side] || []).map(loadCSS)); }

  function initContentScripts() {
    ["CDWall", "CDGallery", "Flipbook", "WorkFlipbook", "WorkLightbox", "CWBears",
     "WritingReader", "Anchors", "TWCanvas", "TWViewer", "SkillCloud", "UX"].forEach(function (k) {
      try { if (window[k] && typeof window[k].init === "function") window[k].init(); } catch (e) {}
    });
  }

  async function fetchPage(href) {
    var res = await fetch(href, { credentials: "same-origin" });
    var doc = new DOMParser().parseFromString(await res.text(), "text/html");
    var pageCls = (doc.body.className.match(/page-[a-z0-9-]+/) || [""])[0];
    return {
      content: (doc.querySelector(".page__content") || {}).innerHTML || "",
      nav: (doc.querySelector(".bar__nav") || {}).innerHTML || "",
      title: doc.title,
      pageClass: pageCls,
      sideRaw: doc.querySelector("[data-brain]") ? doc.querySelector("[data-brain]").getAttribute("data-side") : null,
    };
  }

  // ── the cross ──────────────────────────────────────────────────────────────
  async function cross() {
    if (busy) return;
    var to = curSide() === "left" ? "right" : "left";
    var href = to === "left" ? LEFT_FIRST : RIGHT_FIRST;

    if (reduced) { location.href = href; return; }   // no animation: just go
    busy = true;

    // build the background crossfade veil (destination bg), brain rides above it
    var veil = document.createElement("div");
    veil.className = "brain-cross__veil";
    veil.style.background = to === "left"
      ? "radial-gradient(125% 125% at 50% 38%, #3a414e 0%, #262b33 100%)"
      : "radial-gradient(120% 120% at 50% 42%, #f2efe9 0%, #e2ddd2 100%)";
    document.body.appendChild(veil);

    body.classList.add("brain-crossing");           // lifts brain above veil, fades content
    requestAnimationFrame(function () { veil.classList.add("in"); }); // veil fades in (covers bg+content)

    // drain the brain colour to the plain engraving
    if (window.__ibrain) { window.__ibrain.colorSpeed(0.06); window.__ibrain.sides(0, 0); }

    // fetch destination + its scripts while the veil covers
    var data;
    try { data = await Promise.all([fetchPage(href), loadSide(to), loadSideCSS(to)]).then(function (a) { return a[0]; }); }
    catch (e) { location.href = href; return; }

    await wait(520);  // veil opaque + colour drained → safe to flip + swap under cover

    // glide the brain across (class flip drives the dock transform; .sliding animates it)
    brain.classList.add("sliding");
    body.classList.toggle("theme-tech", to === "left");
    body.classList.toggle("interior--left", to === "left");
    body.classList.toggle("interior--right", to === "right");
    body.className = body.className.replace(/\bpage-[a-z0-9-]+\b/g, "").replace(/\s+/g, " ").trim();
    if (data.pageClass) body.classList.add(data.pageClass);

    // swap destination content + nav + title (hidden under the veil)
    pageContent.innerHTML = data.content;
    pageContent.scrollTop = 0;
    if (barNav && data.nav) barNav.innerHTML = data.nav;
    if (data.title) document.title = data.title;
    initContentScripts();
    setLabel();
    try { history.pushState({ cross: to }, "", href); } catch (e) {}

    await wait(780);  // brain finishes the glide to the far dock

    // re-colour on the far side
    if (window.__ibrain) { window.__ibrain.colorSpeed(0.05); window.__ibrain.sides(to === "left" ? 1 : 0, to === "right" ? 1 : 0); }

    await wait(360);  // colour begins flooding back, then reveal the page

    veil.classList.remove("in");                    // lift the veil → reveal swapped page
    body.classList.remove("brain-crossing");
    await wait(560);
    veil.remove();
    brain.classList.remove("sliding");
    busy = false;
  }

  // click the brain (or its label) to cross
  brain.addEventListener("click", function (e) { e.preventDefault(); cross(); });

  // back/forward: a cross changed the URL without a load — restore by reloading
  window.addEventListener("popstate", function () { location.reload(); });
})();
