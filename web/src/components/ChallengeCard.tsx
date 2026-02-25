'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import type { Challenge } from '@/lib/challenges';

const diffColors = {
  easy: 'bg-brand-yellow text-ink border-ink',
  medium: 'bg-transparent text-ink border-ink',
  hard: 'bg-stamp-red text-white border-stamp-red',
};

const categoryEmojis: Record<string, string> = {
  game: '🎮',
  creative: '🎨',
  frontend: '🖥️',
  svg: '✏️',
  '3d': '🌍',
};

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { t, lang } = useI18n();
  const title = lang === 'zh' ? challenge.titleCn : challenge.title;
  const desc = lang === 'zh' ? challenge.descCn : challenge.description;

  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className="block bg-paper border border-ink p-8 relative transition-all duration-300 no-underline text-ink hover:translate-y-[-3px] hover:shadow-[4px_4px_0_#1A1A1A] group"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{categoryEmojis[challenge.category] || '📦'}</span>
        <span className={`inline-block font-typewriter text-[0.7rem] tracking-[0.1em] px-3 py-1 border uppercase ${diffColors[challenge.difficulty]}`}>
          {t(`diff.${challenge.difficulty}`)}
        </span>
      </div>
      <h3 className="font-typewriter text-base tracking-[0.05em] mb-2">{title}</h3>
      <p className="text-sm text-ink-light leading-relaxed mb-4">{desc}</p>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink-gray">
          {t('challenge.models', { n: challenge.models.length })}
        </span>
        <span className="font-typewriter text-xs text-stamp-red opacity-0 group-hover:opacity-100 transition-opacity">
          {t('challenge.battle')} →
        </span>
      </div>
    </Link>
  );
}
