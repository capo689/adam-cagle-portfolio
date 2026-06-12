/* fable2.js
   Motion for the Print Room. Strictly additive: the page is complete and
   readable before this file runs, with JS disabled, and with reduced motion.
   Animations set their own "from" states at runtime, so nothing is ever
   hidden by default. */

(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.location.search.indexOf("still") > -1) return;
  if (typeof gsap === "undefined") return;

  var hasST = typeof ScrollTrigger !== "undefined";
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* Hero settles in: one quick pass, content never blocked */
  gsap.from(".hero h1", { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.05 });
  gsap.from(".hero .kicker", { y: 14, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.15 });
  gsap.from(".hero .deck", { y: 22, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.3 });

  if (!hasST) return;

  /* Chapter line draws attention as it enters */
  gsap.from(".chapter .line", {
    y: 36, opacity: 0, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".chapter .line", start: "top 86%" }
  });

  /* Prints hang one at a time */
  gsap.utils.toArray(".print").forEach(function (el, i) {
    gsap.from(el, {
      y: 34, opacity: 0, duration: 0.8, ease: "power3.out", delay: (i % 3) * 0.1,
      scrollTrigger: { trigger: el, start: "top 92%" }
    });
  });

  /* Case facts rise in sequence */
  gsap.utils.toArray(".fact, .case .about, .outcome").forEach(function (el) {
    gsap.from(el, {
      y: 24, opacity: 0, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%" }
    });
  });
})();
