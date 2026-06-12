/* fable2-gl.js
   The ink in the paper. A Three.js fragment shader that lets the pointer
   leave faint warm ink blooms in the page surface, fading like wet ink
   drying. Pure decoration at very low opacity. The page never depends on it:
   touch devices, reduced motion, and missing WebGL all simply skip this. */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

/* dynamic import: phones and reduced-motion users never download three.js */
if (!reduced && !coarse && supportsWebGL()) {
  import("three").then((THREE) => init(THREE)).catch(() => {});
}

function init(THREE) {
  const holder = document.querySelector(".inkfield");
  if (!holder) return;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const N = 18;
  const pts = [];
  for (let i = 0; i < N; i++) pts.push(new THREE.Vector3(-10, -10, -100));
  let head = 0;

  const uniforms = {
    uTime:   { value: 0 },
    uAspect: { value: window.innerWidth / window.innerHeight },
    uPts:    { value: pts },
    uInk:    { value: new THREE.Color(0x2a1c14) },
  };

  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        uniform float uTime, uAspect;
        uniform vec3 uPts[${N}];
        uniform vec3 uInk;
        varying vec2 vUv;

        float n2(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec2 p = vec2(vUv.x * uAspect, vUv.y);
          float a = 0.0;
          for (int i = 0; i < ${N}; i++) {
            vec3 pt = uPts[i];
            float age = uTime - pt.z;
            if (age < 0.0 || age > 4.0) continue;
            vec2 c = vec2(pt.x * uAspect, pt.y);
            float d = distance(p, c);
            /* ink spreads a touch as it dries, edge wobbles organically */
            float r = 0.045 + age * 0.02 + 0.012 * n2(c * 40.0 + floor(uTime * 2.0));
            float blot = smoothstep(r, r * 0.25, d);
            float dry = 1.0 - smoothstep(0.0, 4.0, age);
            a += blot * dry;
          }
          a = min(a, 1.0) * 0.10;
          if (a < 0.002) discard;
          gl_FragColor = vec4(uInk, a);
        }
      `,
    })
  );
  scene.add(quad);

  const clock = new THREE.Clock();
  let clockTime = 0;
  let raf = null;

  let last = { x: -1, y: -1 };
  window.addEventListener("pointermove", (e) => {
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (dx * dx + dy * dy < 900) return; /* drop a blot every ~30px of travel */
    last = { x: e.clientX, y: e.clientY };
    const v = pts[head];
    v.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight, clockTime);
    head = (head + 1) % N;
  }, { passive: true });

  function tick() {
    raf = requestAnimationFrame(tick);
    clockTime += Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value = clockTime;
    renderer.render(scene, camera);
  }
  tick();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { clock.getDelta(); tick(); }
  });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uAspect.value = window.innerWidth / window.innerHeight;
  });
}
