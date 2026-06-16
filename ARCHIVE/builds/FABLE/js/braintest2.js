/* braintest2.js — clean build.
   Two genuinely-transparent textures (off = engraving, on = colored), composited
   by a single shader. No parchment, no masks, no defringing. The shader only
   animates the reveal: digital propagation from the seam on the left, watercolor
   bloom on the right. Progressive enhancement: a plain <img> of the engraving is
   the fallback when WebGL is unavailable. */

import * as THREE from "three";

const wrap = document.querySelector("[data-brain]");
const fallback = wrap.querySelector(".brain__img");
const stage = document.querySelector(".stage");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

if (supportsWebGL()) init();

function init() {
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
    uOff:     { value: offTex },
    uOn:      { value: onTex },
    uTime:    { value: 0 },
    uLeft:    { value: 0 },
    uRight:   { value: 0 },
    uReduced: { value: reduced ? 1 : 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uOff, uOn;
      uniform float uTime, uLeft, uRight, uReduced;
      varying vec2 vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
        vec2 uu=f*f*(3.-2.*f);
        return mix(mix(a,b,uu.x), mix(c,d,uu.x), uu.y);
      }
      float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }

      void main(){
        vec2 uv = vUv;
        vec4 off = texture2D(uOff, uv);
        vec4 on  = texture2D(uOn,  uv);

        float seam = 0.5;
        float L = smoothstep(seam + 0.004, seam - 0.004, uv.x);  // 1 on left
        float R = 1.0 - L;
        float t = (uReduced > 0.5) ? 0.0 : uTime;

        // LEFT: neural front radiating from the seam
        float dL = distance(uv, vec2(seam, 0.5));
        float nL = (fbm(uv * 7.0 + t * 0.25) - 0.5) * 0.10;
        float Rl = mix(-0.05, 0.82, uLeft);
        float revL = smoothstep(Rl + 0.06, Rl - 0.02, dL + nL) * L;

        // RIGHT: watercolor bloom from the seam
        float fR = distance(uv, vec2(seam, 0.5)) * 0.9 + fbm(uv * 4.2 + 19.0) * 0.7;
        float gR = mix(-0.10, 1.75, uRight);
        float revR = clamp(smoothstep(fR - 0.07, fR + 0.07, gR) * R, 0.0, 1.0);

        float rev = revL + revR;
        vec3 col = mix(off.rgb, on.rgb, rev);
        float a  = mix(off.a, on.a, rev);

        // subtle electric shimmer on the revealed digital side
        float spark = fbm(uv * 20.0 + vec2(t * 0.6, -t * 0.4));
        float flick = 0.5 + 0.5 * sin(t * 4.0 + spark * 14.0);
        float blue  = smoothstep(0.30, 0.95, dot(on.rgb, vec3(0.1, 0.4, 0.9)));
        col += vec3(0.10, 0.30, 0.70) * revL * blue * flick * 0.25;

        gl_FragColor = vec4(col, a);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  // ── interaction ──
  let tL = 0, tR = 0;
  function apply(side) {
    tL = side === "left" ? 1 : 0;
    tR = side === "right" ? 1 : 0;
    stage.classList.toggle("is-left",  side === "left");
    stage.classList.toggle("is-right", side === "right");
  }
  function sideAt(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const padY = r.height * 0.16;
    if (cy < r.top - padY || cy > r.bottom + padY) return null;
    return cx < r.left + r.width / 2 ? "left" : "right";
  }

  const dbg = new URLSearchParams(location.search).get("dbg");
  if (dbg) {
    apply(dbg === "right" ? "right" : "left");
    u.uLeft.value = tL; u.uRight.value = tR;
  } else if (coarse) {
    document.addEventListener("pointerdown", (e) => apply(sideAt(e.clientX, e.clientY)), { passive: true });
  } else {
    document.addEventListener("pointermove", (e) => apply(sideAt(e.clientX, e.clientY)), { passive: true });
    document.addEventListener("pointerleave", () => apply(null));
    window.addEventListener("blur", () => apply(null));
  }

  // ── loop ──
  function resize() {
    const s = Math.min(wrap.clientWidth, wrap.clientHeight);
    renderer.setSize(s, s, false);
    canvas.style.width = s + "px";
    canvas.style.height = s + "px";
  }
  resize();
  window.addEventListener("resize", resize);

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
}
