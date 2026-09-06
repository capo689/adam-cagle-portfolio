(function () {
'use strict';

var cfg = window.WORKFLOW_CONFIG;
if (!cfg) return;

var $ = function (id) { return document.getElementById(id); };
var body = document.body;
var ROLE = {
  input:{color:0xaeb9c8,label:'INPUT'}, data:{color:0x8aa0ba,label:'GOVERNED DATA'},
  model:{color:0x8cb8f5,label:'MODEL-ASSISTED'}, code:{color:0xaeb9c8,label:'DETERMINISTIC'},
  gate:{color:0x4d8be8,label:'POLICY GATE'}, human:{color:0xf4f6f8,label:'HUMAN AUTHORITY'},
  output:{color:0x4d8be8,label:'OUTPUT'}, external:{color:0x9f8cf2,label:'EXTERNAL SYSTEM'}
};

function escapeText(value) { return String(value || ''); }
function roleFor(node) { return ROLE[node.kind] || ROLE.code; }
function stageFor(id) { var n = cfg.nodes.find(function (item) { return item.id === id; }); return n ? n.stage : 0; }
function routeIndex(id) { return Math.max(0, cfg.route.indexOf(id)); }

document.title = cfg.title + ' · Guided Workflow';
$('system-name').textContent = cfg.title;
$('launcher-kicker').textContent = cfg.kicker;
$('launcher-title').textContent = cfg.headline;
$('launcher-intro').textContent = cfg.intro;
$('case-type').textContent = cfg.case.type;
$('case-title').textContent = cfg.case.title;
$('case-summary').textContent = cfg.case.summary;
$('begin').textContent = cfg.case.cta || 'Begin guided workflow';
$('record-id').textContent = cfg.case.id;
$('record-title').textContent = cfg.case.title;
$('record-route').textContent = cfg.case.route;
$('completion-title').textContent = cfg.completion.title;
$('completion-copy').textContent = cfg.completion.copy;
$('completion-proof').textContent = cfg.completion.proof;
$('completion-human').textContent = cfg.completion.human;
$('completion-write').textContent = cfg.completion.write;

var journey = $('journey');
cfg.stages.forEach(function (label, index) {
  var item = document.createElement('span');
  item.className = 'journey-step'; item.setAttribute('data-stage', index); item.textContent = label;
  journey.appendChild(item);
});

var gl = null;
try {
  var probe = document.createElement('canvas');
  gl = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl');
} catch (e) { gl = null; }
if (!gl || typeof THREE === 'undefined') { body.classList.add('nogl'); return; }

function viewportSize() {
  if (window.innerWidth <= 900) return {w:window.innerWidth,h:Math.max(320,Math.round(window.innerHeight * .58))};
  return {w:Math.max(520,window.innerWidth - 380),h:window.innerHeight};
}

var viewport = viewportSize();
var renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2));
renderer.setSize(viewport.w,viewport.h);
if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
body.appendChild(renderer.domElement);

var scene = new THREE.Scene(); scene.background = new THREE.Color(0x323a45); scene.fog = new THREE.Fog(0x323a45,42,150);
var camera = new THREE.PerspectiveCamera(50,viewport.w / viewport.h,.1,500);
scene.add(new THREE.AmbientLight(0xffffff,.9));
var key = new THREE.DirectionalLight(0xffffff,.66); key.position.set(4,8,10); scene.add(key);
var rim = new THREE.DirectionalLight(0x4d8be8,.25); rim.position.set(-7,-2,-6); scene.add(rim);

