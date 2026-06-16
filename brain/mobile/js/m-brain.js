/* m-brain.js — the mobile hero brain. A shader that lives: idle shimmer, lights
   toward where you touch, ripples on tap, and leans with the phone's gyroscope.
   Falls back to a static image if WebGL is unavailable. Paints frame 1 immediately. */
import * as THREE from "three";

export function initMobileBrain(canvas, opts = {}) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fall = opts.fallback;

  function supportsWebGL() {
    try { const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  }
  if (!supportsWebGL()) { if (fall) fall.style.display = "block"; return null; }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const loader = new THREE.TextureLoader();
  let loaded = 0;
  const onLoad = () => { if (++loaded === 2 && fall) fall.style.opacity = "0"; render(); };
  const off = loader.load("mobile/img/brain-off.webp", onLoad);
  const on  = loader.load("mobile/img/brain-on.webp", onLoad);
  [off, on].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; });

  const u = {
    uOff: { value: off }, uOn: { value: on },
    uTime: { value: 0 }, uCharge: { value: 0.12 },
    uTouch: { value: new THREE.Vector2(0.5, 0.5) }, uTouchOn: { value: 0 },
    uTilt: { value: new THREE.Vector2(0, 0) }, uRipple: { value: 0 }, uReduced: { value: reduced ? 1 : 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: true,
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }",
    fragmentShader: `
      precision highp float;
      uniform sampler2D uOff,uOn; uniform float uTime,uCharge,uTouchOn,uRipple,uReduced;
      uniform vec2 uTouch,uTilt; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p);
        float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));
        vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
      float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
      void main(){
        vec2 uv = vUv + uTilt * 0.04;            // gyro parallax
        vec4 cOff = texture2D(uOff, uv);
        vec4 cOn  = texture2D(uOn, uv);
        float t = (uReduced>0.5)? 0.0 : uTime;
        // base charge rises with interaction; idle breathing
        float breathe = 0.5 + 0.5*sin(t*0.9);
        float base = uCharge + breathe*0.06;
        // glow toward touch point
        float dT = distance(uv, uTouch);
        float touchGlow = uTouchOn * smoothstep(0.42, 0.0, dT) * 0.9;
        // travelling shimmer veins
        float veins = fbm(uv*6.0 + vec2(t*0.3, -t*0.2));
        // expanding ripple from last tap
        float ring = 0.0;
        if (uRipple > 0.001) {
          float r = uRipple * 0.7;
          ring = smoothstep(0.05, 0.0, abs(dT - r)) * (1.0 - uRipple) * 1.2;
        }
        float rev = clamp(base + touchGlow + ring + veins*0.18*base, 0.0, 1.0);
        vec3 col = mix(cOff.rgb, cOn.rgb, rev);
        float a = mix(cOff.a, cOn.a, rev);
        // electric blue lift on lit areas
        float flick = 0.6 + 0.4*sin(t*3.2 + veins*12.0);
        col += vec3(0.10,0.32,0.72) * rev * flick * 0.22;
        gl_FragColor = vec4(col, a);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  function size() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
  }
  size();
  function render() { renderer.render(scene, camera); }
  render(); // guaranteed first paint

  const clock = new THREE.Clock();
  let raf = 0, visible = true;
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    u.uTime.value += Math.min(clock.getDelta(), 0.05);
    // ease charge back down, ripple outward, touch fade
    u.uCharge.value += (0.12 - u.uCharge.value) * 0.03;
    if (u.uRipple.value > 0) u.uRipple.value = Math.min(1, u.uRipple.value + 0.02);
    if (u.uRipple.value >= 1) u.uRipple.value = 0;
    u.uTouchOn.value *= 0.96;
    render();
  }
  if (!reduced) tick();

  // visibility pause (battery)
  try {
    const io = new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; }), { rootMargin: "60px" });
    io.observe(canvas);
  } catch (e) {}
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; });
  window.addEventListener("resize", () => { size(); render(); });

  const api = {
    touch(nx, ny) { u.uTouch.value.set(nx, ny); u.uTouchOn.value = 1; u.uCharge.value = Math.min(1, u.uCharge.value + 0.05); },
    tap(nx, ny) { u.uTouch.value.set(nx, ny); u.uTouchOn.value = 1; u.uCharge.value = 1.0; u.uRipple.value = 0.001; },
    tilt(gx, gy) { u.uTilt.value.set(gx, gy); },
  };
  return api;
}
