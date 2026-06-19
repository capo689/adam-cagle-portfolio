/* brain.js — the home shell IS the app. One persistent brain (never reloaded)
   that hover-lights on home and GLIDES into its dock when you enter a section.
   Entering/leaving a section does not navigate the document: the home UI fades,
   the same brain moves, then the fetched section content flows in on arrival.
   Vanilla, Three only. */

import * as THREE from "three";

const wrap = document.querySelector("[data-brain]");
const fallback = wrap.querySelector(".brain__img");
const stage = document.querySelector(".stage");
const body = document.body;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;

let tL = 0, tR = 0;     // brain hemisphere targets (lerped in the tick)
let locked = false;     // true while a section is open (hover disabled)
let colorK = 0.09;      // paint lerp speed (0.09 = snappy hover; lower = slow breath)

function supportsWebGL() {
  try { const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
  catch (e) { return false; }
}

if (supportsWebGL()) initBrain();
wireStack();
wireResume();
wireNav();

/* ───────────────────────── brain shader + hover ───────────────────────── */
function initBrain() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.className = "brain__canvas";
  wrap.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const loader = new THREE.TextureLoader();
  let n = 0;
  const ready = () => { if (++n === 2) { wrap.classList.add("is-ready"); if (fallback) fallback.style.opacity = "0"; } };
  const offTex = loader.load("img/brain/brain-off.png", ready);
  const onTex  = loader.load("img/brain/brain-on.png", ready);
  [offTex, onTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; });

  const u = {
    uOff: { value: offTex }, uOn: { value: onTex },
    uTime: { value: 0 }, uLeft: { value: 0 }, uRight: { value: 0 }, uReduced: { value: reduced ? 1 : 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: true,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uOff,uOn; uniform float uTime,uLeft,uRight,uReduced; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p);
        float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));
        vec2 uu=f*f*(3.-2.*f); return mix(mix(a,b,uu.x),mix(c,d,uu.x),uu.y); }
      float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }
      void main(){
        vec2 uv=vUv; vec4 off=texture2D(uOff,uv); vec4 on=texture2D(uOn,uv);
        float seam=0.5; float L=smoothstep(seam+0.004,seam-0.004,uv.x); float R=1.0-L;
        float t=(uReduced>0.5)?0.0:uTime;
        float dL=distance(uv,vec2(seam,0.5));
        float nL=(fbm(uv*7.0+t*0.25)-0.5)*0.10;
        float Rl=mix(-0.05,0.82,uLeft);
        float revL=smoothstep(Rl+0.06,Rl-0.02,dL+nL)*L;
        float fR=distance(uv,vec2(seam,0.5))*0.9+fbm(uv*4.2+19.0)*0.7;
        float gR=mix(-0.10,1.75,uRight);
        float revR=clamp(smoothstep(fR-0.07,fR+0.07,gR)*R,0.0,1.0);
        float rev=revL+revR;
        vec3 col=mix(off.rgb,on.rgb,rev);
        float a=mix(off.a,on.a,rev);
        float spark=fbm(uv*20.0+vec2(t*0.6,-t*0.4));
        float flick=0.5+0.5*sin(t*4.0+spark*14.0);
        float blue=smoothstep(0.30,0.95,dot(on.rgb,vec3(0.1,0.4,0.9)));
        col+=vec3(0.10,0.30,0.70)*revL*blue*flick*0.25;
        gl_FragColor=vec4(col,a);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  function apply(side) {
    tL = side === "left" ? 1 : 0; tR = side === "right" ? 1 : 0;
    stage.classList.toggle("is-left", side === "left");
    stage.classList.toggle("is-right", side === "right");
  }
  function sideAt(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const padY = r.height * 0.16;
    if (cy < r.top - padY || cy > r.bottom + padY) return null;
    return cx < r.left + r.width / 2 ? "left" : "right";
  }

  const busy = () => locked || body.classList.contains("stack-open") || body.classList.contains("resume-anim");
  if (coarse) {
    document.addEventListener("pointerdown", (e) => { if (!busy()) apply(sideAt(e.clientX, e.clientY)); }, { passive: true });
  } else {
    document.addEventListener("pointermove", (e) => { if (!busy()) apply(sideAt(e.clientX, e.clientY)); }, { passive: true });
    document.addEventListener("pointerleave", () => { if (!busy()) apply(null); });
    window.addEventListener("blur", () => { if (!busy()) apply(null); });
  }

  function resize() { const s = Math.min(wrap.clientWidth, wrap.clientHeight); renderer.setSize(s, s, false); canvas.style.width = s + "px"; canvas.style.height = s + "px"; }
  resize(); window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let raf = null;
  function tick() {
    raf = requestAnimationFrame(tick);
    u.uTime.value += Math.min(clock.getDelta(), 0.05);
    u.uLeft.value  += (tL - u.uLeft.value)  * colorK;
    u.uRight.value += (tR - u.uRight.value) * colorK;
    renderer.render(scene, camera);
  }
  tick();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { clock.getDelta(); tick(); }
  });

  // control surface for the resume sequence + section controller
  window.__brain = {
    sides(l, r) { tL = l; tR = r; },
    colorSpeed(k) { colorK = k; },                       // set the paint lerp speed
    lock(l, r) { locked = true; tL = l; tR = r; colorK = 0.09; },
    unlock() { locked = false; tL = 0; tR = 0; colorK = 0.09; stage.classList.remove("is-left", "is-right"); },
  };
}

