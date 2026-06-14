/* braintest3.js — braintest2 brain nav + STACK takeover overlays.
   The shader/nav is unchanged from braintest2. Added: clicking a STACK link
   opens that hemisphere's overlay, which pours its categories in with a stagger
   (terminal print on the left, soft bloom on the right). Vanilla, no libs. */

import * as THREE from "three";

const wrap = document.querySelector("[data-brain]");
const fallback = wrap.querySelector(".brain__img");
const stage = document.querySelector(".stage");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;

function supportsWebGL() {
  try { const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
  catch (e) { return false; }
}

if (supportsWebGL()) initBrain();
wireStack();

/* ───────────────────────── brain shader + nav ───────────────────────── */
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

  let tL = 0, tR = 0;
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

  const busy = () => document.body.classList.contains("stack-open") || document.body.classList.contains("resume-anim");
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
    u.uLeft.value  += (tL - u.uLeft.value)  * 0.09;
    u.uRight.value += (tR - u.uRight.value) * 0.09;
    renderer.render(scene, camera);
  }
  tick();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { clock.getDelta(); tick(); }
  });

  /* control surface for the resume sequence */
  window.__brain = { sides(l, r) { tL = l; tR = r; } };
}

/* ───────────────────────── resume reveal ───────────────────────── */
function wireResume() {
  const link = document.querySelector(".bar__resume");
  const resume = document.getElementById("resume");
  if (!link || !resume) return;
  const top = link.querySelector(".top");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let open = false, animating = false;

  // elements that type/animate in, in document order
  const animEls = Array.from(resume.querySelectorAll(
    ".rz-name, .rz-pos, .rz-sec > h2, .rz-body, .rz-card, .rz-group, .rz-item, .rz-cg, .rz-cat, .rz-tcol, .rz-download"
  ));
  if (!reduce) animEls.forEach((el) => el.classList.add("rz-reveal"));

  function setTop(word) {
    if (reduce) { top.textContent = word; return; }
    top.style.transition = "opacity .2s ease"; top.style.opacity = "0";
    setTimeout(() => { top.textContent = word; top.style.opacity = "1"; }, 180);
  }

  function cascadeIn() {
    animEls.forEach((el, i) => { el.style.transitionDelay = (i * 22) + "ms"; el.classList.add("in"); });
  }
  function cascadeReset() {
    animEls.forEach((el) => { el.classList.remove("in"); el.style.transitionDelay = ""; });
  }

  function openR() {
    open = true; animating = true;
    link.setAttribute("aria-expanded", "true");
    resume.setAttribute("aria-hidden", "false");
    setTop("Close");
    document.body.classList.add("resume-anim");        // dissolve side labels
    if (window.__brain) window.__brain.sides(1, 1);    // light both halves -> watermark
    const reveal = () => { document.body.classList.add("resume-open"); cascadeIn(); animating = false; };
    if (reduce) { reveal(); return; }
    setTimeout(reveal, 620);                            // let both sides light first
  }

  function closeR() {
    open = false; animating = true;
    link.setAttribute("aria-expanded", "false");
    resume.setAttribute("aria-hidden", "true");
    setTop("Open");
    document.body.classList.remove("resume-open");
    cascadeReset();
    const done = () => { if (window.__brain) window.__brain.sides(0, 0); document.body.classList.remove("resume-anim"); resume.scrollTop = 0; animating = false; };
    if (reduce) { done(); return; }
    setTimeout(done, 700);
  }

  link.addEventListener("click", (e) => { e.preventDefault(); if (animating) return; open ? closeR() : openR(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open && !animating) closeR(); });
}
wireResume();

/* ─────────────── page-transition veil ─────────────── */
const veil = document.querySelector(".veil");

// lift the veil once the home page is up (fades home in, incl. on return from a section)
// setTimeout (not rAF) so it still fires if the tab loads in the background
if (veil) setTimeout(() => veil.classList.add("clear"), 60);

/* exit to a right-brain section page: cover with the veil, then navigate.
   The section page reveals the brain already painted and glides it into place. */
function wireExit() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".menu--r a:not(.stack)").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#" || /^https?:|^mailto:/.test(href)) return;
      e.preventDefault();
      sessionStorage.setItem("brainEnter", "slide");   // tell the section page to glide in
      if (veil) veil.classList.remove("clear");         // re-cover: soft dissolve out
      setTimeout(() => { window.location.href = href; }, reduce ? 0 : 470);
    });
  });
}
wireExit();

/* ───────────────────────── STACK overlays ───────────────────────── */
function wireStack() {
  const overlays = { tech: document.getElementById("stack-tech"), paint: document.getElementById("stack-paint") };
  let open = null;

  function openStack(which) {
    const ov = overlays[which]; if (!ov) return;
    open = which;
    document.body.classList.add("stack-open");
    document.body.classList.toggle("stack-" + which, true);
    ov.classList.add("is-open"); ov.setAttribute("aria-hidden", "false");

    // pour: stagger every category header and item in document order
    const step = reduced ? 0 : 15;
    const els = ov.querySelectorAll(".cat, .cat li");
    els.forEach((el, i) => { el.style.transitionDelay = (i * step) + "ms"; el.classList.add("in"); });

    const close = ov.querySelector(".stack__close"); if (close) close.focus();
  }

  function closeStack() {
    if (!open) return;
    Object.values(overlays).forEach((ov) => {
      if (!ov) return;
      ov.classList.remove("is-open"); ov.setAttribute("aria-hidden", "true");
      ov.querySelectorAll(".in").forEach((el) => { el.classList.remove("in"); el.style.transitionDelay = ""; });
    });
    document.body.classList.remove("stack-open", "stack-tech", "stack-paint");
    open = null;
  }

  document.querySelectorAll("[data-stack]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); openStack(a.getAttribute("data-stack")); });
  });
  document.querySelectorAll(".stack__close").forEach((b) => b.addEventListener("click", closeStack));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeStack(); });
}
