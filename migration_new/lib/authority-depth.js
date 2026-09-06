/* Migration accelerator — guided workflow
   Graph read from n8n workflow 4XDr2Tb5aQ5GZn2v (v5.1, Evidence IDs).
   40 executing nodes + 45 connections. Sticky notes are annotations and are not drawn.
   No inline script (site CSP is script-src 'self'). */
(function () {
'use strict';

/* ------------------------------------------------------------------ data */

var ROLE = {
  det:   { c: 0xaeb9c8, tag: 'DETERMINISTIC' },
  gate:  { c: 0x4d8be8, tag: 'POLICY GATE' },
  model: { c: 0x8cb8f5, tag: 'MODEL-ASSISTED' },
  human: { c: 0xf4f6f8, tag: 'HUMAN AUTHORITY' }
};

// name | n8n type | n8n x | n8n y
var RAW = [
  ['Manual Trigger','manualTrigger',-1880,0],
  ['DEMO MODE — fixture or live','set',-1680,0],
  ['Load Registry + Synthetic Migration Batch','code',-1460,0],
  ['Preflight + Deterministic Signals','code',-1220,0],
  ['Valid Input?','if',-1000,0],
  ['LIVE MODE?','if',-780,-120],
  ['Build Preflight Exception','code',-760,260],
  ['OCR Needed?','if',-520,-300],
  ['FIXTURE — Run All Routed Tasks','code',-520,160],
  ['Deterministic Risk + Authority Gate','code',5280,-120],
  ['Build Extraction Task','code',-280,-440],
  ['Mark Extraction Skipped','code',-20,-180],
  ['OPENROUTER — Extraction Model','httpRequest',-20,-440],
  ['Validate Extraction Result','code',240,-440],
  ['Rejoin Extraction Paths','merge',480,-260],
  ['Build Duplicate Retrieval Task','code',720,-260],
  ['OPENROUTER — Embedding Model','httpRequest',980,-260],
  ['Score Retrieval Result','code',1240,-260],
  ['Build Disposition Task','code',1500,-260],
  ['OPENROUTER — Disposition Model','httpRequest',1760,-260],
  ['Validate Disposition Result','code',2020,-260],
  ['Disposition Valid?','if',2260,-260],
  ['Rejoin Disposition Paths','merge',3160,-260],
  ['Build One Bounded Repair','code',2480,-80],
  ['OPENROUTER — One Repair Attempt','httpRequest',2700,-80],
  ['Validate Repair or Fail Closed','code',2920,-80],
  ['Ambiguity Analysis Needed?','if',3380,-260],
  ['Build Ambiguity Task','code',3600,-420],
  ['Mark Ambiguity Skipped','code',3840,-180],
  ['OPENROUTER — Ambiguity Model','httpRequest',3840,-420],
  ['Validate Ambiguity Result','code',4080,-420],
  ['Rejoin Ambiguity Paths','merge',4320,-260],
  ['Build Grounded Verification Task','code',4560,-260],
  ['OPENROUTER — Verification Model','httpRequest',4800,-260],
  ['Validate Verification Result','code',5040,-260],
  ['Senior Review Needed?','if',5520,-120],
  ['Senior Review Simulation','code',5760,-240],
  ['Consultant Review Simulation','code',5760,0],
  ['Build Audit + Metrics','code',6000,-80],
  ['Final Structured Output','code',6240,-80]
];

var EDGES = [
  ['Manual Trigger','DEMO MODE — fixture or live'],
  ['DEMO MODE — fixture or live','Load Registry + Synthetic Migration Batch'],
  ['Load Registry + Synthetic Migration Batch','Preflight + Deterministic Signals'],
  ['Preflight + Deterministic Signals','Valid Input?'],
  ['Valid Input?','LIVE MODE?'],
  ['Valid Input?','Build Preflight Exception'],
  ['LIVE MODE?','OCR Needed?'],
  ['LIVE MODE?','FIXTURE — Run All Routed Tasks'],
  ['Build Preflight Exception','Build Audit + Metrics'],
  ['OCR Needed?','Build Extraction Task'],
  ['OCR Needed?','Mark Extraction Skipped'],
  ['FIXTURE — Run All Routed Tasks','Deterministic Risk + Authority Gate'],
  ['Deterministic Risk + Authority Gate','Senior Review Needed?'],
  ['Build Extraction Task','OPENROUTER — Extraction Model'],
  ['Mark Extraction Skipped','Rejoin Extraction Paths'],
  ['OPENROUTER — Extraction Model','Validate Extraction Result'],
  ['Validate Extraction Result','Rejoin Extraction Paths'],
  ['Rejoin Extraction Paths','Build Duplicate Retrieval Task'],
  ['Build Duplicate Retrieval Task','OPENROUTER — Embedding Model'],
  ['OPENROUTER — Embedding Model','Score Retrieval Result'],
  ['Score Retrieval Result','Build Disposition Task'],
  ['Build Disposition Task','OPENROUTER — Disposition Model'],
  ['OPENROUTER — Disposition Model','Validate Disposition Result'],
  ['Validate Disposition Result','Disposition Valid?'],
  ['Disposition Valid?','Rejoin Disposition Paths'],
  ['Disposition Valid?','Build One Bounded Repair'],
  ['Rejoin Disposition Paths','Ambiguity Analysis Needed?'],
  ['Build One Bounded Repair','OPENROUTER — One Repair Attempt'],
  ['OPENROUTER — One Repair Attempt','Validate Repair or Fail Closed'],
  ['Validate Repair or Fail Closed','Rejoin Disposition Paths'],
  ['Ambiguity Analysis Needed?','Build Ambiguity Task'],
  ['Ambiguity Analysis Needed?','Mark Ambiguity Skipped'],
  ['Build Ambiguity Task','OPENROUTER — Ambiguity Model'],
  ['Mark Ambiguity Skipped','Rejoin Ambiguity Paths'],
  ['OPENROUTER — Ambiguity Model','Validate Ambiguity Result'],
  ['Validate Ambiguity Result','Rejoin Ambiguity Paths'],
  ['Rejoin Ambiguity Paths','Build Grounded Verification Task'],
  ['Build Grounded Verification Task','OPENROUTER — Verification Model'],
  ['OPENROUTER — Verification Model','Validate Verification Result'],
  ['Validate Verification Result','Deterministic Risk + Authority Gate'],
  ['Senior Review Needed?','Senior Review Simulation'],
  ['Senior Review Needed?','Consultant Review Simulation'],
  ['Senior Review Simulation','Build Audit + Metrics'],
  ['Consultant Review Simulation','Build Audit + Metrics'],
  ['Build Audit + Metrics','Final Structured Output']
];

var HUMAN = {
  'Senior Review Simulation': 1, 'Consultant Review Simulation': 1, 'Build Preflight Exception': 1
};

var NOTE = {
  'Manual Trigger':'A reviewer starts one controlled run. There is no schedule, webhook, or background process, so nothing begins without an intentional action.',
  'DEMO MODE — fixture or live':'This step makes the execution mode explicit. Fixture mode replays known answers for repeatable testing. Live mode uses the same controls but sends approved tasks through OpenRouter.',
  'Load Registry + Synthetic Migration Batch':'The workflow loads the approved model for each job and the municipal records to evaluate. Model choices live in one registry, so a route can be replaced without rewriting the workflow.',
  'Preflight + Deterministic Signals':'Before AI sees anything, code confirms the customer scope, page identity, secure source URL, usable content, and sensitive-data rules. It also establishes the minimum risk level that later steps cannot reduce.',
  'Valid Input?':'This is the first fail-closed decision. Complete, in-scope records continue. Empty, malformed, or out-of-scope records are quarantined before any model call or cost occurs.',
  'LIVE MODE?':'The workflow now chooses the execution surface, not the business outcome. Live mode calls the evaluated task routes. Fixture mode follows a deterministic test path that should produce the same governed review destinations.',
  'Build Preflight Exception':'The record failed a non-negotiable intake rule. The workflow packages the reason, preserves the source context, assigns a human owner, and stops all model processing.',
  'OCR Needed?':'The workflow checks whether the source is a scanned document that needs text extraction. Digital pages skip OCR. Scanned files take the extraction route before any recommendation is attempted.',
  'FIXTURE — Run All Routed Tasks':'This is the credential-free test path. It returns fixed outputs shaped exactly like the live task responses, allowing the full control system to be rehearsed without calling a provider.',
  'Deterministic Risk + Authority Gate':'Code applies the final risk floor and authority rules after model work is complete. A model may raise concern, but it can never lower a required review level or authorize publication, deletion, or policy truth.',
  'Build Extraction Task':'The workflow creates a narrowly scoped request for visible document text and required fields. The response format is constrained so later code can validate it consistently.',
  'Mark Extraction Skipped':'No extraction was needed for this digital record. The workflow records that decision instead of silently bypassing the stage, preserving a complete audit trail.',
  'OPENROUTER — Extraction Model':'Claude Fable 5 reads the scanned fixture and returns only the requested visible content. It may abstain when the document is unreadable rather than inventing missing text.',
  'Validate Extraction Result':'Deterministic code checks that the extraction is complete, correctly shaped, and safe to use. A malformed or incomplete result does not disappear into the workflow. It raises the review requirement.',
  'Rejoin Extraction Paths':'Scanned and digital records meet again here with the same normalized structure. Downstream steps no longer need to know how the content was originally captured.',
  'Build Duplicate Retrieval Task':'The workflow prepares the page text and approved comparison candidates for similarity search. This narrows the possible duplicate set without deciding that two municipal pages should be merged.',
  'OPENROUTER — Embedding Model':'Qwen3 Embedding 8B converts the record and comparison candidates into numerical representations. It supplies the similarity signal but does not make the migration decision.',
  'Score Retrieval Result':'Code calculates similarity, ranks candidates, and records the separation between the best and next-best match. The threshold and ranking math remain deterministic and inspectable.',
  'Build Disposition Task':'The workflow asks for one migration recommendation, such as keep, revise, merge, archive, delete, or migrate. It supplies short evidence IDs, not passages the model can repeatedly copy or distort.',
  'OPENROUTER — Disposition Model':'Gemini 3.7 Flash proposes a disposition, risk level, rationale, and supporting evidence IDs. This is a recommendation for review, not an instruction to alter the municipal site.',
  'Validate Disposition Result':'Code rejects unknown, repeated, or incomplete evidence IDs. Valid IDs are resolved back to the governed source text on the server so reviewers see the actual evidence behind the recommendation.',
  'Disposition Valid?':'A complete, evidence-linked recommendation continues. Invalid structured output receives one controlled repair attempt. The workflow never enters an open-ended retry loop.',
  'Rejoin Disposition Paths':'Clean recommendations and successfully repaired recommendations return to one common path. The audit record still preserves whether repair was required.',
  'Build One Bounded Repair':'The workflow sends the validation error and original request to one different model. The retry is limited to a single attempt, preventing runaway cost or a model repeatedly correcting itself.',
  'OPENROUTER — One Repair Attempt':'Gemini 3.1 Pro Preview receives one opportunity to return the same required schema correctly. Model diversity reduces the chance that the original formatting failure repeats.',
  'Validate Repair or Fail Closed':'Code validates the repaired response under the same rules as the original. If it still fails, the system abstains, preserves the error, and forces senior review rather than guessing.',
  'Ambiguity Analysis Needed?':'Only records with elevated risk, conflicting evidence, or unresolved uncertainty receive deeper analysis. Routine content skips the additional model call and its cost.',
  'Build Ambiguity Task':'The workflow packages the specific sources and a fixed vocabulary of possible conflicts. The model can identify uncertainty, but it cannot declare which municipal policy or record is authoritative.',
  'Mark Ambiguity Skipped':'The deterministic risk checks found no reason for deeper conflict analysis. The skip and its reason are recorded before the workflow continues.',
  'OPENROUTER — Ambiguity Model':'Claude Opus 5 compares the supplied evidence and flags conflicts, stale sources, missing authority, or compatible differences. It cannot choose policy on the municipality’s behalf.',
  'Validate Ambiguity Result':'Code checks the response against the allowed conflict vocabulary and review routes. An invalid answer becomes an exception or escalation instead of being treated as no conflict.',
  'Rejoin Ambiguity Paths':'Analysed and skipped records return to one normalized path. Any conflict flags remain attached for verification and human review.',
  'Build Grounded Verification Task':'The workflow assembles the proposed recommendation alongside the resolved source evidence and the claims each source may support. This creates a separate verification job rather than asking the authoring model to grade itself.',
  'OPENROUTER — Verification Model':'Claude Opus 4.8 independently checks whether the recommendation is supported by the supplied evidence and stays inside the allowed authority boundary.',
  'Validate Verification Result':'Code rejects unsupported claims, invalid evidence references, and statements that imply legal, records, accessibility, deletion, or publication authority. Rejection raises the human review route.',
  'Senior Review Needed?':'Deterministic rules select the accountable reviewer. High risk, repair, abstention, conflicting evidence, or failed verification requires senior review. Routine supported work still requires consultant review.',
  'Senior Review Simulation':'A senior implementation consultant and the municipal content owner inspect the recommendation and source evidence. They may approve it for staging, return it for revision, or hold it for an accountable owner.',
  'Consultant Review Simulation':'An implementation consultant reviews the recommendation and resolved evidence for routine content. The system still cannot publish, delete, or finalize the customer’s decision.',
  'Build Audit + Metrics':'The workflow creates one traceable record of the route, task models, validation results, human decision, observed cost, and external writes. The expected write count remains zero.',
  'Final Structured Output':'The result is a review-ready migration record with its evidence, recommendation, route, and audit history. Any later staging or production change remains a separate human-authorized action.'
};

// Three guided scenarios drawn from the tested route contract.
var HEAD = ['Manual Trigger','DEMO MODE — fixture or live','Load Registry + Synthetic Migration Batch',
            'Preflight + Deterministic Signals','Valid Input?'];
var MID  = ['LIVE MODE?','OCR Needed?'];
var OCR  = ['Build Extraction Task','OPENROUTER — Extraction Model','Validate Extraction Result','Rejoin Extraction Paths'];
var NOOCR= ['Mark Extraction Skipped','Rejoin Extraction Paths'];
var CORE = ['Build Duplicate Retrieval Task','OPENROUTER — Embedding Model','Score Retrieval Result',
            'Build Disposition Task','OPENROUTER — Disposition Model','Validate Disposition Result','Disposition Valid?'];
var PASS = ['Rejoin Disposition Paths'];
var FIX  = ['Build One Bounded Repair','OPENROUTER — One Repair Attempt','Validate Repair or Fail Closed','Rejoin Disposition Paths'];
var AMBQ = ['Ambiguity Analysis Needed?'];
var AMB  = ['Build Ambiguity Task','OPENROUTER — Ambiguity Model','Validate Ambiguity Result','Rejoin Ambiguity Paths'];
var NOAMB= ['Mark Ambiguity Skipped','Rejoin Ambiguity Paths'];
var VER  = ['Build Grounded Verification Task','OPENROUTER — Verification Model','Validate Verification Result',
            'Deterministic Risk + Authority Gate','Senior Review Needed?'];
var TAIL = ['Build Audit + Metrics','Final Structured Output'];

function path() {
  var out = [], i, a = arguments;
  for (i = 0; i < a.length; i++) out = out.concat(a[i]);
  return out;
}

var SCENARIOS = {
  standard:{ id:'P-001', label:'Current event page', route:'Consultant review', human:'Consultant Review Simulation', path:path(HEAD,MID,NOOCR,CORE,PASS,AMBQ,NOAMB,VER,['Consultant Review Simulation'],TAIL) },
  risk:{ id:'P-003', label:'Scanned budget document', route:'Senior review required', human:'Senior Review Simulation', path:path(HEAD,MID,OCR,CORE,PASS,AMBQ,AMB,VER,['Senior Review Simulation'],TAIL) },
  verification:{ id:'P-003', label:'Unsupported merge claim', route:'Senior review required', human:'Senior Review Simulation', path:path(HEAD,MID,NOOCR,CORE,PASS,AMBQ,AMB,VER,['Senior Review Simulation'],TAIL) }
};

var CHAPTERS = [
  ['Intake and preflight', ['Manual Trigger','DEMO MODE — fixture or live','Load Registry + Synthetic Migration Batch','Preflight + Deterministic Signals','Valid Input?','Build Preflight Exception']],
  ['Mode and extraction', ['LIVE MODE?','FIXTURE — Run All Routed Tasks','OCR Needed?','Build Extraction Task','OPENROUTER — Extraction Model','Validate Extraction Result','Mark Extraction Skipped','Rejoin Extraction Paths']],
  ['Duplicate retrieval', ['Build Duplicate Retrieval Task','OPENROUTER — Embedding Model','Score Retrieval Result']],
  ['Structured disposition', ['Build Disposition Task','OPENROUTER — Disposition Model','Validate Disposition Result','Disposition Valid?']],
  ['One bounded repair', ['Build One Bounded Repair','OPENROUTER — One Repair Attempt','Validate Repair or Fail Closed','Rejoin Disposition Paths']],
  ['Ambiguity analysis', ['Ambiguity Analysis Needed?','Build Ambiguity Task','OPENROUTER — Ambiguity Model','Validate Ambiguity Result','Mark Ambiguity Skipped','Rejoin Ambiguity Paths']],
  ['Grounded verification', ['Build Grounded Verification Task','OPENROUTER — Verification Model','Validate Verification Result']],
  ['Authority and audit', ['Deterministic Risk + Authority Gate','Senior Review Needed?','Senior Review Simulation','Consultant Review Simulation','Build Audit + Metrics','Final Structured Output']]
];
var CH_OF = {};
CHAPTERS.forEach(function (c, i) { c[1].forEach(function (n) { CH_OF[n] = i; }); });

/* --------------------------------------------------------------- helpers */

var $ = function (id) { return document.getElementById(id); };
var body = document.body;

function roleOf(name, type) {
  if (HUMAN[name]) return 'human';
  if (type === 'httpRequest') return 'model';
  if (type === 'if') return 'gate';
  return 'det';
}

/* --------------------------------------------------------------- webgl?  */

var gl = null;
try {
  var probe = document.createElement('canvas');
  gl = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl');
} catch (e) { gl = null; }
if (!gl || typeof THREE === 'undefined') { body.className += ' nogl'; return; }

/* ---------------------------------------------------------------- scene  */

var S = 1 / 52;               // n8n units -> world units
var CARD_W = 3.2, CARD_H = 1.42;
var LANE = { model: 2.8, gate: 0.8, det: -1.6, human: -3.6 };

var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
RAW.forEach(function (r) {
  if (r[2] < minX) minX = r[2]; if (r[2] > maxX) maxX = r[2];
  if (r[3] < minY) minY = r[3]; if (r[3] > maxY) maxY = r[3];
});
var CX = (minX + maxX) / 2, CY = (minY + maxY) / 2;

function graphViewport() {
  if (window.innerWidth <= 900) return { w:window.innerWidth, h:Math.max(300, Math.round(window.innerHeight * 0.58)) };
  return { w:Math.max(520, window.innerWidth - 380), h:window.innerHeight };
}
var viewport = graphViewport();
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(viewport.w, viewport.h);
if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x323a45);
scene.fog = new THREE.Fog(0x323a45, 42, 142);

var camera = new THREE.PerspectiveCamera(52, viewport.w / viewport.h, 0.1, 900);

scene.add(new THREE.AmbientLight(0xffffff, 0.88));
var key = new THREE.DirectionalLight(0xffffff, 0.68); key.position.set(4, 8, 10); scene.add(key);
var rim = new THREE.DirectionalLight(0x4d8be8, 0.24); rim.position.set(-8, -3, -6); scene.add(rim);

/* ---------------------------------------------------------------- cards  */

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}

