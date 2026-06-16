/* scene.js
   FABLE WebGL field. A drifting ink-particle current that carries the page:
   it breathes with scroll velocity, leans away from the pointer, and
   re-colors itself for every chapter. Three.js, custom shaders, GPU only.

   Talks to app.js through window.FABLE_SCENE:
     setChapter(hexColor)  - tween the field toward a chapter accent
     setVelocity(v)        - scroll velocity, any range (smoothed here)
     setPointer(x, y)      - pointer in client coords
     setProgress(p)        - 0..1 overall page progress */

import * as THREE from "three";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

if (reduced || !supportsWebGL()) {
  root.classList.add(reduced ? "reduced-motion" : "no-webgl");
} else {
  init();
}

function init() {
  const holder = document.querySelector(".field");
  if (!holder) return;

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 760;
  const COUNT = coarse || small ? 9000 : 26000;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.75 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 0, 11);

  /* Particles seeded across a wide shallow slab; the shader streams them. */
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT * 4);
  const spreadX = 26, spreadY = 15, spreadZ = 7;
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * spreadX;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
    seeds[i * 4 + 0] = Math.random();
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = 0.4 + Math.random() * 0.6; /* size + pace */
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));

  const uniforms = {
    uTime:     { value: 0 },
    uFlow:     { value: 0 },                                  /* scroll energy */
    uProgress: { value: 0 },                                  /* page progress */
    uPointer:  { value: new THREE.Vector3(0, 0, 0) },          /* world x, y, strength */
    uInk:      { value: new THREE.Color(0xf4f1ea) },
    uAccent:   { value: new THREE.Color(0x5b8cff) },
    uDpr:      { value: renderer.getPixelRatio() },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime, uFlow, uProgress, uDpr;
      uniform vec3 uPointer;
      varying float vTone, vFade;

      /* cheap 3d noise built from sines, enough for wind */
      vec3 curl(vec3 p) {
        float t = uTime * 0.06;
        return vec3(
          sin(p.y * 0.55 + t * 2.1) + sin(p.z * 0.35 + t * 1.3),
          sin(p.z * 0.5  + t * 1.7) + sin(p.x * 0.3  + t * 1.1) * 0.6,
          sin(p.x * 0.45 + t * 1.9) + sin(p.y * 0.4  + t * 0.7)
        );
      }

      void main() {
        vec3 p = position;
        float pace = aSeed.w;

        /* endless lateral drift; scroll energy speeds the current */
        float drift = uTime * (0.18 + 0.55 * uFlow) * (0.4 + pace);
        p.x = mod(p.x + drift + aSeed.x * 26.0, 26.0) - 13.0;

        /* the field slowly rolls as the page progresses */
        p.y += sin(uProgress * 6.2831 + aSeed.y * 6.2831) * 1.1;

        vec3 w = curl(p * 0.7 + aSeed.xyz * 8.0);
        p += w * (0.5 + uFlow * 1.4) * (0.35 + aSeed.y * 0.65);

        /* pointer push */
        vec2 d = p.xy - uPointer.xy;
        float dist = length(d);
        float force = smoothstep(3.2, 0.0, dist) * uPointer.z;
        p.xy += normalize(d + 0.0001) * force * 1.6;

        vTone = aSeed.x;
        vFade = smoothstep(13.0, 9.5, abs(p.x)) * smoothstep(8.5, 5.0, abs(p.y));

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = (1.1 + aSeed.z * 2.4) * (1.0 + uFlow * 0.8);
        gl_PointSize = size * uDpr * (10.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      uniform vec3 uInk, uAccent;
      varying float vTone, vFade;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        float disc = smoothstep(0.5, 0.05, r);
        vec3 col = mix(uInk, uAccent, smoothstep(0.25, 0.85, vTone));
        float a = disc * vFade * 0.32;
        if (a < 0.003) discard;
        gl_FragColor = vec4(col, a);
      }
    `,
  });

  const points = new THREE.Points(geo, material);
  scene.add(points);

  /* ── public state ── */
  let targetAccent = new THREE.Color(0x5b8cff);
  let flow = 0, targetFlow = 0;
  let pointerTarget = new THREE.Vector3(0, 0, 0);
  let progressTarget = 0;

  const ndc = new THREE.Vector2();
  function clientToWorld(cx, cy) {
    ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    const dir = new THREE.Vector3(ndc.x, ndc.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = -camera.position.z / dir.z;
    return camera.position.clone().add(dir.multiplyScalar(t));
  }

  window.FABLE_SCENE = {
    setChapter(hex) { targetAccent = new THREE.Color(hex); },
    setVelocity(v) { targetFlow = Math.min(Math.abs(v) / 60, 1); },
    setPointer(x, y) {
      const w = clientToWorld(x, y);
      pointerTarget.set(w.x, w.y, 1);
    },
    setProgress(p) { progressTarget = p; },
  };

  /* ── loop ── */
  const clock = new THREE.Clock();
  let raf = null;

  function tick() {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value += dt;

    flow += (targetFlow - flow) * 0.06;
    targetFlow *= 0.94;
    uniforms.uFlow.value = flow;

    uniforms.uProgress.value += (progressTarget - uniforms.uProgress.value) * 0.05;
    uniforms.uPointer.value.lerp(pointerTarget, 0.08);
    pointerTarget.z *= 0.985;

    uniforms.uAccent.value.lerp(targetAccent, 0.045);

    renderer.render(scene, camera);
  }
  tick();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!raf) {
      clock.getDelta();
      tick();
    }
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uDpr.value = renderer.getPixelRatio();
  });

  if (!coarse) {
    window.addEventListener("pointermove", (e) => {
      window.FABLE_SCENE.setPointer(e.clientX, e.clientY);
    }, { passive: true });
  }
}
