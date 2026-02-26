import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Constants & State ───────────────────────────────────────────
const G_BASE = 40;
const SOFTENING = 4;
const MAX_SPEED = 80;
const GRID_SIZE = 60;
const GRID_SEG = 80;

let paused = false;
let gravityMul = 1;
let simSpeed = 1;
let trailLen = 120;
let showCurvature = true;
let showTrails = true;
let showVectors = false;
let bodies = [];
let nextId = 0;

// ─── Three.js Setup ─────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020208);
scene.fog = new THREE.FogExp2(0x020208, 0.003);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 2000);
camera.position.set(40, 50, 60);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 10;
controls.maxDistance = 500;

// Lights
scene.add(new THREE.AmbientLight(0x223344, 0.6));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(30, 50, 20);
scene.add(dirLight);

// Starfield
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(3000 * 3);
for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 800;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, sizeAttenuation: true });
scene.add(new THREE.Points(starGeo, starMat));

// ─── Curvature Grid ─────────────────────────────────────────────
const gridGeo = new THREE.PlaneGeometry(GRID_SIZE * 2, GRID_SIZE * 2, GRID_SEG, GRID_SEG);
gridGeo.rotateX(-Math.PI / 2);
const gridMat = new THREE.MeshBasicMaterial({
  color: 0x2244aa, wireframe: true, transparent: true, opacity: 0.22,
  depthWrite: false, side: THREE.DoubleSide,
});
const gridMesh = new THREE.Mesh(gridGeo, gridMat);
gridMesh.position.y = -8;
scene.add(gridMesh);
const gridRestY = new Float32Array(gridGeo.attributes.position.count);
const posAttr = gridGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) gridRestY[i] = posAttr.getY(i);

// ─── Body Creation ──────────────────────────────────────────────
function massToRadius(m) { return Math.pow(m, 1 / 3) * 0.45; }

function bodyColor(mass) {
  const t = Math.min(mass / 300, 1);
  return new THREE.Color().setHSL(0.6 - t * 0.5, 0.8, 0.55 + t * 0.15);
}

