(function () {
  "use strict";

  // ─── Canvas setup ──────────────────────────────────────────
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const W = 1200, H = 600;
  canvas.width = W;
  canvas.height = H;

  // ─── Audio (Web Audio API – optional, silent-fail) ─────────
  let audioCtx;
  function ensureAudio() {
    if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* silent */ }
  }
  function playTone(freq, dur, type, vol) {
    ensureAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.value = vol || 0.15;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }
  function sfxLaunch() { playTone(300, 0.25, "sawtooth", 0.12); }
  function sfxHit() { playTone(120, 0.15, "square", 0.1); }
  function sfxPigPop() { playTone(600, 0.2, "sine", 0.15); setTimeout(() => playTone(900, 0.15, "sine", 0.1), 100); }
  function sfxWin() { [0, 150, 300].forEach((d, i) => setTimeout(() => playTone(500 + i * 200, 0.3, "sine", 0.12), d)); }

  // ─── Constants ─────────────────────────────────────────────
  const GRAVITY = 600;        // px/s²
  const GROUND_Y = H - 60;
  const SLING_X = 160, SLING_Y = GROUND_Y - 80;
  const MAX_PULL = 100;
  const LAUNCH_SCALE = 6;
  const DAMPING = 0.7;        // bounce damping
  const BIRD_RADIUS = 15;
  const PIG_RADIUS = 18;
  const BLOCK_W = 40, BLOCK_H = 40;
  const BIRD_COLORS = ["#e74c3c", "#f1c40f", "#3498db"]; // red, yellow, blue
  const BIRD_NAMES = ["Red", "Chuck", "Jay"];

  // ─── State ─────────────────────────────────────────────────
  let score, birds, pigs, blocks, particles, activeBird, birdQueue;
  let dragging = false, dragPos = { x: 0, y: 0 };
  let waitingForNext = false, waitTimer = 0;
  let gameOver = false;

  // ─── Helpers ───────────────────────────────────────────────
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(60, 200);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 80, life: 1, color, r: rand(2, 5) });
    }
  }

  // ─── Entity factories ─────────────────────────────────────
  function makeBird(type) {
    return { x: 0, y: 0, vx: 0, vy: 0, r: BIRD_RADIUS, type, color: BIRD_COLORS[type], alive: true, launched: false, grounded: false };
  }
  function makePig(x, y) {
    return { x, y, vx: 0, vy: 0, r: PIG_RADIUS, hp: 1, alive: true };
  }
  function makeBlock(x, y, w, h, mat) {
    // mat: 0=wood, 1=stone, 2=ice
    const hpMap = [2, 4, 1];
    const colorMap = ["#b5651d", "#7f8c8d", "#85c1e9"];
    return { x, y, w: w || BLOCK_W, h: h || BLOCK_H, vx: 0, vy: 0, hp: hpMap[mat], maxHp: hpMap[mat], mat, color: colorMap[mat], alive: true, grounded: false };
  }

  // ─── Level design ──────────────────────────────────────────
  function buildLevel() {
    const bx = 750; // base x of structure
    const bw = BLOCK_W, bh = BLOCK_H;
    blocks = [];
    pigs = [];

    // Ground platform row
    blocks.push(makeBlock(bx, GROUND_Y - bh, bw, bh, 0));           // wood
    blocks.push(makeBlock(bx + bw + 4, GROUND_Y - bh, bw, bh, 0));  // wood
    blocks.push(makeBlock(bx + 2 * (bw + 4), GROUND_Y - bh, bw, bh, 0));
    blocks.push(makeBlock(bx + 3 * (bw + 4), GROUND_Y - bh, bw, bh, 0));

    // Vertical pillars
    blocks.push(makeBlock(bx, GROUND_Y - bh * 2 - 4, bw, bh, 1));   // stone
    blocks.push(makeBlock(bx + 3 * (bw + 4), GROUND_Y - bh * 2 - 4, bw, bh, 1));

    // Top beam
    blocks.push(makeBlock(bx, GROUND_Y - bh * 3 - 8, bw, bh, 2));  // ice
    blocks.push(makeBlock(bx + bw + 4, GROUND_Y - bh * 3 - 8, bw, bh, 2));
    blocks.push(makeBlock(bx + 2 * (bw + 4), GROUND_Y - bh * 3 - 8, bw, bh, 2));
    blocks.push(makeBlock(bx + 3 * (bw + 4), GROUND_Y - bh * 3 - 8, bw, bh, 2));

    // Second tier
    blocks.push(makeBlock(bx + bw + 4, GROUND_Y - bh * 4 - 12, bw, bh, 0));
    blocks.push(makeBlock(bx + 2 * (bw + 4), GROUND_Y - bh * 4 - 12, bw, bh, 0));

    // Top piece
    blocks.push(makeBlock(bx + bw + 20, GROUND_Y - bh * 5 - 16, bw, bh, 2));

    // Right separate tower
    const rx = bx + 250;
    blocks.push(makeBlock(rx, GROUND_Y - bh, bw, bh, 1));
    blocks.push(makeBlock(rx + bw + 4, GROUND_Y - bh, bw, bh, 1));
    blocks.push(makeBlock(rx, GROUND_Y - bh * 2 - 4, bw, bh, 0));
    blocks.push(makeBlock(rx + bw + 4, GROUND_Y - bh * 2 - 4, bw, bh, 0));
    blocks.push(makeBlock(rx, GROUND_Y - bh * 3 - 8, bw, bh, 2));
    blocks.push(makeBlock(rx + bw + 4, GROUND_Y - bh * 3 - 8, bw, bh, 2));

    // Pigs
    pigs.push(makePig(bx + 2 * (bw + 4) / 2 + bw / 2, GROUND_Y - bh - PIG_RADIUS - 2));
    pigs.push(makePig(bx + bw + 4 + bw / 2 + 10, GROUND_Y - bh * 3 - 8 - PIG_RADIUS - 2));
    pigs.push(makePig(rx + bw / 2 + (bw + 4) / 2, GROUND_Y - bh * 2 - 4 - PIG_RADIUS - 2));
  }

  // ─── Init ──────────────────────────────────────────────────
  function init() {
    score = 0;
    particles = [];
    gameOver = false;
    waitingForNext = false;
    dragging = false;

    birdQueue = [makeBird(0), makeBird(1), makeBird(2)];
    birds = [];
    buildLevel();
    loadNextBird();
    updateUI();
    document.getElementById("message-overlay").classList.add("hidden");
  }

  function loadNextBird() {
    if (birdQueue.length === 0) { activeBird = null; return; }
    activeBird = birdQueue.shift();
    activeBird.x = SLING_X;
    activeBird.y = SLING_Y;
    birds.push(activeBird);
    updateUI();
  }

  function updateUI() {
    document.getElementById("score").textContent = score;
    document.getElementById("birds-left").textContent = (activeBird && !activeBird.launched ? 1 : 0) + birdQueue.length;
  }

  // ─── Physics helpers ───────────────────────────────────────
  function rectRect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    return Math.hypot(cx - nx, cy - ny) < cr;
  }
  function resolveCircleRect(circle, block) {
    const cx = circle.x, cy = circle.y, cr = circle.r;
    const nx = clamp(cx, block.x, block.x + block.w);
    const ny = clamp(cy, block.y, block.y + block.h);
    const dx = cx - nx, dy = cy - ny;
    const d = Math.hypot(dx, dy);
    if (d === 0 || d >= cr) return false;
    const overlap = cr - d;
    const ux = dx / d, uy = dy / d;
    circle.x += ux * overlap;
    circle.y += uy * overlap;
    // Reflect velocity
    const dot = circle.vx * ux + circle.vy * uy;
    if (dot < 0) {
      circle.vx -= 2 * dot * ux * (1 - DAMPING);
      circle.vy -= 2 * dot * uy * (1 - DAMPING);
      circle.vx += ux * (-dot) * DAMPING * 0.1;
      circle.vy += uy * (-dot) * DAMPING * 0.1;
      // Transfer impulse to block
      const impulse = Math.abs(dot) * 0.4;
      block.vx -= ux * impulse * 0.5;
      block.vy -= uy * impulse * 0.5;
    }
    return Math.abs(dot);
  }

  function resolveCircleCircle(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const minD = a.r + b.r;
    if (d >= minD || d === 0) return 0;
    const overlap = minD - d;
    const ux = dx / d, uy = dy / d;
    a.x -= ux * overlap * 0.5;
    a.y -= uy * overlap * 0.5;
    b.x += ux * overlap * 0.5;
    b.y += uy * overlap * 0.5;
    const relV = (a.vx - b.vx) * ux + (a.vy - b.vy) * uy;
    if (relV > 0) {
      a.vx -= relV * ux * 0.5;
      a.vy -= relV * uy * 0.5;
      b.vx += relV * ux * 0.5;
      b.vy += relV * uy * 0.5;
    }
    return Math.abs(relV);
  }

  // ─── Update ────────────────────────────────────────────────
  let lastTime = 0;
  function update(dt) {
    if (gameOver) return;
    dt = Math.min(dt, 1 / 30); // cap

    // Update active bird if launched
    birds.forEach(b => {
      if (!b.alive || !b.launched) return;
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Ground
      if (b.y + b.r > GROUND_Y) {
        b.y = GROUND_Y - b.r;
        b.vy *= -DAMPING * 0.3;
        b.vx *= 0.8;
        if (Math.abs(b.vy) < 20) { b.vy = 0; b.grounded = true; }
      }
      // Walls
      if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.5; }
      if (b.y < b.r) { b.y = b.r; b.vy *= -0.5; }
    });

    // Update blocks physics
    blocks.forEach(bl => {
      if (!bl.alive) return;
      bl.vy += GRAVITY * dt;
      bl.x += bl.vx * dt;
      bl.y += bl.vy * dt;
      bl.vx *= 0.98;

      // Ground
      if (bl.y + bl.h > GROUND_Y) {
        bl.y = GROUND_Y - bl.h;
        bl.vy *= -DAMPING * 0.2;
        bl.vx *= 0.85;
        if (Math.abs(bl.vy) < 10) { bl.vy = 0; bl.grounded = true; }
      }
      if (bl.x < 0) { bl.x = 0; bl.vx *= -0.3; }
      if (bl.x + bl.w > W) { bl.x = W - bl.w; bl.vx *= -0.3; }
    });

    // Update pigs physics
    pigs.forEach(p => {
      if (!p.alive) return;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      if (p.y + p.r > GROUND_Y) {
        p.y = GROUND_Y - p.r;
        p.vy *= -DAMPING * 0.2;
        p.vx *= 0.85;
        if (Math.abs(p.vy) < 10) p.vy = 0;
      }
    });

    // Block-block collision (simple stacking)
    for (let i = 0; i < blocks.length; i++) {
      const a = blocks[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < blocks.length; j++) {
        const b = blocks[j];
        if (!b.alive) continue;
        if (rectRect(a, b)) {
          // Push apart vertically (simplified)
          const overlapY1 = (a.y + a.h) - b.y;
          const overlapY2 = (b.y + b.h) - a.y;
          if (overlapY1 < overlapY2 && overlapY1 < a.w && overlapY1 < b.w) {
            a.y -= overlapY1 * 0.5;
            b.y += overlapY1 * 0.5;
            const avg = (a.vy + b.vy) * 0.5;
            a.vy = avg * 0.5;
            b.vy = avg * 0.5;
          } else {
            const overlapX1 = (a.x + a.w) - b.x;
            const overlapX2 = (b.x + b.w) - a.x;
            const ox = Math.min(overlapX1, overlapX2);
            if (overlapX1 < overlapX2) { a.x -= ox * 0.5; b.x += ox * 0.5; }
            else { a.x += ox * 0.5; b.x -= ox * 0.5; }
            const avgx = (a.vx + b.vx) * 0.5;
            a.vx = avgx * 0.5;
            b.vx = avgx * 0.5;
          }
        }
      }
    }

    // Bird ↔ block collisions
    birds.forEach(b => {
      if (!b.alive || !b.launched) return;
      blocks.forEach(bl => {
        if (!bl.alive) return;
        if (circleRect(b.x, b.y, b.r, bl.x, bl.y, bl.w, bl.h)) {
          const imp = resolveCircleRect(b, bl);
          if (imp > 40) {
            bl.hp -= 1 + (imp > 200 ? 1 : 0);
            sfxHit();
            if (bl.hp <= 0) {
              bl.alive = false;
              score += bl.mat === 1 ? 200 : 100;
              createParticles(bl.x + bl.w / 2, bl.y + bl.h / 2, bl.color, 8);
              updateUI();
            }
          }
        }
      });
    });

    // Bird ↔ pig collisions
    birds.forEach(b => {
      if (!b.alive || !b.launched) return;
      pigs.forEach(p => {
        if (!p.alive) return;
        const imp = resolveCircleCircle(b, p);
        if (imp > 30) {
          p.hp -= 1;
          if (p.hp <= 0) {
            p.alive = false;
            score += 500;
            sfxPigPop();
            createParticles(p.x, p.y, "#4caf50", 12);
            updateUI();
          }
        }
      });
    });

    // Block ↔ pig collisions (falling blocks kill pigs)
    blocks.forEach(bl => {
      if (!bl.alive) return;
      pigs.forEach(p => {
        if (!p.alive) return;
        if (circleRect(p.x, p.y, p.r, bl.x, bl.y, bl.w, bl.h)) {
          const dx = p.x - (bl.x + bl.w / 2), dy = p.y - (bl.y + bl.h / 2);
          const d = Math.hypot(dx, dy) || 1;
          const speed = Math.hypot(bl.vx, bl.vy);
          if (speed > 50) {
            p.hp -= 1;
            p.vx += (dx / d) * speed * 0.3;
            p.vy += (dy / d) * speed * 0.3;
            if (p.hp <= 0) {
              p.alive = false;
              score += 500;
              sfxPigPop();
              createParticles(p.x, p.y, "#4caf50", 12);
              updateUI();
            }
          }
          // push pig out
          p.x += (dx / d) * 2;
          p.y += (dy / d) * 2;
        }
      });
    });

    // Particles
    particles.forEach(p => {
      p.vy += 300 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 2;
    });
    particles = particles.filter(p => p.life > 0);

    // Check if active bird has stopped
    if (activeBird && activeBird.launched && !waitingForNext) {
      const speed = Math.hypot(activeBird.vx, activeBird.vy);
      if ((speed < 15 && activeBird.grounded) || activeBird.x > W + 50 || activeBird.y > H + 50) {
        waitingForNext = true;
        waitTimer = 0.8;
      }
    }

    if (waitingForNext) {
      waitTimer -= dt;
      if (waitTimer <= 0) {
        waitingForNext = false;
        checkGameState();
        loadNextBird();
      }
    }
  }

  function checkGameState() {
    const pigsAlive = pigs.filter(p => p.alive).length;
    if (pigsAlive === 0) {
      // Win!
      const bonusBirds = ((activeBird && !activeBird.launched ? 1 : 0) + birdQueue.length) * 1000;
      score += bonusBirds;
      updateUI();
      gameOver = true;
      sfxWin();
      showMessage("🎉 Level Complete!", `Score: ${score} (${bonusBirds > 0 ? '+' + bonusBirds + ' bird bonus!' : ''})`);
    } else if (!activeBird || activeBird.launched) {
      if (birdQueue.length === 0) {
        gameOver = true;
        showMessage("💥 Level Failed!", `Pigs remaining: ${pigsAlive}. Score: ${score}`);
      }
    }
  }

  function showMessage(title, text) {
    document.getElementById("message-title").textContent = title;
    document.getElementById("message-text").textContent = text;
    document.getElementById("message-overlay").classList.remove("hidden");
  }

  // ─── Drawing ───────────────────────────────────────────────
  function draw() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, "#4fc3f7");
    skyGrad.addColorStop(0.7, "#81d4fa");
    skyGrad.addColorStop(1, "#a5d6a7");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    [[100, 80, 50], [350, 50, 40], [600, 100, 35], [900, 60, 45]].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.5, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - r, cy + 5, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + r, cy + 5, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ground
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = "#388e3c";
    ctx.fillRect(0, GROUND_Y, W, 4);

    // Slingshot
    drawSlingshot();

    // Trajectory preview
    if (dragging && activeBird && !activeBird.launched) {
      drawTrajectory();
    }

    // Blocks
    blocks.forEach(bl => {
      if (!bl.alive) return;
      const dmg = 1 - bl.hp / bl.maxHp;
      ctx.fillStyle = bl.color;
      ctx.fillRect(bl.x, bl.y, bl.w, bl.h);
      // Damage cracks
      if (dmg > 0) {
        ctx.strokeStyle = `rgba(0,0,0,${dmg * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bl.x + bl.w * 0.2, bl.y + bl.h * 0.3);
        ctx.lineTo(bl.x + bl.w * 0.5, bl.y + bl.h * 0.6);
        ctx.lineTo(bl.x + bl.w * 0.8, bl.y + bl.h * 0.4);
        ctx.stroke();
      }
      // Border
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bl.x, bl.y, bl.w, bl.h);
      // Material indicator
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(bl.x + 2, bl.y + 2, bl.w - 4, bl.h / 3);
    });

    // Pigs
    pigs.forEach(p => {
      if (!p.alive) return;
      // Body
      ctx.fillStyle = "#66bb6a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#388e3c";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Snout
      ctx.fillStyle = "#81c784";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 3, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#388e3c";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Nostrils
      ctx.fillStyle = "#2e7d32";
      ctx.beginPath(); ctx.arc(p.x - 3, p.y + 3, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 3, p.y + 3, 1.5, 0, Math.PI * 2); ctx.fill();
      // Eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.x - 6, p.y - 5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 6, p.y - 5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(p.x - 5, p.y - 5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + 7, p.y - 5, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    // Birds
    birds.forEach(b => {
      if (!b.alive) return;
      drawBird(b);
    });

    // Bird queue indicators
    for (let i = 0; i < birdQueue.length; i++) {
      const bx = 50 + i * 28, by = GROUND_Y + 25;
      ctx.fillStyle = BIRD_COLORS[birdQueue[i].type];
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawBird(b) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Belly
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 4, b.r * 0.6, b.r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(b.x - 4, b.y - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + 4, b.y - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(b.x - 3, b.y - 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + 5, b.y - 4, 2, 0, Math.PI * 2); ctx.fill();
    // Brow (angry look)
    ctx.strokeStyle = b.type === 1 ? "#e67e22" : "#800";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x - 8, b.y - 10);
    ctx.lineTo(b.x - 2, b.y - 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y - 10);
    ctx.lineTo(b.x + 2, b.y - 7);
    ctx.stroke();
    // Beak
    ctx.fillStyle = "#ff9800";
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + 8, b.y + 2);
    ctx.lineTo(b.x, b.y + 5);
    ctx.closePath();
    ctx.fill();
  }

  function drawSlingshot() {
    const sx = SLING_X, sy = SLING_Y;
    // Back arm
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 15, sy - 50); ctx.stroke();
    // Front arm
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 15, sy - 50); ctx.stroke();
    // Base
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(sx - 8, sy, 16, 25);
    ctx.fillStyle = "#795548";
    ctx.fillRect(sx - 6, sy + 2, 12, 21);

    // Rubber band
    if (activeBird && !activeBird.launched) {
      const bx = dragging ? dragPos.x : activeBird.x;
      const by = dragging ? dragPos.y : activeBird.y;
      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(sx - 15, sy - 50); ctx.lineTo(bx, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 15, sy - 50); ctx.lineTo(bx, by); ctx.stroke();
    }
  }

  function drawTrajectory() {
    const dx = SLING_X - dragPos.x;
    const dy = SLING_Y - dragPos.y;
    const vx = dx * LAUNCH_SCALE;
    const vy = dy * LAUNCH_SCALE;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 1; i < 30; i++) {
      const t = i * 0.03;
      const px = dragPos.x + vx * t;
      const py = dragPos.y + vy * t + 0.5 * GRAVITY * t * t;
      if (py > GROUND_Y || px > W || px < 0) break;
      ctx.beginPath();
      ctx.arc(px, py, 2.5 - i * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─── Input ─────────────────────────────────────────────────
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    const t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
    return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
  }

  function onDown(e) {
    e.preventDefault();
    ensureAudio();
    if (gameOver || !activeBird || activeBird.launched) return;
    const pos = getPos(e);
    if (dist(pos, activeBird) < 40) {
      dragging = true;
      dragPos.x = activeBird.x;
      dragPos.y = activeBird.y;
    }
  }
  function onMove(e) {
    e.preventDefault();
    if (!dragging) return;
    const pos = getPos(e);
    const dx = pos.x - SLING_X, dy = pos.y - SLING_Y;
    const d = Math.hypot(dx, dy);
    if (d > MAX_PULL) {
      dragPos.x = SLING_X + (dx / d) * MAX_PULL;
      dragPos.y = SLING_Y + (dy / d) * MAX_PULL;
    } else {
      dragPos.x = pos.x;
      dragPos.y = pos.y;
    }
  }
  function onUp(e) {
    e.preventDefault();
    if (!dragging) return;
    dragging = false;
    const dx = SLING_X - dragPos.x;
    const dy = SLING_Y - dragPos.y;
    if (Math.hypot(dx, dy) < 10) return; // too short
    activeBird.x = dragPos.x;
    activeBird.y = dragPos.y;
    activeBird.vx = dx * LAUNCH_SCALE;
    activeBird.vy = dy * LAUNCH_SCALE;
    activeBird.launched = true;
    sfxLaunch();
    updateUI();
  }

  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseup", onUp);
  canvas.addEventListener("touchstart", onDown, { passive: false });
  canvas.addEventListener("touchmove", onMove, { passive: false });
  canvas.addEventListener("touchend", onUp, { passive: false });

  document.getElementById("reset-btn").addEventListener("click", init);
  document.getElementById("message-btn").addEventListener("click", init);

  // ─── Game loop ─────────────────────────────────────────────
  function loop(ts) {
    const dt = lastTime ? (ts - lastTime) / 1000 : 1 / 60;
    lastTime = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  init();
  requestAnimationFrame(loop);
})();
