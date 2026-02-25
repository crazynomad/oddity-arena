// ============================================
// Oddity Arena — Arcade Engine
// Street Fighter × FBI Dossier
// ============================================

const arcade = {
  combo: 0,
  totalVotes: 0,
  streak: [],
  sounds: {},

  // ── VS Splash ──
  showVS(nameA, nameB, round) {
    let screen = document.getElementById('vs-screen');
    if (!screen) {
      screen = document.createElement('div');
      screen.id = 'vs-screen';
      screen.className = 'vs-screen';
      screen.innerHTML = `
        <div class="vs-content">
          <div class="vs-fighter left">
            <div class="vs-emblem">🤖</div>
            <div class="vs-fighter-label">CHALLENGER A</div>
            <div class="vs-fighter-name" id="vs-name-a"></div>
          </div>
          <div class="vs-divider">
            <div class="vs-text">VS</div>
            <div class="vs-round" id="vs-round"></div>
          </div>
          <div class="vs-fighter right">
            <div class="vs-emblem">🤖</div>
            <div class="vs-fighter-label">CHALLENGER B</div>
            <div class="vs-fighter-name" id="vs-name-b"></div>
          </div>
        </div>
      `;
      document.body.appendChild(screen);
    }

    document.getElementById('vs-name-a').textContent = nameA;
    document.getElementById('vs-name-b').textContent = nameB;
    document.getElementById('vs-round').textContent =
      round ? `ROUND ${round}` : 'FIGHT!';

    // Reset animation
    screen.classList.remove('active');
    void screen.offsetHeight;
    screen.classList.add('active');

    // Auto dismiss
    return new Promise(resolve => {
      setTimeout(() => {
        screen.classList.remove('active');
        setTimeout(resolve, 300);
      }, 1800);
    });
  },

  // ── Screen Shake ──
  shake() {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 400);
  },

  // ── KO Splash ──
  showKO(text) {
    let ko = document.getElementById('ko-splash');
    if (!ko) {
      ko = document.createElement('div');
      ko.id = 'ko-splash';
      ko.className = 'ko-splash';
      document.body.appendChild(ko);
    }
    ko.textContent = text || 'VOTED!';
    ko.classList.remove('active');
    void ko.offsetHeight;
    ko.classList.add('active');
  },

  // ── Fight Announcement ──
  announce(text) {
    let el = document.getElementById('fight-announce');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fight-announce';
      el.className = 'fight-announce';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.remove('active');
    void el.offsetHeight;
    el.classList.add('active');
  },

  // ── Combo Counter ──
  incrementCombo() {
    this.combo++;
    this.totalVotes++;

    let counter = document.getElementById('combo-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.id = 'combo-counter';
      counter.className = 'combo-counter';
      counter.innerHTML = `
        <div class="combo-number" id="combo-num">0</div>
        <div class="combo-label" id="combo-title">COMBO</div>
        <div class="combo-streak" id="combo-msg"></div>
      `;
      document.body.appendChild(counter);
    }

    counter.classList.add('active');
    document.getElementById('combo-num').textContent = this.combo;

    // Combo messages
    const lang = typeof i18n !== 'undefined' ? i18n.lang : 'en';
    const msgs = {
      3: lang === 'zh' ? '🔥 三连！' : '🔥 TRIPLE!',
      5: lang === 'zh' ? '⚡ 五连杀！' : '⚡ FIVE STREAK!',
      7: lang === 'zh' ? '💀 无人能挡！' : '💀 UNSTOPPABLE!',
      10: lang === 'zh' ? '👑 传奇评审！' : '👑 LEGENDARY JUDGE!',
    };

    const title = document.getElementById('combo-title');
    const msg = document.getElementById('combo-msg');

    if (this.combo >= 10) {
      title.textContent = lang === 'zh' ? '传奇' : 'LEGENDARY';
      msg.textContent = msgs[10];
    } else if (this.combo >= 7) {
      title.textContent = lang === 'zh' ? '无敌' : 'UNSTOPPABLE';
      msg.textContent = msgs[7];
    } else if (this.combo >= 5) {
      title.textContent = lang === 'zh' ? '连杀' : 'KILLING SPREE';
      msg.textContent = msgs[5];
    } else if (this.combo >= 3) {
      title.textContent = 'COMBO';
      msg.textContent = msgs[3];
    } else {
      title.textContent = 'COMBO';
      msg.textContent = '';
    }
  },

  // ── Particles Burst ──
  burstParticles(x, y, color, count = 20) {
    let container = document.getElementById('particle-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'particle-container';
      container.className = 'particle-container';
      document.body.appendChild(container);
    }

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 4 + Math.random() * 8;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const distance = 80 + Math.random() * 160;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      p.style.cssText = `
        width: ${size}px; height: ${size}px;
        background: ${color || this._randomColor()};
        left: ${x}px; top: ${y}px;
        --dx: ${dx}px; --dy: ${dy}px;
        animation: particleFly ${0.6 + Math.random() * 0.4}s ease-out forwards;
      `;
      container.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  },

  // ── Confetti Rain ──
  confetti(duration = 3000) {
    let container = document.getElementById('particle-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'particle-container';
      container.className = 'particle-container';
      document.body.appendChild(container);
    }

    const colors = ['#FFE500', '#C41E3A', '#1A1A1A', '#E8E3D4', '#FF6B35', '#4ECDC4'];
    const interval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 6;
        const shapes = ['50%', '0%', '2px'];
        c.style.cssText = `
          width: ${size}px; height: ${size * (0.6 + Math.random() * 0.8)}px;
          background: ${color};
          left: ${Math.random() * 100}vw; top: -10px;
          border-radius: ${shapes[Math.floor(Math.random() * shapes.length)]};
          animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
        `;
        container.appendChild(c);
        setTimeout(() => c.remove(), 4000);
      }
    }, 50);

    setTimeout(() => clearInterval(interval), duration);
  },

  // ── Winner Crown ──
  showCrown(sideEl) {
    const crown = document.createElement('div');
    crown.className = 'winner-crown';
    crown.textContent = '👑';
    sideEl.style.position = 'relative';
    sideEl.appendChild(crown);
  },

  // ── Health Bars ──
  renderHealthBars(nameA, nameB, pctA, pctB) {
    let bars = document.getElementById('health-bars');
    if (!bars) {
      bars = document.createElement('div');
      bars.id = 'health-bars';
      bars.className = 'health-bars';
      // Insert after battle-header
      const header = document.querySelector('.battle-header');
      if (header) header.after(bars);
    }

    bars.innerHTML = `
      <div class="health-bar left">
        <div class="health-fill left" style="width:${pctA}%"></div>
        <span class="health-name left">${nameA}</span>
      </div>
      <span class="health-vs">VS</span>
      <div class="health-bar right">
        <div class="health-fill right" style="width:${pctB}%"></div>
        <span class="health-name right">${nameB}</span>
      </div>
    `;
  },

  // ── Arcade Progress Dots ──
  renderProgress(current, total) {
    let prog = document.getElementById('arcade-progress');
    if (!prog) {
      prog = document.createElement('div');
      prog.id = 'arcade-progress';
      prog.className = 'arcade-progress';
      const header = document.querySelector('.battle-header');
      if (header) header.after(prog);
    }

    let html = '';
    for (let i = 0; i < total; i++) {
      if (i > 0) html += '<div class="arcade-dot-line"></div>';
      const cls = i < current ? 'completed' : i === current ? 'current' : '';
      html += `<div class="arcade-dot ${cls}"></div>`;
    }
    prog.innerHTML = html;
  },

  // ── Full Arcade Vote Sequence ──
  async onVote(choice, winner, loser, winnerSideEl) {
    // 1. Screen shake
    this.shake();

    // 2. KO splash
    const koTexts = ['VOTED!', 'K.O.!', 'BOOM!', 'JUDGED!'];
    this.showKO(koTexts[Math.floor(Math.random() * koTexts.length)]);

    // 3. Particles at click position
    const btn = document.getElementById(choice === 'a' ? 'vote-a' : 'vote-b');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      this.burstParticles(rect.left + rect.width / 2, rect.top, null, 25);
    }

    // 4. Combo
    this.incrementCombo();

    // 5. Crown after a delay
    setTimeout(() => {
      if (winnerSideEl) this.showCrown(winnerSideEl);
    }, 600);

    // 6. Confetti for combos
    if (this.combo >= 3 && this.combo % 3 === 0) {
      this.confetti(2000);
    }
  },

  // ── Utility ──
  _randomColor() {
    const colors = ['#FFE500', '#C41E3A', '#FF6B35', '#4ECDC4', '#E8E3D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
};
