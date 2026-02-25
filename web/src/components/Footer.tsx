'use client';

import { useI18n } from '@/lib/i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="py-8 mt-8 border-t-2 border-ink font-mono text-sm text-ink-gray text-center">
      <p>{t('footer.credit')}</p>
      <p className="mt-2">
        <a href="https://github.com/crazynomad/oddity-arena" className="text-ink-light underline hover:text-stamp-red">
          GitHub
        </a>
      </p>
    </footer>
  );
}
