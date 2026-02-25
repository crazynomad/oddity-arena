// ============================================================
// The Extraordinary Baron Munchausen
// A canvas-based storytelling animation
// ============================================================

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let W, H, cx, cy, scale;
function resize() {
  W = canvas.width = window.innerWidth * devicePixelRatio;
  H = canvas.height = window.innerHeight * devicePixelRatio;
  cx = W / 2; cy = H / 2;
  scale = Math.min(W, H) / 900;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
resize();
window.addEventListener('resize', resize);

// ============================================================
// Utility
// ============================================================
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeIn = t => t * t;
const easeInOut = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const rand = (a, b) => Math.random() * (b - a) + a;

// ============================================================
// Color palette — moody swamp with warm accents
// ============================================================
const PAL = {
  sky1: '#1a0e2e', sky2: '#2d1b4e', sky3: '#4a2c6e',
  moon: '#ffe8a0', moonGlow: 'rgba(255,232,160,0.15)',
  fog: 'rgba(100,80,120,0.12)',
  swampDark: '#1a2a10', swampMid: '#2a3a15', swampLight: '#3a4a20',
  mud: '#3d2b1a', mudLight: '#5a4030', mudDark: '#2a1a0a',
  baron: { coat: '#8b1a1a', coatLight: '#b03030', hat: '#2a1a0a',
           skin: '#e8c090', skinShadow: '#c8a070', hair: '#4a3520',
           boots: '#1a1010', pants: '#d4c8a0', white: '#f0e8d8' },
  horse: { body: '#6a4a2a', bodyLight: '#8a6a4a', mane: '#2a1a0a' },
  sparkle: ['#ffd700', '#ff6b6b', '#7bffb8', '#70d4ff', '#ff70d4'],
  bubble: 'rgba(80,100,50,0.6)',
  text: '#f0e8d8', textShadow: '#1a0e2e',
};

// ============================================================
// Particles
// ============================================================
let particles = [];
class Particle {
  constructor(x, y, vx, vy, life, size, color, gravity = 0, drag = 0.98) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = this.maxLife = life; this.size = size;
    this.color = color; this.gravity = gravity; this.drag = drag;
    this.alive = true;
  }
  update(dt) {
    this.vy += this.gravity * dt;
    this.vx *= this.drag; this.vy *= this.drag;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }
  draw() {
    const a = clamp(this.life / this.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function spawnMudSplash(x, y, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = rand(-Math.PI, 0);
    const speed = rand(50, 200) * scale;
    particles.push(new Particle(
      x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      rand(0.5, 1.5), rand(2, 6), rand(0.5, 1) > 0.5 ? PAL.mud : PAL.mudLight,
      300 * scale, 0.97
    ));
  }
}

function spawnBubble(x, y) {
  particles.push(new Particle(
    x + rand(-30, 30) * scale, y,
    rand(-10, 10) * scale, rand(-40, -80) * scale,
    rand(1, 3), rand(3, 8), PAL.bubble, -5 * scale, 0.99
  ));
}

function spawnSparkle(x, y, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(80, 250) * scale;
    particles.push(new Particle(
      x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      rand(0.5, 2), rand(2, 5),
      PAL.sparkle[Math.floor(rand(0, PAL.sparkle.length))],
      50 * scale, 0.96
    ));
  }
}

function spawnLightbulb(x, y) {
  for (let i = 0; i < 20; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 120) * scale;
    particles.push(new Particle(
      x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      rand(0.3, 1.2), rand(1, 4), PAL.moon, -20 * scale, 0.95
    ));
  }
}

