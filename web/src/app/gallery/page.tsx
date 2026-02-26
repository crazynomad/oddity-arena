'use client';

export const runtime = 'edge';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { CHALLENGES } from '@/lib/challenges';
import Link from 'next/link';

export default function GlobalGalleryPage() {
  const { lang } = useI18n();

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="py-10 border-b-2 border-ink">
          <h1 className="font-stamp text-2xl md:text-3xl tracking-[0.1em] uppercase">
            {lang === 'zh' ? '作品展览' : 'GALLERY'}
          </h1>
          <p className="font-mono text-sm text-ink-light mt-2">
            {lang === 'zh'
              ? `${CHALLENGES.length} 个挑战 · ${CHALLENGES.reduce((s, c) => s + c.models.length, 0)} 件作品`
              : `${CHALLENGES.length} challenges · ${CHALLENGES.reduce((s, c) => s + c.models.length, 0)} submissions`}
          </p>
        </div>

        <div className="py-8 space-y-10">
          {CHALLENGES.map(challenge => {
            const title = lang === 'zh' ? challenge.titleCn : challenge.title;
            const desc = lang === 'zh' ? challenge.descCn : challenge.description;
            // Show first 4 models as preview
            const preview = challenge.models.slice(0, 4);

            return (
              <div key={challenge.id} className="border-2 border-ink bg-paper">
                {/* Challenge header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink bg-paper-dark">
                  <div>
                    <h2 className="font-typewriter text-base tracking-[0.1em]">{title}</h2>
                    <p className="font-mono text-xs text-ink-gray mt-1">{desc}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/challenges/${challenge.id}/gallery`}
                      className="font-typewriter text-xs px-4 py-2 border-2 border-ink bg-transparent text-ink uppercase no-underline hover:bg-ink hover:text-paper transition-all"
                    >
                      {lang === 'zh' ? `全部 ${challenge.models.length} 个 →` : `All ${challenge.models.length} →`}
                    </Link>
                    <Link
                      href={`/challenges/${challenge.id}`}
                      className="font-typewriter text-xs px-4 py-2 border-2 border-ink bg-brand-yellow text-ink uppercase no-underline hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A] transition-all"
                    >
                      ⚔️
                    </Link>
                  </div>
                </div>
                {/* Preview grid */}
                <div className="grid grid-cols-2 md:grid-cols-4">
                  {preview.map((model, i) => (
                    <Link
                      key={model}
                      href={`/challenges/${challenge.id}/gallery`}
                      className={`relative block no-underline ${i < preview.length - 1 ? 'border-r border-ink' : ''}`}
                    >
                      <div className="px-3 py-1.5 bg-paper-dark border-b border-ink">
                        <span className="font-mono text-[10px] text-ink-gray">{model}</span>
                      </div>
                      <iframe
                        src={`/challenges/${challenge.id}/results/${model}/index.html`}
                        className="w-full h-[180px] bg-white pointer-events-none"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