/* ───────────────────────── section navigation (no reload) ───────────────────────── */
function wireNav() {
  const LEFT  = new Set(["ai-systems.html", "ux-ui.html", "technical-writing.html"]);
  const RIGHT = new Set(["creative-direction.html", "copywriting.html", "creative-writing.html"]);
  const barNav = document.querySelector(".bar__nav");
  const pageContent = document.querySelector(".page__content");
  const HOME_TITLE = document.title;
  const baseName = (href) => (href || "").split("/").pop().split("?")[0].split("#")[0];
  const sideOf = (name) => (LEFT.has(name) ? "left" : RIGHT.has(name) ? "right" : null);

  let mode = "home", busyNav = false;

  async function fetchSection(href) {
    const res = await fetch(href, { credentials: "same-origin" });
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const pc = doc.querySelector(".page__content");
    const nv = doc.querySelector(".bar__nav");
    return { content: pc ? pc.innerHTML : "", nav: nv ? nv.innerHTML : "", title: doc.title };
  }
  function initContentScripts() {
    if (window.WorkLightbox) window.WorkLightbox.init();
    if (window.WorkFlipbook) window.WorkFlipbook.init();
    if (window.CDGallery) window.CDGallery.init();
    if (window.CDWall) window.CDWall.init();
    if (window.Flipbook) window.Flipbook.init();
    if (window.WritingReader) window.WritingReader.init();
    if (window.CWBears) window.CWBears.init();
    if (window.Anchors) window.Anchors.init();
    if (window.TWCanvas) window.TWCanvas.init();
    if (window.TWViewer) window.TWViewer.init();
    if (window.SkillCloud) window.SkillCloud.init();
    if (window.UX) window.UX.init();
  }

  async function enterSection(href, push) {
    const name = baseName(href), side = sideOf(name);
    if (!side || busyNav) return;
    busyNav = true; mode = "section";

    if (window.__brain) window.__brain.lock(side === "left" ? 1 : 0, side === "right" ? 1 : 0);
    stage.classList.remove("is-left", "is-right");
    body.classList.toggle("theme-tech", side === "left");
    body.classList.remove("content-in");
    body.classList.add("section-mode");
    body.classList.toggle("side-left", side === "left");
    body.classList.toggle("side-right", side === "right");

    let data;
    try { data = await fetchSection(href); }
    catch (e) { window.location.href = href; return; }

    const arrive = () => {
      pageContent.innerHTML = data.content;
      pageContent.scrollTop = 0;
      if (barNav) { barNav.innerHTML = data.nav; barNav.hidden = false; }
      if (data.title) document.title = data.title;
      initContentScripts();
      if (push) history.pushState({ section: name }, "", href);
      requestAnimationFrame(() => body.classList.add("content-in"));
      busyNav = false;
    };
    if (reduced) arrive(); else setTimeout(arrive, 720);   // flow in as the brain arrives
  }

  async function swapSection(href, push) {                 // same-side sub-nav
    const name = baseName(href);
    const side = sideOf(name) || (body.classList.contains("side-left") ? "left" : "right");
    if (busyNav) return; busyNav = true;
    // the drawn brain stays; only the colour SLOWLY drains off, then floods back on
    body.classList.remove("content-in");                   // content fades out
    if (window.__brain) { window.__brain.colorSpeed(0.035); window.__brain.sides(0, 0); } // slow drain
    let data;
    try { data = await fetchSection(href); }
    catch (e) { window.location.href = href; return; }
    setTimeout(() => {
      pageContent.innerHTML = data.content; pageContent.scrollTop = 0;
      if (barNav) barNav.innerHTML = data.nav;
      if (data.title) document.title = data.title;
      initContentScripts();
      if (push) history.pushState({ section: name }, "", href);
      if (window.__brain) window.__brain.sides(side === "left" ? 1 : 0, side === "right" ? 1 : 0); // colour slowly floods back
      setTimeout(() => { body.classList.add("content-in"); busyNav = false; }, reduced ? 0 : 850); // content in once colour returns
    }, reduced ? 0 : 850);                                  // let the colour fully drain first
  }

  // crossSection: switch to the OTHER hemisphere without leaving section-mode.
  // The brain drains to the plain engraving, GLIDES across (the .app .brain
  // transform transition), then the new side's colour floods on as it lands and
  // that side's first page flows in. One continuous brain, no reload.
  async function crossSection(href, push) {
    const name = baseName(href), side = sideOf(name);            // destination side
    if (!side || busyNav || mode !== "section") return;
    busyNav = true;

    body.classList.remove("content-in");                         // outgoing content fades
    if (window.__brain) { window.__brain.colorSpeed(0.06); window.__brain.sides(0, 0); } // drain to plain

    let data;
    try { data = await fetchSection(href); }
    catch (e) { window.location.href = href; return; }

    setTimeout(() => {
      body.classList.toggle("theme-tech", side === "left");
      body.classList.toggle("side-left",  side === "left");
      body.classList.toggle("side-right", side === "right");     // brain GLIDES to the far dock
      pageContent.innerHTML = data.content; pageContent.scrollTop = 0;   // swap under the travelling brain
      if (barNav) barNav.innerHTML = data.nav;
      if (data.title) document.title = data.title;
      initContentScripts();
      if (push) history.pushState({ section: name }, "", href);
      // colour floods the new hemisphere as the brain nears its dock
      setTimeout(() => { if (window.__brain) window.__brain.lock(side === "left" ? 1 : 0, side === "right" ? 1 : 0); }, reduced ? 0 : 470);
      // content flows in once the brain has landed and recoloured
      setTimeout(() => { body.classList.add("content-in"); busyNav = false; }, reduced ? 0 : 980);
    }, reduced ? 0 : 460);                                       // sit plain a beat, then set off
  }

  function goHome(push) {
    if (busyNav || mode === "home") return;
    busyNav = true; mode = "home";
    body.classList.remove("content-in");                   // content fades out first
    const finish = () => {
      if (window.__brain) window.__brain.unlock();          // brain glides back to centre
      body.classList.remove("section-mode", "side-left", "side-right", "theme-tech");
      if (barNav) { barNav.hidden = true; barNav.innerHTML = ""; }
      document.title = HOME_TITLE;
      if (push) history.pushState({ home: true }, "", "/DEV/");
      setTimeout(() => { pageContent.innerHTML = ""; busyNav = false; }, reduced ? 0 : 850);
    };
    if (reduced) finish(); else setTimeout(finish, 340);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || /^https?:|^mailto:/.test(href)) return;

    if (a.closest(".menu--l") || a.closest(".menu--r")) {
      if (a.classList.contains("stack") || href.startsWith("#")) return;  // stack handled separately
      e.preventDefault(); enterSection(href, true); return;
    }
    if (a.closest(".bar__nav")) {
      e.preventDefault();
      if (!a.classList.contains("is-active")) swapSection(href, true);
      return;
    }
    if (a.classList.contains("bar__name")) {
      e.preventDefault();
      if (mode === "section") goHome(true);
      return;
    }
  });

  // click the brain (while a section is open) to cross to the other hemisphere
  const xHit = document.createElement("div");
  xHit.className = "brain-cross-hit";
  xHit.innerHTML = '<span class="brain-cross-label"></span>';
  const xLabel = xHit.querySelector(".brain-cross-label");
  wrap.appendChild(xHit);
  xHit.addEventListener("mouseenter", () => {
    if (mode === "section") xLabel.textContent = body.classList.contains("side-left") ? "Go Right Brain" : "Go Left Brain";
  });
  xHit.addEventListener("click", () => {
    if (mode !== "section" || busyNav) return;
    crossSection(body.classList.contains("side-left") ? "copywriting.html" : "ai-systems.html", true);
  });

  window.addEventListener("popstate", () => {
    const name = baseName(location.pathname), side = sideOf(name);
    if (side) {
      if (mode === "home") { enterSection(location.pathname, false); return; }
      const cur = body.classList.contains("side-left") ? "left" : "right";
      (side !== cur ? crossSection : swapSection)(location.pathname, false);
    } else if (mode === "section") goHome(false);
  });
}