function createBody(mass, pos, vel) {
  const r = massToRadius(mass);
  const color = bodyColor(mass);
  const geo = new THREE.SphereGeometry(r, 24, 18);
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.5,
    roughness: 0.3, metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  scene.add(mesh);

  // Glow sprite
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, `rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},0.6)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(canvas);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.setScalar(r * 5);
  mesh.add(glow);

  // Trail
  const maxPts = 500;
  const trailGeo = new THREE.BufferGeometry();
  const trailPositions = new Float32Array(maxPts * 3);
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  trailGeo.setDrawRange(0, 0);
  const trailMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false });
  const trail = new THREE.Line(trailGeo, trailMat);
  scene.add(trail);

  // Velocity arrow
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), pos, 1, 0x44ff88, 0.8, 0.4);
  arrow.visible = showVectors;
  scene.add(arrow);

  const body = {
    id: nextId++, mass, pos: pos.clone(), vel: vel.clone(), acc: new THREE.Vector3(),
    radius: r, mesh, trail, trailGeo, trailPositions, trailPoints: [], arrow, color,
  };
  bodies.push(body);
  updateBodyList();
  return body;
}

function removeBody(id) {
  const idx = bodies.findIndex(b => b.id === id);
  if (idx < 0) return;
  const b = bodies[idx];
  scene.remove(b.mesh); scene.remove(b.trail); scene.remove(b.arrow);
  b.mesh.geometry.dispose(); b.mesh.material.dispose();
  b.trailGeo.dispose(); b.trail.material.dispose();
  bodies.splice(idx, 1);
  updateBodyList();
}

// ─── Physics ────────────────────────────────────────────────────
function computeAccelerations() {
  for (const b of bodies) b.acc.set(0, 0, 0);
  const G = G_BASE * gravityMul;
  const eps2 = SOFTENING * SOFTENING;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y, dz = b.pos.z - a.pos.z;
      const dist2 = dx * dx + dy * dy + dz * dz + eps2;
      const dist = Math.sqrt(dist2);
      const F = G / dist2;
      const fx = F * dx / dist, fy = F * dy / dist, fz = F * dz / dist;
      a.acc.x += fx * b.mass; a.acc.y += fy * b.mass; a.acc.z += fz * b.mass;
      b.acc.x -= fx * a.mass; b.acc.y -= fy * a.mass; b.acc.z -= fz * a.mass;
    }
  }
}

function detectCollisions() {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      const d = a.pos.distanceTo(b.pos);
      if (d < (a.radius + b.radius) * 0.6) {
        // Merge into heavier
        const [big, small] = a.mass >= b.mass ? [a, b] : [b, a];
        const totalMass = big.mass + small.mass;
        big.vel.multiplyScalar(big.mass).addScaledVector(small.vel, small.mass).divideScalar(totalMass);
        big.pos.multiplyScalar(big.mass).addScaledVector(small.pos, small.mass).divideScalar(totalMass);
        big.mass = totalMass;
        big.radius = massToRadius(totalMass);
        const c = bodyColor(totalMass);
        big.color = c;
        big.mesh.material.color.copy(c);
        big.mesh.material.emissive.copy(c);
        big.mesh.geometry.dispose();
        big.mesh.geometry = new THREE.SphereGeometry(big.radius, 24, 18);
        big.mesh.children[0].scale.setScalar(big.radius * 5);
        big.trail.material.color.copy(c);
        removeBody(small.id);
        return detectCollisions(); // re-check
      }
    }
  }
}

function stepPhysics(dt) {
  // Leapfrog integrator
  const halfDt = dt * 0.5;
  // Half-kick
  computeAccelerations();
  for (const b of bodies) {
    b.vel.addScaledVector(b.acc, halfDt);
    // Speed clamp
    const spd = b.vel.length();
    if (spd > MAX_SPEED) b.vel.multiplyScalar(MAX_SPEED / spd);
  }
  // Drift
  for (const b of bodies) b.pos.addScaledVector(b.vel, dt);
  // Half-kick
  computeAccelerations();
  for (const b of bodies) b.vel.addScaledVector(b.acc, halfDt);

  detectCollisions();
}

// ─── Gravitational Redshift Effect ──────────────────────────────
function applyRedshift() {
  for (const b of bodies) {
    let potential = 0;
    for (const o of bodies) {
      if (o === b) continue;
      const d = b.pos.distanceTo(o.pos) + SOFTENING;
      potential += o.mass / d;
    }
    // Map potential to hue shift toward red
    const shift = Math.min(potential * 0.003 * gravityMul, 0.35);
    const baseHSL = {};
    b.color = bodyColor(b.mass);
    b.color.getHSL(baseHSL);
    const newHue = Math.max(baseHSL.h - shift, 0);
    b.mesh.material.color.setHSL(newHue, baseHSL.s, baseHSL.l);
    b.mesh.material.emissive.setHSL(newHue, baseHSL.s, baseHSL.l * 0.6);
    b.mesh.material.emissiveIntensity = 0.5 + shift * 2;
  }
}

// ─── Update Curvature Grid ──────────────────────────────────────
function updateGrid() {
  if (!showCurvature) { gridMesh.visible = false; return; }
  gridMesh.visible = true;
  const pos = gridGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const gx = pos.getX(i), gz = pos.getZ(i);
    let deform = 0;
    for (const b of bodies) {
      const dx = gx - b.pos.x, dz = gz - b.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz) + 2;
      deform -= b.mass * 0.15 / dist;
    }
    pos.setY(i, gridRestY[i] + Math.max(deform, -25));
  }
  pos.needsUpdate = true;
}

// ─── Update Visuals ─────────────────────────────────────────────
function updateVisuals() {
  for (const b of bodies) {
    b.mesh.position.copy(b.pos);

    // Trail
    if (showTrails) {
      b.trailPoints.push(b.pos.clone());
      if (b.trailPoints.length > trailLen) b.trailPoints.shift();
      const n = b.trailPoints.length;
      for (let i = 0; i < n; i++) {
        b.trailPositions[i * 3] = b.trailPoints[i].x;
        b.trailPositions[i * 3 + 1] = b.trailPoints[i].y;
        b.trailPositions[i * 3 + 2] = b.trailPoints[i].z;
      }
      b.trailGeo.attributes.position.needsUpdate = true;
      b.trailGeo.setDrawRange(0, n);
      b.trail.visible = true;
    } else {
      b.trail.visible = false;
    }

    // Arrow
    if (showVectors) {
      b.arrow.visible = true;
      b.arrow.position.copy(b.pos);
      const len = b.vel.length();
      if (len > 0.01) {
        b.arrow.setDirection(b.vel.clone().normalize());
        b.arrow.setLength(Math.min(len * 0.5, 15), 0.8, 0.4);
      }
    } else {
      b.arrow.visible = false;
    }
  }
}

// ─── UI ─────────────────────────────────────────────────────────
function updateBodyList() {
  document.getElementById('body-count').textContent = bodies.length;
  const list = document.getElementById('body-list');
  list.innerHTML = '';
  for (const b of bodies) {
    const c = bodyColor(b.mass);
    const hex = '#' + c.getHexString();
    const div = document.createElement('div');
    div.className = 'body-item';
    div.innerHTML = `<span><span class="dot" style="background:${hex}"></span>m=${b.mass.toFixed(0)} r=${b.radius.toFixed(1)}</span>`;
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.onclick = () => removeBody(b.id);
    div.appendChild(btn);
    list.appendChild(div);
  }
}

function randRange(a, b) { return a + Math.random() * (b - a); }

function addRandomBody() {
  const m = parseFloat(document.getElementById('slider-mass').value);
  const angle = Math.random() * Math.PI * 2;
  const dist = randRange(10, 35);
  const pos = new THREE.Vector3(Math.cos(angle) * dist, randRange(-5, 5), Math.sin(angle) * dist);
  // Give tangential velocity for orbit-like motion
  const tangent = new THREE.Vector3(-Math.sin(angle), randRange(-0.3, 0.3), Math.cos(angle));
  const speed = randRange(2, 8);
  createBody(m, pos, tangent.multiplyScalar(speed));
}

function addCentral() {
  createBody(300, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
}

function loadPreset() {
  resetSim();
  const centralMass = 300;
  createBody(centralMass, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
  // Compute orbital speed: v = sqrt(G * M / r) for stable circular orbits
  const planets = [
    { m: 8, d: 14 }, { m: 12, d: 20 }, { m: 10, d: 27 },
    { m: 18, d: 34 }, { m: 6, d: 42 },
  ];
  for (const p of planets) {
    p.s = Math.sqrt(G_BASE * centralMass / p.d) * 0.95; // slightly sub-circular for visual interest
  }
  for (const p of planets) {
    const a = Math.random() * Math.PI * 2;
    const y = randRange(-2, 2);
    const pos = new THREE.Vector3(Math.cos(a) * p.d, y, Math.sin(a) * p.d);
    const vel = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(p.s);
    createBody(p.m, pos, vel);
  }
}

function resetSim() {
  while (bodies.length > 0) removeBody(bodies[0].id);
}

// Bind UI
document.getElementById('btn-pause').onclick = () => {
  paused = !paused;
  document.getElementById('btn-pause').textContent = paused ? '▶ Play' : '⏸ Pause';
};
document.getElementById('btn-reset').onclick = resetSim;
document.getElementById('btn-add').onclick = addRandomBody;
document.getElementById('btn-add-central').onclick = addCentral;
document.getElementById('btn-preset').onclick = loadPreset;
loadPreset(); // Auto-load solar system on start

const sliderGravity = document.getElementById('slider-gravity');
const sliderSpeed = document.getElementById('slider-speed');
const sliderTrail = document.getElementById('slider-trail');
const sliderMass = document.getElementById('slider-mass');

sliderGravity.oninput = () => { gravityMul = parseFloat(sliderGravity.value); document.getElementById('val-gravity').textContent = gravityMul.toFixed(2); };
sliderSpeed.oninput = () => { simSpeed = parseFloat(sliderSpeed.value); document.getElementById('val-speed').textContent = simSpeed.toFixed(2); };
sliderTrail.oninput = () => { trailLen = parseInt(sliderTrail.value); document.getElementById('val-trail').textContent = trailLen; };
sliderMass.oninput = () => { document.getElementById('val-mass').textContent = sliderMass.value; };

document.getElementById('chk-curvature').onchange = (e) => { showCurvature = e.target.checked; };
document.getElementById('chk-trails').onchange = (e) => { showTrails = e.target.checked; };
document.getElementById('chk-vectors').onchange = (e) => { showVectors = e.target.checked; };

// Raycaster for clicking bodies
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('dblclick', (e) => {
  mouse.x = ((e.clientX) / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshes = bodies.map(b => b.mesh);
  const hits = raycaster.intersectObjects(meshes);
  if (hits.length > 0) {
    const b = bodies.find(b => b.mesh === hits[0].object);
    if (b) removeBody(b.id);
  }
});

// ─── Resize ─────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animation Loop ─────────────────────────────────────────────
let lastTime = performance.now();
let frameCount = 0;
let fpsTime = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const rawDt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // FPS
  frameCount++;
  fpsTime += rawDt;
  if (fpsTime >= 0.5) {
    document.getElementById('fps-counter').textContent = Math.round(frameCount / fpsTime) + ' FPS';
    frameCount = 0; fpsTime = 0;
  }

  if (!paused && bodies.length > 0) {
    const dt = rawDt * simSpeed;
    // Sub-step for stability
    const steps = Math.max(1, Math.round(dt / 0.008));
    const subDt = dt / steps;
    for (let s = 0; s < steps; s++) stepPhysics(subDt);
    applyRedshift();
  }

  updateVisuals();
  updateGrid();
  controls.update();
  renderer.render(scene, camera);

  // Energy display
  let ke = 0;
  for (const b of bodies) ke += 0.5 * b.mass * b.vel.lengthSq();
  document.getElementById('energy-display').textContent = 'KE: ' + ke.toFixed(0);
}

// ─── Start ──────────────────────────────────────────────────────
loadPreset();
requestAnimationFrame(animate);
