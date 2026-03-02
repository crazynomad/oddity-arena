'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Lang = 'zh' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // Nav
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.challenges': { zh: '挑战', en: 'Challenges' },
  'nav.leaderboard': { zh: '排行榜', en: 'Leaderboard' },
  'nav.about': { zh: '关于', en: 'About' },

  // Hero
  'hero.title': { zh: '不现实竞技场', en: 'ODDITY ARENA' },
  'hero.subtitle': { zh: 'AI 模型盲测对决 — 你来当裁判', en: 'AI models compete blind. You be the judge.' },
  'hero.start': { zh: '⚡ 开始对战', en: '⚡ START BATTLE' },

  // Challenges
  'challenge.models': { zh: '{n} 个模型', en: '{n} models' },
  'challenge.battle': { zh: '进入对战', en: 'Enter Battle' },

  // Difficulty
  'diff.easy': { zh: '入门', en: 'Easy' },
  'diff.medium': { zh: '中等', en: 'Medium' },
  'diff.hard': { zh: '困难', en: 'Hard' },

  // Battle
  'battle.model_a': { zh: '挑战者 A', en: 'CHALLENGER A' },
  'battle.model_b': { zh: '挑战者 B', en: 'CHALLENGER B' },
  'battle.pick_left': { zh: '👈 选左边', en: '👈 Pick Left' },
  'battle.pick_right': { zh: '选右边 👉', en: 'Pick Right 👉' },
  'battle.voting': { zh: '投票中...', en: 'Voting...' },
  'battle.voted_left': { zh: '✅ 已投左边', en: '✅ Voted Left' },
  'battle.voted_right': { zh: '✅ 已投右边', en: '✅ Voted Right' },
  'battle.next_challenge': { zh: '⚡ 下一关', en: '⚡ Next Challenge' },
  'battle.next_pair': { zh: '🔀 同关换对手', en: '🔀 New Pair' },
  'battle.leaderboard': { zh: '📊 排行榜', en: '📊 Leaderboard' },
  'battle.gallery': { zh: '🖼️ 全部作品', en: '🖼️ Gallery' },
  'battle.all_clear': { zh: '🏆 全部通关！', en: '🏆 ALL CLEAR!' },
  'battle.all_clear_desc': { zh: '你已体验完所有挑战！', en: "You've completed all challenges!" },
  'battle.replay': { zh: '🔄 再来一轮', en: '🔄 Play Again' },
  'battle.auto_next': { zh: '秒后自动进入下一关...', en: 's to next challenge...' },
  'battle.fullscreen': { zh: '全屏', en: 'Fullscreen' },

  // Arcade
  'arcade.combo': { zh: '连击', en: 'COMBO' },
  'arcade.triple': { zh: '🔥 三连！', en: '🔥 TRIPLE!' },
  'arcade.five': { zh: '⚡ 五连杀！', en: '⚡ FIVE STREAK!' },
  'arcade.unstoppable': { zh: '💀 无人能挡！', en: '💀 UNSTOPPABLE!' },
  'arcade.legendary': { zh: '👑 传奇评审！', en: '👑 LEGENDARY JUDGE!' },

  // Stats
  'stats.title': { zh: '统计 / 深度分析', en: 'STATS / DEEP DIVE' },
  'stats.subtitle': { zh: '模型生成数据对比 · 文件大小 · 生成元信息', en: 'Model generation data · File sizes · Metadata' },
  'stats.model_overview': { zh: '📊 模型总览', en: '📊 Model Overview' },
  'stats.model': { zh: '模型', en: 'Model' },
  'stats.challenges_completed': { zh: '完成挑战', en: 'Completed' },
  'stats.total_size': { zh: '总大小', en: 'Total Size' },
  'stats.avg_size': { zh: '平均大小', en: 'Avg Size' },
  'stats.avg_rounds': { zh: '平均轮次', en: 'Avg Rounds' },
  'stats.details': { zh: '详细信息', en: 'Details' },
  'stats.file_size': { zh: '文件大小', en: 'File Size' },
  'stats.rounds': { zh: '轮次', en: 'Rounds' },
  'stats.driver': { zh: '驱动方式', en: 'Driver' },
  'stats.tools': { zh: '工具', en: 'Tools' },
  'stats.time': { zh: '生成时间', en: 'Generated' },
  'stats.grid_title': { zh: '📋 模型 × 挑战 矩阵 (KB)', en: '📋 Model × Challenge Grid (KB)' },
  'stats.unit_kb': { zh: '单位: KB', en: 'Unit: KB' },
  'stats.chart_title': { zh: '📊 挑战文件大小对比', en: '📊 File Size Comparison by Challenge' },

  // Footer
  'footer.credit': { zh: '不现实竞技场 — 不现实宇宙的一部分', en: 'Oddity Arena — Part of the Oddity Universe' },
};

function t(key: string, vars?: Record<string, string | number>): string {
  const lang = typeof window !== 'undefined'
    ? (localStorage.getItem('oddity-lang') as Lang) || 'zh'
    : 'zh';
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[lang] || entry.en || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

interface I18nContextType {
  lang: Lang;
  t: (key: string, vars?: Record<string, string | number>) => string;
  toggle: () => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'zh',
  t,
  toggle: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('oddity-lang') as Lang) || 'zh';
    }
    return 'zh';
  });

  const translate = useCallback((key: string, vars?: Record<string, string | number>) => {
    const entry = translations[key];
    if (!entry) return key;
    let text = entry[lang] || entry.en || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }, [lang]);

  const toggle = useCallback(() => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    localStorage.setItem('oddity-lang', next);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, t: translate, toggle }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
