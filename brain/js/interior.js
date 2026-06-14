/* interior.js — section-page brain + page transitions.
   Same shader as the home nav, locked to one lit hemisphere and rendered
   ALREADY painted (no bloom). A veil masks the reload so navigation never
   blinks. Arriving from home, the brain glides center -> dock, then the
   content fades in. Arriving from another section (sub-nav), the brain is
   already docked and does not move. Vanilla, no libs beyond Three. */

import * as THREE from "three";

const wrap = document.querySelector("[data-brain]");
const veil = document.querySelector(".veil");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// declared before wireNav() runs (avoid temporal-dead-zone on these in the handler)
let swapping = false;
const path = (href) => new URL(href, location.href).pathname;

// entrance mode is decided by where we came from (set on the previous page)
const mode = sessionStorage.getItem("brainEnter");
sessionStorage.removeItem("brainEnter");
const willSlide = !reduced && mode !== "static";

// put the brain at its start spot up-front (under the veil) so it never jumps
if (wrap && willSlide) wrap.classList.add("enter");

wireNav();
if (wrap) initBrain(wrap); else runEntrance();

function supportsWebGL() {
  try { const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
  catch (e) { return false; }
}

/* ───────────────────────── entrance / reveal ───────────────────────── */
let entered = false;
function runEntrance() {
  if (entered) return; entered = true;
  if (veil) veil.classList.add("clear");        // dissolve the mask

  if (!willSlide) {                              // sub-nav / reduced: brain stays put
    setTimeout(() => document.body.classList.add("content-in"), reduced ? 0 : 160);
    return;
  }

  // from home: let the veil clear, then glide center -> dock, then content
  setTimeout(() => {
    if (!wrap) { document.body.classList.add("content-in"); return; }
    wrap.classList.add("sliding");
    void wrap.offsetWidth;                       // commit the start frame
    wrap.classList.remove("enter");              // -> docked, animated
    let done = false;
    const finish = () => { if (done) return; done = true; document.body.classList.add("content-in"); };
    wrap.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 1500);                    // failsafe
  }, 520);
}
// hard failsafe so the page can never stay veiled
setTimeout(runEntrance, 2200);

/* ───────────────────────── brain shader ───────────────────────── */
function initBrain(wrap) {
  const side = wrap.getAttribute("data-side") || "right";
  const fallback = wrap.querySelector(".brain__img");

  if (!supportsWebGL()) { if (fallback) fallback.style.opacity = "1"; runEntrance(); return; }

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
  const ready = () => {
    if (++n === 2) {
      wrap.classList.add("is-ready");
      if (fallback) fallback.style.opacity = "0";
      // ensure one painted frame is on screen before we lift the veil
      requestAnimationFrame(() => requestAnimationFrame(runEntrance));
    }
  };
  const offTex = loader.load("img/brain/brain-off.png", ready);
  const onTex  = loader.load("img/brain/brain-on.png", ready);
  [offTex, onTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; });

  // locked, ALREADY lit (no bloom): right (or left) hemisphere painted from frame 1
  const tL = side === "left" ? 1 : 0;
  const tR = side === "right" ? 1 : 0;
  const u = {
    uOff: { value: offTex }, uOn: { value: onTex },
    uTime: { value: 0 }, uLeft: { value: tL }, uRight: { value: tR }, uReduced: { value: reduced ? 1 : 0 },
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

  function resize() { const s = Math.min(wrap.clientWidth, wrap.clientHeight); renderer.setSize(s, s, false); canvas.style.width = s + "px"; canvas.style.height = s + "px"; }
  resize(); window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let raf = null;
  function tick() {
    raf = requestAnimationFrame(tick);
    u.uTime.value += Math.min(clock.getDelta(), 0.05);
    renderer.render(scene, camera);
  }
  tick();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { clock.getDelta(); tick(); }
  });
}

/* ───────────────────────── navigation ─────────────────────────
   Same-side sub-nav swaps content IN PLACE (brain never moves or reloads).
   The name (home) does a full veil dissolve since the brain changes. */
function wireNav() {
  const navLinks = Array.from(document.querySelectorAll(".bar__nav a"));
  const sameSide = new Set(navLinks.map((a) => path(a.getAttribute("href"))));

  function leave(href) {                          // full dissolve -> reload (home)
    if (veil) veil.classList.remove("clear");
    document.body.classList.remove("content-in");
    setTimeout(() => { window.location.href = href; }, reduced ? 0 : 470);
  }

  async function swap(href, push) {               // in-place content swap, brain stays
    if (swapping) return; swapping = true;
    const pc = document.querySelector(".page__content");
    document.body.classList.remove("content-in"); // fade current content out
    let doc;
    try {
      const res = await fetch(href, { credentials: "same-origin" });
      doc = new DOMParser().parseFromString(await res.text(), "text/html");
    } catch (e) { window.location.href = href; return; }
    const newPC = doc.querySelector(".page__content");
    if (!newPC) { window.location.href = href; return; }
    setTimeout(() => {
      pc.innerHTML = newPC.innerHTML;
      pc.scrollTop = 0;
      document.title = doc.title;
      const tgt = path(href);
      navLinks.forEach((a) => {
        const on = path(a.getAttribute("href")) === tgt;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
      if (push) history.pushState({ spa: true }, "", href);
      if (window.WorkLightbox) window.WorkLightbox.init();
      if (window.WorkFlipbook) window.WorkFlipbook.init();
      swapping = false;
      setTimeout(() => document.body.classList.add("content-in"), 20);
    }, reduced ? 0 : 360);
  }

  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || /^https?:|^mailto:|^#/.test(href)) return;
      e.preventDefault();
      if (a.classList.contains("is-active")) return;
      swap(href, true);
    });
  });

  window.addEventListener("popstate", () => {
    if (sameSide.has(location.pathname)) swap(location.href, false);
    else window.location.reload();
  });

  const name = document.querySelector(".bar__name");
  if (name) name.addEventListener("click", (e) => {
    const href = name.getAttribute("href");
    if (!href || /^https?:|^mailto:/.test(href)) return;
    e.preventDefault(); leave(href);
  });
}
