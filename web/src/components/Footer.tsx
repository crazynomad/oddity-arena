'use client';

import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { lang } = useI18n();

  return (
    <footer style={{
      padding: '2rem 0',
      marginTop: '2rem',
      borderTop: '2px solid #1A1A1A',
      fontFamily: "'Courier Prime', monospace",
      fontSize: '0.8rem',
      color: '#666',
      textAlign: 'center',
    }}>
      <p>{lang === 'zh' ? '不现实竞技场 — 不现实宇宙的一部分' : 'Oddity Arena — Part of the Oddity Universe'}</p>
      <p style={{ marginTop: '0.5rem' }}>
        <a href="https://github.com/crazynomad/oddity-arena" style={{ color: '#4A4A4A', textDecoration: 'underline' }}>
          GitHub
        </a>
      </p>
    </footer>
  );
}