function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }

function cardTexture(name, role) {
  var W = 544, H = 240, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  var c = cv.getContext('2d');
  var col = hex(ROLE[role].c);

  c.clearRect(0, 0, W, H);
  roundRect(c, 8, 8, W - 16, H - 16, 22);
  c.fillStyle = role === 'model' ? '#263e60' : (role === 'human' ? '#151b23' : (role === 'gate' ? '#25354b' : '#2d3642')); c.fill();
  c.lineWidth = 3; c.strokeStyle = role === 'model' ? '#8cb8f5' : (role === 'human' ? '#f4f6f8' : (role === 'gate' ? '#4d8be8' : '#667385')); c.stroke();

  // left accent
  roundRect(c, 8, 8, 12, H - 16, 6); c.fillStyle = col; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;

  c.font = '600 21px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
  c.fillStyle = col; c.textBaseline = 'top';
  c.fillText(ROLE[role].tag, 36, 30);

  c.font = '600 33px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
  c.fillStyle = '#f4f6f8';
  var words = name.split(' '), line = '', lines = [], i, test;
  for (i = 0; i < words.length; i++) {
    test = line ? line + ' ' + words[i] : words[i];
    if (c.measureText(test).width > W - 76 && line) { lines.push(line); line = words[i]; }
    else line = test;
  }
  if (line) lines.push(line);
  lines = lines.slice(0, 3);
  for (i = 0; i < lines.length; i++) c.fillText(lines[i], 36, 78 + i * 42);

  var t = new THREE.CanvasTexture(cv);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
  t.needsUpdate = true;
  return t;
}

