'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import type { Challenge } from '@/lib/challenges';

const diffStyles: Record<string, React.CSSProperties> = {
  easy: { background: '#FFE500', color: '#1A1A1A', border: '1px solid #1A1A1A' },
  medium: { background: 'transparent', color: '#1A1A1A', border: '1px solid #1A1A1A' },
  hard: { background: '#C41E3A', color: '#fff', border: '1px solid #C41E3A' },
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
      style={{
        display: 'block',
        background: '#F5F0E1',
        border: '1px solid #1A1A1A',
        padding: '2rem',
        textDecoration: 'none',
        color: '#1A1A1A',
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '4px 4px 0 #1A1A1A';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{categoryEmojis[challenge.category] || '📦'}</span>
        <span style={{
          display: 'inline-block',
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          padding: '0.3rem 0.75rem',
          textTransform: 'uppercase',
          ...diffStyles[challenge.difficulty],
        }}>
          {t(`diff.${challenge.difficulty}`)}
        </span>
      </div>
      <h3 style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '1rem',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
      }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '1rem' }}>
        {desc}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: '0.75rem', color: '#666' }}>
          {t('challenge.models', { n: challenge.models.length })}
        </span>
      </div>
    </Link>
  );
}
