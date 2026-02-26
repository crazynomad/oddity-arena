'use client';

export const runtime = 'edge';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { getChallengeById, CHALLENGES } from '@/lib/challenges';
import Link from 'next/link';

interface Rating {
  model: string;
  rating: number;
  votes: number;
}

interface DeepDiveEntry {
  challenge: string;
  model: string;
  driver: string;
  driverMode: number;
  timestamp: string;
  rounds: number;
  tools_used: string[];
  file_size_bytes: number;
  status: string;
  track?: string;
}

type SortMode = 'elo' | 'name' | 'random';
type ViewMode = 'grid' | 'compare';

export default function GalleryPage() {
  const params = useParams();
  const challengeId = params.id as string;
  const challenge = getChallengeById(challengeId);
  const { lang } = useI18n();
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('elo');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [interactive, setInteractive] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(350);
  const [deepDive, setDeepDive] = useState<Record<string, DeepDiveEntry>>({});
  const [expandedMeta, setExpandedMeta] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/challenges/${challengeId}/deep-dive.json`)
      .then(r => r.ok ? r.json() : {})
      .then(d => setDeepDive(d))
      .catch(() => {});
  }, [challengeId]);

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
    if (sortMode === 'elo') {
      return (ratings[b]?.rating || 1200) - (ratings[a]?.rating || 1200);
    }
    if (sortMode === 'name') return a.localeCompare(b);
    return Math.random() - 0.5;
  });

  const medals = ['🥇', '🥈', '🥉'];

  // Navigate between challenges
  const challengeIdx = CHALLENGES.findIndex(c => c.id === challengeId);
  const prevChallenge = challengeIdx > 0 ? CHALLENGES[challengeIdx - 1] : null;
  const nextChallenge = challengeIdx < CHALLENGES.length - 1 ? CHALLENGES[challengeIdx + 1] : null;

  // Keyboard nav for fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(null);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const idx = sorted.indexOf(fullscreen);
        if (idx < sorted.length - 1) setFullscreen(sorted[idx + 1]);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const idx = sorted.indexOf(fullscreen);
        if (idx > 0) setFullscreen(sorted[idx - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, sorted]);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between py-8 border-b-2 border-ink">
          <div>
            <h1 className="font-stamp text-xl md:text-2xl tracking-[0.1em] uppercase">
              {title}
            </h1>
            <p className="font-typewriter text-xs text-ink-gray tracking-[0.15em] mt-1 uppercase">
              {lang === 'zh' ? `全部作品 · ${challenge.models.length} 个模型` : `ALL SUBMISSIONS · ${challenge.models.length} models`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/challenges/${challengeId}`}
              className="font-typewriter text-xs tracking-[0.1em] px-4 py-2 border-2 border-ink bg-brand-yellow text-ink uppercase no-underline hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A] transition-all"
            >
              ⚔️
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-dashed border-ink-gray">
          {/* Sort */}
          <div className="flex gap-2 items-center">
            <span className="font-typewriter text-xs text-ink-gray tracking-[0.1em]">
              {lang === 'zh' ? '排序:' : 'SORT:'}
            </span>
            {(['elo', 'name', 'random'] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`font-typewriter text-xs px-3 py-1 border border-ink cursor-pointer transition-all ${
                  sortMode === mode ? 'bg-ink text-paper' : 'bg-transparent text-ink hover:bg-paper-dark'
                }`}
              >
                {mode === 'elo' ? '📊 ELO' : mode === 'name' ? '🔤 A-Z' : '🎲'}
              </button>
            ))}
          </div>

          {/* View mode + controls */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`font-typewriter text-xs px-3 py-1 border border-ink cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-ink text-paper' : 'bg-transparent hover:bg-paper-dark'
              }`}
            >
              ▦
            </button>
            <button
              onClick={() => {
                setViewMode('compare');
                if (!compareA && sorted.length >= 2) {
                  setCompareA(sorted[0]);
                  setCompareB(sorted[1]);
                }
              }}
              className={`font-typewriter text-xs px-3 py-1 border border-ink cursor-pointer transition-all ${
                viewMode === 'compare' ? 'bg-ink text-paper' : 'bg-transparent hover:bg-paper-dark'
              }`}
            >
              ⚡ {lang === 'zh' ? '对比' : 'VS'}
            </button>
            <span className="text-ink-gray">|</span>
            <button
              onClick={() => setInteractive(!interactive)}
              className={`font-typewriter text-xs px-3 py-1 border border-ink cursor-pointer transition-all ${
                interactive ? 'bg-stamp-red text-white border-stamp-red' : 'bg-transparent hover:bg-paper-dark'
              }`}
            >
              {interactive ? '🖱️' : '🔒'}
            </button>
            {/* Height slider */}
            <input
              type="range"
              min={200}
              max={800}
              value={iframeHeight}
              onChange={e => setIframeHeight(Number(e.target.value))}
              className="w-20 accent-stamp-red"
            />
          </div>
        </div>

        {/* Challenge nav */}
        <div className="flex justify-between items-center py-3">
          {prevChallenge ? (
            <Link href={`/challenges/${prevChallenge.id}/gallery`} className="font-typewriter text-xs text-ink-gray hover:text-stamp-red no-underline">
              ← {lang === 'zh' ? prevChallenge.titleCn : prevChallenge.title}
            </Link>
          ) : <span />}
          {nextChallenge ? (
            <Link href={`/challenges/${nextChallenge.id}/gallery`} className="font-typewriter text-xs text-ink-gray hover:text-stamp-red no-underline">
              {lang === 'zh' ? nextChallenge.titleCn : nextChallenge.title} →
            </Link>
          ) : <span />}
        </div>

        {/* Fullscreen overlay */}
        {fullscreen && (
          <div
            className="fixed inset-0 z-50 bg-ink/90 flex flex-col items-center justify-center"
            onClick={() => setFullscreen(null)}
          >
            {/* Top bar */}
            <div className="w-[95vw] flex items-center justify-between mb-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const idx = sorted.indexOf(fullscreen);
                    if (idx > 0) setFullscreen(sorted[idx - 1]);
                  }}
                  disabled={sorted.indexOf(fullscreen) === 0}
                  className="font-typewriter text-sm text-paper hover:text-brand-yellow cursor-pointer bg-transparent border-none disabled:opacity-30"
                >
                  ← PREV
                </button>
                <span className="font-typewriter text-sm text-brand-yellow tracking-[0.1em]">
                  {fullscreen}
                </span>
                {ratings[fullscreen] && (
                  <span className="font-mono text-xs bg-brand-yellow text-ink px-2 py-1">
                    ELO {ratings[fullscreen].rating}
                  </span>
                )}
                <button
                  onClick={() => {
                    const idx = sorted.indexOf(fullscreen);
                    if (idx < sorted.length - 1) setFullscreen(sorted[idx + 1]);
                  }}
                  disabled={sorted.indexOf(fullscreen) === sorted.length - 1}
                  className="font-typewriter text-sm text-paper hover:text-brand-yellow cursor-pointer bg-transparent border-none disabled:opacity-30"
                >
                  NEXT →
                </button>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-mono text-xs text-ink-gray">
                  {sorted.indexOf(fullscreen) + 1}/{sorted.length} · ← → {lang === 'zh' ? '切换' : 'navigate'} · ESC {lang === 'zh' ? '关闭' : 'close'}
                </span>
                <button
                  onClick={() => setFullscreen(null)}
                  className="font-typewriter text-sm text-paper hover:text-brand-yellow cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Iframe */}
            <div className="w-[95vw] h-[85vh]" onClick={e => e.stopPropagation()}>
              <iframe
                src={`/challenges/${challengeId}/results/${fullscreen}/index.html`}
                className="w-full h-full border-2 border-brand-yellow bg-white"
              />
            </div>
            {/* Thumbnail strip */}
            <div className="w-[95vw] flex gap-1 mt-3 overflow-x-auto py-1" onClick={e => e.stopPropagation()}>
              {sorted.map((model) => (
                <button
                  key={model}
                  onClick={() => setFullscreen(model)}
                  className={`font-mono text-[10px] px-2 py-1 border whitespace-nowrap cursor-pointer transition-all ${
                    model === fullscreen
                      ? 'bg-brand-yellow text-ink border-brand-yellow'
                      : 'bg-transparent text-paper/60 border-paper/20 hover:text-paper hover:border-paper/50'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compare mode */}
        {viewMode === 'compare' && (
          <div className="py-6">
            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select
                value={compareA || ''}
                onChange={e => setCompareA(e.target.value)}
                className="font-typewriter text-sm p-2 border-2 border-ink bg-paper cursor-pointer"
              >
                {sorted.map(m => (
                  <option key={m} value={m}>{m} {ratings[m] ? `(${ratings[m].rating})` : ''}</option>
                ))}
              </select>
              <select
                value={compareB || ''}
                onChange={e => setCompareB(e.target.value)}
                className="font-typewriter text-sm p-2 border-2 border-ink bg-paper cursor-pointer"
              >
                {sorted.map(m => (
                  <option key={m} value={m}>{m} {ratings[m] ? `(${ratings[m].rating})` : ''}</option>
                ))}
              </select>
            </div>
            {/* Side by side */}
            <div className="grid grid-cols-2 gap-4">
              {[compareA, compareB].map((model, i) => model && (
                <div key={i} className="border-2 border-ink">
                  <div className="flex items-center justify-between px-4 py-2 bg-paper-dark border-b border-ink">
                    <span className="font-typewriter text-sm">{model}</span>
                    {ratings[model] && (
                      <span className="font-mono text-xs bg-brand-yellow text-ink px-2 py-0.5 border border-ink">
                        ELO {ratings[model].rating}
                      </span>
                    )}
                  </div>
                  <iframe
                    src={`/challenges/${challengeId}/results/${model}/index.html`}
                    className="w-full bg-white"
                    style={{ height: iframeHeight, pointerEvents: interactive ? 'auto' : 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid mode */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {sorted.map((model, i) => {
              const r = ratings[model];
              return (
                <div
                  key={model}
                  className="border border-ink bg-paper transition-all hover:shadow-[4px_4px_0_#1A1A1A] group"
                >
                  {/* Model header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ink bg-paper-dark">
                    <div className="flex items-center gap-2">
                      {i < 3 && <span className="text-lg">{medals[i]}</span>}
                      <span className="font-typewriter text-sm tracking-[0.05em]">{model}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {r && (
                        <span className="font-mono text-xs bg-brand-yellow text-ink px-2 py-1 border border-ink">
                          {r.rating}
                        </span>
                      )}
                      {r && (
                        <span className="font-mono text-xs text-ink-gray">
                          {r.votes}v
                        </span>
                      )}
                      <button
                        onClick={() => setFullscreen(model)}
                        className="font-typewriter text-xs text-ink-gray hover:text-stamp-red cursor-pointer bg-transparent border-none opacity-0 group-hover:opacity-100 transition-opacity"
                        title={lang === 'zh' ? '全屏' : 'Fullscreen'}
                      >
                        ⛶
                      </button>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="relative cursor-pointer" onClick={() => setFullscreen(model)}>
                    <iframe
                      src={`/challenges/${challengeId}/results/${model}/index.html`}
                      className="w-full bg-white"
                      style={{ height: iframeHeight, pointerEvents: interactive ? 'auto' : 'none' }}
                    />
                    {!interactive && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ink/5">
                        <span className="font-typewriter text-xs bg-ink text-paper px-4 py-2 tracking-[0.1em]">
                          {lang === 'zh' ? '点击放大' : 'CLICK TO ENLARGE'}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Deep Dive */}
                  {deepDive[model] && (
                    <div className="border-t border-ink">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedMeta(expandedMeta === model ? null : model); }}
                        className="w-full flex items-center justify-between px-4 py-2 bg-paper-dark hover:bg-paper cursor-pointer border-none font-typewriter text-xs text-ink-gray tracking-[0.08em]"
                      >
                        <span>🔬 {lang === 'zh' ? '生成详情' : 'DEEP DIVE'}</span>
                        <span>{expandedMeta === model ? '▲' : '▼'}</span>
                      </button>
                      {expandedMeta === model && (
                        <div className="px-4 py-3 bg-paper-dark/50 font-mono text-xs leading-relaxed">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            <span className="text-ink-gray">{lang === 'zh' ? '赛道' : 'Track'}</span>
                            <span className="text-ink">{deepDive[model].track === 'openclaw' ? '🦞 OpenClaw' : '🎨 Code'}</span>
                            <span className="text-ink-gray">{lang === 'zh' ? '驱动方式' : 'Driver'}</span>
                            <span className="text-ink">{deepDive[model].driver} (mode {deepDive[model].driverMode})</span>
                            <span className="text-ink-gray">{lang === 'zh' ? '对话轮次' : 'Rounds'}</span>
                            <span className="text-ink">{deepDive[model].rounds}</span>
                            <span className="text-ink-gray">{lang === 'zh' ? '工具调用' : 'Tools'}</span>
                            <span className="text-ink">{deepDive[model].tools_used.join(', ')}</span>
                            <span className="text-ink-gray">{lang === 'zh' ? '文件大小' : 'File Size'}</span>
                            <span className="text-ink">{(deepDive[model].file_size_bytes / 1024).toFixed(1)} KB</span>
                            <span className="text-ink-gray">{lang === 'zh' ? '生成时间' : 'Generated'}</span>
                            <span className="text-ink">{new Date(deepDive[model].timestamp).toLocaleString()}</span>
                            <span className="text-ink-gray">{lang === 'zh' ? '状态' : 'Status'}</span>
                            <span className={deepDive[model].status === 'ok' ? 'text-green-700' : 'text-stamp-red'}>{deepDive[model].status}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
