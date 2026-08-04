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

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.append(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.032);

const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.15, 15.2);

const portrait = new THREE.Group();
portrait.position.y = -0.15;
scene.add(portrait);

const GOLD = new THREE.Color("#d8a93b");
const PALE_GOLD = new THREE.Color("#ffe077");
const DEEP_GOLD = new THREE.Color("#9a650e");
const points = [];

function addPoint(x, y, z, kind = 0, brightness = 0.75) {
  points.push({ x, y, z, bx: x, by: y, bz: z, kind, brightness, seed: Math.random() * Math.PI * 2 });
}

function ellipse(cx, cy, rx, ry, z, count, kind = 0, brightness = 0.8, arcStart = 0, arcEnd = Math.PI * 2) {
  for (let i = 0; i < count; i++) {
    const a = arcStart + (arcEnd - arcStart) * (i / count) + (Math.random() - 0.5) * 0.025;
    addPoint(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z + (Math.random() - 0.5) * 0.025, kind, brightness);
  }
}

function line(a, b, count, kind = 0, brightness = 0.75, bow = 0) {
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const s = Math.sin(t * Math.PI) * bow;
    addPoint(
      THREE.MathUtils.lerp(a[0], b[0], t),
      THREE.MathUtils.lerp(a[1], b[1], t) + s,
      THREE.MathUtils.lerp(a[2], b[2], t),
      kind,
      brightness
    );
  }
}

// Face shell: a tapered, slightly asymmetric front half of an ellipsoid.
for (let i = 0; i < 10200; i++) {
  const v = Math.acos(1 - 2 * Math.random());
  const u = (Math.random() - 0.5) * Math.PI * 1.12;
  const sy = Math.cos(v);
  const jaw = THREE.MathUtils.lerp(0.69, 1, THREE.MathUtils.smoothstep(sy, -0.72, 0.2));
  let x = 2.42 * Math.sin(v) * Math.sin(u) * jaw;
  let y = 3.22 * sy;
  let z = 1.62 * Math.sin(v) * Math.cos(u);
  if (z < -0.12 || y < -2.95) continue;

  // Cheekbones, muzzle, chin and brow planes.
  const cheek = Math.exp(-((Math.abs(x) - 1.2) ** 2) / 0.38 - ((y + 0.3) ** 2) / 0.9);
  const muzzle = Math.exp(-(x * x) / 0.9 - ((y + 1.15) ** 2) / 0.5);
  const brow = Math.exp(-(x * x) / 4.8 - ((y - 0.86) ** 2) / 0.13);
  const chin = Math.exp(-(x * x) / 0.75 - ((y + 2.35) ** 2) / 0.2);
  z += cheek * 0.22 + muzzle * 0.12 + brow * 0.09 + chin * 0.2;

  // Leave crisp negative-space slots for glasses and mouth.
  const glassesVoid = y > 0.42 && y < 1.36 && Math.abs(x) < 2.03;
  const mouthVoid = y > -1.72 && y < -0.98 && Math.abs(x) < 1.28;
  if (glassesVoid || mouthVoid) continue;
  addPoint(x, y, z, 0, 0.38 + Math.random() * 0.53);
}

// Ears.
ellipse(-2.35, -0.05, 0.42, 0.78, 0.05, 180, 0, 0.55);
ellipse(2.35, -0.05, 0.42, 0.78, 0.05, 180, 0, 0.55);

// Slicked hair cap and swept-back ridges.
for (let r = 0; r < 13; r++) {
  const x0 = -1.75 + r * 0.29;
  const lean = (r - 6) * 0.045;
  for (let i = 0; i < 75; i++) {
    const t = i / 74;
    const x = x0 + lean * t + Math.sin(t * Math.PI) * 0.3;
    const y = 2.05 + t * 1.08 + Math.sin(t * Math.PI) * 0.18;
    const z = 1.05 - Math.abs(x) * 0.18 + Math.sin(t * Math.PI) * 0.2;
    addPoint(x, y, z, 0, 0.66 + Math.random() * 0.3);
  }
}
ellipse(0, 2.35, 2.05, 1.08, 0.8, 520, 0, 0.62, 0, Math.PI);

