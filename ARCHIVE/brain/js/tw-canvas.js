/* tw-canvas.js — live WebGL thumbnails for the Technical Writing cards.
   Each <canvas data-shader="TYPE"> runs a bespoke fragment shader that animates
   the subject of its paper. Offscreen canvases pause (IntersectionObserver),
   DPR is capped, and prefers-reduced-motion renders a single static frame.
   ES module: resolves "three" via the page importmap. */
import * as THREE from "three";

const PRELUDE = `
precision highp float;
uniform float uTime; uniform vec2 uRes;
mat2 rot(float a){ return mat2(cos(a),-sin(a),sin(a),cos(a)); }
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float fbm(vec2 p){ float v=0.,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }
`;

const FRAG = {
  // SSIA — markets: a flowing liquidity field, green↔blue
  ssia: `
    vec2 uv=gl_FragCoord.xy/uRes;
    vec2 q=uv*vec2(3.0,6.0); q.x+=uTime*0.28;
    float f=fbm(q+fbm(q+uTime*0.12));
    float streak=smoothstep(0.34,0.6,f);
    vec3 base=vec3(0.06,0.08,0.12);
    vec3 col=mix(base, mix(vec3(0.25,0.85,0.55),vec3(0.30,0.55,0.98),uv.x), streak*0.95);
    col+=0.05*smoothstep(0.985,1.0,sin(uv.x*70.0+uTime*1.5));
    gl_FragColor=vec4(col,1.0);
  `,
  // AuScan — geospatial: topographic contours with gold hotspots + scan sweep
  auscan: `
    vec2 p=(gl_FragCoord.xy*2.0-uRes)/uRes.y;
    float h=fbm(p*1.6+vec2(uTime*0.05,uTime*0.02));
    float c=abs(fract(h*9.0-uTime*0.2)-0.5);
    float line=smoothstep(0.05,0.0,c);
    vec3 base=vec3(0.07,0.09,0.13);
    float hot=smoothstep(0.72,0.96,h);
    float sweep=smoothstep(0.06,0.0,abs(p.x-(fract(uTime*0.12)*2.4-1.2)));
    vec3 col=base + line*vec3(0.25,0.45,0.85)*0.65 + hot*vec3(1.0,0.78,0.32)*1.3 + sweep*vec3(0.2,0.4,0.7);
    gl_FragColor=vec4(col,1.0);
  `,
  // AIW — AI writing: streaming token columns
  aiw: `
    vec2 uv=gl_FragCoord.xy/uRes;
    float cols=24.0;
    float x=floor(uv.x*cols);
    float speed=0.5+hash(vec2(x,1.0))*1.6;
    float gap=step(0.16,fract(uv.x*cols));
    float dash=step(0.45,fract(uv.y*30.0 - uTime*speed));
    float head=fract(uv.y + uTime*speed*0.22 + hash(vec2(x,7.0))*9.0);
    float bright=smoothstep(0.0,0.25,head)*smoothstep(1.0,0.45,head);
    vec3 base=vec3(0.05,0.07,0.11);
    vec3 col=base + vec3(0.35,0.62,1.0)*bright*dash*gap;
    gl_FragColor=vec4(col,1.0);
  `,
  // Booklite — agents: a drifting node swarm (glowing constellation)
  booklite: `
    vec2 p=(gl_FragCoord.xy*2.0-uRes)/uRes.y;
    vec3 col=vec3(0.06,0.08,0.12);
    float glow=0.0; vec2 prev=vec2(0.0);
    for(int i=0;i<9;i++){ float fi=float(i);
      vec2 c=vec2(sin(uTime*0.5+fi*1.7)*0.95, cos(uTime*0.42+fi*2.3)*0.55);
      glow+=0.011/length(p-c);
      if(i>0){ vec2 a=prev,b=c; vec2 pa=p-a, ba=b-a; float hh=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); glow+=0.004/length(pa-ba*hh); }
      prev=c;
    }
    col+=glow*vec3(0.32,0.6,1.0);
    gl_FragColor=vec4(col,1.0);
  `,
  // Singularity SEO — a vortex spiraling into a bright core
  seo: `
    vec2 p=(gl_FragCoord.xy*2.0-uRes)/uRes.y;
    float r=length(p), a=atan(p.y,p.x);
    float spiral=sin(a*5.0 - uTime*2.2 - log(max(r,0.04))*7.0);
    float arms=smoothstep(0.0,0.55,spiral)*smoothstep(1.25,0.08,r);
    vec3 base=vec3(0.06,0.08,0.12);
    vec3 col=base + arms*vec3(0.32,0.62,1.0);
    col+=vec3(0.55,0.75,1.0)*smoothstep(0.16,0.0,r);
    gl_FragColor=vec4(col,1.0);
  `,
  // A Little Help — quantum gravity: an accretion ring around a black hole
  horizon: `
    vec2 p=(gl_FragCoord.xy*2.0-uRes)/uRes.y;
    float r=length(p), a=atan(p.y,p.x);
    float swirl=0.5+0.5*sin(a - uTime*1.6 + 1.0/max(r,0.18)*2.2);
    float disk=smoothstep(0.62,0.46,r)*smoothstep(0.31,0.42,r);
    vec3 hot=mix(vec3(1.0,0.45,0.10),vec3(1.0,0.85,0.45),swirl);
    vec3 col=vec3(0.03,0.04,0.07);
    col+=disk*hot*swirl*1.7;
    col+=smoothstep(0.012,0.0,abs(r-0.34))*vec3(1.0,0.82,0.55)*0.9;
    col*=smoothstep(0.27,0.31,r);
    gl_FragColor=vec4(col,1.0);
  `,
  // Alice and Bob — entanglement: two orbs linked by a wave
  entangle: `
    vec2 p=(gl_FragCoord.xy*2.0-uRes)/uRes.y;
    vec2 A=vec2(-0.62,0.0), B=vec2(0.62,0.0);
    vec3 col=vec3(0.05,0.07,0.11);
    col+=(0.02/length(p-A))*vec3(0.35,0.62,1.0);
    col+=(0.02/length(p-B))*vec3(1.0,0.82,0.42);
    float s=clamp((p.x-A.x)/(B.x-A.x),0.0,1.0);
    vec2 onLine=mix(A,B,s); onLine.y+=sin(s*11.0-uTime*4.0)*0.13;
    col+=smoothstep(0.035,0.0,length(p-onLine))*vec3(0.6,0.8,1.0);
    gl_FragColor=vec4(col,1.0);
  `,
};

