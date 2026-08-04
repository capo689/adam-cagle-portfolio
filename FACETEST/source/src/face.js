import * as THREE from "three";

const stage = document.querySelector("#stage");
const fallback = document.querySelector("#fallback");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stageWidth = () => Math.max(1, stage.clientWidth);
const stageHeight = () => Math.max(1, stage.clientHeight);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
} catch {
  fallback.style.display = "grid";
  throw new Error("WebGL unavailable");
}

renderer.setClearColor(0x010208, 1);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(stageWidth(), stageHeight());
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(39, stageWidth() / stageHeight(), 0.1, 50);

function fitCamera() {
  camera.aspect = stageWidth() / stageHeight();
  camera.position.z = 13 + Math.max(0, .9 - camera.aspect) * 10;
  camera.updateProjectionMatrix();
}

fitCamera();

const clock = new THREE.Clock();
const pointer = new THREE.Vector2();
const pointerTarget = new THREE.Vector2();
let viewWidth = 16;
let viewHeight = 9.5;

const fieldUniforms = {
  uTime: { value: 0 },
  uPointer: { value: new THREE.Vector2() },
  uView: { value: new THREE.Vector2(viewWidth, viewHeight) },
  uPixelRatio: { value: renderer.getPixelRatio() }
};

const fieldMaterial = new THREE.ShaderMaterial({
  uniforms: fieldUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aSeed;
    attribute float aSize;
    uniform float uTime;
    uniform vec2 uPointer;
    uniform vec2 uView;
    uniform float uPixelRatio;
    varying float vLight;
    varying float vSeed;
    void main() {
      vec3 p = position;
      vec2 mouse = vec2(uPointer.x * uView.x * .5, uPointer.y * uView.y * .5);
      vec2 md = p.xy - mouse;
      float mouseWave = exp(-dot(md, md) * 1.15);
      float radius = length(vec2(p.x / 3.05, p.y / 3.75));
      float angle = atan(p.y, p.x);
      float tension = exp(-pow((radius - 1.12) * 2.2, 2.0));
      float wrinkle = sin(radius * 35.0 + angle * 5.0) * .115 * tension;
      float shimmer = sin(p.x * .82 + p.y * .61 + uTime * .38 + aSeed * 3.0) * .018;
      float current = sin(length(p.xy) * 1.9 - uTime * .22 + aSeed) * .012;
      p.z = -.92 + wrinkle + shimmer + current + mouseWave * .15;
      p.xy += normalize(md + vec2(.0001)) * mouseWave * .045;
      vLight = .14 + tension * .24 + mouseWave * .20;
      vSeed = aSeed;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = min(6.5, aSize * uPixelRatio * (11.5 / max(1.0, -mv.z)));
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying float vLight;
    varying float vSeed;
    void main() {
      vec2 p = gl_PointCoord - .5;
      float d = length(p);
      if (d > .5) discard;
      float core = smoothstep(.5, .06, d);
      float glow = smoothstep(.5, .18, d) * .30;
      float pulse = .84 + .16 * sin(uTime * 1.34 + vSeed * 8.0);
      vec3 midnight = vec3(.018,.026,.075);
      vec3 bronze = vec3(.43,.20,.045);
      vec3 gold = vec3(1.0,.67,.20);
      vec3 color = mix(midnight, bronze, smoothstep(.08,.31,vLight));
      color = mix(color, gold, smoothstep(.28,.55,vLight));
      gl_FragColor = vec4(color * (core * 1.55 + glow) * pulse, (core + glow) * (.62 + vLight));
    }
  `
});

const faceUniforms = {
  uTime: { value: 0 },
  uPixelRatio: { value: renderer.getPixelRatio() },
  uOpacity: { value: 0 },
  uSpeaking: { value: 0 }
};

const faceMaterial = new THREE.ShaderMaterial({
  uniforms: faceUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending,
  vertexShader: `
    attribute float aSeed;
    attribute float aSize;
    attribute float aLight;
    attribute float aAlpha;
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uOpacity;
    uniform float uSpeaking;
    varying float vLight;
    varying float vSeed;
    varying float vOpacity;
    varying vec3 vPosition;
    void main() {
      vLight = aLight;
      vSeed = aSeed;
      vOpacity = uOpacity * aAlpha;
      vPosition = position;
      vec3 p = position;
      p.z += sin(aSeed * 9.0 + uTime * 1.4) * .006 * (1.0 - aAlpha);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = min(9.2, aSize * uPixelRatio * (12.8 / max(1.0, -mv.z)) * (1.0 + uSpeaking * .08));
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying float vLight;
    varying float vSeed;
    varying float vOpacity;
    varying vec3 vPosition;
    void main() {
      vec2 p = gl_PointCoord - .5;
      float d = length(p);
      if (d > .5) discard;
      float core = smoothstep(.5, .035, d);
      float glow = smoothstep(.5, .14, d) * .30;
      float pulse = .94 + .06 * sin(uTime * 1.7 + vSeed * 9.0);
      vec3 shadow = vec3(.045,.055,.16);
      vec3 bronze = vec3(.37,.16,.045);
      vec3 gold = vec3(.96,.57,.16);
      vec3 ivory = vec3(1.0,.91,.66);
      vec3 color = mix(shadow, bronze, smoothstep(.12,.38,vLight));
      color = mix(color, gold, smoothstep(.34,.68,vLight));
      color = mix(color, ivory, smoothstep(.76,1.0,vLight));
      float coolRim = smoothstep(1.55,2.75,abs(vPosition.x)) * smoothstep(.1,.75,vLight);
      color = mix(color, vec3(.18,.32,.62), coolRim * .38);
      gl_FragColor = vec4(color * (core * 1.55 + glow) * pulse, (core + glow) * vOpacity);
    }
  `
});

const veilMaterial = new THREE.ShaderMaterial({
  uniforms: faceUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aSeed;
    attribute float aSize;
    attribute float aLight;
    attribute float aAlpha;
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uOpacity;
    varying float vLight;
    varying float vSeed;
    varying float vOpacity;
    void main(){
      vLight=aLight; vSeed=aSeed; vOpacity=uOpacity*aAlpha;
      vec3 p=position;
      p.z += sin(aSeed*5.0+uTime*.42)*.018*(1.0-aAlpha);
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      gl_PointSize=min(6.2,aSize*uPixelRatio*(11.8/max(1.0,-mv.z)));
      gl_Position=projectionMatrix*mv;
    }
  `,
  fragmentShader: `
    varying float vLight; varying float vSeed; varying float vOpacity;
    uniform float uTime;
    void main(){
      float d=length(gl_PointCoord-.5); if(d>.5)discard;
      float core=smoothstep(.5,.08,d);
      float pulse=.76+.24*sin(uTime*.72+vSeed*7.0);
      vec3 color=mix(vec3(.07,.13,.34),vec3(.93,.48,.11),smoothstep(.18,.72,vLight));
      gl_FragColor=vec4(color*core*pulse,core*vOpacity*.56);
    }
  `
});

const eyeUniforms = {
  uTime: {value: 0},
  uPixelRatio: {value: renderer.getPixelRatio()},
  uOpacity: {value: 0},
  uSpeaking: {value: 0}
};

const eyeMaterial = new THREE.ShaderMaterial({
  uniforms: eyeUniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute float aSeed; attribute float aSize; attribute float aLight; attribute float aAlpha;
    uniform float uTime; uniform float uPixelRatio; uniform float uOpacity; uniform float uSpeaking;
    varying float vBand; varying float vSeed; varying float vOpacity;
    void main(){
      vBand=aLight; vSeed=aSeed; vOpacity=uOpacity*aAlpha;
      vec4 mv=modelViewMatrix*vec4(position,1.0);
      gl_PointSize=min(11.0,aSize*uPixelRatio*(13.6/max(1.0,-mv.z))*(1.0+uSpeaking*.12));
      gl_Position=projectionMatrix*mv;
    }
  `,
  fragmentShader: `
    uniform float uTime; uniform float uSpeaking;
    varying float vBand; varying float vSeed; varying float vOpacity;
    void main(){
      float d=length(gl_PointCoord-.5); if(d>.5)discard;
      float core=smoothstep(.5,.035,d); float glow=smoothstep(.5,.14,d)*.62;
      vec3 deep=vec3(.015,.08,.13); vec3 teal=vec3(.08,1.0,.82); vec3 ice=vec3(.72,1.0,1.0);
      vec3 color=mix(deep,teal,smoothstep(.18,.68,vBand));
      color=mix(color,ice,smoothstep(.84,1.0,vBand));
      float flicker=.88+.12*sin(uTime*3.2+vSeed*13.0)+uSpeaking*.08;
      gl_FragColor=vec4(color*(core*2.25+glow)*flicker,(core+glow)*vOpacity);
    }
  `
});

const LIPS = new Set([0,13,14,17,37,39,40,61,78,80,81,82,84,87,88,91,95,146,178,181,185,191,267,269,270,291,308,310,311,312,314,317,318,321,324,375,402,405,409,415]);
const LEFT_EYE = new Set([7,33,133,144,145,153,154,155,157,158,159,160,161,163,173,246]);
const RIGHT_EYE = new Set([249,263,362,373,374,380,381,382,384,385,386,387,388,390,398,466]);
const LEFT_BROW = new Set([46,52,53,55,63,65,66,70,105,107]);
const RIGHT_BROW = new Set([276,282,283,285,293,295,296,300,334,336]);

let meshData;
let faceCloud;
let fieldCloud;
let skirtCloud;
let eyesCloud;
let faceSamples;
let skirtSamples;
let deformed;
let normalBuffer;
let externalExpression = null;
let externalState = null;
let speechStarted = 0;

function parseOBJ(text) {
  const vertices = [];
  const faces = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v") vertices.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    if (parts[0] === "f") {
      const ids = parts.slice(1).map((part) => Number(part.split("/")[0]) - 1);
      for (let i = 1; i < ids.length - 1; i++) faces.push([ids[0], ids[i], ids[i + 1]]);
    }
  }

  const rest = new Float32Array(vertices.length * 3);
  vertices.forEach((v, i) => {
    rest[i * 3] = v[0] * .42;
    rest[i * 3 + 1] = (v[1] + .48) * .40;
    rest[i * 3 + 2] = v[2] * .40 - .84;
  });
  return { rest, faces, count: vertices.length };
}

function triangleArea(rest, f) {
  const ax = rest[f[0]*3], ay = rest[f[0]*3+1], az = rest[f[0]*3+2];
  const bx = rest[f[1]*3], by = rest[f[1]*3+1], bz = rest[f[1]*3+2];
  const cx = rest[f[2]*3], cy = rest[f[2]*3+1], cz = rest[f[2]*3+2];
  const abx=bx-ax, aby=by-ay, abz=bz-az, acx=cx-ax, acy=cy-ay, acz=cz-az;
  const nx=aby*acz-abz*acy, ny=abz*acx-abx*acz, nz=abx*acy-aby*acx;
  return Math.hypot(nx,ny,nz) * .5;
}

function chooseWeighted(cumulative, total) {
  const value = Math.random() * total;
  let lo = 0, hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] < value) lo = mid + 1; else hi = mid;
  }
  return lo;
}

function createFaceSamples(data, count = 76000) {
  const cumulative = [];
  let total = 0;
  for (const face of data.faces) { total += triangleArea(data.rest, face); cumulative.push(total); }
  const a = new Uint16Array(count), b = new Uint16Array(count), c = new Uint16Array(count);
  const u = new Float32Array(count), v = new Float32Array(count);
  const flatX = new Float32Array(count), flatY = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const f = data.faces[chooseWeighted(cumulative, total)];
    let r1 = Math.random(), r2 = Math.random();
    if (r1 + r2 > 1) { r1 = 1-r1; r2 = 1-r2; }
    a[i]=f[0]; b[i]=f[1]; c[i]=f[2]; u[i]=r1; v[i]=r2;
    const angle=Math.random()*Math.PI*2,radius=Math.sqrt(Math.random());
    flatX[i]=Math.cos(angle)*radius*3.08;
    flatY[i]=Math.sin(angle)*radius*3.72;
  }
  return { count, a, b, c, u, v, flatX, flatY };
}

function boundaryEdges(faces) {
  const map = new Map();
  for (const face of faces) {
    for (const [a,b] of [[face[0],face[1]],[face[1],face[2]],[face[2],face[0]]]) {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (map.has(key)) map.delete(key); else map.set(key, [a,b]);
    }
  }
  return [...map.values()];
}

function createSkirtSamples(data) {
  const edges = boundaryEdges(data.faces).filter(([a,b]) => {
    const ax=data.rest[a*3],ay=data.rest[a*3+1],bx=data.rest[b*3],by=data.rest[b*3+1];
    return Math.hypot(((ax+bx)*.5)/3.15,((ay+by)*.5)/3.75)>.72;
  });
  const samples = [];
  for (const [a,b] of edges) {
    for (let s=0; s<9; s++) {
      const along = (s + Math.random()*.7) / 9;
      for (let ring=0; ring<20; ring++) samples.push({ a,b,along,t:ring/19,seed:Math.random()*Math.PI*2 });
    }
  }
  return samples;
}

function attributeSet(count, baseSize=1.5) {
  const positions = new Float32Array(count*3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const lights = new Float32Array(count);
  const alphas = new Float32Array(count);
  for (let i=0;i<count;i++) { seeds[i]=Math.random()*Math.PI*2; sizes[i]=baseSize+Math.random()*1.5; lights[i]=.55; alphas[i]=1; }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions,3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds,1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes,1));
  geometry.setAttribute("aLight", new THREE.BufferAttribute(lights,1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas,1));
  return geometry;
}

function createField() {
  if (fieldCloud) { scene.remove(fieldCloud); fieldCloud.geometry.dispose(); }
  const distance = camera.position.z + .92;
  viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) * distance * 1.06;
  viewWidth = viewHeight * camera.aspect;
  fieldUniforms.uView.value.set(viewWidth, viewHeight);
  const target = stageWidth() < 720 ? 82000 : 168000;
  const gap = Math.sqrt((viewWidth*viewHeight)/target);
  const positions=[], seeds=[], sizes=[];
  for (let y=-viewHeight/2-gap*3; y<=viewHeight/2+gap*3; y+=gap) {
    for (let x=-viewWidth/2-gap*3; x<=viewWidth/2+gap*3; x+=gap) {
      positions.push(x+(Math.random()-.5)*gap*.24, y+(Math.random()-.5)*gap*.24, -.92);
      seeds.push(Math.random()*Math.PI*2);
      sizes.push(1.05+Math.random()*1.2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute("aSeed",new THREE.Float32BufferAttribute(seeds,1));
  g.setAttribute("aSize",new THREE.Float32BufferAttribute(sizes,1));
  fieldCloud = new THREE.Points(g,fieldMaterial);
  scene.add(fieldCloud);
}

function averageIndices(buffer, set) {
  let x=0,y=0,z=0,n=0;
  for (const i of set) { x+=buffer[i*3];y+=buffer[i*3+1];z+=buffer[i*3+2];n++; }
  return [x/n,y/n,z/n];
}

function buildScene(data) {
  meshData=data;
  deformed=new Float32Array(data.rest);
  normalBuffer=new Float32Array(data.rest.length);
  faceSamples=createFaceSamples(data);
  skirtSamples=createSkirtSamples(data);

  const faceGeometry=attributeSet(faceSamples.count,1.25);
  faceCloud=new THREE.Points(faceGeometry,faceMaterial);
  scene.add(faceCloud);

  const skirtGeometry=attributeSet(skirtSamples.length,1.0);
  skirtCloud=new THREE.Points(skirtGeometry,veilMaterial);
  scene.add(skirtCloud);

  const eyeGeometry=attributeSet(760,1.55);
  eyesCloud=new THREE.Points(eyeGeometry,eyeMaterial);
  scene.add(eyesCloud);
  createField();
}

function smoothstep(a,b,x) {
  const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);
  return t*t*(3-2*t);
}

function pulse(t,start,end,edge=.12) {
  return smoothstep(start,start+edge,t)*(1-smoothstep(end-edge,end,t));
}

function phonemes(t) {
  const shapes=[
    [5.20,5.52,.10,.00,.00], [5.52,5.90,.62,.24,.00], [5.90,6.24,.25,.42,.00],
    [6.24,6.72,.65,-.10,.72], [6.98,7.46,.38,-.18,.85], [7.46,7.88,.54,.16,.18],
    [7.88,8.22,.20,.40,.00], [8.22,8.62,.07,.10,.00]
  ];
  let open=.025,wide=0,pucker=0;
  for(const [s,e,o,w,p] of shapes){const n=pulse(t,s,e,.10);open+=o*n;wide+=w*n;pucker+=p*n;}
  return {open,wide,pucker};
}

function timeline(elapsed) {
  const t=reducedMotion?11.2:elapsed%14;
  const speech=phonemes(t);
  const blink=Math.max(pulse(t,1.92,2.13,.06),pulse(t,9.05,9.34,.08),pulse(t,11.55,11.82,.07));
  const lookLeft=pulse(t,2.75,4.55,.65);
  const lookRight=pulse(t,9.8,11.3,.45);
  return {
    open:speech.open,wide:speech.wide,pucker:speech.pucker,
    smile:.045+pulse(t,8.7,10.05,.45)*.72,
    blink,brow:pulse(t,2.8,4.3,.45)*.38,
    yaw:-lookLeft*.30+lookRight*.22+pointer.x*.07,
    pitch:pointer.y*.04-pulse(t,3.2,4.3,.4)*.06,
    roll:-lookLeft*.10,
    gazeX:pointer.x*.20-lookLeft*.18+lookRight*.12,
    gazeY:pointer.y*.10+Math.sin(elapsed*.31)*.025,
    emerge:reducedMotion?1:smoothstep(.2,2.7,elapsed)
  };
}

function currentControls(elapsed) {
  const base=timeline(elapsed);
  const microBlink=Math.max(pulse(elapsed%5.7,4.84,5.05,.055),pulse(elapsed%8.3,7.72,7.94,.06));
  if (externalState === "listening") Object.assign(base,{open:.018,smile:.10+Math.sin(elapsed*.45)*.025,brow:.18+Math.sin(elapsed*.31)*.045,blink:microBlink,gazeX:pointer.x*.29+Math.sin(elapsed*.22)*.035,gazeY:pointer.y*.16+Math.sin(elapsed*.29)*.025});
  if (externalState === "thinking") Object.assign(base,{open:.018,pucker:.10,brow:.32+Math.sin(elapsed*.8)*.05,yaw:-.14+Math.sin(elapsed*.25)*.035,gazeX:.22+Math.sin(elapsed*.43)*.055,gazeY:.10+Math.cos(elapsed*.37)*.035,blink:microBlink});
  if (externalState === "speaking") Object.assign(base,phonemes((elapsed-speechStarted)%3.45+5.2));
  if (externalExpression) Object.assign(base,externalExpression);
  return base;
}

function transformPoint(x,y,z,c) {
  let cz=Math.cos(c.yaw),sz=Math.sin(c.yaw),cx=Math.cos(c.pitch),sx=Math.sin(c.pitch),cr=Math.cos(c.roll),sr=Math.sin(c.roll);
  let x1=x*cz+z*sz, z1=-x*sz+z*cz;
  let y1=y*cx-z1*sx, z2=y*sx+z1*cx;
  return [x1*cr-y1*sr,x1*sr+y1*cr,z2];
}

function deformVertices(c) {
  deformed.set(meshData.rest);
  const leftEyeCenter=averageIndices(meshData.rest,LEFT_EYE);
  const rightEyeCenter=averageIndices(meshData.rest,RIGHT_EYE);
  for(let i=0;i<meshData.count;i++){
    const j=i*3;let x=deformed[j],y=deformed[j+1],z=deformed[j+2];
    if(LIPS.has(i)){
      const lower=y<-1.50;
      y+=lower?-c.open*.58:c.open*.20;
      x*=1+c.wide*.16-c.pucker*.22;
      z+=c.pucker*.26;
      const corner=Math.min(1,Math.abs(x)/1.25);
      y+=c.smile*corner*.34;
    }
    if(y<-.72&&Math.abs(x)<2.25){const w=smoothstep(-.72,-3.55,y);y-=c.open*.48*w;z+=c.open*.10*w;}
    if(LEFT_EYE.has(i))y=THREE.MathUtils.lerp(y,leftEyeCenter[1],c.blink*.93);
    if(RIGHT_EYE.has(i))y=THREE.MathUtils.lerp(y,rightEyeCenter[1],c.blink*.93);
    if(LEFT_BROW.has(i)||RIGHT_BROW.has(i)){y+=c.brow*.42;z+=c.brow*.045;}
    if(c.smile>0&&y>-.95&&y<.30&&Math.abs(x)>.55){
      const cheek=smoothstep(.48,1.45,Math.abs(x))*(1-smoothstep(1.55,2.45,Math.abs(x)));
      y+=c.smile*.10*cheek;z+=c.smile*.18*cheek;
    }
    if(y>.20&&y<1.2&&Math.abs(x)<.55)z+=c.brow*.035;
    const p=transformPoint(x,y,z,c);deformed[j]=p[0];deformed[j+1]=p[1];deformed[j+2]=p[2];
  }
}

function calculateNormals() {
  normalBuffer.fill(0);
  for(const f of meshData.faces){
    const a=f[0]*3,b=f[1]*3,c=f[2]*3;
    const abx=deformed[b]-deformed[a],aby=deformed[b+1]-deformed[a+1],abz=deformed[b+2]-deformed[a+2];
    const acx=deformed[c]-deformed[a],acy=deformed[c+1]-deformed[a+1],acz=deformed[c+2]-deformed[a+2];
    const nx=aby*acz-abz*acy,ny=abz*acx-abx*acz,nz=abx*acy-aby*acx;
    for(const j of [a,b,c]){normalBuffer[j]+=nx;normalBuffer[j+1]+=ny;normalBuffer[j+2]+=nz;}
  }
  for(let i=0;i<meshData.count;i++){const j=i*3,l=Math.hypot(normalBuffer[j],normalBuffer[j+1],normalBuffer[j+2])||1;normalBuffer[j]/=l;normalBuffer[j+1]/=l;normalBuffer[j+2]/=l;}
}

function updateFace(c,time) {
  deformVertices(c);calculateNormals();
  const pos=faceCloud.geometry.attributes.position.array,light=faceCloud.geometry.attributes.aLight.array,alpha=faceCloud.geometry.attributes.aAlpha.array;
  const lightX=-.42+Math.sin(time*.19)*.16,lightY=.36+Math.cos(time*.23)*.08,lightZ=.84;
  const leftEyeCenter=averageIndices(deformed,LEFT_EYE),rightEyeCenter=averageIndices(deformed,RIGHT_EYE);
  for(let i=0;i<faceSamples.count;i++){
    const a=faceSamples.a[i],b=faceSamples.b[i],cc=faceSamples.c[i],u=faceSamples.u[i],v=faceSamples.v[i],w=1-u-v;
    const j=i*3,ai=a*3,bi=b*3,ci=cc*3;
    const flatX=deformed[ai]*w+deformed[bi]*u+deformed[ci]*v;
    const flatY=deformed[ai+1]*w+deformed[bi+1]*u+deformed[ci+1]*v;
    const surfaceZ=deformed[ai+2]*w+deformed[bi+2]*u+deformed[ci+2]*v;
    pos[j]=THREE.MathUtils.lerp(faceSamples.flatX[i],flatX,c.emerge);
    pos[j+1]=THREE.MathUtils.lerp(faceSamples.flatY[i],flatY,c.emerge);
    pos[j+2]=THREE.MathUtils.lerp(-.91,surfaceZ,c.emerge);
    const nx=normalBuffer[ai]*w+normalBuffer[bi]*u+normalBuffer[ci]*v;
    const ny=normalBuffer[ai+1]*w+normalBuffer[bi+1]*u+normalBuffer[ci+1]*v;
    const nz=normalBuffer[ai+2]*w+normalBuffer[bi+2]*u+normalBuffer[ci+2]*v;
    const key=Math.max(0,nx*lightX+ny*lightY+nz*lightZ);
    const rim=Math.pow(1-Math.abs(nz),2.2);
    const sculpted=THREE.MathUtils.clamp(.08+key*.72+rim*.34+(surfaceZ+.9)*.038,.04,1);
    light[i]=THREE.MathUtils.lerp(.12,sculpted,c.emerge);
    const edgeRadius=Math.hypot(flatX/3.18,flatY/3.82);
    const edgeFade=1-smoothstep(.78,1.13,edgeRadius);
    const featureBoost=1-smoothstep(.22,.52,Math.hypot(flatX/3.2,(flatY+.16)/3.7));
    const eyeDistance=Math.min(
      Math.hypot((flatX-leftEyeCenter[0])/.30,(flatY-leftEyeCenter[1])/.17),
      Math.hypot((flatX-rightEyeCenter[0])/.30,(flatY-rightEyeCenter[1])/.17)
    );
    const socket=smoothstep(.56,1.12,eyeDistance);
    alpha[i]=THREE.MathUtils.clamp((.42+edgeFade*.58+featureBoost*.14)*(.12+.88*socket),0,1);
  }
  faceCloud.geometry.attributes.position.needsUpdate=true;faceCloud.geometry.attributes.aLight.needsUpdate=true;faceCloud.geometry.attributes.aAlpha.needsUpdate=true;
}

function updateSkirt(c,time) {
  const pos=skirtCloud.geometry.attributes.position.array,light=skirtCloud.geometry.attributes.aLight.array,alpha=skirtCloud.geometry.attributes.aAlpha.array;
  skirtSamples.forEach((s,i)=>{
    const ai=s.a*3,bi=s.b*3,k=s.along,t=s.t,e=t*t*(3-2*t);
    const bx=THREE.MathUtils.lerp(deformed[ai],deformed[bi],k),by=THREE.MathUtils.lerp(deformed[ai+1],deformed[bi+1],k),bz=THREE.MathUtils.lerp(deformed[ai+2],deformed[bi+2],k);
    const scale=1.0+e*.50,ox=bx*scale,oy=by*scale,wrinkle=Math.sin(t*28+s.seed*4+time*.22)*.10*(1-e);
    const j=i*3;pos[j]=THREE.MathUtils.lerp(bx,ox,e);pos[j+1]=THREE.MathUtils.lerp(by,oy,e);pos[j+2]=THREE.MathUtils.lerp(THREE.MathUtils.lerp(-.91,bz,c.emerge),-.92,e)+wrinkle*c.emerge;
    light[i]=THREE.MathUtils.lerp(.16,.27+(1-e)*.48,c.emerge);
    alpha[i]=Math.pow(1-e,1.18)*(.52+.48*Math.sin(s.seed*3+time*.18)*.5+.24);
  });
  skirtCloud.geometry.attributes.position.needsUpdate=true;skirtCloud.geometry.attributes.aLight.needsUpdate=true;skirtCloud.geometry.attributes.aAlpha.needsUpdate=true;
}

function updateEyes(c,time) {
  const left=averageIndices(deformed,LEFT_EYE),right=averageIndices(deformed,RIGHT_EYE);
  const pos=eyesCloud.geometry.attributes.position.array,light=eyesCloud.geometry.attributes.aLight.array,alpha=eyesCloud.geometry.attributes.aAlpha.array;
  const saccadeX=Math.sin(time*.83)*.012+Math.sin(time*2.31)*.005;
  const saccadeY=Math.cos(time*.67)*.008;
  for(let i=0;i<760;i++){
    const side=i<380?left:right,local=i%380,q=(local+.5)/380,a=local*2.399963+time*.06,rn=Math.sqrt(q),r=.145*rn;
    const irisMotion=Math.sin(time*1.4+rn*8.0)*.003*(1-rn);
    const j=i*3;
    pos[j]=side[0]+Math.cos(a)*(r+irisMotion)+(c.gazeX+saccadeX)*.13;
    pos[j+1]=side[1]+Math.sin(a)*(r+irisMotion)*.86+(c.gazeY+saccadeY)*.085;
    pos[j+2]=side[2]+.11+(.022*(1-rn));
    light[i]=rn<.24?.01:rn<.76?(.76+.22*Math.sin(a*6.0+time*.95)):.18;
    const pupil=rn<.235?.035:1;
    alpha[i]=Math.pow(1-c.blink,2.4)*smoothstep(1.0,.78,rn)*pupil;
  }
  eyesCloud.visible=c.emerge>.62&&c.blink<.93;
  eyesCloud.geometry.attributes.position.needsUpdate=true;eyesCloud.geometry.attributes.aLight.needsUpdate=true;eyesCloud.geometry.attributes.aAlpha.needsUpdate=true;
}

function animate() {
  const elapsed=clock.getElapsedTime(),c=currentControls(elapsed);
  pointer.lerp(pointerTarget,.04);
  fieldUniforms.uTime.value=elapsed;fieldUniforms.uPointer.value.copy(pointer);
  faceUniforms.uTime.value=elapsed;faceUniforms.uOpacity.value=c.emerge;faceUniforms.uSpeaking.value=externalState==="speaking"?1:0;
  eyeUniforms.uTime.value=elapsed;eyeUniforms.uOpacity.value=c.emerge;eyeUniforms.uSpeaking.value=externalState==="speaking"?1:0;
  if(meshData){updateFace(c,elapsed);updateSkirt(c,elapsed);updateEyes(c,elapsed);}
  renderer.render(scene,camera);requestAnimationFrame(animate);
}

addEventListener("pointermove",event=>{const rect=stage.getBoundingClientRect();pointerTarget.x=((event.clientX-rect.left)/rect.width-.5)*2;pointerTarget.y=-((event.clientY-rect.top)/rect.height-.5)*2;},{passive:true});

let resizeTimer;
addEventListener("resize",()=>{
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(stageWidth(),stageHeight());fitCamera();
  fieldUniforms.uPixelRatio.value=renderer.getPixelRatio();faceUniforms.uPixelRatio.value=renderer.getPixelRatio();
  eyeUniforms.uPixelRatio.value=renderer.getPixelRatio();
  clearTimeout(resizeTimer);resizeTimer=setTimeout(createField,140);
},{passive:true});

window.FACE={
  setState(state){externalState=state;speechStarted=clock.getElapsedTime();},
  setExpression(values){externalExpression={...(externalExpression||{}),...values};},
  clearExpression(){externalExpression=null;},
  reset(){externalState=null;externalExpression=null;}
};

async function init() {
  const response=await fetch(`${import.meta.env.BASE_URL}assets/canonical_face_model.obj`);
  if(!response.ok)throw new Error(`Face mesh failed to load: ${response.status}`);
  buildScene(parseOBJ(await response.text()));
}

init().catch(error=>{console.error(error);fallback.textContent="Face mesh unavailable";fallback.style.display="grid";});
animate();
