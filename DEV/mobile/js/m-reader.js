/* m-reader.js — in-site readers for mobile:
   • [data-paper] (data-url,data-title) → fullscreen iframe paper viewer
   • [data-reader] (data-file) → fetch a writing sample, render it full-screen, prev/next
   • [data-flip="hf|amd"] → swipe flipbook (lazy pages) */
import { MFX } from "./m-core.js";

function lock(on){ document.body.classList.toggle("m-lock", on); }

export function initReader() {
  paperModal();
  writingReader();
  flipbooks();
}

/* ---- paper iframe ---- */
function paperModal() {
  if (!document.querySelector("[data-paper]")) return;
  let ov;
  function build(){
    ov = document.createElement("div"); ov.className = "m-reader"; ov.style.background = "rgba(6,8,11,.98)";
    ov.innerHTML = '<div class="m-reader__top"><span class="m-reader__t"></span><a class="ext" target="_blank" rel="noopener" style="margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--fg2)">Open ↗</a><button class="cl" style="background:none;border:0;color:#fff;font-size:24px">&times;</button></div><iframe style="flex:1;width:100%;border:0;background:#fff"></iframe>';
    document.body.appendChild(ov);
    ov.querySelector(".cl").addEventListener("click", close);
  }
  function close(){ ov.classList.remove("open"); lock(false); setTimeout(()=>{ if(!ov.classList.contains("open")) ov.querySelector("iframe").src="about:blank"; }, 250); }
  document.addEventListener("click",(e)=>{ const t=e.target.closest("[data-paper]"); if(!t)return; e.preventDefault();
    if(!ov) build(); ov.querySelector(".m-reader__t").textContent=t.getAttribute("data-title")||""; ov.querySelector(".ext").href=t.getAttribute("data-url"); ov.querySelector("iframe").src=t.getAttribute("data-url"); ov.classList.add("open"); lock(true); MFX.haptic(8); });
}

/* ---- writing reader ---- */
function writingReader() {
  const cards = [...document.querySelectorAll("[data-reader]")];
  if (!cards.length) return;
  const files = cards.map((c)=>({ file:c.getAttribute("data-file"), title:c.getAttribute("data-title")||"" }));
  let ov, idx = 0; const cache = {};
  function build(){
    ov = document.createElement("div"); ov.className = "m-reader";
    ov.innerHTML = '<div class="m-reader__top"><button class="cl" style="background:none;border:0;color:#fff;font-size:24px">&times;</button><span class="m-reader__t" style="margin-left:8px"></span></div><div class="m-reader__scroll"></div><div class="m-reader__nav"><button class="pv">‹ Prev</button><button class="nx">Next ›</button></div>';
    document.body.appendChild(ov);
    ov.querySelector(".cl").addEventListener("click",()=>{ ov.classList.remove("open"); lock(false); });
    ov.querySelector(".pv").addEventListener("click",()=>go(idx-1));
    ov.querySelector(".nx").addEventListener("click",()=>go(idx+1));
  }
  async function load(i){
    const f = files[i]; if (cache[f.file]) return cache[f.file];
    try {
      const html = await fetch(f.file).then(r=>r.text());
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = (doc.querySelector(".sh-title")||doc.querySelector("h1")||{}).textContent || f.title;
      const bodies = doc.querySelectorAll(".folio-body, .sh-body, article p");
      let html2 = "";
      if (bodies.length) bodies.forEach((b)=>{ html2 += b.classList && b.classList.contains("folio-body") ? b.innerHTML : "<p>"+b.innerHTML+"</p>"; });
      else html2 = "<p>" + (doc.body.textContent||"").trim().slice(0,4000) + "</p>";
      return (cache[f.file] = { title, html: html2 });
    } catch(e){ return { title:f.title, html:"<p>Could not load this sample. <a href='"+f.file+"' target='_blank' rel='noopener' style='color:var(--accent2)'>Open it directly ↗</a></p>" }; }
  }
  async function go(i){ idx=(i+files.length)%files.length; const d=await load(idx);
    ov.querySelector(".m-reader__t").textContent=d.title;
    const s=ov.querySelector(".m-reader__scroll"); s.innerHTML="<h1>"+d.title+"</h1>"+d.html; s.scrollTop=0; }
  cards.forEach((c,i)=>c.addEventListener("click",(e)=>{ e.preventDefault(); if(!ov)build(); ov.classList.add("open"); lock(true); MFX.haptic(8); go(i); }));
}

/* ---- flipbooks (HF 61pp, AMD 10pp) ---- */
function hfPages(){ const a=[]; for(let n=62;n<=122;n++) a.push("mobile/img/hf/HotelFigueroa%20"+n+".webp"); return a; }
function amdPages(){ const a=[]; for(let n=1;n<=10;n++) a.push("mobile/img/amd/amd-"+n+".webp"); return a; }
function flipbooks() {
  const triggers = [...document.querySelectorAll("[data-flip]")];
  if (!triggers.length) return;
  let ov, track, countEl, pages = [], i = 0;
  function build(){
    ov = document.createElement("div"); ov.className = "m-flip";
    ov.innerHTML = '<button class="m-x" aria-label="Close">&times;</button><div class="m-flip__stage"><div class="m-flip__track"></div></div><div class="m-flip__bar"><button class="pv">‹</button><span class="m-flip__count"></span><button class="nx">›</button></div>';
    document.body.appendChild(ov);
    track = ov.querySelector(".m-flip__track"); countEl = ov.querySelector(".m-flip__count");
    ov.querySelector(".m-x").addEventListener("click",()=>{ ov.classList.remove("open"); lock(false); });
    ov.querySelector(".pv").addEventListener("click",()=>go(i-1));
    ov.querySelector(".nx").addEventListener("click",()=>go(i+1));
    // swipe
    let sx=0; ov.addEventListener("pointerdown",(e)=>sx=e.clientX);
    ov.addEventListener("pointerup",(e)=>{ const dx=e.clientX-sx; if(dx<-40)go(i+1); else if(dx>40)go(i-1); });
  }
  function open(set){
    if(!ov) build();
    pages = set; i = 0;
    track.innerHTML = "";
    pages.forEach((src,n)=>{ const pg=document.createElement("div"); pg.className="m-flip__pg"; const im=new Image(); im.alt="Page "+(n+1); im.decoding="async"; if(n<2) im.src=src; else im.dataset.src=src; pg.appendChild(im); track.appendChild(pg); });
    ov.classList.add("open"); lock(true); render();
  }
  function render(){
    track.style.transform = "translateX("+(-i*100)+"%)";
    countEl.textContent = (i+1)+" / "+pages.length;
    // lazy load current ± 1
    [i,i+1,i-1].forEach((n)=>{ const pg=track.children[n]; if(pg){ const im=pg.querySelector("img"); if(im && !im.src && im.dataset.src) im.src=im.dataset.src; } });
  }
  function go(n){ i=Math.max(0,Math.min(pages.length-1,n)); render(); MFX.haptic(6); }
  triggers.forEach((t)=>t.addEventListener("click",(e)=>{ e.preventDefault();
    const kind=t.getAttribute("data-flip"); open(kind==="amd"?amdPages():hfPages()); }));
}