// Sunglasses: gold rims, bridge, arms, dark interiors made by absent face dots.
ellipse(-1.03, 0.84, 0.92, 0.57, 1.69, 310, 0, 1);
ellipse(1.03, 0.84, 0.92, 0.57, 1.69, 310, 0, 1);
line([-0.18, 0.93, 1.72], [0.18, 0.93, 1.72], 50, 0, 1, 0.08);
line([-1.88, 0.97, 1.46], [-2.35, 1.1, 0.8], 65, 0, 0.78);
line([1.88, 0.97, 1.46], [2.35, 1.1, 0.8], 65, 0, 0.78);

// Eyes and pupils, visible as sparse glints behind the frames.
ellipse(-1.02, 0.82, 0.45, 0.13, 1.73, 90, 2, 0.9);
ellipse(1.02, 0.82, 0.45, 0.13, 1.73, 90, 2, 0.9);
ellipse(-1.02, 0.82, 0.065, 0.065, 1.77, 30, 2, 1);
ellipse(1.02, 0.82, 0.065, 0.065, 1.77, 30, 2, 1);

// Nose and smile creases.
line([0.03, 0.7, 1.7], [-0.1, -0.52, 2.08], 180, 0, 0.82, -0.05);
ellipse(0, -0.6, 0.38, 0.15, 2.03, 80, 0, 0.77, 0, Math.PI);
line([-1.35, -0.72, 1.62], [-1.03, -1.18, 1.82], 70, 0, 0.66, 0.08);
line([1.35, -0.72, 1.62], [1.03, -1.18, 1.82], 70, 0, 0.66, 0.08);

// Mouth is a separate particle rig. Its base coordinates are morphed per phoneme.
for (let ring = 0; ring < 9; ring++) {
  const rr = ring / 8;
  ellipse(0, -1.34, 1.08 * (0.74 + rr * 0.26), 0.16 + rr * 0.2, 1.83 + rr * 0.06, 115, 1, 0.7 + rr * 0.3);
}

// Neck, collar, tie and shoulders give the floating head a bust silhouette.
for (let i = 0; i < 1200; i++) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const y = -2.7 - Math.random() * 2.1;
  const width = THREE.MathUtils.lerp(1.05, 1.48, (-y - 2.7) / 2.1);
  const x = side * (Math.random() * width);
  const z = 0.65 - Math.abs(x) * 0.22;
  addPoint(x, y, z, 0, 0.35 + Math.random() * 0.45);
}
line([-1.25, -4.45, 0.55], [-4.55, -5.35, -0.1], 520, 0, 0.42);
line([1.25, -4.45, 0.55], [4.55, -5.35, -0.1], 520, 0, 0.42);
line([-1.4, -4.08, 0.72], [0, -5.02, 1.05], 180, 0, 0.78);
line([1.4, -4.08, 0.72], [0, -5.02, 1.05], 180, 0, 0.78);
line([0, -4.7, 1.06], [0, -5.55, 0.9], 160, 0, 0.85);

const count = points.length;
const positions = new Float32Array(count * 3);
const homes = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const sizes = new Float32Array(count);
const seeds = new Float32Array(count);
const kinds = new Float32Array(count);

points.forEach((p, i) => {
  const j = i * 3;
  homes[j] = p.bx; homes[j + 1] = p.by; homes[j + 2] = p.bz;
  const scatter = 8 + Math.random() * 14;
  positions[j] = p.bx + (Math.random() - 0.5) * scatter;
  positions[j + 1] = p.by + (Math.random() - 0.5) * scatter;
  positions[j + 2] = p.bz + (Math.random() - 0.5) * scatter;
  const color = DEEP_GOLD.clone().lerp(GOLD, p.brightness).lerp(PALE_GOLD, Math.max(0, p.brightness - 0.78) * 2.1);
  colors[j] = color.r; colors[j + 1] = color.g; colors[j + 2] = color.b;
  sizes[i] = 1.8 + Math.random() * 3.1;
  seeds[i] = p.seed;
  kinds[i] = p.kind;
});

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
  vertexShader: `
    attribute float aSize;
    attribute float aSeed;
    varying vec3 vColor;
    varying float vPulse;
    uniform float uTime;
    uniform float uPixelRatio;
    void main() {
      vColor = color;
      vPulse = .78 + .22 * sin(uTime * 2.15 + aSeed * 5.0);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = min(9.0, aSize * uPixelRatio * (12.8 / max(1.0, -mv.z)));
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vPulse;
    void main() {
      vec2 p = gl_PointCoord - .5;
      float d = length(p);
      if (d > .5) discard;
      float core = smoothstep(.5, .04, d);
      float glow = smoothstep(.5, .18, d) * .55;
      gl_FragColor = vec4(vColor * (core * 2.35 + glow) * vPulse, core + glow);
    }
  `
});