// ============================================================
// Swamp bubbles (ambient)
// ============================================================
let swampBubbles = [];
class SwampBubble {
  constructor() { this.reset(); }
  reset() {
    this.x = rand(0, W);
    this.y = rand(cy + 50 * scale, H);
    this.r = rand(2, 7) * scale;
    this.speed = rand(15, 40) * scale;
    this.life = rand(2, 5);
    this.maxLife = this.life;
    this.wobble = rand(0, Math.PI * 2);
    this.wobbleSpeed = rand(2, 5);
  }
  update(dt) {
    this.y -= this.speed * dt;
    this.x += Math.sin(this.wobble) * 8 * scale * dt;
    this.wobble += this.wobbleSpeed * dt;
    this.life -= dt;
    if (this.life <= 0) this.reset();
  }
  draw() {
    const a = Math.min(1, this.life / this.maxLife) * 0.5;
    ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(120,140,80,0.7)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
    // highlight
    ctx.fillStyle = 'rgba(180,200,140,0.3)';
    ctx.beginPath();
    ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
for (let i = 0; i < 15; i++) swampBubbles.push(new SwampBubble());

// ============================================================
// Fog layers (parallax)
// ============================================================
let fogLayers = [];
class FogLayer {
  constructor(y, speed, alpha) {
    this.y = y; this.speed = speed; this.alpha = alpha;
    this.offset = rand(0, 1000);
  }
  draw(t) {
    const time = t + this.offset;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = 'rgba(100,80,120,1)';
    ctx.beginPath();
    ctx.moveTo(0, this.y);
    for (let x = 0; x <= W; x += 20) {
      const wave = Math.sin(x * 0.002 + time * this.speed) * 20 * scale
                 + Math.sin(x * 0.005 + time * this.speed * 0.7) * 10 * scale;
      ctx.lineTo(x, this.y + wave);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// Stars
// ============================================================
let stars = [];
function initStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: rand(0, W), y: rand(0, cy * 0.8),
      r: rand(0.5, 2) * scale,
      twinkle: rand(0, Math.PI * 2),
      speed: rand(1, 3)
    });
  }
}
initStars();

function drawStars(t) {
  stars.forEach(s => {
    const a = 0.3 + 0.7 * Math.abs(Math.sin(s.twinkle + t * s.speed));
    ctx.globalAlpha = a;
    ctx.fillStyle = PAL.moon;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ============================================================
// Moon
// ============================================================
function drawMoon() {
  const mx = W * 0.78, my = H * 0.15, mr = 40 * scale;
  // glow
  const g = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4);
  g.addColorStop(0, PAL.moonGlow);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(mx, my, mr * 4, 0, Math.PI * 2);
  ctx.fill();
  // moon body
  ctx.fillStyle = PAL.moon;
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  // crescent shadow
  ctx.fillStyle = PAL.sky2;
  ctx.beginPath();
  ctx.arc(mx + mr * 0.35, my - mr * 0.1, mr * 0.85, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================
// Background
// ============================================================
function drawBackground(t) {
  // sky gradient
  const skyG = ctx.createLinearGradient(0, 0, 0, H);
  skyG.addColorStop(0, PAL.sky1);
  skyG.addColorStop(0.4, PAL.sky2);
  skyG.addColorStop(0.7, PAL.sky3);
  skyG.addColorStop(1, PAL.swampDark);
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, W, H);

  drawStars(t);
  drawMoon();

  // distant trees (silhouettes)
  drawTreeLine(cy * 0.6, 0.6, PAL.sky1);
  drawTreeLine(cy * 0.75, 0.8, '#0d0a15');
  drawTreeLine(cy * 0.88, 1.0, '#0a0810');
}

function drawTreeLine(baseY, scaleF, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY + 30 * scale);
  for (let x = 0; x <= W; x += 25 * scale * scaleF) {
    const h = rand(30, 80) * scale * scaleF;
    const w = rand(8, 20) * scale * scaleF;
    // triangle tree
    ctx.lineTo(x, baseY + 30 * scale);
    ctx.lineTo(x + w / 2, baseY + 30 * scale - h);
    ctx.lineTo(x + w, baseY + 30 * scale);
  }
  ctx.lineTo(W, baseY + 30 * scale);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
}

// ============================================================
// Swamp surface
// ============================================================
function drawSwamp(t, mudLevel) {
  const swampY = mudLevel;
  // main swamp body
  const sg = ctx.createLinearGradient(0, swampY, 0, H);
  sg.addColorStop(0, PAL.swampLight);
  sg.addColorStop(0.3, PAL.swampMid);
  sg.addColorStop(1, PAL.swampDark);
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(0, swampY);
  for (let x = 0; x <= W; x += 10) {
    const wave = Math.sin(x * 0.008 + t * 1.5) * 4 * scale
               + Math.sin(x * 0.015 + t * 2.3) * 2 * scale;
    ctx.lineTo(x, swampY + wave);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // mud shine
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = PAL.mudLight;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 10) {
    const wave = Math.sin(x * 0.008 + t * 1.5) * 4 * scale
               + Math.sin(x * 0.015 + t * 2.3) * 2 * scale;
    if (x === 0) ctx.moveTo(x, swampY + wave);
    else ctx.lineTo(x, swampY + wave);
  }
  ctx.lineTo(W, swampY + 15 * scale);
  ctx.lineTo(0, swampY + 15 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ============================================================
// Baron Character Drawing
// ============================================================
function drawBaron(opts) {
  const {
    x, y, sinkDepth = 0, armRaise = 0, hairPull = 0,
    expression = 'confident', walkCycle = 0, bodyTilt = 0,
    triumphPose = 0, bowAngle = 0, scale: s = 1,
    opacity = 1, hatTip = 0, legSpread = 0,
  } = opts;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.scale(s * scale, s * scale);
  ctx.rotate(bodyTilt);

  const clipSwamp = sinkDepth > 0;
  if (clipSwamp) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-200, -400, 400, 400 - sinkDepth);
    ctx.clip();
  }

  // Legs
  const legAngle = Math.sin(walkCycle) * 0.3;
  const lSpread = legSpread;
  ctx.save();
  ctx.translate(-8 - lSpread, 0);
  ctx.rotate(-legAngle);
  drawLeg(0, 0, 50 + triumphPose * 5);
  ctx.restore();
  ctx.save();
  ctx.translate(8 + lSpread, 0);
  ctx.rotate(legAngle);
  drawLeg(0, 0, 50 + triumphPose * 5);
  ctx.restore();

  // Body / Coat
  drawCoat(triumphPose);

  // Arms
  const armAngleL = -0.3 + armRaise * -2.0 + triumphPose * -0.8;
  const armAngleR = 0.3 + armRaise * -1.8 + triumphPose * -0.6;
  drawArm(-20, -50, armAngleL, hairPull > 0);
  drawArm(20, -50, armAngleR, hairPull > 0.2);

  // Head
  ctx.save();
  ctx.translate(0, -75);

  // Hair being pulled
  if (hairPull > 0) {
    drawHairPull(hairPull);
  }

  drawHead(expression, hatTip);
  ctx.restore();

  if (clipSwamp) {
    ctx.restore();
    // Draw mud over legs
    ctx.fillStyle = PAL.swampMid;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, -sinkDepth + 2, 40, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = opacity;
  }

  ctx.restore();
}

function drawLeg(x, y, length) {
  // Boot + pants
  ctx.fillStyle = PAL.baron.pants;
  ctx.fillRect(x - 5, y, 10, length * 0.6);
  ctx.fillStyle = PAL.baron.boots;
  ctx.fillRect(x - 6, y + length * 0.6, 12, length * 0.4);
  // boot tip
  ctx.fillRect(x - 6, y + length - 4, 16, 4);
}

function drawCoat(triumph) {
  // Main coat body
  ctx.fillStyle = PAL.baron.coat;
  ctx.beginPath();
  ctx.moveTo(-22, -65);
  ctx.lineTo(22, -65);
  ctx.lineTo(25 + triumph * 3, 5);
  ctx.lineTo(-25 - triumph * 3, 5);
  ctx.closePath();
  ctx.fill();

  // Coat tails
  ctx.fillStyle = PAL.baron.coatLight;
  ctx.beginPath();
  ctx.moveTo(-20, -5);
  ctx.lineTo(-28, 10);
  ctx.lineTo(-15, 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -5);
  ctx.lineTo(28, 10);
  ctx.lineTo(15, 10);
  ctx.closePath();
  ctx.fill();

  // Buttons
  ctx.fillStyle = PAL.moon;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, -55 + i * 14, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // White cravat
  ctx.fillStyle = PAL.baron.white;
  ctx.beginPath();
  ctx.moveTo(-8, -65);
  ctx.lineTo(8, -65);
  ctx.lineTo(4, -55);
  ctx.lineTo(-4, -55);
  ctx.closePath();
  ctx.fill();
}

function drawArm(x, y, angle, gripping) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Upper arm
  ctx.fillStyle = PAL.baron.coat;
  ctx.fillRect(-4, 0, 8, 25);
  // Lower arm (white sleeve)
  ctx.fillStyle = PAL.baron.white;
  ctx.fillRect(-3, 25, 6, 20);
  // Hand
  ctx.fillStyle = PAL.baron.skin;
  ctx.beginPath();
  ctx.arc(0, 48, gripping ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();
  if (gripping) {
    // Gripping fingers
    ctx.strokeStyle = PAL.baron.skin;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 48, 6, -0.5, 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHead(expression, hatTip) {
  // Face
  ctx.fillStyle = PAL.baron.skin;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shadow on face
  ctx.fillStyle = PAL.baron.skinShadow;
  ctx.beginPath();
  ctx.ellipse(3, 2, 10, 12, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.baron.skin;
  ctx.beginPath();
  ctx.ellipse(-1, -1, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  drawEyes(expression);

  // Mustache (very important for the Baron!)
  ctx.fillStyle = PAL.baron.hair;
  // Left curl
  ctx.beginPath();
  ctx.moveTo(-3, 5);
  ctx.quadraticCurveTo(-12, 3, -14, -1);
  ctx.quadraticCurveTo(-12, 5, -3, 7);
  ctx.closePath();
  ctx.fill();
  // Right curl
  ctx.beginPath();
  ctx.moveTo(3, 5);
  ctx.quadraticCurveTo(12, 3, 14, -1);
  ctx.quadraticCurveTo(12, 5, 3, 7);
  ctx.closePath();
  ctx.fill();

  // Nose
  ctx.fillStyle = PAL.baron.skinShadow;
  ctx.beginPath();
  ctx.moveTo(-1, -2);
  ctx.lineTo(2, 3);
  ctx.lineTo(-2, 4);
  ctx.closePath();
  ctx.fill();

  // Mouth based on expression
  drawMouth(expression);

  // Hair (ponytail in back)
  ctx.fillStyle = PAL.baron.hair;
  ctx.beginPath();
  ctx.moveTo(-10, -14);
  ctx.quadraticCurveTo(-18, -5, -15, 10);
  ctx.lineTo(-12, 10);
  ctx.quadraticCurveTo(-14, -3, -8, -12);
  ctx.closePath();
  ctx.fill();

  // Ponytail
  ctx.beginPath();
  ctx.moveTo(-13, 5);
  ctx.quadraticCurveTo(-20, 15, -15, 25);
  ctx.quadraticCurveTo(-10, 28, -10, 20);
  ctx.quadraticCurveTo(-12, 12, -11, 5);
  ctx.closePath();
  ctx.fill();

  // Hat (tricorn!)
  ctx.save();
  ctx.rotate(hatTip);
  ctx.fillStyle = PAL.baron.hat;
  // Brim
  ctx.beginPath();
  ctx.ellipse(0, -16, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Crown
  ctx.beginPath();
  ctx.moveTo(-14, -16);
  ctx.lineTo(-10, -36);
  ctx.lineTo(10, -36);
  ctx.lineTo(14, -16);
  ctx.closePath();
  ctx.fill();
  // Feather!
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -34);
  ctx.quadraticCurveTo(20, -50, 12, -55);
  ctx.stroke();
  ctx.strokeStyle = '#ff9b6b';
  ctx.beginPath();
  ctx.moveTo(8, -34);
  ctx.quadraticCurveTo(22, -48, 14, -52);
  ctx.stroke();
  ctx.restore();
}

function drawEyes(expression) {
  const eyeY = -5;
  if (expression === 'panic') {
    // Wide eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-6, eyeY, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, eyeY, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-6, eyeY, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, eyeY, 2.5, 0, Math.PI * 2); ctx.fill();
    // Eyebrows raised
    ctx.strokeStyle = PAL.baron.hair;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, eyeY - 9); ctx.lineTo(-2, eyeY - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, eyeY - 9); ctx.lineTo(2, eyeY - 10); ctx.stroke();
  } else if (expression === 'eureka') {
    // One eye wide, one squinting, big grin
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-6, eyeY, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-6, eyeY - 1, 2, 0, Math.PI * 2); ctx.fill();
    // Squint right
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3, eyeY); ctx.lineTo(9, eyeY - 1); ctx.stroke();
    // Raised eyebrow
    ctx.strokeStyle = PAL.baron.hair;
    ctx.beginPath(); ctx.moveTo(-10, eyeY - 10); ctx.quadraticCurveTo(-6, eyeY - 14, -2, eyeY - 10); ctx.stroke();
  } else if (expression === 'determined') {
    // Narrowed, focused eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-6, eyeY, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, eyeY, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-6, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    // Furrowed brows
    ctx.strokeStyle = PAL.baron.hair;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-11, eyeY - 7); ctx.lineTo(-2, eyeY - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, eyeY - 7); ctx.lineTo(2, eyeY - 9); ctx.stroke();
  } else if (expression === 'triumph') {
    // Sparkly confident eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-6, eyeY, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, eyeY, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-6, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    // Sparkle in eye
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-5, eyeY - 1.5, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, eyeY - 1.5, 1, 0, Math.PI * 2); ctx.fill();
    // Confident brows
    ctx.strokeStyle = PAL.baron.hair;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, eyeY - 8); ctx.lineTo(-2, eyeY - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, eyeY - 8); ctx.lineTo(2, eyeY - 9); ctx.stroke();
  } else if (expression === 'closed') {
    // Closed eyes (for bow)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-6, eyeY, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(6, eyeY, 4, 0.2, Math.PI - 0.2); ctx.stroke();
  } else {
    // Default confident
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-6, eyeY, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, eyeY, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-5, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = PAL.baron.hair;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, eyeY - 7); ctx.lineTo(-2, eyeY - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, eyeY - 7); ctx.lineTo(2, eyeY - 8); ctx.stroke();
  }
}

