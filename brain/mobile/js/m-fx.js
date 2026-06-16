/* m-fx.js — ambient full-bleed background scene: drifting neural dust + flow,
   tinted to the section accent, gyro parallax. Cheap single-quad fragment shader. */
import * as THREE from "three";
import { MFX } from "./m-core.js";

export function initBgScene() {
  const host = document.querySelector(".m-stage[data-bgscene]");
  if (!host) return;
  const canvas = document.createElement("canvas"); host.appendChild(canvas);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "low-power" }); }
  catch (e) { host.classList.add("m-fallbg"); return; }
  renderer.setPixelRatio(Math.min(MFX.dpr(), 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // accent color from theme
  const art = document.body.classList.contains("t-art");
  const rose = document.body.classList.contains("t-rose");
  const col = art ? new THREE.Vector3(0.90, 0.64, 0.30)
            : rose ? new THREE.Vector3(0.91, 0.48, 0.42)
            : new THREE.Vector3(0.30, 0.55, 0.91);
  const count = MFX.tier === "A" ? 90.0 : 46.0;

  const u = { uTime:{value:0}, uRes:{value:new THREE.Vector2(1,1)}, uTilt:{value:new THREE.Vector2(0,0)}, uCol:{value:col}, uN:{value:count} };
  const mat = new THREE.ShaderMaterial({ uniforms:u, transparent:true,
    vertexShader:"void main(){gl_Position=vec4(position,1.0);}",
    fragmentShader:`precision highp float;
      uniform float uTime,uN;uniform vec2 uRes,uTilt;uniform vec3 uCol;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));vec2 u=f*f*(3.-2.*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
      void main(){
        vec2 uv=gl_FragCoord.xy/uRes.xy; float asp=uRes.x/uRes.y;
        vec2 p=(uv-0.5); p.x*=asp; p+=uTilt*0.06;
        vec3 c=vec3(0.0);
        // faint flow
        float flow=noise(p*3.0+vec2(uTime*0.05,uTime*0.03));
        c+=uCol*flow*0.05;
        // drifting glints
        for(float i=0.0;i<90.0;i++){
          if(i>=uN) break;
          float s=hash(vec2(i,1.0));
          vec2 gp=vec2(hash(vec2(i,2.0)), fract(hash(vec2(i,3.0))+uTime*(0.01+s*0.03)));
          gp=(gp-0.5); gp.x*=asp;
          float d=length(p-gp);
          float tw=0.5+0.5*sin(uTime*(1.0+s*3.0)+i);
          c+=uCol*(0.0009/(d*d+0.0008))*(0.4+0.6*tw)*0.5;
        }
        float a=clamp(max(max(c.r,c.g),c.b),0.0,1.0);
        gl_FragColor=vec4(c, a*0.9);
      }`});
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));

  function size(){ const w=host.clientWidth||innerWidth, h=host.clientHeight||innerHeight; renderer.setSize(w,h,false); u.uRes.value.set(w*renderer.getPixelRatio(), h*renderer.getPixelRatio()); }
  size(); function render(){ renderer.render(scene,camera); } render();

  const sc = MFX.add({ visible:true, tick(dt){ u.uTime.value+=dt; render(); }, dispose(){ renderer.dispose(); } });
  MFX.onGyro((gx,gy)=>u.uTilt.value.set(gx,gy));
  addEventListener("resize",()=>{ size(); render(); });
  document.addEventListener("visibilitychange",()=>{ sc.visible=!document.hidden; });
}
