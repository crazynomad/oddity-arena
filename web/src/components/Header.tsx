'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function Header() {
  const { t, lang, toggle } = useI18n();

  return (
    <nav className="flex items-center justify-between py-5 border-b-2 border-ink">
      <Link href="/" className="font-typewriter text-lg tracking-[0.15em] font-bold no-underline text-ink hover:text-ink">
        ODDITY ARENA
      </Link>
      <div className="flex gap-5 items-center">
        <Link href="/" className="font-typewriter text-xs tracking-[0.1em] uppercase text-ink-light hover:text-stamp-red no-underline">
          {t('nav.home')}
        </Link>
        <Link href="/gallery" className="font-typewriter text-xs tracking-[0.1em] uppercase text-ink-light hover:text-stamp-red no-underline">
          {lang === 'zh' ? '展览' : 'Gallery'}
        </Link>
        <Link href="/leaderboard" className="font-typewriter text-xs tracking-[0.1em] uppercase text-ink-light hover:text-stamp-red no-underline">
          {t('nav.leaderboard')}
        </Link>
        <button
          onClick={toggle}
          className="font-typewriter text-xs tracking-[0.1em] border border-ink px-3 py-1 bg-transparent cursor-pointer hover:bg-ink hover:text-paper transition-colors"
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
    </nav>
  );
}