var glowTex = (function () {
  var s = 128, cv = document.createElement('canvas'); cv.width = cv.height = s;
  var c = cv.getContext('2d');
  var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,.42)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(cv);
})();

var nodes = [], byName = {};
var cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
var glowGeo = new THREE.PlaneGeometry(CARD_W * 1.5, CARD_H * 1.85);

RAW.forEach(function (r) {
  var name = r[0], type = r[1], role = roleOf(name, type);
  var p = new THREE.Vector3((r[2] - CX) * S, -(r[3] - CY) * S, LANE[role]);

  var glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
    map: glowTex, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, color: new THREE.Color(ROLE[role].c)
  }));
  glow.position.copy(p); glow.position.z -= 0.02; glow.visible = false;

  var card = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({
    map: cardTexture(name, role), transparent: true, depthWrite: true
  }));
  card.position.copy(p);

  scene.add(glow); scene.add(card);

  var n = { name: name, type: type, role: role, pos: p, card: card, glow: glow, hl: 0, hlColor: new THREE.Color(0xffffff) };
  nodes.push(n); byName[name] = n;
  card.userData.node = n;
});

/* ---------------------------------------------------------------- edges  */

function curveFor(a, b) {
  var p0 = a.pos.clone(), p1 = b.pos.clone();
  p0.x += CARD_W / 2; p1.x -= CARD_W / 2;
  var dx = p1.x - p0.x, dy = p1.y - p0.y;
  var mid = new THREE.Vector3((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
  // long jumps bow outward so they read as bypass channels
  var span = Math.abs(dx);
  mid.z += Math.min(6, span * 0.055) * (dy >= 0 ? 1 : -1) + (span > 30 ? -3.5 : 0);
  mid.y += (span > 30 ? -2.4 : dy * 0.12);
  return new THREE.QuadraticBezierCurve3(p0, mid, p1);
}

var edges = [], linePts = [];
EDGES.forEach(function (e) {
  var a = byName[e[0]], b = byName[e[1]];
  if (!a || !b) return;
  var cu = curveFor(a, b);
  var pts = cu.getPoints(26);
  for (var i = 0; i < pts.length - 1; i++) { linePts.push(pts[i], pts[i + 1]); }
  edges.push({ from: e[0], to: e[1], curve: cu, len: cu.getLength() });
});

var edgeIndex = {};
edges.forEach(function (e) { edgeIndex[e.from + ' ' + e.to] = e; });

var lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
scene.add(new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
  color: 0x91a0b4, transparent: true, opacity: 0.24
})));
var completedLine = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color:0x4d8be8, transparent:true, opacity:.5 }));
completedLine.visible = false; scene.add(completedLine);
var completedEdgeCount = -1;
var activeLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color:0x8cb8f5, transparent:true, opacity:1 }));
activeLine.visible = false; scene.add(activeLine);

