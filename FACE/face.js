import * as THREE from "three";

const stage = document.querySelector("#stage");
const fallback = document.querySelector("#fallback");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
} catch {
  fallback.style.display = "grid";
  throw new Error("WebGL unavailable");
}

renderer.setClearColor(0x000000, 1);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, 0.1, 40);
camera.position.z = 12.8;

const uniforms = {
  uTime: { value: 0 },
  uCycle: { value: 0 },
  uMouthOpen: { value: 0.02 },
  uMouthWide: { value: 0 },
  uMouthRound: { value: 0 },
  uPointer: { value: new THREE.Vector2() },
  uPixelRatio: { value: renderer.getPixelRatio() }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform float uCycle;
    uniform float uMouthOpen;
    uniform float uMouthWide;
    uniform float uMouthRound;
    uniform vec2 uPointer;
    uniform float uPixelRatio;
    varying float vLight;
    varying float vFace;
    varying float vSeed;

    float sat(float x) { return clamp(x, 0.0, 1.0); }
    float ease(float a, float b, float x) {
      float t = sat((x - a) / (b - a));
      return t * t * (3.0 - 2.0 * t);
    }
    float gauss(vec2 p, vec2 center, vec2 spread) {
      vec2 d = (p - center) / spread;
      return exp(-dot(d, d));
    }
    mat2 rotate2d(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
    }

    void main() {
      vec3 p = position;
      float emerge = ease(0.15, 2.65, uTime);
      float tiltIn = ease(2.6, 3.25, uCycle);
      float tiltOut = ease(4.15, 4.95, uCycle);
      float tilt = -0.155 * tiltIn * (1.0 - tiltOut);

      // Rotate the deformation itself, so the face moves inside one unbroken membrane.
      vec2 center = vec2(0.0, 0.15);
      vec2 q = rotate2d(-tilt) * (p.xy - center);
      q.x -= uPointer.x * 0.055;
      q.y -= uPointer.y * 0.035;

      // Strong jaw taper, broad forehead: one continuous sculpted mask.
      float jawTaper = mix(0.70, 1.0, ease(-2.8, 0.35, q.y));
      float rx = 2.35 * jawTaper;
      float ry = 3.18;
      float r = length(vec2(q.x / rx, q.y / ry));
      float faceMask = ease(1.11, 0.96, r);
      float skull = pow(max(0.0, 1.0 - r * r), 0.56) * 2.82;

      // Facial relief: brow, eye sockets, cheekbones, nose, muzzle and chin.
      float brow = gauss(q, vec2(0.0, 0.93), vec2(1.65, 0.28)) * 0.28;
      float eyeL = gauss(q, vec2(-0.78, 0.58), vec2(0.52, 0.23));
      float eyeR = gauss(q, vec2(0.78, 0.58), vec2(0.52, 0.23));
      float eyeSockets = -(eyeL + eyeR) * 0.66;
      float pupils = (gauss(q, vec2(-0.78, 0.57), vec2(0.105, 0.095)) +
                      gauss(q, vec2(0.78, 0.57), vec2(0.105, 0.095))) * 0.54;
      float noseBridge = gauss(q, vec2(0.0, 0.08), vec2(0.24, 0.92)) * 0.88;
      float noseTip = gauss(q, vec2(0.0, -0.28), vec2(0.46, 0.30)) * 0.58;
      float nostrils = -(gauss(q, vec2(-0.20, -0.34), vec2(0.09, 0.07)) +
                         gauss(q, vec2(0.20, -0.34), vec2(0.09, 0.07))) * 0.34;
      float cheeks = (gauss(q, vec2(-1.15, -0.27), vec2(0.64, 0.74)) +
                      gauss(q, vec2(1.15, -0.27), vec2(0.64, 0.74))) * 0.26;
      float chin = gauss(q, vec2(0.0, -2.10), vec2(0.72, 0.43)) * 0.42;

      // A living mouth cavity. Width/rounding/opening are driven by HELLO WORLD phonemes.
      float mouthRx = 0.88 * (1.0 + uMouthWide * 0.33 - uMouthRound * 0.30);
      float mouthRy = 0.13 + uMouthOpen * 0.72 + uMouthRound * 0.12;
      vec2 mouthP = vec2(q.x / mouthRx, (q.y + 1.15) / mouthRy);
      float mouthMetric = length(mouthP);
      float cavity = -ease(1.05, 0.74, mouthMetric) * (1.05 + uMouthOpen * 0.72);
      float lipRing = exp(-pow((mouthMetric - 1.0) * 5.2, 2.0)) * 0.58;
      float philtrum = gauss(q, vec2(0.0, -0.73), vec2(0.18, 0.30)) * 0.20;

      float relief = skull + brow + eyeSockets + pupils + noseBridge + noseTip +
                     nostrils + cheeks + chin + cavity + lipRing + philtrum;

      // Cloth-like tension radiates out from the emerging head into the whole field.
      float angle = atan(q.y / ry, q.x / rx);
      float outside = ease(0.74, 1.26, r) * (1.0 - ease(1.85, 2.55, r));
      float radialWrinkle = sin(r * 31.0 + angle * 4.0 + sin(angle * 3.0) * 1.4);
      float fineWrinkle = sin(r * 57.0 - angle * 7.0 + aSeed * 0.6);
      float sidePull = pow(abs(cos(angle)), 3.0) * 0.26 + 0.06;
      float wrinkles = outside * (radialWrinkle * sidePull + fineWrinkle * 0.035);

      // The untouched screen remains a field, never empty, with an almost imperceptible pulse.
      float ambient = sin(p.x * 0.72 + p.y * 0.45 + uTime * 0.22 + aSeed) * 0.018;
      float push = faceMask * relief + wrinkles;
      p.z = -0.72 + ambient + push * emerge;

      // The membrane draws inward as it protrudes, creating stretched streaks at the boundary.
      float pull = outside * emerge * 0.075 * sin(r * 18.0 + angle * 5.0);
      p.xy -= normalize(q + vec2(0.0001)) * pull;

      float feature = max(pupils * 1.8, max(lipRing, noseTip * 0.38));
      float mouthDark = ease(1.02, 0.72, mouthMetric);
      float eyeDark = sat((eyeL + eyeR) * 1.18 - pupils * 1.7);
      vFace = faceMask;
      vSeed = aSeed;
      vLight = 0.28 + faceMask * 0.48 + sat((p.z + 0.72) / 3.4) * 0.72 + feature;
      vLight *= 1.0 - mouthDark * 0.92;
      vLight *= 1.0 - eyeDark * 0.78;
      vLight += pupils * 1.2 + lipRing * 0.22;

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float perspective = 12.0 / max(1.0, -mv.z);
      gl_PointSize = min(8.5, aSize * uPixelRatio * perspective * (0.86 + vLight * 0.24));
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    varying float vLight;
    varying float vFace;
    varying float vSeed;
    uniform float uTime;
    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float d = length(p);
      if (d > 0.5) discard;
      float core = smoothstep(0.48, 0.04, d);
      float halo = smoothstep(0.50, 0.20, d) * 0.36;
      float shimmer = 0.91 + sin(uTime * 1.8 + vSeed * 9.0) * 0.09;
      vec3 deepGold = vec3(0.46, 0.245, 0.035);
      vec3 brightGold = vec3(1.0, 0.72, 0.18);
      vec3 gold = mix(deepGold, brightGold, clamp(vLight, 0.0, 1.0));
      float power = (core * 1.82 + halo) * shimmer * (0.66 + vLight * 0.54);
      gl_FragColor = vec4(gold * power, core + halo);
    }
  `
});

let cloud;
let geometry;

function buildField() {
  if (cloud) {
    scene.remove(cloud);
    geometry.dispose();
  }

  // Cover beyond every viewport edge so the background is an uninterrupted particle field.
  const aspect = innerWidth / innerHeight;
  const viewHeight = 10.75;
  const viewWidth = viewHeight * aspect;
  const area = viewWidth * viewHeight;
  const targetCount = innerWidth < 700 ? 72000 : 145000;
  const gap = Math.sqrt(area / targetCount);
  const cols = Math.ceil(viewWidth / gap) + 8;
  const rows = Math.ceil(viewHeight / gap) + 8;
  const count = cols * rows;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  let n = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const seed = Math.random() * Math.PI * 2;
      const x = (col - (cols - 1) / 2) * gap + (Math.random() - 0.5) * gap * 0.26;
      const y = (row - (rows - 1) / 2) * gap + (Math.random() - 0.5) * gap * 0.26;
      positions[n * 3] = x;
      positions[n * 3 + 1] = y;
      positions[n * 3 + 2] = 0;
      seeds[n] = seed;
      sizes[n] = 1.05 + Math.random() * 1.25;
      n++;
    }
  }

  geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  cloud = new THREE.Points(geometry, material);
  scene.add(cloud);
}

const phrase = [
  [5.15, 5.50, 0.12, 0.00, 0.00], // H
  [5.50, 5.88, 0.58, 0.28, 0.00], // EH
  [5.88, 6.25, 0.24, 0.44, 0.00], // L
  [6.25, 6.72, 0.62, -0.12, 0.68], // O
  [6.72, 7.00, 0.03, 0.00, 0.00],
  [7.00, 7.48, 0.38, -0.20, 0.82], // W
  [7.48, 7.86, 0.50, 0.18, 0.16], // OR
  [7.86, 8.22, 0.18, 0.40, 0.00], // L
  [8.22, 8.62, 0.05, 0.12, 0.00]  // D
];

function ease(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function mouthShape(t) {
  let open = 0.02;
  let wide = 0;
  let round = 0;
  for (const [start, end, o, w, r] of phrase) {
    const attack = ease((t - start) / 0.10);
    const release = 1 - ease((t - (end - 0.12)) / 0.12);
    const amount = Math.max(0, Math.min(attack, release));
    open += o * amount;
    wide += w * amount;
    round += r * amount;
  }
  return { open, wide, round };
}

const clock = new THREE.Clock();
const pointerTarget = new THREE.Vector2();
const pointer = new THREE.Vector2();

addEventListener("pointermove", (event) => {
  pointerTarget.x = (event.clientX / innerWidth - 0.5) * 2;
  pointerTarget.y = -(event.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

function animate() {
  const elapsed = clock.getElapsedTime();
  const cycle = reduceMotion ? 10.5 : elapsed % 13.5;
  const mouth = reduceMotion ? { open: 0.03, wide: 0, round: 0 } : mouthShape(cycle);
  pointer.lerp(pointerTarget, 0.035);

  uniforms.uTime.value = reduceMotion ? 12 : elapsed;
  uniforms.uCycle.value = cycle;
  uniforms.uMouthOpen.value = mouth.open;
  uniforms.uMouthWide.value = mouth.wide;
  uniforms.uMouthRound.value = mouth.round;
  uniforms.uPointer.value.copy(reduceMotion ? new THREE.Vector2() : pointer);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

let resizeTimer;
function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  uniforms.uPixelRatio.value = renderer.getPixelRatio();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildField, 120);
}

addEventListener("resize", resize, { passive: true });
buildField();
animate();