const cloud = new THREE.Points(geometry, material);
portrait.add(cloud);

const clock = new THREE.Clock();
const pointer = new THREE.Vector2();
const pointerTarget = new THREE.Vector2();

addEventListener("pointermove", (event) => {
  pointerTarget.x = (event.clientX / innerWidth - 0.5) * 2;
  pointerTarget.y = -(event.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

const phrase = [
  // start, end, openness, width, rounding — a silent HEL-LO WORLD
  [5.20, 5.52, 0.12, 0.00, 0.00],
  [5.52, 5.88, 0.62, 0.24, 0.00],
  [5.88, 6.25, 0.28, 0.42, 0.00],
  [6.25, 6.70, 0.68, -0.12, 0.62],
  [6.70, 7.02, 0.06, 0.00, 0.00],
  [7.02, 7.48, 0.42, -0.18, 0.78],
  [7.48, 7.86, 0.54, 0.18, 0.15],
  [7.86, 8.20, 0.20, 0.38, 0.00],
  [8.20, 8.58, 0.08, 0.10, 0.00]
];

function smoother(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function mouthShape(t) {
  let open = 0.02, wide = 0, round = 0;
  for (const [start, end, o, w, r] of phrase) {
    const attack = smoother((t - start) / 0.10);
    const release = 1 - smoother((t - (end - 0.12)) / 0.12);
    const amount = Math.max(0, Math.min(attack, release));
    open += o * amount;
    wide += w * amount;
    round += r * amount;
  }
  return { open, wide, round };
}

function animate() {
  const elapsed = clock.getElapsedTime();
  const cycle = reduceMotion ? 10.8 : elapsed % 13.5;
  material.uniforms.uTime.value = elapsed;
  pointer.lerp(pointerTarget, 0.035);

  // Arrival, curious cock, return to center, speech, then an unwavering stare.
  const arrive = reduceMotion ? 1 : smoother(cycle / 2.35);
  const cockIn = smoother((cycle - 2.55) / 0.7);
  const cockOut = smoother((cycle - 4.05) / 0.78);
  const cock = cockIn * (1 - cockOut);
  const stare = smoother((cycle - 8.55) / 0.8);

  portrait.rotation.z = THREE.MathUtils.lerp(-0.018, -0.17, cock);
  portrait.rotation.y = pointer.x * 0.035 * (1 - stare);
  portrait.rotation.x = -pointer.y * 0.022 * (1 - stare);
  portrait.position.x = cock * -0.14;

  const mouth = mouthShape(cycle);
  const pos = geometry.attributes.position.array;
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    let tx = homes[j];
    let ty = homes[j + 1];
    let tz = homes[j + 2];

    if (kinds[i] === 1) {
      const relX = tx / 1.1;
      const relY = (ty + 1.34) / 0.36;
      const centerWeight = 1 - Math.min(1, Math.abs(relX));
      tx *= 1 + mouth.wide * 0.23 - mouth.round * 0.24;
      ty = -1.34 + relY * (0.36 + mouth.open * (0.33 + centerWeight * 0.2));
      tz += mouth.open * 0.13 * centerWeight + mouth.round * 0.12;
    }

    // A restrained blink as the face settles into the stare.
    if (kinds[i] === 2) {
      const blink = Math.max(0, 1 - Math.abs(cycle - 9.3) / 0.11);
      ty = THREE.MathUtils.lerp(ty, ty > 0.82 ? 0.84 : 0.80, blink);
      tx += pointer.x * 0.018 * (1 - stare);
    }

    const twinkle = Math.sin(elapsed * 0.85 + seeds[i] * 8) * 0.0025;
    tx += twinkle;
    ty += Math.cos(elapsed * 0.72 + seeds[i] * 5) * 0.002;

    // Spring from the initial exploded field into the portrait.
    const spring = 0.028 + arrive * 0.115;
    pos[j] += (tx - pos[j]) * spring;
    pos[j + 1] += (ty - pos[j + 1]) * spring;
    pos[j + 2] += (tz - pos[j + 2]) * spring;
  }
  geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function resize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  // Keep the entire bust comfortably framed across tall and wide screens.
  const portraitScale = innerWidth / innerHeight < 0.82 ? 0.78 : 1;
  portrait.scale.setScalar(portraitScale);
}

addEventListener("resize", resize, { passive: true });
resize();
animate();
