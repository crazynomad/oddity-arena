(() => {
'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const titleCard = document.getElementById('title-card');
const endCard = document.getElementById('end-card');
const stepIndicator = document.getElementById('step-indicator');

let W, H, dpr;
function resize() {
  dpr = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

// ============ STATE ============
const PHASES = ['title', 'setup', 'crouch', 'leap', 'step1', 'step2', 'step3', 'step4', 'step5', 'peak', 'landing', 'end'];
let phase = 'title';
let phaseTime = 0;
let globalTime = 0;
let cameraY = 0;
let targetCameraY = 0;
let particles = [];
let afterimages = [];
let shockwaves = [];
let speedLines = [];
let inkSplashes = [];
let cloudWisps = [];

// Character state
const char = {
  x: 0, y: 0, velY: 0,
  torsoAngle: 0, // lean
  leftLegAngle: 0, rightLegAngle: 0,
  leftArmAngle: 0, rightArmAngle: 0,
  crouching: 0, // 0-1
  robeFlow: 0,
  sashFlow: 0,
  hairFlow: 0,
  scale: 1,
  stepFoot: 'left', // which foot steps next
};

// Scene constants
const GROUND_Y = 0; // world coords, ground at 0, up is negative
const STEP_HEIGHTS = [-200, -500, -900, -1400, -2000]; // world Y for each step
const PEAK_HEIGHT = -2800;

// Interactive mode
let interactiveMode = false;
let pendingStep = 0;
let awaitingClick = false;

// Step indicator dots
function buildStepDots() {
  stepIndicator.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const dot = document.createElement('div');
    dot.className = 'step-dot';
    dot.dataset.idx = i;
    stepIndicator.appendChild(dot);
  }
}
buildStepDots();

function setActiveDot(idx) {
  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.classList.toggle('active', i <= idx);
  });
}

// ============ UTILS ============
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t) { return t * t * t; }
function rand(a, b) { return a + Math.random() * (b - a); }

// ============ COLORS ============
const INK = {
  bg: '#f4ede0',
  bgDark: '#1a1612',
  paper: '#e8dcc8',
  ink: '#2a1f14',
  inkLight: '#5a4a3a',
  inkFaint: 'rgba(42,31,20,0.15)',
  red: '#c43a31',
  gold: '#d4a843',
  goldGlow: 'rgba(212,168,67,0.4)',
  moonGlow: 'rgba(255,240,200,0.15)',
  cloud: 'rgba(200,190,170,0.3)',
};

// ============ BACKGROUND RENDERING ============