function roundRect(c,x,y,w,h,r) {
  c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
  c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h);
  c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
}
function hex(value) { return '#' + ('000000' + value.toString(16)).slice(-6); }
function cardTexture(node) {
  var role = roleFor(node), cv = document.createElement('canvas'); cv.width = 560; cv.height = 230;
  var c = cv.getContext('2d'); c.clearRect(0,0,560,230); roundRect(c,8,8,544,214,20);
  c.fillStyle = node.kind === 'model' ? '#263e60' : node.kind === 'human' ? '#151b23' : node.kind === 'gate' ? '#25354b' : '#2d3642'; c.fill();
  c.strokeStyle = node.kind === 'model' ? '#8cb8f5' : node.kind === 'human' ? '#f4f6f8' : node.kind === 'gate' ? '#4d8be8' : '#667385'; c.lineWidth = 3; c.stroke();
  c.fillStyle = hex(role.color); c.fillRect(8,26,11,178);
  c.fillStyle = hex(role.color); c.font = '700 20px ui-sans-serif,system-ui,sans-serif'; c.textBaseline = 'top'; c.fillText(node.tier || role.label,34,27);
  c.fillStyle = '#f4f6f8'; c.font = '700 31px ui-sans-serif,system-ui,sans-serif';
  var words = node.label.split(' '), line = '', lines = [];
  words.forEach(function (word) { var test = line ? line + ' ' + word : word; if (c.measureText(test).width > 480 && line) { lines.push(line); line = word; } else line = test; });
  if (line) lines.push(line); lines.slice(0,3).forEach(function (text,index) { c.fillText(text,34,72 + index * 39); });
  var texture = new THREE.CanvasTexture(cv); texture.needsUpdate = true; return texture;
}
function glowTexture() {
  var cv = document.createElement('canvas'); cv.width = cv.height = 128; var c = cv.getContext('2d');
  var g = c.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.45,'rgba(255,255,255,.36)'); g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0,0,128,128); return new THREE.CanvasTexture(cv);
}
var glowTex = glowTexture(), CARD_W = 3.7, CARD_H = 1.52;
var cardGeo = new THREE.PlaneGeometry(CARD_W,CARD_H), glowGeo = new THREE.PlaneGeometry(CARD_W*1.55,CARD_H*1.9);
var nodes = [], byId = {};
cfg.nodes.forEach(function (source) {
  var role = roleFor(source), lane = source.lane || 0;
  var p = new THREE.Vector3((source.stage - 3.5) * 7.15,-lane * 2.65,source.kind === 'model' ? 1.4 : source.kind === 'human' ? -1.1 : source.kind === 'gate' ? .55 : 0);
  var glow = new THREE.Mesh(glowGeo,new THREE.MeshBasicMaterial({map:glowTex,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(role.color)}));
  glow.position.copy(p); glow.position.z -= .03; glow.visible = false;
  var card = new THREE.Mesh(cardGeo,new THREE.MeshBasicMaterial({map:cardTexture(source),transparent:true,depthWrite:true})); card.position.copy(p); card.userData.id = source.id;
  scene.add(glow); scene.add(card);
  var node = {source:source,pos:p,card:card,glow:glow,highlight:0}; nodes.push(node); byId[source.id] = node;
});

function curveFor(a,b) {
  var p0 = a.pos.clone(), p1 = b.pos.clone(); p0.x += CARD_W/2; p1.x -= CARD_W/2;
  var mid = new THREE.Vector3((p0.x+p1.x)/2,(p0.y+p1.y)/2,(p0.z+p1.z)/2);
  mid.z += Math.min(4,Math.abs(p1.x-p0.x)*.09); mid.y += (p1.y-p0.y)*.1;
  return new THREE.QuadraticBezierCurve3(p0,mid,p1);
}
var edges = [], edgeMap = {}, allLinePoints = [];
cfg.edges.forEach(function (spec) {
  var from = byId[spec[0]], to = byId[spec[1]]; if (!from || !to) return;
  var curve = curveFor(from,to), edge = {from:spec[0],to:spec[1],curve:curve,type:spec[2] || 'main'}; edges.push(edge); edgeMap[spec[0]+'|'+spec[1]] = edge;
  var pts = curve.getPoints(24); for (var i=0;i<pts.length-1;i++) allLinePoints.push(pts[i],pts[i+1]);
});
scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(allLinePoints),new THREE.LineBasicMaterial({color:0x91a0b4,transparent:true,opacity:.25})));
var completedLine = new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x4d8be8,transparent:true,opacity:.66})); scene.add(completedLine); completedLine.visible=false;
var activeLine = new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x8cb8f5,transparent:true,opacity:1})); scene.add(activeLine); activeLine.visible=false;

