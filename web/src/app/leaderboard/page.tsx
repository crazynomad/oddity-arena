
'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { CHALLENGES } from '@/lib/challenges';

interface Rating {
  model: string;
  rating: number;
  votes: number;
}

interface LeaderboardData {
  challenge: string;
  totalVotes: number;
  ratings: Rating[];
}

export default function LeaderboardPage() {
  const { t, lang } = useI18n();
  const [selectedChallenge, setSelectedChallenge] = useState(CHALLENGES[0].id);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard/${selectedChallenge}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedChallenge]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="text-center py-10 border-b-2 border-ink">
          <h1 className="font-stamp text-2xl md:text-3xl tracking-[0.1em] uppercase">
            {lang === 'zh' ? '排行榜' : 'LEADERBOARD'}
          </h1>
          <p className="font-mono text-sm text-ink-light mt-2">
            {lang === 'zh' ? 'ELO 评分系统 · K=32 · 起始分 1200' : 'ELO Rating System · K=32 · Starting 1200'}
          </p>
        </div>

        {/* Challenge selector */}
        <div className="flex flex-wrap gap-3 justify-center py-6">
          {CHALLENGES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedChallenge(c.id)}
              className={`font-typewriter text-xs tracking-[0.1em] px-4 py-2 border-2 border-ink cursor-pointer transition-all uppercase ${
                selectedChallenge === c.id
                  ? 'bg-brand-yellow text-ink'
                  : 'bg-transparent text-ink hover:bg-paper-dark'
              }`}
            >
              {lang === 'zh' ? c.titleCn : c.title}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="max-w-2xl mx-auto py-6">
          {loading ? (
            <div className="text-center py-12 font-mono text-ink-gray">Loading...</div>
          ) : !data || data.ratings.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-typewriter text-ink-gray">
                {lang === 'zh' ? '暂无投票数据' : 'No votes yet'}
              </p>
              <p className="font-mono text-sm text-ink-gray mt-2">
                {lang === 'zh' ? '去对战页投票吧！' : 'Go vote in the arena!'}
              </p>
            </div>
          ) : (
            <>
              <div className="text-right font-mono text-xs text-ink-gray mb-4">
                {lang === 'zh' ? `共 ${data.totalVotes} 票` : `${data.totalVotes} total votes`}
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-ink">
                    <th className="font-typewriter text-xs tracking-[0.1em] text-left py-3 w-12">#</th>
                    <th className="font-typewriter text-xs tracking-[0.1em] text-left py-3">MODEL</th>
                    <th className="font-typewriter text-xs tracking-[0.1em] text-right py-3">ELO</th>
                    <th className="font-typewriter text-xs tracking-[0.1em] text-right py-3">VOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ratings.map((r, i) => (
                    <tr
                      key={r.model}
                      className={`border-b border-dashed border-ink-gray transition-colors hover:bg-paper-dark ${
                        i === 0 ? 'bg-brand-yellow/10' : ''
                      }`}
                    >
                      <td className="py-3 font-mono text-sm">
                        {medals[i] || <span className="text-ink-gray">{i + 1}</span>}
                      </td>
                      <td className="py-3 font-typewriter text-sm tracking-[0.05em]">
                        {r.model}
                      </td>
                      <td className="py-3 font-mono text-sm text-right font-bold">
                        {r.rating}
                      </td>
                      <td className="py-3 font-mono text-sm text-right text-ink-gray">
                        {r.votes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
