/* m-brain.js — the mobile hero brain. Shader brain with firing synapses, lights
   toward touch, ripples + haptic on tap, leans with gyro. Shares the governor loop. */
import * as THREE from "three";
import { MFX } from "./m-core.js";

export function initBrain() {
  const canvas = document.querySelector("canvas[data-brain]");
  if (!canvas) return;
  const fall = canvas.parentElement.querySelector(".fallimg");

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { if (fall) fall.style.display = "block"; return; }
  renderer.setPixelRatio(MFX.dpr());
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const loader = new THREE.TextureLoader();
  let n = 0; const done = () => { if (++n === 2 && fall) fall.style.opacity = "0"; render(); };
  const off = loader.load("mobile/img/brain-off.webp", done);
  const on  = loader.load("mobile/img/brain-on.webp", done);
  [off, on].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; });

  const u = {
    uOff:{value:off}, uOn:{value:on}, uTime:{value:0}, uCharge:{value:0.14},
    uTouch:{value:new THREE.Vector2(0.5,0.5)}, uTouchOn:{value:0},
    uTilt:{value:new THREE.Vector2(0,0)}, uRipple:{value:0},
  };
  const mat = new THREE.ShaderMaterial({ uniforms:u, transparent:true,
    vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}",
    fragmentShader:`precision highp float;
      uniform sampler2D uOff,uOn;uniform float uTime,uCharge,uTouchOn,uRipple;uniform vec2 uTouch,uTilt;varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));vec2 u=f*f*(3.-2.*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
      void main(){
        vec2 uv=vUv+uTilt*0.04;
        vec4 cOff=texture2D(uOff,uv), cOn=texture2D(uOn,uv);
        float t=uTime;
        float base=uCharge+(0.5+0.5*sin(t*0.9))*0.06;
        float dT=distance(uv,uTouch);
        float touchGlow=uTouchOn*smoothstep(0.42,0.0,dT)*0.9;
        // firing synapses: travelling bright filaments
        float veins=fbm(uv*7.0+vec2(t*0.35,-t*0.22));
        float fire=smoothstep(0.62,0.98,veins)* (0.5+0.5*sin(t*6.0+veins*22.0));
        float ring=0.0;
        if(uRipple>0.001){float r=uRipple*0.72;ring=smoothstep(0.05,0.0,abs(dT-r))*(1.0-uRipple)*1.3;}
        float rev=clamp(base+touchGlow+ring+veins*0.16*base+fire*0.25,0.0,1.0);
        vec3 col=mix(cOff.rgb,cOn.rgb,rev);
        float a=mix(cOff.a,cOn.a,rev);
        col+=vec3(0.10,0.32,0.72)*rev*(0.6+0.4*sin(t*3.2+veins*12.0))*0.24;
        col+=vec3(0.2,0.5,1.0)*fire*0.5;
        gl_FragColor=vec4(col,a);
      }`});
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));

  function size(){ const w=canvas.clientWidth||300, h=canvas.clientHeight||300; renderer.setSize(w,h,false); }
  size(); function render(){ renderer.render(scene,camera); } render();

  const sc = MFX.add({ visible:true, tick(dt){
    u.uTime.value += dt;
    u.uCharge.value += (0.14 - u.uCharge.value)*0.03;
    if(u.uRipple.value>0){ u.uRipple.value=Math.min(1,u.uRipple.value+dt*0.9); if(u.uRipple.value>=1) u.uRipple.value=0; }
    u.uTouchOn.value *= 0.95;
    render();
  }, dispose(){ renderer.dispose(); } });

  const rect=()=>canvas.getBoundingClientRect();
  canvas.style.touchAction="none";
  canvas.addEventListener("pointermove",(e)=>{ const r=rect(); u.uTouch.value.set((e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height); u.uTouchOn.value=1; u.uCharge.value=Math.min(1,u.uCharge.value+0.04); },{passive:true});
  canvas.addEventListener("pointerdown",(e)=>{ const r=rect(); u.uTouch.value.set((e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height); u.uTouchOn.value=1; u.uCharge.value=1.0; u.uRipple.value=0.001; MFX.haptic(14); const h=document.querySelector(".m-taphint"); if(h)h.classList.add("gone"); },{passive:true});
  MFX.onGyro((gx,gy)=>u.uTilt.value.set(gx,gy));
  addEventListener("resize",()=>{ size(); render(); });
  const io=new IntersectionObserver((es)=>es.forEach((e)=>sc.visible=e.isIntersecting),{rootMargin:"60px"}); io.observe(canvas);
}