function recordTexture() {
  var cv = document.createElement('canvas'); cv.width=360; cv.height=440; var c=cv.getContext('2d');
  c.shadowColor='rgba(0,0,0,.42)';c.shadowBlur=24;c.shadowOffsetY=10;c.fillStyle='#202833';c.fillRect(26,20,308,388);c.shadowColor='transparent';
  c.strokeStyle='#4d8be8';c.lineWidth=8;c.strokeRect(26,20,308,388);c.fillStyle='#4d8be8';c.fillRect(26,20,308,62);
  c.fillStyle='#fff';c.font='800 23px ui-monospace,monospace';c.textBaseline='middle';c.textAlign='left';c.fillText(cfg.case.cardLabel.toUpperCase(),48,52);
  c.fillStyle='#f4f6f8';c.font='900 60px ui-monospace,monospace';c.fillText(cfg.case.id,48,142);
  c.fillStyle='#aeb9c8';c.font='800 17px ui-monospace,monospace';c.fillText(cfg.case.cardSub.toUpperCase(),48,192);
  c.fillStyle='#566273';c.fillRect(48,232,238,13);c.fillRect(48,264,190,13);c.fillRect(48,296,222,13);
  c.fillStyle='#4d8be8';c.beginPath();c.arc(286,354,22,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.font='900 22px ui-monospace,monospace';c.textAlign='center';c.fillText('AI',286,355);
  return new THREE.CanvasTexture(cv);
}
var record = new THREE.Sprite(new THREE.SpriteMaterial({map:recordTexture(),transparent:true,depthWrite:false})); record.scale.set(1.55,1.9,1); record.visible=false; scene.add(record);
var recordHalo = new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),new THREE.MeshBasicMaterial({map:glowTex,color:0x4d8be8,transparent:true,opacity:.64,depthWrite:false,blending:THREE.AdditiveBlending})); recordHalo.visible=false;scene.add(recordHalo);

var hops=[],duration=1;
for(var hi=0;hi<cfg.route.length-1;hi++){
  var routeEdge=edgeMap[cfg.route[hi]+'|'+cfg.route[hi+1]];
  if(!routeEdge && byId[cfg.route[hi]] && byId[cfg.route[hi+1]]) routeEdge={from:cfg.route[hi],to:cfg.route[hi+1],curve:curveFor(byId[cfg.route[hi]],byId[cfg.route[hi+1]])};
  if(routeEdge) hops.push({edge:routeEdge,source:cfg.route[hi],target:cfg.route[hi+1],t0:0,t1:0});
}
var cursor=0;
hops.forEach(function(h){h.t0=cursor;cursor+=Math.max(1.05,h.edge.curve.getLength()/5.6);h.t1=cursor;cursor+=1.35;}); duration=cursor+.7;

var cam={focus:new THREE.Vector3(),target:new THREE.Vector3(),dist:58,targetDist:58,yaw:0,targetYaw:0,pitch:.25,targetPitch:.25};
function applyCamera(){var cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);camera.position.set(cam.focus.x+cam.dist*cp*Math.sin(cam.yaw),cam.focus.y+cam.dist*sp,cam.focus.z+cam.dist*cp*Math.cos(cam.yaw));camera.lookAt(cam.focus);}
function fitAll(instant){var box=new THREE.Box3();nodes.forEach(function(n){box.expandByPoint(n.pos);});var center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),vf=2*Math.tan(camera.fov*Math.PI/360);cam.target.copy(center);cam.targetDist=Math.max(size.y/vf,size.x/(vf*camera.aspect))*1.05+5;cam.targetYaw=0;cam.targetPitch=.24;if(instant){cam.focus.copy(cam.target);cam.dist=cam.targetDist;cam.yaw=cam.targetYaw;cam.pitch=cam.targetPitch;}}
fitAll(true);applyCamera();