function showActiveEdge(edge) {
  if (!edge) { activeLine.visible = false; return; }
  activeLine.geometry.dispose(); activeLine.geometry = new THREE.BufferGeometry().setFromPoints(edge.curve.getPoints(34));
  activeLine.visible = true;
}

function showCompletedPath() {
  if (!currentRunner) { completedLine.visible = false; completedEdgeCount = -1; return; }
  var done = currentRunner.hops.filter(function (h) { return clock > h.t1; });
  if (done.length === completedEdgeCount) return;
  completedEdgeCount = done.length;
  var pts = [];
  done.forEach(function (h) {
    var curvePts = h.edge.curve.getPoints(24);
    for (var i = 0; i < curvePts.length - 1; i++) pts.push(curvePts[i], curvePts[i + 1]);
  });
  completedLine.geometry.dispose();
  completedLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
  completedLine.visible = pts.length > 0;
}

/* ---------------------------------------------------------- guided record */

var haloGeo = new THREE.PlaneGeometry(1.35, 1.35);
var runners = [], DURATION = 1, currentScenario = null, currentRunner = null;
var humanResolved = true, currentStepName = '', currentStepIndex = 0;

function recordCard(id) {
  var cv = document.createElement('canvas'); cv.width = 360; cv.height = 440;
  var c = cv.getContext('2d');
  c.shadowColor = 'rgba(0,0,0,.36)'; c.shadowBlur = 22; c.shadowOffsetY = 10;
  c.fillStyle = '#202833'; c.fillRect(26, 20, 308, 388);
  c.shadowColor = 'transparent';
  c.strokeStyle = '#4d8be8'; c.lineWidth = 8; c.strokeRect(26, 20, 308, 388);
  c.fillStyle = '#4d8be8'; c.fillRect(26, 20, 308, 62);
  c.fillStyle = '#ffffff'; c.font = '800 24px ui-monospace,SFMono-Regular,Menlo,monospace';
  c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('MUNICIPAL RECORD', 48, 52);
  c.fillStyle = '#f4f6f8'; c.font = '900 66px ui-monospace,SFMono-Regular,Menlo,monospace'; c.fillText(id, 48, 142);
  c.fillStyle = '#aeb9c8'; c.font = '800 18px ui-monospace,SFMono-Regular,Menlo,monospace'; c.fillText('MIGRATION REVIEW', 48, 193);
  c.fillStyle = '#566273';
  c.fillRect(48, 232, 238, 13); c.fillRect(48, 264, 190, 13); c.fillRect(48, 296, 222, 13);
  c.fillStyle = '#4d8be8'; c.beginPath(); c.arc(286, 354, 22, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff'; c.font = '900 22px ui-monospace,SFMono-Regular,Menlo,monospace'; c.textAlign = 'center'; c.fillText('AI', 286, 355);
  var tex = new THREE.CanvasTexture(cv);
  var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false }));
  sprite.scale.set(1.5, 1.82, 1);
  return sprite;
}

function clearRunner() {
  stopNarration(false);
  runners.forEach(function (r) {
    scene.remove(r.mesh); scene.remove(r.halo);
    if (r.mesh.material.map) r.mesh.material.map.dispose();
    r.mesh.material.dispose(); r.halo.material.dispose();
  });
  runners = []; currentRunner = null; completedLine.visible = false; completedEdgeCount = -1;
}

function buildRunner(rec) {
  var hops = [], i, e, t = 0;
  for (i = 0; i < rec.path.length - 1; i++) {
    e = edgeIndex[rec.path[i] + ' ' + rec.path[i + 1]];
    if (!e) continue;
    hops.push({ edge:e, t0:0, t1:0, source:rec.path[i], target:rec.path[i + 1], index:hops.length + 1 });
  }
  hops.forEach(function (h) {
    h.t0 = t; t += Math.max(.48, h.edge.len / 8.2); h.t1 = t; t += .7;
  });
  var col = new THREE.Color(0x4d8be8);
  var mesh = recordCard(rec.id);
  mesh.visible = false; scene.add(mesh);
  var halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ map:glowTex, color:col, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending }));
  halo.visible = false; scene.add(halo);
  return { rec:rec, hops:hops, mesh:mesh, halo:halo, end:t, color:col, active:false, pos:new THREE.Vector3() };
}

