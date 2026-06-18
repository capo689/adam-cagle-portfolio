/* m-skillcloud.js — pixel-cloud wordmarks (TONE/AIC/GRANTS/FINISHER) for mobile.
   Touch scatters the particles; they spring back and reform. Guaranteed static
   first paint (visible even in tier C / reduced motion). Ported from js/skill-cloud.js. */
import { MFX } from "./m-core.js";

const PALETTE = [[45,226,230],[77,139,232],[139,92,246]];

export function initSkillClouds() {
  document.querySelectorAll("canvas[data-skillcloud]").forEach((c) => { if (!c.__sc) { c.__sc = true; build(c); } });
}

function build(canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const word = canvas.getAttribute("data-word") || "SKILL";
  const font = canvas.getAttribute("data-font") || "700 120px 'Inter', sans-serif";
  let DPR = Math.min(devicePixelRatio || 1, 2), W = 0, H = 0, parts = [], mouse = { x:-9999, y:-9999, on:false };

  function sample() {
    W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return false;
    canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);
    const off = document.createElement("canvas"); off.width = canvas.width; off.height = canvas.height;
    const o = off.getContext("2d"); o.setTransform(DPR,0,0,DPR,0,0); o.clearRect(0,0,W,H);
    o.fillStyle = "#fff"; o.textAlign = "center"; o.textBaseline = "middle";
    let size = Math.min(H*0.6, 200); o.font = font.replace(/\d+px/, size+"px");
    let tw = o.measureText(word).width; const target = W*0.84;
    if (tw > 0) size = Math.max(20, Math.floor(size*target/tw));
    o.font = font.replace(/\d+px/, size+"px"); o.fillText(word, W/2, H/2+size*0.02);
    const img = o.getImageData(0,0,canvas.width,canvas.height).data;
    const gap = Math.max(3, Math.round((MFX.tier === "A" ? 3 : 4)*DPR)), pts = [];
    for (let y=0;y<canvas.height;y+=gap) for (let x=0;x<canvas.width;x+=gap)
      if (img[(y*canvas.width+x)*4+3] > 130) pts.push([x/DPR, y/DPR]);
    parts = pts.map((p) => { const col = PALETTE[Math.floor((p[0]/W)*PALETTE.length)%PALETTE.length];
      return { hx:p[0], hy:p[1], x:p[0]+(Math.random()-0.5)*8, y:p[1]+(Math.random()-0.5)*8, vx:0, vy:0, c:col }; });
    return true;
  }
  function renderStatic() { ctx.clearRect(0,0,W,H); for (const p of parts){ ctx.fillStyle="rgb("+p.c[0]+","+p.c[1]+","+p.c[2]+")"; ctx.fillRect(p.hx,p.hy,1.7,1.7); } }

  if (!sample()) { const t = setInterval(() => { if (sample()){ clearInterval(t); start(); } }, 200); return; }
  start();

  function start() {
    renderStatic(); // first paint, always
    if (MFX.tier === "C" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sc = MFX.add({ visible:false, tick(){ frame(); }, });
    const io = new IntersectionObserver((es)=>es.forEach((e)=>sc.visible=e.isIntersecting), { rootMargin:"120px" });
    io.observe(canvas);
  }
  function frame() {
    ctx.clearRect(0,0,W,H);
    for (let i=0;i<parts.length;i++){ const p=parts[i];
      let ax=(p.hx-p.x)*0.045, ay=(p.hy-p.y)*0.045;
      if (mouse.on){ const dx=p.x-mouse.x, dy=p.y-mouse.y, d2=dx*dx+dy*dy, R=64;
        if (d2<R*R){ const d=Math.sqrt(d2)||1, f=(1-d/R)*5.5; ax+=(dx/d)*f; ay+=(dy/d)*f; } }
      p.vx=(p.vx+ax)*0.82; p.vy=(p.vy+ay)*0.82;
      p.x+=p.vx+(Math.random()-0.5)*0.25; p.y+=p.vy+(Math.random()-0.5)*0.25;
      ctx.fillStyle="rgb("+p.c[0]+","+p.c[1]+","+p.c[2]+")"; ctx.fillRect(p.x,p.y,1.7,1.7);
    }
  }
  canvas.style.touchAction = "pan-y";
  canvas.addEventListener("pointermove",(e)=>{ const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; mouse.on=true; },{passive:true});
  canvas.addEventListener("pointerleave",()=>{ mouse.on=false; });
  let rt; addEventListener("resize",()=>{ clearTimeout(rt); rt=setTimeout(()=>{ DPR=Math.min(devicePixelRatio||1,2); sample(); renderStatic(); }, 200); });
}