/* ───────────────────────── resume reveal ───────────────────────── */
function wireResume() {
  const link = document.querySelector(".bar__resume");
  const resume = document.getElementById("resume");
  if (!link || !resume) return;
  const top = link.querySelector(".top");
  const reduce = reduced;
  let open = false, animating = false;

  const animEls = Array.from(resume.querySelectorAll(
    ".rz-kicker, .rz-name, .rz-roles, .rz-head .rz-dl, .rz-sec > h2, .rz-body, .rz-card, .rz-group, .rz-item, .rz-cat, .rz-tcol, .rz-foot"
  ));
  if (!reduce) animEls.forEach((el) => el.classList.add("rz-reveal"));

  function setTop(word) {
    if (reduce) { top.textContent = word; return; }
    top.style.transition = "opacity .2s ease"; top.style.opacity = "0";
    setTimeout(() => { top.textContent = word; top.style.opacity = "1"; }, 180);
  }
  function cascadeIn() { animEls.forEach((el, i) => { el.style.transitionDelay = (i * 22) + "ms"; el.classList.add("in"); }); }
  function cascadeReset() { animEls.forEach((el) => { el.classList.remove("in"); el.style.transitionDelay = ""; }); }

  function openR() {
    open = true; animating = true;
    link.setAttribute("aria-expanded", "true"); resume.setAttribute("aria-hidden", "false");
    setTop("Close");
    body.classList.add("resume-anim");
    if (window.__brain) window.__brain.sides(1, 1);
    const reveal = () => { body.classList.add("resume-open"); cascadeIn(); animating = false; };
    if (reduce) { reveal(); return; }
    setTimeout(reveal, 620);
  }
  function closeR() {
    open = false; animating = true;
    link.setAttribute("aria-expanded", "false"); resume.setAttribute("aria-hidden", "true");
    setTop("Open");
    body.classList.remove("resume-open");
    cascadeReset();
    const done = () => { if (window.__brain) window.__brain.sides(0, 0); body.classList.remove("resume-anim"); resume.scrollTop = 0; animating = false; };
    if (reduce) { done(); return; }
    setTimeout(done, 700);
  }

  link.addEventListener("click", (e) => { e.preventDefault(); if (animating) return; open ? closeR() : openR(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open && !animating) closeR(); });
}

