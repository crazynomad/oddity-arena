// i18n — lightweight bilingual support (zh/en)
// Usage: add data-i18n="key" to elements, call i18n.init()

const i18n = {
  _lang: 'zh',
  _texts: {
    // Nav
    'nav.challenges': { zh: '挑战', en: 'Challenges' },
    'nav.github': { zh: 'GitHub', en: 'GitHub' },

    // Hero
    'hero.tagline': { zh: 'AI 模型进场，你来体验，你来裁决。', en: 'AI models enter. You experience. You decide.' },
    'hero.desc': {
      zh: '这不是又一个聊天机器人跑分榜。在这里，AI 模型构建真正的应用 — 游戏、3D 模拟、动画 — 由<strong style="color:var(--text)">你</strong>来评判高下。',
      en: 'Not another chatbot benchmark. Here, AI models build real apps — games, 3D simulations, animations — and <strong style="color:var(--text)">you</strong> pick the winner.'
    },

    // Tracks
    'track.coding': { zh: '代码', en: 'Coding' },
    'track.coding.desc': { zh: '同一个 Prompt，完整应用。比拼代码实力。', en: 'One prompt, full apps. Compare the code.' },
    'track.coding.count': { zh: '6 个挑战', en: '6 challenges' },
    'track.skills': { zh: '技能', en: 'Skills' },
    'track.skills.desc': { zh: '相同工具，不同模型。谁用得更好？', en: 'Same tools, different models. Who uses them better?' },
    'track.agent': { zh: '智能体', en: 'Agent' },
    'track.agent.desc': { zh: '一个目标，完全自主。AI 能搞定吗？', en: 'One goal, full autonomy. Can the AI figure it out?' },
    'track.coming': { zh: '即将推出', en: 'Coming Soon' },

    // How it Works
    'how.title': { zh: '玩法', en: 'How it Works' },
    'how.step1.title': { zh: '体验', en: 'Experience' },
    'how.step1.desc': { zh: '并排体验两个 AI 生成的应用。模型匿名 — 没有偏见。', en: 'Play two AI-generated apps side by side. Models are anonymous — no bias.' },
    'how.step2.title': { zh: '投票', en: 'Vote' },
    'how.step2.desc': { zh: '选出更好的那个。就这么简单。不需要技术背景。', en: 'Pick the better one. That\'s it. No technical knowledge required.' },
    'how.step3.title': { zh: '揭晓', en: 'Reveal' },
    'how.step3.desc': { zh: '看看哪个 AI 模型做了哪个应用。查看社区投票。分享你的结果。', en: 'See which AI model made which app. Check the community vote. Share your result.' },

    // Challenges
    'challenges.title': { zh: '代码挑战', en: 'Coding Challenges' },
    'challenges.subtitle': { zh: '每个挑战 = 一个 Prompt，多个 AI 模型，可运行的真实应用。', en: 'Each challenge = one prompt, multiple AI models, real deployable apps.' },
    'challenges.models': { zh: '{n} 个模型参赛', en: '{n} models competing' },
    'challenges.awaiting': { zh: '等待参赛者', en: 'Awaiting contestants' },

    // Footer
    'footer.universe': { zh: '<a href="https://github.com/crazynomad">Oddity</a> 宇宙的一部分。🛸', en: 'Part of the <a href="https://github.com/crazynomad">Oddity</a> universe. 🛸' },
    'footer.built': { zh: '用好奇心构建。没有框架受到伤害。', en: 'Built with curiosity. No frameworks were harmed.' },

    // Battle page
    'battle.model_a': { zh: '模型 A', en: 'Model A' },
    'battle.model_b': { zh: '模型 B', en: 'Model B' },
    'battle.pick_left': { zh: '👈 选这个', en: '👈 This One' },
    'battle.pick_right': { zh: '选这个 👉', en: 'This One 👉' },
    'battle.voting': { zh: '投票中...', en: 'Voting...' },
    'battle.voted_left': { zh: '👈 ✓ 已投票！', en: '👈 ✓ Voted!' },
    'battle.voted_right': { zh: '✓ 已投票！ 👉', en: '✓ Voted! 👉' },
    'battle.community': { zh: '🏆 社区投票', en: '🏆 Community Votes' },
    'battle.new_pair': { zh: '🔀 换一对', en: '🔀 New Pair' },
    'battle.leaderboard': { zh: '📊 排行榜', en: '📊 Leaderboard' },
    'battle.gallery': { zh: '🖼️ 全部作品', en: '🖼️ Gallery' },
    'battle.share': { zh: '📤 分享', en: '📤 Share' },
    'battle.back': { zh: '← 返回对战', en: '← Back to Battle' },
    'battle.back_home': { zh: '← 返回挑战列表', en: '← Back to Challenges' },
    'battle.waiting': { zh: '⏳ 等待更多模型参赛...', en: '⏳ Waiting for more models to compete...' },
    'battle.waiting_desc': { zh: '目前只有 1 个模型参加了这个挑战。', en: 'Only 1 model has entered this challenge so far.' },
    'battle.duplicate': { zh: '你已经对这一对投过票了！换一对试试 🔀', en: 'You already voted on this pair! Try a new one 🔀' },
    'battle.fullscreen': { zh: '全屏', en: 'Fullscreen' },
    'battle.elo_title': { zh: '📊 ELO 排行榜', en: '📊 ELO Leaderboard' },
    'battle.no_votes': { zh: '还没有投票。来做第一个投票的人！ 🗳️', en: 'No votes yet. Be the first to vote! 🗳️' },
    'battle.total_votes': { zh: '{n} 次总投票', en: '{n} total votes' },
    'battle.votes_cast': { zh: '{n} 次投票', en: '{n} votes cast' },
    'battle.wins': { zh: '{n} 胜', en: '{n} wins' },
    'battle.all_submissions': { zh: '🖼️ 全部参赛作品', en: '🖼️ All Submissions' },

    // Difficulty
    'diff.easy': { zh: '简单', en: 'easy' },
    'diff.medium': { zh: '中等', en: 'medium' },
    'diff.hard': { zh: '困难', en: 'hard' },

    // Categories
    'cat.game': { zh: '游戏', en: 'game' },
    'cat.3d': { zh: '3D', en: '3d' },
    'cat.animation': { zh: '动画', en: 'animation' },
    'cat.frontend': { zh: '前端', en: 'frontend' },
    'cat.engineering': { zh: '工程', en: 'engineering' },

    // Table headers
    'table.rank': { zh: '#', en: '#' },
    'table.model': { zh: '模型', en: 'Model' },
    'table.elo': { zh: 'ELO', en: 'ELO' },
    'table.record': { zh: '战绩', en: 'Record' },
    'table.winrate': { zh: '胜率', en: 'Win%' },

    // Auto-advance
    'battle.next_challenge': { zh: '⚡ 下一关', en: '⚡ Next Challenge' },
    'battle.next_pair': { zh: '🔀 同关换对手', en: '🔀 New Pair (Same Challenge)' },
    'battle.all_clear': { zh: '🏆 全部通关！', en: '🏆 ALL CLEAR!' },
    'battle.all_clear_desc': { zh: '你已体验完所有挑战！', en: "You've completed all challenges!" },
    'battle.replay': { zh: '🔄 再来一轮', en: '🔄 Play Again' },
    'battle.auto_next': { zh: '秒后自动进入下一关...', en: 's to next challenge...' },
    'battle.round': { zh: '第 {n} 关', en: 'ROUND {n}' },

    // Lang toggle
    'lang.switch': { zh: 'EN', en: '中文' },
  },

  init() {
    this._lang = localStorage.getItem('oddity-lang') || 'zh';
    this.apply();
  },

  toggle() {
    this._lang = this._lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('oddity-lang', this._lang);
    this.apply();
  },

  get lang() { return this._lang; },

  t(key, vars) {
    const entry = this._texts[key];
    if (!entry) return key;
    let text = entry[this._lang] || entry.en || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.innerHTML = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });
    // Update lang toggle button
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = this.t('lang.switch');
    // Update html lang
    document.documentElement.lang = this._lang === 'zh' ? 'zh-CN' : 'en';
    // Fire event for dynamic content
    window.dispatchEvent(new CustomEvent('langchange', { detail: this._lang }));
  }
};
