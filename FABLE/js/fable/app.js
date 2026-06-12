/* app.js
   FABLE choreography. GSAP + ScrollTrigger + SplitText + Lenis.
   Progressive enhancement: without JS (or without these libs) every word
   on the page is already in the DOM and readable. This file only adds motion. */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (reduced) root.classList.add("reduced-motion");
  if (!hasGsap || reduced) {
    /* No motion stack: show everything, remove the preloader, done. */
    var pre = document.querySelector(".preloader");
    if (pre) pre.remove();
    document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
    wireMenu();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = typeof SplitText !== "undefined";

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* Fonts gate: split-based reveals measure glyphs, so they must wait for
     Fraunces. Race against a timeout so a stalled font never blocks the page. */
  var fontsReady = Promise.race([
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    new Promise(function (r) { setTimeout(r, 1800); })
  ]);

  var ACCENTS = {
    hero: "#5b8cff", about: "#5b8cff",
    killer: "#ff3b3b", traveler: "#ffb02e", sunset: "#e8b54d",
    figueroa: "#6f9bff", clink: "#ff7a59", filekeepers: "#9d7bff",
    systems: "#35e0b8", books: "#d8c39a", contact: "#5b8cff"
  };

  /* ── Lenis smooth scroll ─────────────────────────────── */

  var lenis = null;
  var noLenis = window.location.search.indexOf("nolenis") > -1;
  if (typeof Lenis !== "undefined" && !coarse && !noLenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      smoothTouch: false
    });
    lenis.on("scroll", function (e) {
      ScrollTrigger.update();
      if (window.FABLE_SCENE) window.FABLE_SCENE.setVelocity(e.velocity || 0);
    });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.lenis = lenis;
  } else {
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      if (window.FABLE_SCENE) window.FABLE_SCENE.setVelocity(window.scrollY - lastY);
      lastY = window.scrollY;
    }, { passive: true });
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else {
      var el = typeof target === "string" ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      document.body.classList.remove("menu-open");
      scrollToTarget(el);
    });
  });

  /* page progress feeds the field */
  ScrollTrigger.create({
    start: 0,
    end: function () { return document.documentElement.scrollHeight - window.innerHeight; },
    onUpdate: function (self) {
      if (window.FABLE_SCENE) window.FABLE_SCENE.setProgress(self.progress);
    }
  });

  /* ── Cursor ──────────────────────────────────────────── */

  if (!coarse) {
    var cursor = document.querySelector(".cursor");
    var label = cursor.querySelector(".cursor__label");
    var cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    var cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("mousemove", function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });

    var TEXT = { view: "View", drag: "Drag", read: "Read", email: "Email" };
    document.querySelectorAll("[data-cursor]").forEach(function (el) {
      var state = el.getAttribute("data-cursor");
      el.addEventListener("mouseenter", function () {
        cursor.classList.add("is-" + state);
        label.textContent = TEXT[state] || "";
      });
      el.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-" + state);
        label.textContent = "";
      });
    });
    document.querySelectorAll("a:not([data-cursor]), button:not([data-cursor])").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("is-link"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("is-link"); });
    });
    window.addEventListener("mousedown", function () { cursor.classList.add("is-down"); });
    window.addEventListener("mouseup", function () { cursor.classList.remove("is-down"); });
  }

  /* ── Magnetic buttons ────────────────────────────────── */

  if (!coarse) {
    document.querySelectorAll(".btn, .menu-btn").forEach(function (el) {
      var sx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
      var sy = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        sx((e.clientX - r.left - r.width / 2) * 0.25);
        sy((e.clientY - r.top - r.height / 2) * 0.25);
      });
      el.addEventListener("mouseleave", function () { sx(0); sy(0); });
    });
  }

  /* ── Menu ────────────────────────────────────────────── */

  wireMenu();

  /* ── Preloader, then intro ───────────────────────────── */

  var pre = document.querySelector(".preloader");
  var count = pre ? pre.querySelector(".preloader__count") : null;
  var introPlayed = false;

  if (pre && count) {
    document.body.style.overflow = "hidden";
    var num = { v: 0 };
    var loaded = false;
    window.addEventListener("load", function () { loaded = true; });

    gsap.to(num, {
      v: 100,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: function () {
        count.textContent = String(Math.round(num.v)).padStart(3, "0") + "%";
      },
      onComplete: function waitReady() {
        /* hold at 100 until the window is actually ready, max another 1.2s */
        var waited = 0;
        (function poll() {
          if (loaded || waited > 1200) finishPreloader();
          else { waited += 80; setTimeout(poll, 80); }
        })();
      }
    });
  } else {
    intro();
  }

  function finishPreloader() {
    fontsReady.then(function () {
      gsap.to(pre, {
        yPercent: -100,
        duration: 0.9,
        ease: "power4.inOut",
        onStart: intro,
        onComplete: function () { pre.remove(); }
      });
      document.body.style.overflow = "";
    });
  }

  function intro() {
    if (introPlayed) return;
    introPlayed = true;

    var tl = gsap.timeline({ delay: 0.15 });
    var rows = document.querySelectorAll(".hero__name .row");

    if (hasSplit && rows.length) {
      rows.forEach(function (row, i) {
        var split = new SplitText(row, { type: "chars" });
        gsap.set(row, { opacity: 1 });
        tl.from(split.chars, {
          yPercent: 110,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.035
        }, i * 0.12);
      });
    } else {
      tl.to(rows, { opacity: 1, duration: 0.8 }, 0);
    }

    tl.to(".hero__kicker", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.5);
    tl.to(".hero__deck",   { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.7);
    tl.to(".site-head",    { opacity: 1, duration: 0.8 }, 0.9);
    tl.to(".rail",         { opacity: 1, duration: 0.8 }, 1.0);
  }

  gsap.set(".hero__name .row", { opacity: 0 });
  gsap.set(".hero__kicker", { opacity: 0, y: 18 });
  gsap.set(".hero__deck", { opacity: 0, y: 24 });
  gsap.set(".site-head, .rail", { opacity: 0 });

  /* ── Chapter accents → CSS + field ───────────────────── */

  document.querySelectorAll("[data-chapter]").forEach(function (section) {
    var name = section.getAttribute("data-chapter");
    ScrollTrigger.create({
      trigger: section,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: function (self) {
        if (!self.isActive) return;
        document.body.setAttribute("data-chapter", name);
        if (window.FABLE_SCENE && ACCENTS[name]) window.FABLE_SCENE.setChapter(ACCENTS[name]);
        document.querySelectorAll(".rail a").forEach(function (dot) {
          dot.classList.toggle("active", dot.getAttribute("data-rail") === name);
        });
      }
    });
  });

  /* ── Reveals ─────────────────────────────────────────── */

  /* generic rise */
  document.querySelectorAll('[data-reveal="rise"]').forEach(function (el) {
    gsap.fromTo(el,
      { opacity: 0, y: 44 },
      {
        opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
        onStart: function () { el.classList.add("in"); }
      });
  });

  /* split lines (manifesto, big quotes) */
  fontsReady.then(function () {
  document.querySelectorAll('[data-reveal="lines"]').forEach(function (el) {
    if (!hasSplit) {
      gsap.fromTo(el, { opacity: 0 }, {
        opacity: 1, duration: 1,
        scrollTrigger: { trigger: el, start: "top 85%" },
        onStart: function () { el.classList.add("in"); }
      });
      return;
    }
    var split = new SplitText(el, { type: "lines", linesClass: "line" });
    el.classList.add("in");
    gsap.set(el, { opacity: 1 });
    gsap.from(split.lines, {
      yPercent: 105,
      opacity: 0,
      duration: 1.0,
      ease: "power3.out",
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: "top 82%" }
    });
  });

  /* chapter taglines: word cascade tied to scroll entry */
  document.querySelectorAll('[data-reveal="words"]').forEach(function (el) {
    if (!hasSplit) {
      gsap.fromTo(el, { opacity: 0 }, {
        opacity: 1, duration: 1,
        scrollTrigger: { trigger: el, start: "top 85%" },
        onStart: function () { el.classList.add("in"); }
      });
      return;
    }
    var split = new SplitText(el, { type: "words", wordsClass: "word" });
    el.classList.add("in");
    gsap.set(el, { opacity: 1 });
    gsap.from(split.words, {
      yPercent: 60,
      opacity: 0,
      rotateZ: 2,
      duration: 1.15,
      ease: "power4.out",
      stagger: 0.07,
      scrollTrigger: { trigger: el, start: "top 80%" }
    });
  });
  ScrollTrigger.refresh();
  reanchor();
  });

  /* Deep links: pinning and text splitting reflow the page after the
     browser's native hash jump, so put the visitor back on target. */
  function reanchor() {
    if (!location.hash) return;
    var el = document.querySelector(location.hash);
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }
  window.addEventListener("load", function () { setTimeout(reanchor, 60); });

  /* image frames: clip-path wipe + slow parallax drift */
  document.querySelectorAll(".frame, .shot").forEach(function (el) {
    gsap.fromTo(el,
      { clipPath: "inset(12% 6% 12% 6% round 6px)", opacity: 0 },
      {
        clipPath: "inset(0% 0% 0% 0% round 6px)", opacity: 1,
        duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%" }
      });
    var img = el.querySelector("img");
    if (img && !el.closest(".strip")) {
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
      });
    }
  });

  /* ── Stat counters ───────────────────────────────────── */

  document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
      onUpdate: function () { el.firstChild.nodeValue = Math.round(obj.v); }
    });
  });

  /* ── Traveler horizontal strip ───────────────────────── */

  var stage = document.querySelector(".strip-stage");
  if (stage && window.innerWidth > 860) {
    var strip = stage.querySelector(".strip");
    var pin = stage.querySelector(".strip-pin");
    var travel = function () { return strip.scrollWidth - window.innerWidth; };
    gsap.to(strip, {
      x: function () { return -travel(); },
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: function () { return "+=" + travel(); },
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });
  }

  /* ── Agent hover peek ────────────────────────────────── */

  var peek = document.querySelector(".agent-peek");
  if (peek && !coarse) {
    var imgs = {};
    peek.querySelectorAll("img").forEach(function (im) { imgs[im.getAttribute("data-agent")] = im; });
    var px = gsap.quickTo(peek, "x", { duration: 0.5, ease: "power3" });
    var py = gsap.quickTo(peek, "y", { duration: 0.5, ease: "power3" });
    window.addEventListener("mousemove", function (e) {
      px(Math.min(e.clientX + 30, window.innerWidth - peek.offsetWidth - 20));
      py(Math.min(e.clientY - peek.offsetHeight / 2, window.innerHeight - peek.offsetHeight - 20));
    }, { passive: true });

    document.querySelectorAll(".agent[data-peek]").forEach(function (row) {
      var key = row.getAttribute("data-peek");
      row.addEventListener("mouseenter", function () {
        Object.keys(imgs).forEach(function (k) { imgs[k].classList.toggle("on", k === key); });
        if (imgs[key]) gsap.to(peek, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" });
      });
      row.addEventListener("mouseleave", function () {
        gsap.to(peek, { opacity: 0, scale: 0.94, duration: 0.3, ease: "power3.in" });
      });
    });
  }

  /* ── AuScan percent scrub ────────────────────────────── */

  var pct = document.querySelector(".auscan [data-pct]");
  if (pct) {
    var po = { v: 0 };
    gsap.to(po, {
      v: 72,
      ease: "none",
      scrollTrigger: {
        trigger: ".auscan",
        start: "top 80%",
        end: "center 50%",
        scrub: 0.5
      },
      onUpdate: function () { pct.firstChild.nodeValue = Math.round(po.v); }
    });
  }

  /* ── Footer marquee gets a scroll-direction nudge ────── */

  var marquee = document.querySelector(".marquee");
  if (marquee) {
    ScrollTrigger.create({
      trigger: ".foot",
      start: "top bottom",
      onEnter: function () { marquee.style.animationPlayState = "running"; }
    });
  }

  /* ── helpers ─────────────────────────────────────────── */

  function wireMenu() {
    var btn = document.querySelector(".menu-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.body.classList.remove("menu-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    document.querySelectorAll(".menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }
})();