/* ───────────────────────── STACK overlays ───────────────────────── */
function wireStack() {
  const overlays = { tech: document.getElementById("stack-tech"), paint: document.getElementById("stack-paint") };
  let open = null;

  function openStack(which) {
    const ov = overlays[which]; if (!ov) return;
    open = which;
    body.classList.add("stack-open"); body.classList.toggle("stack-" + which, true);
    ov.classList.add("is-open"); ov.setAttribute("aria-hidden", "false");
    const step = reduced ? 0 : 15;
    ov.querySelectorAll(".cat, .cat li").forEach((el, i) => { el.style.transitionDelay = (i * step) + "ms"; el.classList.add("in"); });
    const close = ov.querySelector(".stack__close"); if (close) close.focus();
  }
  function closeStack() {
    if (!open) return;
    Object.values(overlays).forEach((ov) => {
      if (!ov) return;
      ov.classList.remove("is-open"); ov.setAttribute("aria-hidden", "true");
      ov.querySelectorAll(".in").forEach((el) => { el.classList.remove("in"); el.style.transitionDelay = ""; });
    });
    body.classList.remove("stack-open", "stack-tech", "stack-paint");
    open = null;
  }

  document.querySelectorAll("[data-stack]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); openStack(a.getAttribute("data-stack")); });
  });
  document.querySelectorAll(".stack__close").forEach((b) => b.addEventListener("click", closeStack));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeStack(); });
}
