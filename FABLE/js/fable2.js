/* fable2.js · THE FULL STOP system + motion
   Brand rule: red belongs to the period, nothing else.
   Strictly additive: the page is complete and readable before this file runs,
   with JS disabled, and with reduced motion. Animations set their own "from"
   states at runtime, so nothing is ever hidden by default. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var still = window.location.search.indexOf("still") > -1;
  var noLenis = window.location.search.indexOf("nolenis") > -1;

  /* ── scroll velocity feed (used by the press shader) ── */
  var lastY = window.scrollY, lastT = performance.now();
  function pumpVel() {
    var now = performance.now(), y = window.scrollY;
    var dt = Math.max(now - lastT, 1);
    window.__pressVel = (y - lastY) / dt * 16.7;
    lastY = y; lastT = now;
    requestAnimationFrame(pumpVel);
  }
  if (!reduced && !still) requestAnimationFrame(pumpVel);

  /* ── book reader (works without GSAP, not without JS: arrows are
        enhancements; the strip itself is native scroll) ── */
  document.querySelectorAll("[data-book]").forEach(function (book) {
    var strip = book.querySelector(".book__strip");
    var pages = strip ? strip.querySelectorAll("figure").length : 0;
    var num = book.querySelector("[data-book-num]");
    if (!strip) return;

    function pageWidth() {
      var fig = strip.querySelector("figure");
      return fig ? fig.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).gap || 0) : 0;
    }
    function current() {
      return Math.min(pages, Math.max(1, Math.round(strip.scrollLeft / pageWidth()) + 1));
    }
    function go(dir) {
      strip.scrollBy({ left: dir * pageWidth(), behavior: reduced ? "auto" : "smooth" });
    }
    book.querySelectorAll("[data-book-prev]").forEach(function (b) {
      b.addEventListener("click", function () { go(-1); });
    });
    book.querySelectorAll("[data-book-next]").forEach(function (b) {
      b.addEventListener("click", function () { go(1); });
    });
    strip.addEventListener("scroll", function () {
      if (num) num.textContent = String(current()).padStart(2, "0");
    }, { passive: true });
    document.addEventListener("keydown", function (e) {
      var r = book.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
  });

  if (reduced || still) return;

  /* ── the period cursor (fine pointers only) ── */
  if (!coarse) {
    var dot = document.createElement("div");
    dot.className = "stopcursor";
    dot.innerHTML = '<span class="stopcursor__label"></span>';
    document.body.appendChild(dot);
    document.documentElement.classList.add("has-stopcursor");
    var label = dot.querySelector(".stopcursor__label");

    var cx = window.innerWidth / 2, cy = -40, tx = cx, ty = cy;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      dot.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(follow);
    })();

    var TEXT = { view: "View", drag: "Drag", read: "Read", email: "Email" };
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      var state = el.getAttribute("data-cursor");
      el.addEventListener("mouseenter", function () {
        dot.classList.add("is-" + state);
        label.textContent = TEXT[state] || "";
      });
      el.addEventListener("mouseleave", function () {
        dot.classList.remove("is-" + state);
        label.textContent = "";
      });
    });
    window.addEventListener("mousedown", function () { dot.classList.add("is-down"); });
    window.addEventListener("mouseup", function () { dot.classList.remove("is-down"); });
  }

  if (typeof gsap === "undefined") return;
  var hasST = typeof ScrollTrigger !== "undefined";
  if (hasST) gsap.registerPlugin(ScrollTrigger);
  var hasSplit = typeof SplitText !== "undefined";

  /* ── Lenis smoothing (desktop) ── */
  if (typeof Lenis !== "undefined" && !coarse && !noLenis) {
    var lenis = new Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      smoothTouch: false
    });
    if (hasST) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
  }

  var fontsReady = Promise.race([
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    new Promise(function (r) { setTimeout(r, 1800); })
  ]);

  /* ── masked type reveals: lines rise inside clipped masks, the red
        period lands last with a thunk ── */
  fontsReady.then(function () {
    if (hasSplit) {
      document.querySelectorAll("[data-split]").forEach(function (el) {
        var dotEl = el.querySelector(".dot");
        var split = new SplitText(el, { type: "lines", linesClass: "mask-line" });
        split.lines.forEach(function (line) {
          var wrap = document.createElement("span");
          wrap.className = "mask-wrap";
          line.parentNode.insertBefore(wrap, line);
          wrap.appendChild(line);
        });
        var tl = gsap.timeline(hasST ? {
          scrollTrigger: { trigger: el, start: "top 85%" }
        } : {});
        tl.from(split.lines, {
          yPercent: 110,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.09
        });
        if (dotEl) {
          tl.from(dotEl, {
            scale: 0,
            transformOrigin: "42% 78%",
            duration: 0.45,
            ease: "back.out(2.4)"
          }, "-=0.55");
        }
      });
    }

    /* hero: Fraunces gets wonky under scroll pressure */
    var heroIt = document.querySelector(".hero h1 .r2");
    if (heroIt && hasST) {
      gsap.fromTo(heroIt,
        { "--wonk": 0 },
        {
          "--wonk": 1, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom 35%", scrub: 0.4 }
        });
    }

    if (hasST) ScrollTrigger.refresh();
  });

  /* ── non-art content: masked clip reveals, not fades ── */
  if (hasST) {
    document.querySelectorAll("[data-rise]").forEach(function (el) {
      gsap.from(el, {
        y: 26, opacity: 0, duration: 0.8, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%" }
      });
    });

    /* art without the GL layer (touch, reduced GPU): curtain wipe reveal */
    var glLive = !coarse;
    document.querySelectorAll(".art").forEach(function (el) {
      if (glLive && el.querySelector("[data-press]")) return; /* press shader owns it */
      gsap.fromTo(el,
        { clipPath: "inset(0 0 100% 0)" },
        {
          clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "expo.inOut",
          scrollTrigger: { trigger: el, start: "top 88%" }
        });
    });
  }
})();