/* -------------------------------------------------------- guided narration */

var NARRATION = window.CIVIC_NARRATION || { scenarios:{} };
var narrationAudio = document.createElement('audio');
narrationAudio.preload = 'auto';
narrationAudio.setAttribute('playsinline', '');
var narrationSegments = [], narrationIndex = -1, narrationMuted = false;
var narrationFailed = false, narrationSeekRatio = 0, narrationStarting = false;

function nodeArrivalTime(name) {
  if (!currentRunner || !currentScenario) return 0;
  if (currentScenario.path[0] === name) return 0;
  var hop = currentRunner.hops.find(function (h) { return h.target === name; });
  return hop ? hop.t1 : 0;
}

function stopNarration(clearUi) {
  narrationAudio.pause();
  narrationAudio.removeAttribute('src');
  narrationAudio.load();
  narrationSegments = []; narrationIndex = -1; narrationFailed = false; narrationSeekRatio = 0; narrationStarting = false;
  if (clearUi) {
    $('narrationvoice').textContent = 'Choose a scenario';
    $('narrationcaption').textContent = 'Select one of the three routes to begin its narrated walkthrough.';
  }
}

function prepareNarration() {
  stopNarration(false);
  if (!currentScenario || !NARRATION.scenarios[currentScenario.key]) return;
  var spec = NARRATION.scenarios[currentScenario.key], priorEnd = 0;
  narrationSegments = spec.segments.map(function (segment, index) {
    var end = index === spec.segments.length - 1 ? DURATION : nodeArrivalTime(segment.endNode);
    var bound = {
      id:segment.id,
      text:segment.text,
      startNode:segment.startNode,
      endNode:segment.endNode,
      tStart:priorEnd,
      tEnd:Math.max(priorEnd + .05, end),
      src:'narration/audio/' + currentScenario.key + '/' + segment.id + '.mp3'
    };
    priorEnd = bound.tEnd;
    return bound;
  });
  $('narrationvoice').textContent = spec.voiceLabel + ' · Grok Voice';
  $('narrationcaption').textContent = narrationSegments[0].text;
  narrationAudio.muted = narrationMuted;
}

function narrationSegmentForClock(value) {
  if (!narrationSegments.length) return -1;
  for (var i = narrationSegments.length - 1; i >= 0; i--) {
    if (value >= narrationSegments[i].tStart - .001) return i;
  }
  return 0;
}

function loadNarrationSegment(index) {
  if (index < 0 || index >= narrationSegments.length) return false;
  var segment = narrationSegments[index];
  if (narrationIndex === index && narrationAudio.getAttribute('src')) { narrationSeekRatio = null; return true; }
  narrationAudio.pause();
  narrationStarting = false;
  narrationIndex = index;
  narrationSeekRatio = Math.max(0, Math.min(1, (clock - segment.tStart) / Math.max(.01, segment.tEnd - segment.tStart)));
  narrationAudio.src = segment.src;
  narrationAudio.muted = narrationMuted;
  narrationAudio.load();
  $('narrationcaption').textContent = segment.text;
  return true;
}

function playNarration() {
  if (!narrationSegments.length || narrationFailed || narrationStarting) return;
  var index = narrationSegmentForClock(clock);
  if (!loadNarrationSegment(index)) return;
  narrationStarting = true;
  var begin = function () {
    if (narrationSeekRatio !== null && Number.isFinite(narrationAudio.duration) && narrationAudio.duration > 0) {
      narrationAudio.currentTime = Math.min(narrationAudio.duration - .01, narrationSeekRatio * narrationAudio.duration);
    }
    narrationSeekRatio = null;
    var promise = narrationAudio.play();
    narrationStarting = false;
    if (promise && promise.catch) promise.catch(function () {
      narrationFailed = true;
      $('narrationvoice').textContent = 'Narration unavailable';
    });
  };
  if (narrationAudio.readyState >= 1) begin();
  else narrationAudio.addEventListener('loadedmetadata', begin, { once:true });
}

function narrationTick() {
  if (!playing || !narrationSegments.length || narrationFailed) return false;
  var index = narrationSegmentForClock(clock);
  if (index !== narrationIndex) { loadNarrationSegment(index); playNarration(); return true; }
  if (narrationAudio.readyState < 1) return true;
  if (narrationAudio.paused && !narrationAudio.ended) playNarration();
  if (Number.isFinite(narrationAudio.duration) && narrationAudio.duration > 0) {
    var segment = narrationSegments[index];
    var ratio = Math.max(0, Math.min(1, narrationAudio.currentTime / narrationAudio.duration));
    clock = segment.tStart + ratio * (segment.tEnd - segment.tStart);
  }
  return true;
}

narrationAudio.addEventListener('ended', function () {
  if (narrationIndex < 0 || narrationIndex >= narrationSegments.length) return;
  clock = Math.min(DURATION, narrationSegments[narrationIndex].tEnd + .001);
  narrationIndex = -1; narrationStarting = false;
});
narrationAudio.addEventListener('error', function () {
  narrationFailed = true; narrationStarting = false;
  $('narrationvoice').textContent = 'Narration unavailable';
});

/* ---------------------------------------------------------------- camera */

var cam = {
  focus: new THREE.Vector3(0, 0, 0), dist: 60, yaw: 0, pitch: 0.30,
  tFocus: new THREE.Vector3(0, 0, 0), tDist: 60, tYaw: 0, tPitch: 0.30
};

function applyCamera() {
  var cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  camera.position.set(
    cam.focus.x + cam.dist * cp * Math.sin(cam.yaw),
    cam.focus.y + cam.dist * sp,
    cam.focus.z + cam.dist * cp * Math.cos(cam.yaw)
  );
  camera.lookAt(cam.focus);
}

function fitAll(instant) {
  var box = new THREE.Box3();
  nodes.forEach(function (n) { box.expandByPoint(n.pos); });
  var c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  cam.tFocus.copy(c);
  cam.tDist = Math.max(sz.x, sz.y * 2.2) * 0.62 + 12;
  cam.tYaw = 0; cam.tPitch = 0.34;
  if (instant) { cam.focus.copy(cam.tFocus); cam.dist = cam.tDist; cam.yaw = cam.tYaw; cam.pitch = cam.tPitch; }
}
var chFrame = CHAPTERS.map(function (c) {
  var box = new THREE.Box3(), any = false;
  c[1].forEach(function (nm) { if (byName[nm]) { box.expandByPoint(byName[nm].pos); any = true; } });
  if (!any) return null;
  var ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  return { center: ctr, w: sz.x + CARD_W * 1.6, h: sz.y + CARD_H * 2.4 };
});
function fitDist(w, h) {
  var vf = 2 * Math.tan(camera.fov * Math.PI / 360);
  return Math.max(h / vf, w / (vf * camera.aspect)) * 1.02 + 3.6;
}

