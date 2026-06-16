/* fable2-gl.js · THE PRESS
   The artwork is press-printed onto the page. Each [data-press] image gets a
   DOM-synced WebGL plane running a CMYK halftone shader:
   - prints resolve from a coarse dot screen to the finished piece on entry
   - fast scrolling knocks the C/M/Y plates out of register, snapping back at rest
   - hovering coarsens the screen under the pointer, like a loupe on a proof
   The <img> stays in the DOM as the source of truth (SEO, no-JS, mobile).
   Desktop fine-pointer enhancement only; phones and reduced-motion never
   download three.js. Sampling is always the full texture at rest: the art can
   not be cropped by this layer. */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;
const still = window.location.search.indexOf("still") > -1;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

if (!reduced && !coarse && supportsWebGL() &&
    document.querySelector("[data-press]")) {
  import("three").then((THREE) => init(THREE)).catch(() => {});
}

function init(THREE) {
  const imgs = Array.from(document.querySelectorAll("[data-press]"));
  if (!imgs.length) return;

  const holder = document.querySelector(".pressfield");
  if (!holder) return;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  const DPR = Math.min(window.devicePixelRatio, 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight);
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  let camera = makeCamera();
  function makeCamera() {
    const c = new THREE.OrthographicCamera(0, window.innerWidth, 0, -window.innerHeight, -10, 10);
    return c;
  }

  const VERT = /* glsl */ `
    uniform float uVel;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      /* press shear: the sheet leans with scroll velocity */
      p.x += (uv.y - 0.5) * uVel * 14.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;

  const FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D uTex;
    uniform vec2 uSize;       /* plane size in px */
    uniform float uReveal;    /* 0 coarse screen -> 1 finished print */
    uniform float uVel;       /* scroll velocity, signed, lerped */
    uniform vec2 uMouse;      /* pointer in plane uv */
    uniform float uHover;     /* 0..1 */
    varying vec2 vUv;

    vec2 rot(vec2 p, float a) {
      float s = sin(a), c = cos(a);
      return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    }

    /* coverage of one ink plate at this fragment.
       angle per plate, classic press screen angles. */
    float plate(float ink, vec2 px, float cell, float ang) {
      vec2 r = rot(px, ang);
      vec2 cellCenter = (floor(r / cell) + 0.5) * cell;
      float d = length(r - cellCenter);
      float radius = cell * 0.62 * sqrt(clamp(ink, 0.0, 1.0));
      float aa = cell * 0.18;
      return smoothstep(radius + aa, radius - aa, d);
    }

    /* ink amounts (cmyk) for the texture at a given uv, with plate offset */
    vec4 inks(vec2 uv, vec2 ofs) {
      vec3 t = texture2D(uTex, clamp(uv + ofs, 0.0, 1.0)).rgb;
      float k = 1.0 - max(max(t.r, t.g), t.b);
      float den = max(1.0 - k, 1e-4);
      float c = (1.0 - t.r - k) / den;
      float m = (1.0 - t.g - k) / den;
      float y = (1.0 - t.b - k) / den;
      return vec4(c, m, y, k);
    }

    void main() {
      vec2 px = vUv * uSize;

      /* loupe: the screen coarsens near the pointer while hovering */
      float lens = uHover * smoothstep(0.42, 0.0, distance(vUv * vec2(uSize.x / uSize.y, 1.0), uMouse * vec2(uSize.x / uSize.y, 1.0)));

      /* dot cell size: coarse while revealing, fine when resolved */
      float cell = mix(16.0, 4.2, uReveal) * (1.0 + lens * 2.4);

      /* misregistration: plates drift with velocity, k stays true */
      float mis = clamp(uVel, -1.0, 1.0) * 0.006 * (1.0 + lens * 1.5);

      vec4 cC = inks(vUv, vec2( mis, 0.0));
      vec4 cM = inks(vUv, vec2(-mis * 0.7,  mis * 0.7));
      vec4 cY = inks(vUv, vec2( mis * 0.7,  mis * 0.7));
      vec4 cK = inks(vUv, vec2(0.0));

      float covC = plate(cC.x, px, cell, 0.2618); /* 15deg */
      float covM = plate(cM.y, px, cell, 1.3090); /* 75deg */
      float covY = plate(cY.z, px, cell, 0.0);    /*  0deg */
      float covK = plate(cK.w, px, cell, 0.7854); /* 45deg */

      /* subtractive ink on paper */
      vec3 paper = vec3(1.0, 0.992, 0.972);
      vec3 ht = paper;
      ht.r *= 1.0 - covC * 0.92;
      ht.g *= 1.0 - covM * 0.92;
      ht.b *= 1.0 - covY * 0.88;
      ht *= 1.0 - covK * 0.95;

      /* finished print: the true texture (full, uncropped, unwarped) */
      vec3 tex = texture2D(uTex, vUv).rgb;

      /* crossfade: dots resolve into the real plate; loupe pulls back to dots */
      float resolve = smoothstep(0.55, 1.0, uReveal) * (1.0 - lens * 0.85);
      /* a touch of misregistration ghost on the resolved print while moving */
      vec3 texMis = vec3(
        texture2D(uTex, clamp(vUv + vec2(mis, 0.0), 0.0, 1.0)).r,
        tex.g,
        texture2D(uTex, clamp(vUv - vec2(mis, 0.0), 0.0, 1.0)).b
      );
      vec3 col = mix(ht, texMis, resolve);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const items = [];
  const loader = new THREE.TextureLoader();

  imgs.forEach((img) => {
    loader.load(img.currentSrc || img.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTex:    { value: tex },
          uSize:   { value: new THREE.Vector2(1, 1) },
          uReveal: { value: still ? 1 : 0 },
          uVel:    { value: 0 },
          uMouse:  { value: new THREE.Vector2(-10, -10) },
          uHover:  { value: 0 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      });

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 24), material);
      scene.add(mesh);

      const item = {
        img, mesh, material,
        reveal: still ? 1 : 0, revealT: still ? 1 : 0,
        hover: 0, hoverT: 0,
        mouse: new THREE.Vector2(-10, -10),
      };
      items.push(item);
      img.closest(".art")?.classList.add("press-live");

      img.addEventListener("pointerenter", () => { item.hoverT = 1; });
      img.addEventListener("pointerleave", () => { item.hoverT = 0; });
      img.addEventListener("pointermove", (e) => {
        const r = img.getBoundingClientRect();
        item.mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      });

      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { item.revealT = 1; io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(img);
    });
  });

  /* scroll velocity, shared with the rest of the page via window.__pressVel */
  let vel = 0;

  let raf = null;
  function tick() {
    raf = requestAnimationFrame(tick);
    const target = (window.__pressVel || 0) / 90;
    vel += (Math.max(-1, Math.min(1, target)) - vel) * 0.08;

    for (const it of items) {
      const r = it.img.getBoundingClientRect();
      if (r.bottom < -80 || r.top > window.innerHeight + 80) { it.mesh.visible = false; continue; }
      it.mesh.visible = true;
      it.mesh.scale.set(r.width, r.height, 1);
      it.mesh.position.set(r.left + r.width / 2, -(r.top + r.height / 2), 0);

      it.reveal += (it.revealT - it.reveal) * 0.045;
      it.hover += (it.hoverT - it.hover) * 0.12;

      const u = it.material.uniforms;
      u.uSize.value.set(r.width * DPR, r.height * DPR);
      u.uReveal.value = it.reveal;
      u.uVel.value = vel;
      u.uHover.value = it.hover;
      u.uMouse.value.copy(it.mouse);
    }
    renderer.render(scene, camera);
  }
  tick();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) tick();
  });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera = makeCamera();
  });
}