const VERT = `void main(){ gl_Position = vec4(position, 1.0); }`;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const instances = [];
let raf = 0, last = 0;

function makeInstance(canvas) {
  const type = canvas.getAttribute("data-shader");
  const frag = FRAG[type] ? PRELUDE + "void main(){" + FRAG[type] + "}" : PRELUDE + "void main(){ gl_FragColor=vec4(0.06,0.08,0.12,1.0); }";
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const cam = new THREE.Camera();
  const uniforms = { uTime: { value: Math.random() * 120 }, uRes: { value: new THREE.Vector2(2, 2) } };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  const inst = { canvas, renderer, scene, cam, uniforms, visible: false, w: 0, h: 0 };
  inst.resize = function () {
    const w = canvas.clientWidth || 320, h = canvas.clientHeight || 190;
    if (w === inst.w && h === inst.h) return;
    renderer.setSize(w, h, false);
    const pr = renderer.getPixelRatio();
    uniforms.uRes.value.set(w * pr, h * pr);
    inst.w = w; inst.h = h;
  };
  return inst;
}

function loop(t) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min((t - last) / 1000 || 0, 0.05); last = t;
  for (const inst of instances) {
    if (!inst.visible || !inst.canvas.isConnected) continue;
    inst.resize();
    inst.uniforms.uTime.value += dt;
    inst.renderer.render(inst.scene, inst.cam);
  }
}

function init() {
  // drop instances whose canvas left the DOM (SPA swaps)
  for (let i = instances.length - 1; i >= 0; i--) {
    if (!instances[i].canvas.isConnected) { try { instances[i].renderer.dispose(); } catch (e) {} instances.splice(i, 1); }
  }
  document.querySelectorAll("canvas[data-shader]").forEach((c) => {
    if (c.__twInit) return;
    c.__twInit = true;
    const inst = makeInstance(c);
    if (!inst) return;
    instances.push(inst);
    if (reduced) { inst.visible = true; inst.resize(); inst.uniforms.uTime.value = 8.0; inst.renderer.render(inst.scene, inst.cam); inst.visible = false; return; }
    const io = new IntersectionObserver((es) => { es.forEach((e) => { inst.visible = e.isIntersecting; }); }, { rootMargin: "120px" });
    io.observe(c);
  });
  if (!reduced && !raf) raf = requestAnimationFrame(loop);
}

window.TWCanvas = { init };
if (document.querySelector("canvas[data-shader]")) init();