function drawMouth(expression) {
  if (expression === 'panic') {
    // Open mouth, yelling
    ctx.fillStyle = '#2a0a0a';
    ctx.beginPath();
    ctx.ellipse(0, 10, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6060';
    ctx.beginPath();
    ctx.ellipse(0, 11, 4, 2, 0, 0, Math.PI);
    ctx.fill();
  } else if (expression === 'eureka') {
    // Big grin
    ctx.strokeStyle = '#2a0a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 7, 8, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 7, 7, 0.4, Math.PI - 0.4);
    ctx.fill();
  } else if (expression === 'determined') {
    // Gritted teeth / tight line
    ctx.strokeStyle = '#2a0a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.lineTo(5, 9);
    ctx.stroke();
  } else if (expression === 'triumph') {
    // Confident smirk
    ctx.strokeStyle = '#2a0a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2, 6, 7, 0.2, Math.PI - 0.5);
    ctx.stroke();
  } else if (expression === 'closed') {
    // Gentle smile
    ctx.strokeStyle = '#2a0a0a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 7, 5, 0.3, Math.PI - 0.3);
    ctx.stroke();
  } else {
    // Confident smile
    ctx.strokeStyle = '#2a0a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(1, 7, 6, 0.1, Math.PI - 0.3);
    ctx.stroke();
  }
}

function drawHairPull(amount) {
  // Hair stretching upward absurdly
  const stretchY = -30 - amount * 120;
  ctx.strokeStyle = PAL.baron.hair;
  ctx.lineWidth = 3;

  // Multiple hair strands being pulled
  for (let i = -2; i <= 2; i++) {
    const sx = i * 3;
    const controlX = sx + Math.sin(amount * 5 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(sx, -14);
    ctx.quadraticCurveTo(controlX, stretchY * 0.5, sx * 0.5, stretchY);
    ctx.stroke();
  }

  // Hands gripping at top
  ctx.fillStyle = PAL.baron.skin;
  ctx.beginPath();
  ctx.ellipse(0, stretchY, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Strain lines
  if (amount > 0.3) {
    ctx.strokeStyle = 'rgba(255,100,100,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + amount * 3;
      const r1 = 20, r2 = 28;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r1, stretchY + Math.sin(angle) * r1);
      ctx.lineTo(Math.cos(angle) * r2, stretchY + Math.sin(angle) * r2);
      ctx.stroke();
    }
  }
}

// ============================================================
// Horse Drawing
// ============================================================
function drawHorse(x, y, sinkDepth, scale_h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale_h * scale, scale_h * scale);

  if (sinkDepth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-100, -150, 200, 150 - sinkDepth);
    ctx.clip();
  }

  // Body
  ctx.fillStyle = PAL.horse.body;
  ctx.beginPath();
  ctx.ellipse(0, -40, 45, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = PAL.horse.body;
  for (const lx of [-25, -10, 10, 25]) {
    ctx.fillRect(lx - 3, -20, 6, 35);
    // Hooves
    ctx.fillStyle = '#1a1010';
    ctx.fillRect(lx - 4, 12, 8, 5);
    ctx.fillStyle = PAL.horse.body;
  }

  // Neck
  ctx.fillStyle = PAL.horse.bodyLight;
  ctx.beginPath();
  ctx.moveTo(-30, -55);
  ctx.quadraticCurveTo(-40, -90, -30, -100);
  ctx.lineTo(-20, -95);
  ctx.quadraticCurveTo(-28, -80, -22, -55);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.fillStyle = PAL.horse.bodyLight;
  ctx.beginPath();
  ctx.ellipse(-32, -105, 15, 10, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-36, -108, 2, 0, Math.PI * 2);
  ctx.fill();

  // Mane
  ctx.fillStyle = PAL.horse.mane;
  ctx.beginPath();
  ctx.moveTo(-28, -100);
  ctx.quadraticCurveTo(-32, -85, -28, -60);
  ctx.lineTo(-24, -60);
  ctx.quadraticCurveTo(-26, -85, -24, -98);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.strokeStyle = PAL.horse.mane;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(42, -45);
  ctx.quadraticCurveTo(60, -50, 55, -30);
  ctx.stroke();

  if (sinkDepth > 0) {
    ctx.restore();
    // Mud over horse
    ctx.fillStyle = PAL.swampMid;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, -sinkDepth + 2, 55, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ============================================================
// Text rendering
// ============================================================
function drawText(text, x, y, size, alpha = 1, maxWidth = W * 0.8) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${size * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Shadow
  ctx.fillStyle = PAL.textShadow;
  ctx.fillText(text, x + 2 * scale, y + 2 * scale, maxWidth);
  // Main
  ctx.fillStyle = PAL.text;
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

function drawSubtitle(text, y, alpha, size = 18) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `italic ${size * scale}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,232,160,0.9)';
  ctx.fillText(text, cx, y, W * 0.8);
  ctx.restore();
}

// ============================================================
// Scene system
// ============================================================
const SCENES = {
  TITLE: 0, WALK: 1, SINK: 2, PANIC: 3, EUREKA: 4,
  PULL: 5, RISE: 6, TRIUMPH: 7, BOW: 8, END: 9
};

let currentScene = SCENES.TITLE;
let sceneTime = 0;
let globalTime = 0;
let autoPlay = true;
let sceneTriggered = {};

// Scene durations for auto-play (seconds)
const SCENE_DURATION = {
  [SCENES.TITLE]: 3.5,
  [SCENES.WALK]: 4,
  [SCENES.SINK]: 3,
  [SCENES.PANIC]: 3,
  [SCENES.EUREKA]: 2.5,
  [SCENES.PULL]: 3.5,
  [SCENES.RISE]: 4,
  [SCENES.TRIUMPH]: 3.5,
  [SCENES.BOW]: 3,
  [SCENES.END]: 999,
};

function nextScene() {
  if (currentScene === SCENES.END) {
    // Replay
    currentScene = SCENES.TITLE;
    sceneTime = 0;
    sceneTriggered = {};
    particles = [];
    return;
  }
  currentScene++;
  sceneTime = 0;
}

// Click handler
canvas.addEventListener('click', () => {
  autoPlay = false;
  nextScene();
});

// ============================================================
// Main render
// ============================================================
let lastTime = 0;
const mudLevel = () => cy + 60 * scale;

function render(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  globalTime += dt;
  sceneTime += dt;

  // Auto advance
  if (autoPlay && sceneTime > SCENE_DURATION[currentScene]) {
    nextScene();
  }

  ctx.clearRect(0, 0, W, H);
  drawBackground(globalTime);

  // Init fog layers once (after resize)
  if (fogLayers.length === 0) {
    fogLayers.push(new FogLayer(cy * 0.95, 0.3, 0.06));
    fogLayers.push(new FogLayer(cy * 1.05, 0.5, 0.08));
    fogLayers.push(new FogLayer(cy * 1.15, 0.2, 0.04));
  }

  // Scene-specific rendering
  const ml = mudLevel();
  const t = sceneTime;
  const gt = globalTime;
  const sc = currentScene;

  // Draw back fog
  fogLayers[0].draw(gt);

  // Baron position tracking
  let baronX = cx, baronY = ml;
  let baronOpts = { x: cx, y: ml, expression: 'confident', scale: 1 };

  // Horse
  let showHorse = false;
  let horseX = cx - 120 * scale, horseY = ml;
  let horseSink = 0;

  switch (sc) {
    case SCENES.TITLE: {
      const fadeIn = clamp(t / 1.5, 0, 1);
      const fadeOut = t > 2.5 ? clamp((t - 2.5) / 1, 0, 1) : 0;
      const a = fadeIn * (1 - fadeOut);
      drawSwamp(gt, ml);
      drawText('The Extraordinary', cx, cy - 40 * scale, 28, a);
      drawText('Baron Munchausen', cx, cy + 20 * scale, 42, a);
      drawSubtitle('— A Tale of Impossible Self-Rescue —', cy + 70 * scale, a * 0.7, 16);
      break;
    }

    case SCENES.WALK: {
      const walkX = lerp(-100 * scale, cx, ease(clamp(t / 3, 0, 1)));
      baronOpts = {
        x: walkX, y: ml, expression: 'confident',
        walkCycle: gt * 8, scale: 1, bodyTilt: Math.sin(gt * 8) * 0.03,
        hatTip: 0,
      };
      showHorse = true;
      horseX = walkX - 100 * scale;
      horseY = ml;
      horseSink = 0;
      drawSwamp(gt, ml);
      drawHorse(horseX, horseY, horseSink, 0.8);
      drawBaron(baronOpts);
      drawSubtitle('"A fine evening for a stroll through the marshlands!"',
        ml - 160 * scale, clamp(t - 0.5, 0, 1) * (1 - clamp(t - 3, 0, 1)), 14);
      break;
    }

    case SCENES.SINK: {
      const sinkProgress = easeIn(clamp(t / 2.5, 0, 1));
      const sink = sinkProgress * 65;
      baronOpts = {
        x: cx, y: ml, sinkDepth: sink, expression: t > 1 ? 'panic' : 'confident',
        walkCycle: 0, scale: 1,
        bodyTilt: t > 1 ? Math.sin(gt * 4) * 0.05 : 0,
      };
      showHorse = true;
      horseX = cx - 100 * scale;
      horseSink = sinkProgress * 40;
      // Mud splashes
      if (t > 0.5 && !sceneTriggered.sinkSplash) {
        sceneTriggered.sinkSplash = true;
        spawnMudSplash(cx, ml, 15);
      }
      drawSwamp(gt, ml);
      drawHorse(horseX, ml, horseSink, 0.8);
      drawBaron(baronOpts);
      // Bubbles
      if (t > 1) spawnBubble(cx, ml);
      drawSubtitle('"Wait... what is this? QUICKSAND?!"',
        ml - 180 * scale, clamp(t - 1, 0, 1) * (1 - clamp(t - 2.5, 0, 1)), 14);
      break;
    }

    case SCENES.PANIC: {
      const sinkProgress = 0.8 + easeIn(clamp(t / 2.5, 0, 1)) * 0.2;
      const sink = sinkProgress * 80;
      const wiggle = Math.sin(gt * 12) * 0.08;
      baronOpts = {
        x: cx + Math.sin(gt * 10) * 5 * scale, y: ml,
        sinkDepth: sink, expression: 'panic',
        walkCycle: 0, scale: 1,
        bodyTilt: wiggle,
        armRaise: 0.3 + Math.sin(gt * 6) * 0.3,
      };
      showHorse = true;
      horseX = cx - 100 * scale;
      horseSink = sinkProgress * 60;
      drawSwamp(gt, ml);
      drawHorse(horseX, ml, horseSink, 0.8);
      drawBaron(baronOpts);
      // Lots of bubbles
      if (Math.random() < 0.3) spawnBubble(cx, ml);
      if (Math.random() < 0.1) spawnBubble(horseX, ml);
      drawSubtitle('"HELP! Somebody! Anybody! ...Nobody?!"',
        ml - 200 * scale,
        clamp(t - 0.3, 0, 1) * (1 - clamp(t - 2.5, 0, 1)), 15);
      break;
    }

    case SCENES.EUREKA: {
      const sink = 85;
      baronOpts = {
        x: cx, y: ml, sinkDepth: sink, expression: 'eureka',
        scale: 1, bodyTilt: 0,
        armRaise: t > 0.8 ? 0.5 : 0,
      };
      showHorse = true;
      horseX = cx - 100 * scale;
      horseSink = 55;
      // Lightbulb moment
      if (t > 0.5 && !sceneTriggered.eureka) {
        sceneTriggered.eureka = true;
        spawnLightbulb(cx, ml - 170 * scale);
      }
      drawSwamp(gt, ml);
      drawHorse(horseX, ml, horseSink, 0.8);
      drawBaron(baronOpts);

      // Floating lightbulb
      if (t > 0.5) {
        const bulbAlpha = clamp((t - 0.5) / 0.5, 0, 1) * (1 - clamp(t - 2, 0, 1));
        const bulbY = ml - (170 + Math.sin(gt * 3) * 5) * scale;
        ctx.save();
        ctx.globalAlpha = bulbAlpha;
        ctx.font = `${30 * scale}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('💡', cx + 25 * scale, bulbY);
        ctx.restore();
      }

      drawSubtitle('"Wait... my HAIR! Of course!"',
        ml - 210 * scale,
        clamp(t - 0.8, 0, 1) * (1 - clamp(t - 2, 0, 1)), 15);
      break;
    }

    case SCENES.PULL: {
      const pullProgress = easeInOut(clamp(t / 3, 0, 1));
      const sink = 85;
      baronOpts = {
        x: cx, y: ml, sinkDepth: sink,
        expression: 'determined', scale: 1,
        bodyTilt: Math.sin(gt * 8) * 0.02,
        armRaise: 0.7 + pullProgress * 0.3,
        hairPull: pullProgress,
      };
      showHorse = true;
      horseX = cx - 100 * scale;
      horseSink = 55;
      drawSwamp(gt, ml);
      drawHorse(horseX, ml, horseSink, 0.8);
      drawBaron(baronOpts);
      // Strain effects
      if (pullProgress > 0.3 && Math.random() < 0.15) {
        spawnMudSplash(cx + rand(-20, 20) * scale, ml, 3);
      }
      drawSubtitle('"If... I just... PULL... hard enough...!"',
        ml - 220 * scale,
        clamp(t - 0.5, 0, 1) * (1 - clamp(t - 3, 0, 1)), 14);
      break;
    }

    case SCENES.RISE: {
      const riseProgress = easeInOut(clamp(t / 3.5, 0, 1));
      const sink = lerp(85, -20, riseProgress);
      const horseSinkVal = lerp(55, -10, riseProgress);
      baronOpts = {
        x: cx, y: ml - riseProgress * 30 * scale,
        sinkDepth: Math.max(0, sink),
        expression: riseProgress > 0.7 ? 'triumph' : 'determined',
        scale: 1,
        bodyTilt: Math.sin(gt * 6) * 0.02 * (1 - riseProgress),
        armRaise: 1 - riseProgress * 0.5,
        hairPull: 1 - riseProgress * 0.8,
      };
      showHorse = true;
      horseX = cx - 100 * scale;
      horseSink = Math.max(0, horseSinkVal);
      // Mud dripping off
      if (riseProgress > 0.2 && Math.random() < 0.2) {
        particles.push(new Particle(
          cx + rand(-20, 20) * scale, ml - riseProgress * 30 * scale,
          rand(-20, 20) * scale, rand(20, 60) * scale,
          rand(0.5, 1.5), rand(2, 4), PAL.mud, 200 * scale, 0.98
        ));
      }
      // Big splash at start
      if (t < 0.3 && !sceneTriggered.riseSplash) {
        sceneTriggered.riseSplash = true;
        spawnMudSplash(cx, ml, 20);
        spawnMudSplash(horseX, ml, 10);
      }
      drawSwamp(gt, ml);
      drawHorse(horseX, ml - riseProgress * 20 * scale, horseSink, 0.8);
      drawBaron(baronOpts);
      drawSubtitle('"IT\'S WORKING! HA HA!"',
        ml - 230 * scale,
        clamp(t - 1, 0, 1) * (1 - clamp(t - 3, 0, 1)), 16);
      break;
    }

    case SCENES.TRIUMPH: {
      const landBounce = t < 0.5 ? Math.sin(t * Math.PI * 4) * 10 * (1 - t * 2) : 0;
      baronOpts = {
        x: cx, y: ml - 10 * scale + landBounce * scale,
        sinkDepth: 0, expression: 'triumph',
        scale: 1, bodyTilt: 0,
        armRaise: 0.8, triumphPose: 1,
        legSpread: 5,
      };
      showHorse = true;
      horseX = cx - 100 * scale;
      horseSink = 0;
      // Sparkles!
      if (t < 0.3 && !sceneTriggered.triumphSparkle) {
        sceneTriggered.triumphSparkle = true;
        spawnSparkle(cx, ml - 80 * scale, 30);
        spawnSparkle(horseX, ml - 60 * scale, 15);
      }
      if (Math.random() < 0.08) {
        spawnSparkle(cx + rand(-80, 80) * scale, ml - rand(50, 150) * scale, 3);
      }
      drawSwamp(gt, ml);
      drawHorse(horseX, ml, horseSink, 0.8);
      drawBaron(baronOpts);
      drawSubtitle('"HA! Nothing is impossible for Baron Munchausen!"',
        ml - 200 * scale,
        clamp(t - 0.5, 0, 1) * (1 - clamp(t - 3, 0, 1)), 14);
      break;
    }

    case SCENES.BOW: {
      const bowProgress = Math.sin(clamp(t / 1.5, 0, 1) * Math.PI) * 0.4;
      baronOpts = {
        x: cx, y: ml, sinkDepth: 0, expression: 'closed',
        scale: 1, bodyTilt: bowProgress,
        hatTip: bowProgress * 0.5,
        armRaise: 0.2, triumphPose: 0.5,
      };
      showHorse = true;
      horseX = cx - 100 * scale;
      horseSink = 0;
      if (Math.random() < 0.05) {
        spawnSparkle(cx + rand(-100, 100) * scale, ml - rand(30, 130) * scale, 2);
      }
      drawSwamp(gt, ml);
      drawHorse(horseX, ml, horseSink, 0.8);
      drawBaron(baronOpts);
      drawSubtitle('"Thank you, thank you! You\'re too kind."',
        ml - 180 * scale,
        clamp(t - 0.3, 0, 1) * (1 - clamp(t - 2.5, 0, 1)), 14);
      break;
    }

    case SCENES.END: {
      const fadeIn = clamp(t / 2, 0, 1);
      drawSwamp(gt, ml);
      // Dim overlay
      ctx.fillStyle = `rgba(26,14,46,${fadeIn * 0.7})`;
      ctx.fillRect(0, 0, W, H);
      drawText('~ The End ~', cx, cy - 30 * scale, 38, fadeIn);
      drawSubtitle('"And that, my friends, is the absolute truth."',
        cy + 30 * scale, fadeIn * 0.8, 16);
      drawSubtitle('— click to watch again —',
        cy + 80 * scale, fadeIn * 0.5, 13);
      // Floating sparkles
      if (Math.random() < 0.05) {
        spawnSparkle(rand(W * 0.2, W * 0.8), rand(H * 0.2, H * 0.8), 2);
      }
      break;
    }
  }

  // Front fog
  fogLayers.slice(1).forEach(f => f.draw(gt));

  // Swamp bubbles
  swampBubbles.forEach(b => { b.update(dt); b.draw(); });

  // Particles
  particles.forEach(p => { p.update(dt); p.draw(); });
  particles = particles.filter(p => p.alive);

  // Scene indicator dots
  if (sc !== SCENES.TITLE && sc !== SCENES.END) {
    const dotY = H - 30 * scale;
    for (let i = 1; i <= 8; i++) {
      const active = i <= sc;
      ctx.globalAlpha = active ? 0.8 : 0.25;
      ctx.fillStyle = active ? PAL.moon : '#fff';
      ctx.beginPath();
      ctx.arc(cx + (i - 4.5) * 16 * scale, dotY, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