var playing=false,clock=0,follow=true,currentNode='',currentRouteIndex=0,last=performance.now(),completedCount=-1;
function setPlaying(value){playing=value;body.classList.toggle('playing',value);$('play-icon').setAttribute('d',value?'M6 5h4v14H6zm8 0h4v14h-4z':'M8 5v14l11-7z');$('play').setAttribute('aria-label',value?'Pause':'Play');}
function updateJourney(stage){document.querySelectorAll('[data-stage]').forEach(function(el){var index=Number(el.getAttribute('data-stage'));el.className='journey-step'+(index<stage?' done':index===stage?' current':'');if(index===stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});}
function renderGuide(id){if(!id||id===currentNode)return;currentNode=id;currentRouteIndex=routeIndex(id);var node=byId[id].source;
  $('step-count').textContent='Step '+(currentRouteIndex+1)+' of '+cfg.route.length;$('step-name').textContent=node.label;$('step-what').textContent=node.summary;
  $('step-decision').textContent=node.decision;$('step-why').textContent=node.why;$('step-narration').textContent='“'+node.narration+'”';updateJourney(node.stage);
}
function reset(autoplay){clock=0;currentNode='';completedCount=-1;completedLine.visible=false;activeLine.visible=false;record.visible=true;recordHalo.visible=true;follow=true;$('follow').className='btn on';$('completion').className='completion';$('completion').setAttribute('aria-hidden','true');renderGuide(cfg.route[0]);if(autoplay)setPlaying(true);else setPlaying(false);}
function start(){body.classList.remove('choosing');$('launcher').className='launcher gone';reset(true);}
function showCompletion(){if($('completion').classList.contains('show'))return;$('completion').className='completion show';$('completion').setAttribute('aria-hidden','false');}
function jump(delta){setPlaying(false);var index=Math.max(0,Math.min(cfg.route.length-1,currentRouteIndex+delta)),id=cfg.route[index];if(index===0)clock=0;else{var hop=hops.find(function(h){return h.target===id;});if(hop)clock=Math.max(0,hop.t1-.01);}currentNode='';renderGuide(id);}
function toggle(){if(clock>=duration-.01)reset(false);setPlaying(!playing);}

function locate(at){var state={pos:new THREE.Vector3(),activeId:cfg.route[0],activeEdge:null,on:false};
  for(var i=0;i<hops.length;i++){var h=hops[i];if(at>=h.t0&&at<=h.t1){var u=(at-h.t0)/Math.max(.001,h.t1-h.t0);h.edge.curve.getPoint(u,state.pos);state.activeId=u<.82?h.source:h.target;state.activeEdge=h.edge;state.on=true;break;}if(at>h.t1&&(i===hops.length-1||at<hops[i+1].t0)){var n=byId[h.target];if(n){state.pos.copy(n.pos);state.pos.z+=.82;state.activeId=h.target;state.on=true;}break;}}
  if(!state.on&&at<=.01&&byId[cfg.route[0]]){state.pos.copy(byId[cfg.route[0]].pos);state.pos.z+=.82;state.on=true;}return state;
}
function followTarget(pos,instant){cam.target.copy(pos);cam.target.y+=window.innerWidth<=900?.7:1.3;cam.targetDist=window.innerWidth<=900?20:18.5;cam.targetYaw=.045;cam.targetPitch=.08;if(instant){cam.focus.copy(cam.target);cam.dist=cam.targetDist;cam.yaw=cam.targetYaw;cam.pitch=cam.targetPitch;applyCamera();}}

$('begin').addEventListener('click',start);$('play').addEventListener('click',toggle);$('prev').addEventListener('click',function(){jump(-1);});$('next').addEventListener('click',function(){jump(1);});$('restart').addEventListener('click',function(){reset(true);});
$('follow').addEventListener('click',function(){follow=!follow;$('follow').className=follow?'btn on':'btn';});$('fit').addEventListener('click',function(){follow=false;$('follow').className='btn';fitAll(false);});$('completion-replay').addEventListener('click',function(){reset(true);});
$('completion-close').addEventListener('click',function(){$('completion').className='completion';$('completion').setAttribute('aria-hidden','true');});
var track=$('track');function scrub(ev){var rect=track.getBoundingClientRect();clock=Math.max(0,Math.min(1,(ev.clientX-rect.left)/rect.width))*duration;var state=locate(clock);currentNode='';if(state.on){record.visible=true;recordHalo.visible=true;record.position.copy(state.pos);recordHalo.position.copy(state.pos);renderGuide(state.activeId);if(follow)followTarget(state.pos,true);}activePath(state.activeEdge);completedPath();$('fill').style.width=(clock/duration*100)+'%';$('head').style.left=(clock/duration*100)+'%';$('now').textContent=clock>=duration-.01?'Run complete':cfg.stages[stageFor(state.activeId)];renderer.render(scene,camera);}
track.addEventListener('pointerdown',function(ev){track.setPointerCapture(ev.pointerId);track.dataset.drag='1';setPlaying(false);scrub(ev);});track.addEventListener('pointermove',function(ev){if(track.dataset.drag==='1')scrub(ev);});track.addEventListener('pointerup',function(){track.dataset.drag='';});

var ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),drag=null;
function inspectNode(node){$('inspect-kind').textContent=(node.tier||roleFor(node).label);$('inspect-title').textContent=node.label;$('inspect-copy').textContent=node.summary;$('inspect').className='inspect show';}
renderer.domElement.addEventListener('pointerdown',function(ev){renderer.domElement.setPointerCapture(ev.pointerId);var pan=ev.shiftKey||ev.metaKey||ev.ctrlKey||ev.button===1;drag={x:ev.clientX,y:ev.clientY,moved:false,pan:pan};if(pan)body.classList.add('panning');});
renderer.domElement.addEventListener('pointermove',function(ev){if(!drag)return;var dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3){drag.moved=true;follow=false;$('follow').className='btn';if(drag.pan){var right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),amount=cam.dist*.0017;cam.target.addScaledVector(right,-dx*amount).addScaledVector(up,dy*amount);cam.focus.addScaledVector(right,-dx*amount).addScaledVector(up,dy*amount);}else{cam.targetYaw-=dx*.004;cam.targetPitch=Math.max(-.8,Math.min(.9,cam.targetPitch+dy*.003));}}drag.x=ev.clientX;drag.y=ev.clientY;});
renderer.domElement.addEventListener('pointerup',function(ev){if(drag&&!drag.moved){var rect=renderer.domElement.getBoundingClientRect();pointer.x=((ev.clientX-rect.left)/rect.width)*2-1;pointer.y=-((ev.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(pointer,camera);var hits=ray.intersectObjects(nodes.map(function(n){return n.card;}),false);if(hits.length)inspectNode(byId[hits[0].object.userData.id]);}drag=null;body.classList.remove('panning');});
renderer.domElement.addEventListener('pointercancel',function(){drag=null;body.classList.remove('panning');});
renderer.domElement.addEventListener('wheel',function(ev){ev.preventDefault();follow=false;$('follow').className='btn';cam.targetDist=Math.max(8,Math.min(150,cam.targetDist*(ev.deltaY>0?1.12:.88)));},{passive:false});
$('inspect-close').addEventListener('click',function(){$('inspect').className='inspect';});
window.addEventListener('keydown',function(ev){if(ev.key==='Shift'||ev.key==='Meta'||ev.key==='Control')body.classList.add('pan-ready');if(ev.key===' '){ev.preventDefault();toggle();}else if(ev.key.toLowerCase()==='f'){follow=!follow;$('follow').className=follow?'btn on':'btn';}else if(ev.key.toLowerCase()==='r'){reset(true);}else if(ev.key==='Escape'){$('inspect').className='inspect';}});
window.addEventListener('keyup',function(ev){if(!ev.shiftKey&&!ev.metaKey&&!ev.ctrlKey)body.classList.remove('pan-ready');});
window.addEventListener('blur',function(){body.classList.remove('pan-ready','panning');drag=null;});

function completedPath(){var done=hops.filter(function(h){return clock>h.t1;}),pts=[];if(done.length===completedCount)return;completedCount=done.length;done.forEach(function(h){var p=h.edge.curve.getPoints(20);for(var i=0;i<p.length-1;i++)pts.push(p[i],p[i+1]);});completedLine.geometry.dispose();completedLine.geometry=new THREE.BufferGeometry().setFromPoints(pts);completedLine.visible=pts.length>0;}
function activePath(edge){if(!edge){activeLine.visible=false;return;}activeLine.geometry.dispose();activeLine.geometry=new THREE.BufferGeometry().setFromPoints(edge.curve.getPoints(30));activeLine.visible=true;}

function frame(now){var dt=Math.min(.05,(now-last)/1000);last=now;if(playing){clock+=dt;if(clock>=duration){clock=duration;setPlaying(false);showCompletion();}}
  var state=locate(clock),pos=state.pos,activeId=state.activeId,on=state.on;
  record.visible=on;recordHalo.visible=on;if(on){record.position.copy(pos);recordHalo.position.copy(pos);recordHalo.quaternion.copy(camera.quaternion);var activeNode=byId[activeId];if(activeNode)activeNode.highlight=1;renderGuide(activeId);}
  activePath(state.activeEdge);completedPath();
  nodes.forEach(function(n){if(n.highlight>0){n.highlight*=.935;n.glow.visible=true;n.glow.material.opacity=n.highlight*.85;var s=1+n.highlight*.1;n.card.scale.set(s,s,1);}else if(n.glow.visible){n.glow.visible=false;n.card.scale.set(1,1,1);}});
  if(follow&&on)followTarget(pos,false);
  var smooth=1-Math.pow(.0015,dt),focusSmooth=follow&&on?1-Math.pow(.0000004,dt):smooth;cam.focus.lerp(cam.target,focusSmooth);cam.dist+=(cam.targetDist-cam.dist)*smooth;cam.yaw+=(cam.targetYaw-cam.yaw)*smooth;cam.pitch+=(cam.targetPitch-cam.pitch)*smooth;applyCamera();
  nodes.forEach(function(n){n.card.quaternion.copy(camera.quaternion);n.glow.quaternion.copy(camera.quaternion);});recordHalo.quaternion.copy(camera.quaternion);
  $('fill').style.width=(clock/duration*100)+'%';$('head').style.left=(clock/duration*100)+'%';$('now').textContent=clock>=duration-.01?'Run complete':cfg.stages[stageFor(activeId)];
  renderer.render(scene,camera);requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.addEventListener('resize',function(){viewport=viewportSize();camera.aspect=viewport.w/viewport.h;camera.updateProjectionMatrix();renderer.setSize(viewport.w,viewport.h);});
})();
