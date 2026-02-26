
'use client';

export const runtime = 'edge';

import { useParams } from 'next/navigation';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { getChallengeById, getNextChallenge, getChallengeIndex, CHALLENGES } from '@/lib/challenges';
import Link from 'next/link';

export default function BattlePage() {
  const params = useParams();
  const challengeId = params.id as string;
  const challenge = getChallengeById(challengeId);
  const { t, lang } = useI18n();

  const [modelA, setModelA] = useState('');
  const [modelB, setModelB] = useState('');
  const [voted, setVoted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [winner, setWinner] = useState('');
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const [koText, setKoText] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pickPair = useCallback(() => {
    if (!challenge) return;
    const models = [...challenge.models];
    const idxA = Math.floor(Math.random() * models.length);
    const a = models.splice(idxA, 1)[0];
    const b = models[Math.floor(Math.random() * models.length)];
    if (Math.random() > 0.5) {
      setModelA(b); setModelB(a);
    } else {
      setModelA(a); setModelB(b);
    }
    setVoted(false);
    setRevealed(false);
    setWinner('');
    setKoText('');
    setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [challenge]);

  useEffect(() => { pickPair(); }, [pickPair]);

  const doVote = async (choice: 'a' | 'b') => {
    if (voted || !challenge) return;
    setVoted(true);
    const w = choice === 'a' ? modelA : modelB;
    const l = choice === 'a' ? modelB : modelA;
    setWinner(w);
    setRevealed(true);

    // Arcade effects
    setShake(true);
    setTimeout(() => setShake(false), 400);
    const koTexts = ['VOTED!', 'K.O.!', 'BOOM!', 'JUDGED!'];
    setKoText(koTexts[Math.floor(Math.random() * koTexts.length)]);
    setTimeout(() => setKoText(''), 800);
    setCombo(prev => prev + 1);

    // API vote
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge: challenge.id, winner: w, loser: l }),
      });
    } catch {}

    // Auto-advance countdown
    const next = getNextChallenge(challengeId);
    if (next) {
      let remaining = 8;
      setCountdown(remaining);
      timerRef.current = setInterval(() => {
        remaining--;
        setCountdown(remaining);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          window.location.href = `/challenges/${next.id}`;
        }
      }, 1000);
    }
  };

  const cancelCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
  };

  if (!challenge) {
    return <div className="py-20 text-center font-typewriter">Challenge not found</div>;
  }

  const title = lang === 'zh' ? challenge.titleCn : challenge.title;
  const idx = getChallengeIndex(challengeId);
  const next = getNextChallenge(challengeId);

  return (
    <div className={shake ? 'animate-shake' : ''}>
      <Header />
      <main className="min-h-screen">
        {/* KO Splash */}
        {koText && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <span className="font-stamp text-[clamp(4rem,12vw,8rem)] text-stamp-red animate-stamp-in"
              style={{ textShadow: '0 0 40px rgba(196,30,58,0.8), 4px 4px 0 #1A1A1A' }}>
              {koText}
            </span>
          </div>
        )}

        {/* Battle Header */}
        <div className="text-center py-10 border-b-2 border-ink">
          <h1 className="font-stamp text-2xl md:text-3xl tracking-[0.1em] uppercase">
            {title}
          </h1>
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {CHALLENGES.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                {i > 0 && <div className="w-5 h-0.5 bg-ink-gray" />}
                <div className={`w-3 h-3 border-2 border-ink transition-all ${
                  i < idx ? 'bg-brand-yellow' :
                  i === idx ? 'bg-stamp-red shadow-[0_0_8px_rgba(196,30,58,0.5)] scale-120' :
                  'bg-transparent'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Combo counter */}
        {combo > 0 && (
          <div className="fixed top-5 right-5 z-40 text-right pointer-events-none">
            <div className="font-stamp text-5xl text-brand-yellow" style={{ textShadow: '2px 2px 0 #1A1A1A' }}>
              {combo}
            </div>
            <div className="font-typewriter text-xs text-stamp-red tracking-[0.2em] uppercase">
              {combo >= 10 ? t('arcade.legendary') :
               combo >= 7 ? t('arcade.unstoppable') :
               combo >= 5 ? t('arcade.five') :
               combo >= 3 ? t('arcade.triple') :
               t('arcade.combo')}
            </div>
          </div>
        )}

        {/* Battle Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-6">
          {/* Side A */}
          <div>
            <div className={`text-center font-typewriter text-sm tracking-[0.15em] py-3 border border-ink border-b-0 uppercase ${
              revealed ? 'bg-brand-yellow font-bold' : 'bg-paper-dark'
            }`}>
              {revealed ? modelA : t('battle.model_a')}
              {revealed && winner === modelA && ' 👑'}
            </div>
            <iframe
              src={modelA ? `/challenges/${challengeId}/results/${modelA}/index.html` : ''}
              className={`w-full h-[500px] border-2 border-ink bg-white ${
                revealed && winner === modelA ? 'border-stamp-red shadow-[0_0_0_3px_#C41E3A]' : ''
              }`}
            />
            <button
              onClick={() => doVote('a')}
              disabled={voted}
              className={`w-full mt-3 font-typewriter text-sm tracking-[0.1em] py-3 border-2 border-ink cursor-pointer transition-all uppercase ${
                voted && winner === modelA
                  ? 'bg-stamp-red text-white border-stamp-red'
                  : 'bg-brand-yellow text-ink hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A]'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
            >
              {voted ? (winner === modelA ? t('battle.voted_left') : t('battle.pick_left')) : t('battle.pick_left')}
            </button>
          </div>

          {/* Side B */}
          <div>
            <div className={`text-center font-typewriter text-sm tracking-[0.15em] py-3 border border-ink border-b-0 uppercase ${
              revealed ? 'bg-brand-yellow font-bold' : 'bg-paper-dark'
            }`}>
              {revealed ? modelB : t('battle.model_b')}
              {revealed && winner === modelB && ' 👑'}
            </div>
            <iframe
              src={modelB ? `/challenges/${challengeId}/results/${modelB}/index.html` : ''}
              className={`w-full h-[500px] border-2 border-ink bg-white ${
                revealed && winner === modelB ? 'border-stamp-red shadow-[0_0_0_3px_#C41E3A]' : ''
              }`}
            />
            <button
              onClick={() => doVote('b')}
              disabled={voted}
              className={`w-full mt-3 font-typewriter text-sm tracking-[0.1em] py-3 border-2 border-ink cursor-pointer transition-all uppercase ${
                voted && winner === modelB
                  ? 'bg-stamp-red text-white border-stamp-red'
                  : 'bg-brand-yellow text-ink hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A]'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
            >
              {voted ? (winner === modelB ? t('battle.voted_right') : t('battle.pick_right')) : t('battle.pick_right')}
            </button>
          </div>
        </div>

        {/* Action buttons after vote */}
        {voted && (
          <div className="text-center py-4 space-y-3">
            <div className="flex gap-3 justify-center flex-wrap">
              {next && (
                <Link
                  href={`/challenges/${next.id}`}
                  onClick={cancelCountdown}
                  className="font-typewriter text-sm tracking-[0.1em] px-6 py-3 bg-brand-yellow text-ink border-2 border-ink uppercase no-underline hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A] transition-all"
                >
                  {t('battle.next_challenge')}
                </Link>
              )}
              <button
                onClick={() => { cancelCountdown(); pickPair(); }}
                className="font-typewriter text-sm tracking-[0.1em] px-6 py-3 bg-transparent text-ink border-2 border-ink uppercase cursor-pointer hover:bg-ink hover:text-paper transition-all"
              >
                {t('battle.next_pair')}
              </button>
              <Link
                href={`/challenges/${challengeId}/gallery`}
                onClick={cancelCountdown}
                className="font-typewriter text-sm tracking-[0.1em] px-6 py-3 bg-transparent text-ink border-2 border-ink uppercase no-underline cursor-pointer hover:bg-ink hover:text-paper transition-all"
              >
                {t('battle.gallery')}
              </Link>
              <Link
                href="/leaderboard"
                onClick={cancelCountdown}
                className="font-typewriter text-sm tracking-[0.1em] px-6 py-3 bg-transparent text-ink border-2 border-ink uppercase no-underline cursor-pointer hover:bg-ink hover:text-paper transition-all"
              >
                {t('battle.leaderboard')}
              </Link>
            </div>
            {countdown > 0 && (
              <p className="font-mono text-sm text-stamp-red">
                {countdown}{t('battle.auto_next')}
              </p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