fitAll(true); applyCamera();

/* -------------------------------------------------------------- controls */

var el = renderer.domElement, drag = null, moved = false;
var keys = {};

function markMoved() { if (!moved) { moved = true; body.className += ' moved'; } }
function detach() { if (follow) { follow = false; $('follow').className = 'btn'; } }

el.addEventListener('pointerdown', function (ev) {
  el.setPointerCapture(ev.pointerId);
  drag = { x: ev.clientX, y: ev.clientY, pan: ev.shiftKey || ev.button === 1 || ev.button === 2, t: Date.now(), moved: false };
});
el.addEventListener('pointermove', function (ev) {
  if (!drag) return;
  var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) { drag.moved = true; markMoved(); detach(); }
  drag.x = ev.clientX; drag.y = ev.clientY;
  if (drag.pan) {
    var right = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
    var up = new THREE.Vector3(0, 1, 0);
    var k = cam.dist * 0.0016;
    cam.tFocus.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
  } else {
    cam.tYaw -= dx * 0.0042;
    cam.tPitch = Math.max(-1.05, Math.min(1.15, cam.tPitch + dy * 0.0034));
  }
});
function endDrag(ev) {
  if (drag && !drag.moved) pick(ev);
  drag = null;
}
el.addEventListener('pointerup', endDrag);
el.addEventListener('pointercancel', function () { drag = null; });
el.addEventListener('contextmenu', function (e) { e.preventDefault(); });

el.addEventListener('wheel', function (ev) {
  ev.preventDefault(); markMoved(); detach();
  cam.tDist = Math.max(5, Math.min(220, cam.tDist * (1 + (ev.deltaY > 0 ? 0.13 : -0.13))));
}, { passive: false });

window.addEventListener('keydown', function (ev) {
  var k = ev.key.toLowerCase();
  keys[k] = true;
  if (k === ' ') { ev.preventDefault(); toggle(); }
  else if (k === 'f') { follow = !follow; $('follow').className = follow ? 'btn on' : 'btn'; }
  else if (k === 'r') { detach(); fitAll(false); }
  else if (k === 'escape') { hideDetail(); $('info').className = 'info'; }
});
window.addEventListener('keyup', function (ev) { keys[ev.key.toLowerCase()] = false; });

