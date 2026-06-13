/* braintest.js
   Two-mind brain. Pencil engraving at rest. Hover the left hemisphere and the
   digital network propagates out from the central seam, lines lighting and
   flickering. Hover the right and the watercolor blooms outward like ink in
   water. Only the hovered half ever colorizes. Three.js, one shader, GPU only.

   Progressive enhancement: a plain <img> of the pencil brain is the markup;
   if WebGL is unavailable this page still shows the brain. */

import * as THREE from "three";

const wrap = document.querySelector("[data-brain]");
const fallback = wrap.querySelector(".brain__img");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  let loaded = 0;
  const onLoad = () => { if (++loaded === 2) { wrap.classList.add("is-ready"); if (fallback) fallback.style.opacity = "0"; } };
  const pencil = loader.load("img/brain/brain-46-cut.png", onLoad);
  const color  = loader.load("img/brain/brain-41-cut.png", onLoad);
  [pencil, color].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; });

  const uniforms = {
    uPencil:  { value: pencil },
    uColor:   { value: color },
    uTime:    { value: 0 },
    uLeft:    { value: 0 },
    uRight:   { value: 0 },
    uMouse:   { value: new THREE.Vector2(0.5, 0.5) },
    uReduced: { value: reducedMotion ? 1 : 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uPencil, uColor;
      uniform float uTime, uLeft, uRight, uReduced;
      uniform vec2 uMouse;
      varying vec2 vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }

      void main(){
        vec2 uv = vUv;
        vec4 pencilT = texture2D(uPencil, uv);
        vec4 colorT  = texture2D(uColor,  uv);
        vec3 pencil = pencilT.rgb;
        vec3 color  = colorT.rgb;

        float seam = 0.5;
        float leftSide  = smoothstep(seam + 0.005, seam - 0.005, uv.x);
        float rightSide = 1.0 - leftSide;
        float t = (uReduced > 0.5) ? 0.0 : uTime;

        /* LEFT: neural front radiating out from the central seam */
        float distSeam = distance(uv, vec2(seam, 0.5));
        float edgeN = (fbm(uv * 7.0 + t * 0.25) - 0.5) * 0.10;
        float Rl = mix(-0.05, 0.82, uLeft);
        float revealL = smoothstep(Rl + 0.06, Rl - 0.02, distSeam + edgeN) * leftSide;

        float net  = fbm(uv * 20.0 + vec2(t * 0.6, -t * 0.4));
        float flick = 0.5 + 0.5 * sin(t * 4.0 + net * 14.0);
        float blue = smoothstep(0.25, 0.9, dot(color, vec3(0.15, 0.45, 0.95)));
        float glowL = revealL * blue * (0.35 + 0.65 * flick);

        /* RIGHT: watercolor bloom spreading outward from the seam */
        float bloom = fbm(uv * 4.2 + 19.0);
        float fieldR = distance(uv, vec2(seam, 0.5)) * 0.9 + bloom * 0.7;
        float growR = mix(-0.10, 1.75, uRight);
        float revealR = clamp(smoothstep(fieldR - 0.07, fieldR + 0.07, growR) * rightSide, 0.0, 1.0);

        float spot = smoothstep(0.28, 0.0, distance(uv, uMouse)) * (uLeft + uRight);

        vec3 outc = pencil;
        outc = mix(outc, color, revealL);
        outc += vec3(0.15, 0.40, 0.90) * glowL * 0.7;
        outc = mix(outc, color, revealR);
        float wet = revealR * (1.0 - revealR) * 4.0;
        outc = mix(outc, outc * vec3(0.9, 0.85, 0.8), wet * 0.4 * rightSide);
        outc += spot * 0.06;
        float seamF = (uLeft + uRight) * smoothstep(0.012, 0.0, abs(uv.x - seam));
        outc += vec3(1.0, 0.96, 0.9) * seamF * 0.22;

        /* composited transparency: pencil shape at rest, colored shape where revealed,
           so the brain sits on the page with no parchment square */
        float alpha = pencilT.a;
        alpha = mix(alpha, colorT.a, revealL);
        alpha = mix(alpha, colorT.a, revealR);
        gl_FragColor = vec4(outc, alpha);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  /* targets eased toward each frame; DOM classes drive the label/menu swap */
  const stage = document.querySelector(".stage");
  let tLeft = 0, tRight = 0;

  function applyState(side) {
    tLeft  = side === "left"  ? 1 : 0;
    tRight = side === "right" ? 1 : 0;
    stage.classList.toggle("is-left",  side === "left");
    stage.classList.toggle("is-right", side === "right");
  }

  /* Hit zone: a horizontal band level with the brain, split at its center.
     Full page width so travelling out to a side menu keeps that half active. */
  function sideFromPoint(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const padY = r.height * 0.16;
    if (cy < r.top - padY || cy > r.bottom + padY) return null;
    uniforms.uMouse.value.set((cx - r.left) / r.width, 1 - (cy - r.top) / r.height);
    return cx < r.left + r.width / 2 ? "left" : "right";
  }

  const dbg = new URLSearchParams(location.search).get("dbg");
  if (dbg === "both") { tLeft = 1; tRight = 1; uniforms.uLeft.value = 1; uniforms.uRight.value = 1; }
  else if (dbg) { applyState(dbg === "right" ? "right" : "left"); uniforms.uLeft.value = tLeft; uniforms.uRight.value = tRight; }
  else {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) {
      document.addEventListener("pointerdown", (e) => applyState(sideFromPoint(e.clientX, e.clientY)), { passive: true });
    } else {
      document.addEventListener("pointermove", (e) => applyState(sideFromPoint(e.clientX, e.clientY)), { passive: true });
      document.addEventListener("pointerleave", () => applyState(null));
      window.addEventListener("blur", () => applyState(null));
    }
  }

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
    uniforms.uTime.value += Math.min(clock.getDelta(), 0.05);
    uniforms.uLeft.value  += (tLeft  - uniforms.uLeft.value)  * 0.09;
    uniforms.uRight.value += (tRight - uniforms.uRight.value) * 0.09;
    renderer.render(scene, camera);
  }
  tick();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { clock.getDelta(); tick(); }
  });
}