function drawSky(t) {
  // Gradient from paper-white at bottom to darker at top, shifts as we ascend
  const ascendRatio = clamp(-cameraY / 3000, 0, 1);
  const grad = ctx.createLinearGradient(0, 0, 0, H);

  if (ascendRatio < 0.3) {
    // Near ground: warm paper tones
    grad.addColorStop(0, '#d8cbb8');
    grad.addColorStop(1, '#f0e6d4');
  } else if (ascendRatio < 0.7) {
    // Mid altitude: transitioning to night
    const m = (ascendRatio - 0.3) / 0.4;
    const r1 = lerp(216, 30, m), g1 = lerp(203, 25, m), b1 = lerp(184, 40, m);
    const r2 = lerp(240, 60, m), g2 = lerp(230, 50, m), b2 = lerp(212, 70, m);
    grad.addColorStop(0, `rgb(${r1|0},${g1|0},${b1|0})`);
    grad.addColorStop(1, `rgb(${r2|0},${g2|0},${b2|0})`);
  } else {
    // High altitude: deep night
    grad.addColorStop(0, '#0e0b15');
    grad.addColorStop(0.6, '#1a1525');
    grad.addColorStop(1, '#2a2035');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars appear at high altitude
  if (ascendRatio > 0.5) {
    const starAlpha = (ascendRatio - 0.5) * 2;
    drawStars(t, starAlpha);
  }
}

function drawStars(t, alpha) {
  // Deterministic stars
  const seed = 42;
  for (let i = 0; i < 80; i++) {
    const px = ((seed * (i + 1) * 7919) % 10000) / 10000;
    const py = ((seed * (i + 1) * 6271) % 10000) / 10000;
    const twinkle = Math.sin(t * 2 + i * 1.3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,250,230,${alpha * twinkle * 0.7})`;
    const sz = ((i % 3) + 1) * 0.8;
    ctx.beginPath();
    ctx.arc(px * W, py * H * 0.7, sz, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMoon(t) {
  const ascendRatio = clamp(-cameraY / 3000, 0, 1);
  // Moon rises as we ascend
  const moonBaseY = H * 0.15;
  const moonWorldY = -2200; // world Y where moon is
  const moonScreenY = moonWorldY - cameraY + H * 0.7;
  const moonX = W * 0.72;
  const moonR = lerp(40, 80, ascendRatio);

  if (moonScreenY < -200 || moonScreenY > H + 200) return;

  // Moon glow
  const glowR = moonR * 4;
  const glow = ctx.createRadialGradient(moonX, moonScreenY, moonR * 0.5, moonX, moonScreenY, glowR);
  glow.addColorStop(0, `rgba(255,240,200,${0.15 * Math.min(1, ascendRatio * 2)})`);
  glow.addColorStop(0.5, `rgba(255,230,180,${0.05 * Math.min(1, ascendRatio * 2)})`);
  glow.addColorStop(1, 'rgba(255,220,160,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(moonX, moonScreenY, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Moon body
  ctx.fillStyle = `rgba(255,245,220,${0.7 + ascendRatio * 0.3})`;
  ctx.beginPath();
  ctx.arc(moonX, moonScreenY, moonR, 0, Math.PI * 2);
  ctx.fill();

  // Moon craters (subtle)
  ctx.fillStyle = `rgba(220,210,180,${0.3 + ascendRatio * 0.2})`;
  ctx.beginPath(); ctx.arc(moonX - moonR * 0.2, moonScreenY - moonR * 0.1, moonR * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(moonX + moonR * 0.15, moonScreenY + moonR * 0.25, moonR * 0.1, 0, Math.PI * 2); ctx.fill();
}

function drawMountains(t) {
  const ascendRatio = clamp(-cameraY / 3000, 0, 1);

  // Far mountains - parallax 0.1
  drawMountainLayer(0.1, 0.4, `rgba(80,70,60,${0.3 - ascendRatio * 0.2})`, 300);
  // Mid mountains - parallax 0.2
  drawMountainLayer(0.2, 0.55, `rgba(60,50,40,${0.4 - ascendRatio * 0.3})`, 200);
  // Near mountains - parallax 0.35
  drawMountainLayer(0.35, 0.7, `rgba(45,35,28,${0.5 - ascendRatio * 0.4})`, 100);
}

function drawMountainLayer(parallax, baseRatio, color, seed) {
  const offsetY = cameraY * parallax;
  const baseY = H * baseRatio + offsetY;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  for (let x = -10; x <= W + 10; x += 3) {
    const n1 = Math.sin(x * 0.003 + seed) * 80;
    const n2 = Math.sin(x * 0.008 + seed * 2) * 40;
    const n3 = Math.sin(x * 0.001 + seed * 0.5) * 120;
    ctx.lineTo(x, baseY + n1 + n2 + n3);
  }
  ctx.lineTo(W + 10, H + 10);
  ctx.closePath();
  ctx.fill();
}

function drawBamboo(t) {
  const offsetY = cameraY * 0.5;
  const baseY = H * 0.85 + offsetY;
  if (baseY < -200) return; // off screen

  const ascendRatio = clamp(-cameraY / 3000, 0, 1);
  const alpha = clamp(1 - ascendRatio * 1.5, 0, 1);
  if (alpha <= 0) return;

  // Draw bamboo stalks
  for (let i = 0; i < 12; i++) {
    const bx = (i / 12) * W * 1.2 - W * 0.1;
    const sway = Math.sin(t * 0.8 + i * 1.5) * 3;
    const h = 200 + (i % 3) * 80;

    ctx.strokeStyle = `rgba(50,65,35,${alpha * 0.6})`;
    ctx.lineWidth = 3 + (i % 2);
    ctx.beginPath();
    ctx.moveTo(bx, baseY);
    ctx.quadraticCurveTo(bx + sway, baseY - h / 2, bx + sway * 1.5, baseY - h);
    ctx.stroke();

    // Nodes
    for (let j = 1; j < 4; j++) {
      const ny = baseY - h * j / 4;
      const nx = bx + sway * (j / 4);
      ctx.strokeStyle = `rgba(40,55,25,${alpha * 0.4})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(nx - 4, ny); ctx.lineTo(nx + 4, ny);
      ctx.stroke();
    }

    // Leaves
    const leafSway = Math.sin(t * 1.2 + i * 2) * 5;
    ctx.fillStyle = `rgba(55,75,35,${alpha * 0.4})`;
    for (let j = 0; j < 3; j++) {
      const lx = bx + sway * 1.5 + rand(-15, 15) + leafSway;
      const ly = baseY - h + rand(-30, 20);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rand(-0.8, 0.8));
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawClouds(t) {
  const ascendRatio = clamp(-cameraY / 3000, 0, 1);

  // Multiple cloud layers at different world heights
  const cloudLayers = [
    { worldY: -400, parallax: 0.6, count: 4, alpha: 0.3 },
    { worldY: -900, parallax: 0.5, count: 5, alpha: 0.35 },
    { worldY: -1500, parallax: 0.4, count: 6, alpha: 0.4 },
    { worldY: -2200, parallax: 0.3, count: 5, alpha: 0.25 },
  ];

  for (const layer of cloudLayers) {
    const screenY = layer.worldY - cameraY * layer.parallax + H * 0.5;
    if (screenY < -200 || screenY > H + 200) continue;

    for (let i = 0; i < layer.count; i++) {
      const cx = ((i + 0.5) / layer.count) * W + Math.sin(t * 0.2 + i * 3) * 30;
      const cy = screenY + Math.sin(t * 0.15 + i * 2) * 15;
      drawInkCloud(cx, cy, 80 + (i % 3) * 30, layer.alpha);
    }
  }
}

function drawInkCloud(x, y, size, alpha) {
  ctx.fillStyle = `rgba(180,170,155,${alpha})`;
  // Organic cloud shape with multiple overlapping circles
  for (let i = 0; i < 5; i++) {
    const ox = (i - 2) * size * 0.3;
    const oy = Math.sin(i * 1.2) * size * 0.1;
    const r = size * (0.25 + Math.sin(i * 2.5) * 0.1);
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(t) {
  const groundScreenY = GROUND_Y - cameraY + H * 0.7;
  if (groundScreenY > H + 50) return;
  if (groundScreenY < -50) return;

  const ascendRatio = clamp(-cameraY / 3000, 0, 1);
  const alpha = clamp(1 - ascendRatio * 2, 0, 1);
  if (alpha <= 0) return;

  // Ground surface - ink wash style
  ctx.fillStyle = `rgba(42,31,20,${alpha * 0.6})`;
  ctx.beginPath();
  ctx.moveTo(-10, groundScreenY);
  for (let x = -10; x <= W + 10; x += 5) {
    const bump = Math.sin(x * 0.02) * 3 + Math.sin(x * 0.05) * 2;
    ctx.lineTo(x, groundScreenY + bump);
  }
  ctx.lineTo(W + 10, H + 10);
  ctx.lineTo(-10, H + 10);
  ctx.closePath();
  ctx.fill();

  // Cliff face / wall on the right side
  drawCliff(groundScreenY, alpha, t);
}

function drawCliff(groundY, alpha, t) {
  const cliffX = W * 0.78;
  const cliffTop = groundY - 350;

  ctx.fillStyle = `rgba(55,42,30,${alpha * 0.7})`;
  ctx.beginPath();
  ctx.moveTo(cliffX, groundY);
  ctx.lineTo(cliffX - 20, cliffTop + 50);
  ctx.lineTo(cliffX + 10, cliffTop);
  ctx.lineTo(W + 10, cliffTop - 20);
  ctx.lineTo(W + 10, groundY);
  ctx.closePath();
  ctx.fill();

  // Cliff texture lines
  ctx.strokeStyle = `rgba(35,25,18,${alpha * 0.3})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const lx = cliffX + 10 + i * 25;
    ctx.beginPath();
    ctx.moveTo(lx, cliffTop + rand(0, 30));
    ctx.lineTo(lx + rand(-10, 10), groundY);
    ctx.stroke();
  }
}

// ============ CHARACTER DRAWING ============

function drawCharacter(t) {
  const screenX = char.x;
  const screenY = char.y - cameraY + H * 0.7;

  if (screenY < -200 || screenY > H + 200) return;

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.scale(char.scale, char.scale);
  ctx.rotate(char.torsoAngle);

  const crouchOffset = char.crouching * 15;

  // === AFTERIMAGE TRAIL ===
  // (drawn separately before character)

  // === BODY ===
  const bodyH = 45 - crouchOffset;

  // Flowing robe (outer) — with cloth physics
  drawRobe(t, bodyH, crouchOffset);

  // Legs
  drawLegs(t, bodyH, crouchOffset);

  // Torso
  ctx.fillStyle = INK.ink;
  ctx.beginPath();
  ctx.ellipse(0, -bodyH / 2, 10, bodyH / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red sash at waist
  ctx.strokeStyle = INK.red;
  ctx.lineWidth = 3;
  const sashWave = Math.sin(t * 3 + char.sashFlow) * 8;
  ctx.beginPath();
  ctx.moveTo(-8, -5 + crouchOffset);
  ctx.quadraticCurveTo(-15 + sashWave, 5, -25 + sashWave * 1.5, 10 + Math.sin(t * 4) * 3);
  ctx.stroke();
  // Sash second tail
  ctx.beginPath();
  ctx.moveTo(-8, -3 + crouchOffset);
  ctx.quadraticCurveTo(-12 + sashWave * 0.7, 8, -20 + sashWave * 1.2, 18 + Math.sin(t * 3.5) * 4);
  ctx.stroke();

  // Arms
  drawArms(t, bodyH, crouchOffset);

  // Head
  ctx.fillStyle = INK.ink;
  ctx.beginPath();
  ctx.arc(0, -bodyH - 8, 9, 0, Math.PI * 2);
  ctx.fill();

  // Hair flowing
  const hairWave = Math.sin(t * 2.5 + char.hairFlow) * 12;
  ctx.strokeStyle = INK.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -bodyH - 14);
  ctx.quadraticCurveTo(-10 + hairWave * 0.5, -bodyH - 30, -20 + hairWave, -bodyH - 45);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2, -bodyH - 13);
  ctx.quadraticCurveTo(-8 + hairWave * 0.3, -bodyH - 25, -15 + hairWave * 0.8, -bodyH - 40);
  ctx.stroke();

  // Sword on back (diagonal)
  ctx.strokeStyle = `rgba(100,90,80,0.7)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, -10 + crouchOffset);
  ctx.lineTo(12, -bodyH - 25);
  ctx.stroke();
  // Sword hilt
  ctx.strokeStyle = INK.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4, -6 + crouchOffset);
  ctx.lineTo(10, -4 + crouchOffset);
  ctx.stroke();

  ctx.restore();
}

function drawRobe(t, bodyH, crouchOffset) {
  const flow = char.robeFlow;
  const wind = Math.sin(t * 2 + flow) * 15;
  const wind2 = Math.sin(t * 2.7 + flow * 1.3) * 10;

  ctx.fillStyle = `rgba(50,40,30,0.6)`;
  ctx.beginPath();
  ctx.moveTo(-12, -bodyH * 0.3);
  ctx.quadraticCurveTo(-18 + wind * 0.5, 10, -22 + wind, 30 + crouchOffset);
  ctx.lineTo(-5 + wind2 * 0.3, 35 + crouchOffset);
  ctx.quadraticCurveTo(0, 15, 5 + wind2 * 0.2, 35 + crouchOffset);
  ctx.lineTo(15 + wind * 0.3, 30 + crouchOffset);
  ctx.quadraticCurveTo(14, 10, 12, -bodyH * 0.3);
  ctx.closePath();
  ctx.fill();

  // Robe trailing edges
  ctx.strokeStyle = `rgba(42,31,20,0.4)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-22 + wind, 30 + crouchOffset);
  ctx.quadraticCurveTo(-28 + wind * 1.5, 45, -30 + wind * 2, 55 + Math.sin(t * 3) * 5);
  ctx.stroke();
}

function drawLegs(t, bodyH, crouchOffset) {
  const leftA = char.leftLegAngle;
  const rightA = char.rightLegAngle;

  ctx.strokeStyle = INK.ink;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  // Left leg
  ctx.save();
  ctx.rotate(leftA);
  ctx.beginPath();
  ctx.moveTo(-4, crouchOffset);
  ctx.lineTo(-6, 25 - crouchOffset * 0.5);
  ctx.lineTo(-5, 40 - crouchOffset);
  ctx.stroke();
  // Foot
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-5, 40 - crouchOffset);
  ctx.lineTo(-10, 42 - crouchOffset);
  ctx.stroke();
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.rotate(rightA);
  ctx.beginPath();
  ctx.moveTo(4, crouchOffset);
  ctx.lineTo(6, 25 - crouchOffset * 0.5);
  ctx.lineTo(5, 40 - crouchOffset);
  ctx.stroke();
  // Foot
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(5, 40 - crouchOffset);
  ctx.lineTo(10, 42 - crouchOffset);
  ctx.stroke();
  ctx.restore();
}

function drawArms(t, bodyH, crouchOffset) {
  const leftA = char.leftArmAngle;
  const rightA = char.rightArmAngle;

  ctx.strokeStyle = INK.ink;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';

  // Left arm
  ctx.save();
  ctx.translate(-8, -bodyH * 0.7);
  ctx.rotate(leftA);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5, 18);
  ctx.lineTo(-3, 32);
  ctx.stroke();
  // Sleeve
  ctx.strokeStyle = `rgba(50,40,30,0.5)`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-2, 8);
  ctx.lineTo(-6, 20);
  ctx.stroke();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.translate(8, -bodyH * 0.7);
  ctx.rotate(rightA);
  ctx.beginPath();
  ctx.strokeStyle = INK.ink;
  ctx.lineWidth = 3.5;
  ctx.moveTo(0, 0);
  ctx.lineTo(5, 18);
  ctx.lineTo(3, 32);
  ctx.stroke();
  ctx.strokeStyle = `rgba(50,40,30,0.5)`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(2, 8);
  ctx.lineTo(6, 20);
  ctx.stroke();
  ctx.restore();
}

// ============ EFFECTS ============

function drawAfterimages() {
  for (let i = afterimages.length - 1; i >= 0; i--) {
    const a = afterimages[i];
    a.life -= 0.01;
    if (a.life <= 0) { afterimages.splice(i, 1); continue; }

    const screenX = a.x;
    const screenY = a.y - cameraY + H * 0.7;
    if (screenY < -100 || screenY > H + 100) continue;

    ctx.save();
    ctx.globalAlpha = a.life * 0.3;
    ctx.translate(screenX, screenY);
    ctx.scale(a.scale || 1, a.scale || 1);
    // Simplified silhouette
    ctx.fillStyle = `rgba(42,31,20,${a.life * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(0, -20, 10, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -52, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnShockwave(worldX, worldY) {
  shockwaves.push({ x: worldX, y: worldY, radius: 0, maxRadius: 120, life: 1, speed: 3 });
  // Ink splashes
  for (let i = 0; i < 15; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(2, 8);
    inkSplashes.push({
      x: worldX, y: worldY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(1, 4),
      size: rand(2, 6), life: 1, decay: rand(0.01, 0.03),
    });
  }
  // Qi particles
  for (let i = 0; i < 20; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1, 5);
    particles.push({
      x: worldX, y: worldY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(2, 5),
      size: rand(1, 3), life: 1, decay: rand(0.008, 0.02),
      color: Math.random() > 0.5 ? INK.gold : INK.red,
    });
  }
}

function spawnSpeedLines(worldX, worldY, direction) {
  for (let i = 0; i < 8; i++) {
    speedLines.push({
      x: worldX + rand(-30, 30), y: worldY + rand(-10, 10),
      length: rand(40, 100), angle: direction + rand(-0.2, 0.2),
      life: 1, decay: rand(0.02, 0.04),
    });
  }
}

function spawnAfterimage() {
  afterimages.push({
    x: char.x, y: char.y, scale: char.scale, life: 1,
  });
}

function updateAndDrawParticles() {
  // Ink splashes
  for (let i = inkSplashes.length - 1; i >= 0; i--) {
    const p = inkSplashes[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1; // gravity
    p.vx *= 0.99;
    p.life -= p.decay;
    if (p.life <= 0) { inkSplashes.splice(i, 1); continue; }

    const sy = p.y - cameraY + H * 0.7;
    if (sy < -50 || sy > H + 50) continue;
    ctx.fillStyle = `rgba(42,31,20,${p.life * 0.7})`;
    ctx.beginPath();
    ctx.arc(p.x, sy, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  // Qi particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.05;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }

    const sy = p.y - cameraY + H * 0.7;
    if (sy < -50 || sy > H + 50) continue;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life * 0.8;
    ctx.beginPath();
    ctx.arc(p.x, sy, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.radius += s.speed;
    s.life -= 0.015;
    if (s.life <= 0) { shockwaves.splice(i, 1); continue; }

    const sy = s.y - cameraY + H * 0.7;
    if (sy < -200 || sy > H + 200) continue;

    // Ink ring
    ctx.strokeStyle = `rgba(42,31,20,${s.life * 0.4})`;
    ctx.lineWidth = 3 * s.life;
    ctx.beginPath();
    ctx.arc(s.x, sy, s.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Golden qi ring
    ctx.strokeStyle = `rgba(212,168,67,${s.life * 0.3})`;
    ctx.lineWidth = 2 * s.life;
    ctx.beginPath();
    ctx.arc(s.x, sy, s.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Speed lines
  for (let i = speedLines.length - 1; i >= 0; i--) {
    const l = speedLines[i];
    l.life -= l.decay;
    if (l.life <= 0) { speedLines.splice(i, 1); continue; }

    const sy = l.y - cameraY + H * 0.7;
    if (sy < -50 || sy > H + 50) continue;

    ctx.strokeStyle = `rgba(42,31,20,${l.life * 0.5})`;
    ctx.lineWidth = 1.5 * l.life;
    ctx.beginPath();
    ctx.moveTo(l.x, sy);
    ctx.lineTo(l.x + Math.cos(l.angle) * l.length * l.life, sy + Math.sin(l.angle) * l.length * l.life);
    ctx.stroke();
  }
}

// ============ INK WASH OVERLAY ============
function drawInkWashVignette() {
  // Edges darkened like ink wash painting
  const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.3, W/2, H/2, Math.max(W,H) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(20,15,10,0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// Paper texture overlay
function drawPaperTexture() {
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 200; i++) {
    const x = (Math.sin(i * 127.1) * 0.5 + 0.5) * W;
    const y = (Math.cos(i * 311.7) * 0.5 + 0.5) * H;
    ctx.fillStyle = i % 2 ? '#000' : '#fff';
    ctx.fillRect(x, y, rand(1, 3), rand(1, 3));
  }
  ctx.globalAlpha = 1;
}

// ============ PHASE LOGIC ============

function setPhase(newPhase) {
  phase = newPhase;
  phaseTime = 0;

  const idx = PHASES.indexOf(newPhase);
  if (idx >= 0) setActiveDot(Math.min(idx, 6));
}

function updatePhases(dt) {
  phaseTime += dt;

  switch (phase) {
    case 'title': break; // waiting for click

    case 'setup': {
      // Character walks to position and stands ready
      char.x = lerp(W * 0.2, W * 0.35, clamp(phaseTime / 2, 0, 1));
      char.y = GROUND_Y;
      char.leftLegAngle = Math.sin(phaseTime * 4) * 0.2;
      char.rightLegAngle = -Math.sin(phaseTime * 4) * 0.2;
      char.leftArmAngle = -Math.sin(phaseTime * 4) * 0.15;
      char.rightArmAngle = Math.sin(phaseTime * 4) * 0.15;
      char.robeFlow = phaseTime * 2;
      char.sashFlow = phaseTime;
      char.hairFlow = phaseTime;

      if (phaseTime > 2.5) {
        // Look up at cliff
        char.torsoAngle = lerp(0, -0.1, clamp((phaseTime - 2.5) / 0.5, 0, 1));
      }
      if (phaseTime > 3.5) setPhase('crouch');
      break;
    }

    case 'crouch': {
      const t = clamp(phaseTime / 0.8, 0, 1);
      char.crouching = ease(t);
      char.leftLegAngle = lerp(0, 0.4, t);
      char.rightLegAngle = lerp(0, -0.3, t);
      char.leftArmAngle = lerp(0, 0.5, t);
      char.rightArmAngle = lerp(0, -0.4, t);
      char.torsoAngle = lerp(-0.1, 0.15, t);
      char.robeFlow = phaseTime * 2 + 3;
      char.y = GROUND_Y;

      if (phaseTime > 1) {
        setPhase('leap');
        char.velY = -18; // launch!
        spawnShockwave(char.x, char.y);
        spawnSpeedLines(char.x, char.y, -Math.PI / 2);
      }
      break;
    }

    case 'leap': {
      // Rising from ground
      char.velY += 0.3; // gravity
      char.y += char.velY;
      char.crouching = lerp(char.crouching, 0, 0.1);
      char.torsoAngle = lerp(char.torsoAngle, -0.15, 0.05);
      char.leftLegAngle = lerp(char.leftLegAngle, -0.1, 0.05);
      char.rightLegAngle = lerp(char.rightLegAngle, 0.15, 0.05);
      char.leftArmAngle = lerp(char.leftArmAngle, -0.6, 0.05);
      char.rightArmAngle = lerp(char.rightArmAngle, 0.5, 0.05);
      char.robeFlow += dt * 5;
      char.sashFlow += dt * 4;
      char.hairFlow += dt * 3;

      if (phaseTime % 0.15 < dt) spawnAfterimage();

      // Slow down as approaching first step height
      if (char.y < STEP_HEIGHTS[0] + 50 && char.velY > -2) {
        setPhase('step1');
        doStep(0);
      }
      break;
    }

    case 'step1': case 'step2': case 'step3': case 'step4': case 'step5': {
      const stepIdx = parseInt(phase.replace('step', '')) - 1;
      updateStep(stepIdx, dt);
      break;
    }

    case 'peak': {
      // Floating at peak
      const t = clamp(phaseTime / 3, 0, 1);
      char.velY = lerp(char.velY, 0, 0.05);
      char.y += char.velY;
      char.torsoAngle = lerp(char.torsoAngle, 0, 0.02);
      char.leftArmAngle = lerp(char.leftArmAngle, -1.2, 0.02);
      char.rightArmAngle = lerp(char.rightArmAngle, 1.2, 0.02);
      char.leftLegAngle = lerp(char.leftLegAngle, 0, 0.02);
      char.rightLegAngle = lerp(char.rightLegAngle, 0, 0.02);
      char.robeFlow += dt * 2;
      char.hairFlow += dt * 1.5;

      // Qi aura
      if (phaseTime % 0.2 < dt) {
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: char.x + rand(-20, 20), y: char.y + rand(-30, 10),
            vx: rand(-1, 1), vy: rand(-2, 0),
            size: rand(1, 3), life: 1, decay: 0.01,
            color: INK.gold,
          });
        }
      }

      if (phaseTime > 3) setPhase('landing');
      break;
    }

    case 'landing': {
      // Graceful descent
      char.velY += 0.15;
      char.y += char.velY;
      char.torsoAngle = lerp(char.torsoAngle, 0, 0.03);
      char.leftArmAngle = lerp(char.leftArmAngle, -0.3, 0.02);
      char.rightArmAngle = lerp(char.rightArmAngle, 0.3, 0.02);
      char.robeFlow += dt * 6;
      char.hairFlow += dt * 4;

      if (phaseTime % 0.1 < dt) spawnAfterimage();

      // Land on cliff top
      const landingY = GROUND_Y - 330;
      if (char.y > landingY) {
        char.y = landingY;
        char.velY = 0;
        spawnShockwave(char.x, char.y);
        char.x = W * 0.8; // on the cliff
        if (phaseTime > 1) setPhase('end');
      }

      // Move towards cliff
      char.x = lerp(char.x, W * 0.8, 0.01);
      break;
    }

    case 'end': {
      char.robeFlow += dt;
      char.hairFlow += dt * 0.5;
      char.sashFlow += dt;
      // Gentle idle
      char.leftArmAngle = Math.sin(globalTime * 0.5) * 0.05;
      char.rightArmAngle = -Math.sin(globalTime * 0.5) * 0.05;

      if (phaseTime > 1.5 && !endCard.classList.contains('visible')) {
        endCard.classList.remove('hidden');
      }
      break;
    }
  }

  // Camera follow
  if (phase !== 'title' && phase !== 'end') {
    targetCameraY = Math.min(0, char.y + 50);
  }
  cameraY = lerp(cameraY, targetCameraY, 0.04);
}

let stepAnimTime = 0;
let currentStepPhase = 'slowmo'; // 'slowmo', 'step', 'launch'

function doStep(idx) {
  stepAnimTime = 0;
  currentStepPhase = 'slowmo';
  char.velY = 0; // freeze momentarily
  spawnAfterimage();
}

function updateStep(idx, dt) {
  stepAnimTime += dt;

  const nextPhase = idx < 4 ? `step${idx + 2}` : 'peak';
  const nextHeight = idx < 4 ? STEP_HEIGHTS[idx + 1] : PEAK_HEIGHT;

  if (currentStepPhase === 'slowmo') {
    // Slow-motion: character prepares the impossible step
    // Time dilated - 0.8 seconds of slow-mo
    const t = clamp(stepAnimTime / 0.8, 0, 1);

    // Foot-on-foot animation!
    if (char.stepFoot === 'left') {
      // Right foot comes under left foot
      char.rightLegAngle = lerp(0.15, -0.5, ease(t));
      char.leftLegAngle = lerp(-0.1, 0.3, ease(t));
    } else {
      char.leftLegAngle = lerp(-0.1, -0.5, ease(t));
      char.rightLegAngle = lerp(0.15, 0.3, ease(t));
    }

    // Arms prepare
    char.leftArmAngle = lerp(char.leftArmAngle, -0.8 - idx * 0.1, 0.08);
    char.rightArmAngle = lerp(char.rightArmAngle, 0.7 + idx * 0.1, 0.08);
    char.torsoAngle = lerp(char.torsoAngle, -0.1 - idx * 0.03, 0.05);

    // Qi buildup particles
    if (stepAnimTime % 0.1 < dt) {
      particles.push({
        x: char.x + rand(-15, 15), y: char.y + 30,
        vx: rand(-0.5, 0.5), vy: rand(-1, 0),
        size: rand(1, 3), life: 0.8, decay: 0.02,
        color: INK.gold,
      });
    }

    char.robeFlow += dt * 2;

    // Gentle hover
    char.y += Math.sin(stepAnimTime * 3) * 0.3;

    if (stepAnimTime > 0.8) {
      currentStepPhase = 'step';
      stepAnimTime = 0;
    }
  }

  else if (currentStepPhase === 'step') {
    // THE KEY MOMENT: foot pushes off foot!
    const t = clamp(stepAnimTime / 0.3, 0, 1);

    // Explosive leg motion
    if (char.stepFoot === 'left') {
      char.leftLegAngle = lerp(0.3, -0.3, easeOut(t));
      char.rightLegAngle = lerp(-0.5, 0.4, easeOut(t));
    } else {
      char.rightLegAngle = lerp(0.3, -0.3, easeOut(t));
      char.leftLegAngle = lerp(-0.5, 0.4, easeOut(t));
    }

    // Spawn the shockwave at foot position
    if (stepAnimTime < dt * 2) {
      spawnShockwave(char.x, char.y + 35);
      spawnSpeedLines(char.x, char.y, -Math.PI / 2);

      // Extra dramatic qi burst for higher steps
      for (let i = 0; i < 5 + idx * 3; i++) {
        const angle = rand(-Math.PI, 0); // upward hemisphere
        const speed = rand(3, 8 + idx * 2);
        particles.push({
          x: char.x + rand(-5, 5), y: char.y + 30,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(2, 5), life: 1, decay: rand(0.01, 0.025),
          color: Math.random() > 0.3 ? INK.gold : INK.red,
        });
      }
    }

    if (stepAnimTime > 0.3) {
      currentStepPhase = 'launch';
      stepAnimTime = 0;
      char.velY = -(12 + idx * 2); // more powerful each time
      char.stepFoot = char.stepFoot === 'left' ? 'right' : 'left';
    }
  }

  else if (currentStepPhase === 'launch') {
    // Rising to next step
    char.velY += 0.25;
    char.y += char.velY;
    char.robeFlow += dt * 6;
    char.hairFlow += dt * 5;
    char.sashFlow += dt * 4;
    char.torsoAngle = lerp(char.torsoAngle, -0.2, 0.03);

    if (stepAnimTime % 0.08 < dt) spawnAfterimage();

    // Speed lines while ascending
    if (stepAnimTime % 0.05 < dt) {
      spawnSpeedLines(char.x + rand(-20, 20), char.y + rand(-10, 20), Math.PI / 2);
    }

    if (char.y < nextHeight + 50 && char.velY > -3) {
      if (idx < 4) {
        setPhase(nextPhase);
        doStep(idx + 1);
      } else {
        setPhase('peak');
      }
    }
  }
}

// ============ MAIN LOOP ============

let lastTime = 0;
let started = false;

function animate(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  globalTime += dt;

  ctx.clearRect(0, 0, W, H);

  drawSky(globalTime);
  drawMoon(globalTime);
  drawMountains(globalTime);
  drawClouds(globalTime);
  drawBamboo(globalTime);
  drawGround(globalTime);

  if (phase !== 'title') {
    updatePhases(dt);
    drawAfterimages();
    drawCharacter(globalTime);
    updateAndDrawParticles();
  }

  drawInkWashVignette();
  drawPaperTexture();

  requestAnimationFrame(animate);
}

// ============ INPUT ============

function startAnimation() {
  if (started) return;
  started = true;
  titleCard.classList.add('hidden');
  endCard.classList.add('hidden');

  // Reset
  char.x = W * 0.15;
  char.y = GROUND_Y;
  char.velY = 0;
  char.torsoAngle = 0;
  char.leftLegAngle = 0; char.rightLegAngle = 0;
  char.leftArmAngle = 0; char.rightArmAngle = 0;
  char.crouching = 0;
  char.robeFlow = 0; char.sashFlow = 0; char.hairFlow = 0;
  char.scale = 1;
  char.stepFoot = 'left';
  cameraY = 0; targetCameraY = 0;
  particles = []; afterimages = []; shockwaves = [];
  speedLines = []; inkSplashes = [];
  globalTime = 0;

  setPhase('setup');
}

function restart() {
  started = false;
  phase = 'title';
  endCard.classList.add('hidden');
  titleCard.classList.remove('hidden');
  cameraY = 0; targetCameraY = 0;
}

canvas.addEventListener('click', () => {
  if (phase === 'title') {
    startAnimation();
  } else if (phase === 'end') {
    restart();
  }
});

// ============ INIT ============
requestAnimationFrame(animate);

})();