function flyKeys(dt) {
  var f = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
  var r = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
  var u = (keys.e ? 1 : 0) - (keys.q ? 1 : 0);
  if (!f && !r && !u) return;
  markMoved(); detach();
  var sp = cam.dist * 0.9 * dt;
  var fwd = new THREE.Vector3(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
  var rgt = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
  cam.tFocus.addScaledVector(fwd, f * sp).addScaledVector(rgt, r * sp);
  cam.tFocus.y += u * sp;
}

/* ------------------------------------------------------------ pick/detail */

var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(ev) {
  var vp = graphViewport();
  if (ev.clientX > vp.w || ev.clientY > vp.h) return;
  ndc.x = (ev.clientX / vp.w) * 2 - 1;
  ndc.y = -(ev.clientY / vp.h) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  var hits = ray.intersectObjects(nodes.map(function (n) { return n.card; }), false);
  if (hits.length) showDetail(hits[0].object.userData.node); else hideDetail();
}
function showDetail(n) {
  $('dkind').textContent = ROLE[n.role].tag + ' · ' + n.type;
  $('dname').textContent = n.name;
  $('dbody').textContent = NOTE[n.name] || '';
  $('detail').className = 'detail show';
}
function hideDetail() { $('detail').className = 'detail'; }
$('detailx').addEventListener('click', hideDetail);

/* -------------------------------------------------------------- playback */

var playing = false, clock = 0, follow = true, last = performance.now(), curCh = 0;
var humanChoice = '';
var journeyIndex = -1;

function updateJourney(index) {
  if (index === journeyIndex) return;
  journeyIndex = index;
  document.querySelectorAll('[data-chapter]').forEach(function (el) {
    var ch = Number(el.getAttribute('data-chapter'));
    el.className = 'journey-step' + (ch < index ? ' done' : (ch === index ? ' current' : ''));
    if (ch === index) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
  });
}

function guidedOutcome() {
  if (!currentScenario) return '';
  if (currentScenario.key === 'standard') return 'Approved for staging review. No production write occurs.';
  if (currentScenario.key === 'risk') return 'Held for the accountable municipal content owner. No production write occurs.';
  return 'Returned for revision with the evidence and verifier reason attached. No production write occurs.';
}

function hideCompletion() {
  $('completion').className = 'completion';
  $('completion').setAttribute('aria-hidden', 'true');
}

function showCompletion() {
  if (!currentScenario || $('completion').className.indexOf('show') !== -1) return;
  var spec = {
    standard: {
      title:'Supported recommendation',
      copy:'The current event page clears independent verification and reaches consultant review. It is approved for staging review; production remains a separate human-authorized action.',
      verification:'Supported', route:'Consultant review'
    },
    risk: {
      title:'Risk preserved',
      copy:'The scanned budget document remains on the senior-review path even after a supported recommendation. The system reduces preparation time without lowering the accountable review floor.',
      verification:'Supported', route:'Senior review'
    },
    verification: {
      title:'Unsupported claim rejected',
      copy:'The independent verifier rejects the proposed merge because similarity is not sufficient evidence. The recommendation returns for revision with its evidence and rejection reason attached.',
      verification:'Rejected', route:'Senior review'
    }
  }[currentScenario.key];
  $('completion-title').textContent = spec.title;
  $('completion-copy').textContent = spec.copy;
  $('completion-verification').textContent = spec.verification;
  $('completion-route').textContent = spec.route;
  $('completion').className = 'completion show';
  $('completion').setAttribute('aria-hidden', 'false');
}

function showScenarioChooser() {
  pause(); hideCompletion();
  body.classList.remove('has-scenario');
  body.classList.add('choosing');
  $('launcher').className = 'launcher';
}

function routeText(name) {
  var key = currentScenario ? currentScenario.key : '';
  var out = { decision:'No route is chosen at this step.', why:'This step prepares, calls, or validates one bounded part of the record.', next:'' };
  if (name === 'Manual Trigger') { out.decision='Start one controlled run.'; out.why='The demonstration begins only when the reviewer asks it to.'; }
  else if (name === 'Valid Input?') {
    out.decision = 'PASS. Continue to the governed task routes.';
    out.why = 'Tenant, page identity, secure source, content, and sensitive-data checks passed.';
  } else if (name === 'LIVE MODE?') { out.decision='LIVE. Use the evaluated OpenRouter task registry.'; out.why='This guided replay follows the same route exercised in the final live rehearsals.'; }
  else if (name === 'OCR Needed?') {
    out.decision = key === 'risk' ? 'YES. Extract the scanned document first.' : 'NO. Keep the existing digital text.';
    out.why = key === 'risk' ? 'The budget fixture is a scan, so downstream reasoning needs validated text.' : 'The event page already contains machine-readable text.';
  } else if (name === 'Disposition Valid?') { out.decision='PASS. No repair is needed in this clean scenario.'; out.why='The response has the required fields and complete, distinct, known evidence IDs.'; }
  else if (name === 'Ambiguity Analysis Needed?') {
    out.decision = key === 'standard' ? 'NO. Record the skip and continue.' : 'YES. Run the deeper conflict check.';
    out.why = key === 'risk' ? 'The scanned budget carries an elevated risk floor and needs accountable review.' : key === 'verification' ? 'The proposed merge combines records with a material evidence gap, so the workflow asks for a deeper check.' : 'The routine event page has no conflicting or high-consequence signal.';
  } else if (name === 'Validate Verification Result') {
    out.decision = key === 'verification' ? 'REJECTED. The merge recommendation goes beyond the resolved evidence.' : 'SUPPORTED. Continue, while preserving the human authority boundary.';
    out.why = key === 'verification' ? 'The independent verifier blocks the unsupported claim and raises the required review route.' : 'The recommendation is grounded in resolved source evidence and makes no unsupported authority claim.';
  }
  else if (name === 'Senior Review Needed?') {
    out.decision = key === 'standard' ? 'NO. Route to standard consultant review.' : 'YES. Route to a senior implementation reviewer.';
    out.why = key === 'risk' ? 'The deterministic risk floor remains elevated even when the recommendation is supported.' : key === 'verification' ? 'Failed independent verification forces escalation. The authoring model cannot overrule that control.' : 'The evidence is supported, no repair occurred, and no elevated risk signal remains.';
  } else if (name === 'Build Preflight Exception') { out.decision='STOP MODEL PROCESSING. Assign the exception to a human owner.'; out.why='A missing-content record cannot produce a grounded recommendation.'; }
  else if (name === 'Senior Review Simulation' || name === 'Consultant Review Simulation') { out.decision = humanChoice; out.why='The guided replay follows the recorded review outcome. The production workflow still preserves human authority.'; }
  else if (name === 'Build Audit + Metrics') { out.decision='Record the complete route and the human outcome.' + (humanChoice ? ' ' + humanChoice : ''); out.why='A reviewer should be able to reconstruct what happened without reading model logs.'; }
  else if (name === 'Final Structured Output') { out.decision='COMPLETE. Produce a review-ready record with zero public writes.' + (humanChoice ? ' ' + humanChoice : ''); out.why='Staging, publication, deletion, and municipal truth remain outside this workflow’s authority.'; }
  return out;
}

function scenarioIndexFor(name) {
  if (!currentScenario) return 0;
  return Math.max(0, currentScenario.path.indexOf(name));
}

function renderGuide(name) {
  if (!currentScenario || !name || name === currentStepName) return;
  currentStepName = name; currentStepIndex = scenarioIndexFor(name);
  var rt = routeText(name), nextName = currentScenario.path[currentStepIndex + 1];
  $('recordid').textContent = currentScenario.id;
  $('recordtitle').textContent = currentScenario.label;
  $('recordroute').textContent = currentScenario.route;
  $('stepcount').textContent = 'Step ' + (currentStepIndex + 1) + ' of ' + currentScenario.path.length;
  $('stepname').textContent = name;
  $('stepwhat').textContent = NOTE[name] || 'This step advances the governed workflow.';
  $('stepdecision').textContent = rt.decision;
  $('stepwhy').textContent = rt.why;
  $('stepnext').textContent = nextName ? nextName : 'Review the completed audit record.';
}

function toggle() { playing ? pause() : play(); }
function play() {
  if (!currentScenario) return;
  if (clock >= DURATION - .01) resetScenario(false);
  playing = true; body.className = body.className.replace(/\bplaying\b/g, '') + ' playing';
  $('playicon').setAttribute('d', 'M6 5h4v14H6zm8 0h4v14h-4z');
  $('play').setAttribute('aria-label', 'Pause');
  playNarration();
}
function pause() {
  narrationAudio.pause();
  playing = false; body.className = body.className.replace(/\bplaying\b/g, '');
  $('playicon').setAttribute('d', 'M8 5v14l11-7z');
  $('play').setAttribute('aria-label', 'Play');
}

function rebuildTicks() {
  var old = $('track').querySelectorAll('.tick'); old.forEach(function (d) { d.remove(); });
  if (!currentRunner) return;
  var seen = {};
  currentRunner.hops.forEach(function (h) {
    var ch = CH_OF[h.target]; if (ch === undefined || seen[ch]) return; seen[ch] = true;
    var d = document.createElement('div'); d.className = 'tick'; d.style.left = (h.t1 / DURATION * 100) + '%'; $('track').appendChild(d);
  });
}

function resetScenario(autoPlay) {
  if (!currentScenario) return;
  hideCompletion();
  narrationAudio.pause(); narrationIndex = -1; narrationStarting = false;
  clock = 0; humanResolved = true; humanChoice = guidedOutcome(); currentStepName = '';
  renderGuide(currentScenario.path[0]);
  follow = true; $('follow').className = 'btn on';
  if (autoPlay) play(); else pause();
}

function selectScenario(key) {
  var source = SCENARIOS[key]; if (!source) return;
  pause(); clearRunner();
  body.classList.remove('choosing'); body.classList.add('has-scenario');
  currentScenario = Object.assign({ key:key }, source); currentRunner = buildRunner(currentScenario); runners = [currentRunner];
  document.querySelectorAll('[data-side-scenario]').forEach(function (b) {
    var active = b.getAttribute('data-side-scenario') === key;
    b.className = active ? 'rail-scenario active' : 'rail-scenario';
    b.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  DURATION = currentRunner.end + 1.1; curCh = 0; rebuildTicks(); resetScenario(false); prepareNarration();
  $('launcher').className = 'launcher gone';
  play();
}

function stepTo(delta) {
  if (!currentRunner) return;
  pause();
  narrationIndex = -1; narrationStarting = false;
  var idx = Math.max(0, Math.min(currentScenario.path.length - 1, currentStepIndex + delta));
  var targetName = currentScenario.path[idx];
  if (idx > 0) {
    var hop = currentRunner.hops.find(function (h) { return h.target === targetName; });
    if (hop) clock = hop.t1 - .01;
  } else clock = 0;
  var narrationTarget = narrationSegments.findIndex(function (segment) { return segment.startNode === targetName; });
  loadNarrationSegment(narrationTarget >= 0 ? narrationTarget : narrationSegmentForClock(clock));
  currentStepName = ''; renderGuide(targetName);
  var n = byName[targetName]; if (n) { n.hl = 1; n.hlColor.set(0x4d8be8); }
}

$('play').addEventListener('click', toggle);
$('prev').addEventListener('click', function () { stepTo(-1); });
$('next').addEventListener('click', function () { stepTo(1); });
$('restart').addEventListener('click', function () { resetScenario(true); });
$('fit').addEventListener('click', function () { detach(); fitAll(false); });
$('follow').addEventListener('click', function () { follow = !follow; $('follow').className = follow ? 'btn on' : 'btn'; });
$('mute').addEventListener('click', function () {
  narrationMuted = !narrationMuted;
  narrationAudio.muted = narrationMuted;
  $('mute').className = narrationMuted ? 'btn on' : 'btn';
  $('mute').setAttribute('aria-pressed', narrationMuted ? 'true' : 'false');
  $('mute').setAttribute('aria-label', narrationMuted ? 'Unmute narration' : 'Mute narration');
  $('mute').setAttribute('title', narrationMuted ? 'Unmute narration' : 'Mute narration');
});
$('infobtn').addEventListener('click', function () { $('info').className = 'info show'; });
$('infoclose').addEventListener('click', function () { $('info').className = 'info'; });
$('info').addEventListener('click', function (e) { if (e.target === $('info')) $('info').className = 'info'; });
$('change-scenario').addEventListener('click', showScenarioChooser);
$('completion-compare').addEventListener('click', showScenarioChooser);
$('completion-replay').addEventListener('click', function () { resetScenario(true); });
document.querySelectorAll('[data-scenario]').forEach(function (b) { b.addEventListener('click', function () { selectScenario(b.getAttribute('data-scenario')); }); });
document.querySelectorAll('[data-side-scenario]').forEach(function (b) { b.addEventListener('click', function () { selectScenario(b.getAttribute('data-side-scenario')); }); });

var track = $('track');
function scrub(ev) {
  if (!currentRunner) return;
  var r = track.getBoundingClientRect(), requested = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * DURATION;
  clock = requested; currentStepName = ''; narrationIndex = -1; narrationStarting = false;
}
track.addEventListener('pointerdown', function (ev) { track.setPointerCapture(ev.pointerId); track.dataset.d = '1'; pause(); scrub(ev); });
track.addEventListener('pointermove', function (ev) { if (track.dataset.d === '1') scrub(ev); });
track.addEventListener('pointerup', function () { track.dataset.d = ''; });

/* ------------------------------------------------------------------ loop */

var tmpV = new THREE.Vector3();

function step(now) {
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (playing) {
    if (!narrationTick()) clock += dt;
    if (clock >= DURATION) { clock = DURATION; pause(); showCompletion(); }
  }
  flyKeys(dt);

  // ---- runners
  var live = 0, cenX = 0, cenY = 0, cenZ = 0, spread = 0, label = '', activeName = '', activeEdge = null;
  var chCount = new Array(CHAPTERS.length); for (var z0 = 0; z0 < chCount.length; z0++) chCount[z0] = 0;
  var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;

  runners.forEach(function (r) {
    var on = false, i, h;
    for (i = 0; i < r.hops.length; i++) {
      h = r.hops[i];
      if (clock >= h.t0 && clock <= h.t1) {
        var u = (clock - h.t0) / Math.max(0.0001, h.t1 - h.t0);
        h.edge.curve.getPoint(u, r.pos);
        on = true;
        activeName = u < .42 ? h.source : h.target; activeEdge = h.edge;
        if (CH_OF[h.target] !== undefined) chCount[CH_OF[h.target]]++;
        if (u > 0.965) {
          var tn = byName[h.target];
          if (tn) { tn.hl = 1; tn.hlColor.copy(r.color); }
        }
        break;
      }
      if (clock > h.t1 && (i === r.hops.length - 1 || clock < r.hops[i + 1].t0)) {
        var lastHop = (i === r.hops.length - 1);
        if (lastHop && clock > h.t1 + 1.6) break;   // retire after settling
        var dn = byName[h.target];
        if (dn) {
          r.pos.copy(dn.pos); r.pos.z += 0.9;
          dn.hl = 1; dn.hlColor.copy(r.color);
          on = true;
          activeName = h.target;
          if (CH_OF[h.target] !== undefined) chCount[CH_OF[h.target]]++;
        }
        break;
      }
    }
    r.active = on;
    r.mesh.visible = on; r.halo.visible = on;
    if (on) {
      r.mesh.position.copy(r.pos);
      r.halo.position.copy(r.pos);
      r.halo.quaternion.copy(camera.quaternion);
      r.halo.material.opacity = 0.62;
      live++;
      cenX += r.pos.x; cenY += r.pos.y; cenZ += r.pos.z;
      if (r.pos.x < minx) minx = r.pos.x; if (r.pos.x > maxx) maxx = r.pos.x;
      if (r.pos.y < miny) miny = r.pos.y; if (r.pos.y > maxy) maxy = r.pos.y;
      label = r.rec.id + ' · ' + r.rec.label;
    }
  });
  showActiveEdge(activeEdge);
  showCompletedPath();
  if (currentScenario && !activeName) activeName = currentScenario.path[0];
  if (activeName) {
    renderGuide(activeName);
  }

  // ---- node highlight decay
  nodes.forEach(function (n) {
    if (n.hl > 0) {
      n.hl *= 0.938;
      if (n.hl < 0.004) n.hl = 0;
      n.glow.visible = true;
      n.glow.material.opacity = n.hl * 0.9;
      n.glow.material.color.copy(n.hlColor);
      var s = 1 + n.hl * 0.12;
      n.card.scale.set(s, s, 1);
    } else if (n.glow.visible) {
      n.glow.visible = false; n.glow.material.opacity = 0; n.card.scale.set(1, 1, 1);
    }
  });

  // ---- camera follow: frame the chapter where most of the action is
  if (live) {
    var best = -1, bestN = -1, ci;
    for (ci = 0; ci < CHAPTERS.length; ci++) {
      if (chCount[ci] > bestN || (chCount[ci] === bestN && chCount[ci] > 0)) { bestN = chCount[ci]; best = ci; }
    }
    if (best >= 0 && bestN > 0) curCh = best;
  }
  if (currentScenario) updateJourney(curCh);
  if (follow && chFrame[curCh]) {
    var fr = chFrame[curCh];
    cam.tFocus.copy(fr.center);
    cam.tDist = fitDist(fr.w, fr.h);
    cam.tPitch = 0.12;
    cam.tYaw = Math.sin(clock * 0.085) * 0.17;
  }

  var k = 1 - Math.pow(0.0012, dt);
  cam.focus.lerp(cam.tFocus, k);
  cam.dist += (cam.tDist - cam.dist) * k;
  cam.yaw += (cam.tYaw - cam.yaw) * k;
  cam.pitch += (cam.tPitch - cam.pitch) * k;
  applyCamera();

  // ---- billboards for cards (face camera on Y only, keeps the row readable)
  nodes.forEach(function (n) {
    n.card.quaternion.copy(camera.quaternion);
    n.glow.quaternion.copy(camera.quaternion);
  });

  // ---- ui
  $('fill').style.width = (clock / DURATION * 100) + '%';
  $('head').style.left = (clock / DURATION * 100) + '%';
  $('now').textContent = currentScenario ? (clock >= DURATION - 0.02 ? 'Run complete' : CHAPTERS[curCh][0]) : 'Choose a scenario';

  renderer.render(scene, camera);
  requestAnimationFrame(step);
}
requestAnimationFrame(step);

window.addEventListener('resize', function () {
  viewport = graphViewport();
  camera.aspect = viewport.w / viewport.h;
  camera.updateProjectionMatrix();
  renderer.setSize(viewport.w, viewport.h);
});

})();
