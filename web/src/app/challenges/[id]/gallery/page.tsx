
'use client';

export const runtime = 'edge';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { getChallengeById } from '@/lib/challenges';
import Link from 'next/link';

interface Rating {
  model: string;
  rating: number;
  votes: number;
}

export default function GalleryPage() {
  const params = useParams();
  const challengeId = params.id as string;
  const challenge = getChallengeById(challengeId);
  const { lang } = useI18n();
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [fullscreen, setFullscreen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leaderboard/${challengeId}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, Rating> = {};
        for (const r of d.ratings || []) map[r.model] = r;
        setRatings(map);
      })
      .catch(() => {});
  }, [challengeId]);

  if (!challenge) {
    return <div className="py-20 text-center font-typewriter">Challenge not found</div>;
  }

  const title = lang === 'zh' ? challenge.titleCn : challenge.title;
  const sorted = [...challenge.models].sort((a, b) => {
    const ra = ratings[a]?.rating || 1200;
    const rb = ratings[b]?.rating || 1200;
    return rb - ra;
  });

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="flex items-center justify-between py-8 border-b-2 border-ink">
          <div>
            <h1 className="font-stamp text-xl md:text-2xl tracking-[0.1em] uppercase">
              {title}
            </h1>
            <p className="font-typewriter text-xs text-ink-gray tracking-[0.15em] mt-1 uppercase">
              {lang === 'zh' ? '全部作品' : 'ALL SUBMISSIONS'}
            </p>
          </div>
          <Link
            href={`/challenges/${challengeId}`}
            className="font-typewriter text-xs tracking-[0.1em] px-4 py-2 border-2 border-ink bg-brand-yellow text-ink uppercase no-underline hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A] transition-all"
          >
            {lang === 'zh' ? '⚔️ 对战' : '⚔️ Battle'}
          </Link>
        </div>

        {/* Fullscreen overlay */}
        {fullscreen && (
          <div
            className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center cursor-pointer"
            onClick={() => setFullscreen(null)}
          >
            <div className="w-[95vw] h-[90vh] relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setFullscreen(null)}
                className="absolute -top-10 right-0 font-typewriter text-sm text-paper hover:text-brand-yellow cursor-pointer bg-transparent border-none"
              >
                ✕ {lang === 'zh' ? '关闭' : 'CLOSE'}
              </button>
              <iframe
                src={`/challenges/${challengeId}/results/${fullscreen}/index.html`}
                className="w-full h-full border-2 border-brand-yellow bg-white"
              />
            </div>
          </div>
        )}

        {/* Gallery grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
          {sorted.map((model, i) => {
            const r = ratings[model];
            return (
              <div key={model} className="border border-ink bg-paper transition-all hover:shadow-[4px_4px_0_#1A1A1A]">
                {/* Model header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-ink bg-paper-dark">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{medals[i] || ''}</span>
                    <span className="font-typewriter text-sm tracking-[0.05em]">{model}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {r && (
                      <span className="font-mono text-xs bg-brand-yellow text-ink px-2 py-1 border border-ink">
                        ELO {r.rating}
                      </span>
                    )}
                    <button
                      onClick={() => setFullscreen(model)}
                      className="font-typewriter text-xs text-ink-gray hover:text-stamp-red cursor-pointer bg-transparent border-none"
                    >
                      ⛶
                    </button>
                  </div>
                </div>
                {/* Preview iframe */}
                <iframe
                  src={`/challenges/${challengeId}/results/${model}/index.html`}
                  className="w-full h-[350px] bg-white pointer-events-none"
                />
                <div
                  className="text-center py-2 border-t border-ink cursor-pointer font-typewriter text-xs text-ink-gray hover:text-stamp-red hover:bg-paper-dark transition-colors"
                  onClick={() => setFullscreen(model)}
                >
                  {lang === 'zh' ? '点击放大' : 'Click to enlarge'}
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
