'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function Header() {
  const { t, lang, toggle } = useI18n();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 0',
      borderBottom: '2px solid #1A1A1A',
    }}>
      <Link href="/" style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '1.1rem',
        letterSpacing: '0.15em',
        textDecoration: 'none',
        color: '#1A1A1A',
        fontWeight: 700,
      }}>
        ⚡ ODDITY ARENA
      </Link>
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <Link href="/#challenges" style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.8rem',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#4A4A4A',
        }}>
          {lang === 'zh' ? '挑战' : 'Challenges'}
        </Link>
        <Link href="/gallery" style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.8rem',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#4A4A4A',
        }}>
          {lang === 'zh' ? '展览' : 'Gallery'}
        </Link>
        <Link href="/leaderboard" style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.8rem',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#4A4A4A',
        }}>
          {lang === 'zh' ? '排行榜' : 'Leaderboard'}
        </Link>
        <a href="https://github.com/crazynomad/oddity-arena" target="_blank" style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.8rem',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#4A4A4A',
        }}>
          GitHub
        </a>
        <button
          onClick={toggle}
          style={{
            background: 'none',
            border: '1px solid #1A1A1A',
            color: '#1A1A1A',
            padding: '4px 12px',
            cursor: 'pointer',
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.85em',
          }}
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
    </nav>
  );
}
