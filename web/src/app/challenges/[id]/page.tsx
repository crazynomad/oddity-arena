'use client';

export const runtime = 'edge';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { getChallengeById, getNextChallenge, getChallengeIndex, CHALLENGES } from '@/lib/challenges';
import Link from 'next/link';

interface Tallies {
  [model: string]: { wins: number; elo: number };
}

const diffStyles: Record<string, React.CSSProperties> = {
  easy: { background: '#FFE500', color: '#1A1A1A', border: '1px solid #1A1A1A' },
  medium: { background: 'transparent', color: '#1A1A1A', border: '1px solid #1A1A1A' },
  hard: { background: '#C41E3A', color: '#fff', border: '1px solid #C41E3A' },
};

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
  const [loser, setLoser] = useState('');
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const [koText, setKoText] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [tallies, setTallies] = useState<Tallies>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [voting, setVoting] = useState(false);
  const [toast, setToast] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch leaderboard for ELO badges + total votes
  useEffect(() => {
    if (!challenge) return;
    fetch(`/api/leaderboard/${challenge.id}`)
      .then(r => r.json())
      .then(d => {
        setTotalVotes(d.totalVotes || 0);
        const map: Tallies = {};
        for (const r of d.ratings || []) {
          map[r.model] = { wins: r.votes, elo: r.rating };
        }
        setTallies(map);
      })
      .catch(() => {});
  }, [challenge]);

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
    setLoser('');
    setKoText('');
    setCountdown(0);
    setVoting(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [challenge]);

  useEffect(() => { pickPair(); }, [pickPair]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const goFullscreen = (iframeId: string) => {
    const el = document.getElementById(iframeId);
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    // @ts-ignore
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  const doVote = async (choice: 'a' | 'b') => {
    if (voted || !challenge) return;
    setVoted(true);
    setVoting(true);
    const w = choice === 'a' ? modelA : modelB;
    const l = choice === 'a' ? modelB : modelA;
    setWinner(w);
    setLoser(l);
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
      const resp = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge: challenge.id, winner: w, loser: l }),
      });
      const data = await resp.json();
      if (resp.ok && data.success && data.tallies) {
        setTallies(data.tallies);
        setTotalVotes(prev => prev + 1);
      } else if (resp.status === 429) {
        showToast(lang === 'zh' ? '你已经投过这一对了' : 'You already voted on this pair');
        // localStorage fallback
        const key = `oddity-vote-${challenge.id}`;
        const votes = JSON.parse(localStorage.getItem(key) || '{}');
        votes[w] = (votes[w] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(votes));
      }
    } catch {
      // localStorage fallback
      const key = `oddity-vote-${challenge.id}`;
      const votes = JSON.parse(localStorage.getItem(key) || '{}');
      votes[w] = (votes[w] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(votes));
    }
    setVoting(false);

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

  const share = () => {
    if (!challenge) return;
    const title = lang === 'zh' ? challenge.titleCn : challenge.title;
    const text = lang === 'zh'
      ? `我刚在 Oddity Arena 投票了「${title}」！🛸\n\n来玩来投票：`
      : `I just voted on "${title}" in Oddity Arena! 🛸\n\nCome play and vote:`;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${title} — Oddity Arena`, text, url });
    } else {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
  };

  if (!challenge) {
    return <div style={{ padding: '5rem 0', textAlign: 'center', fontFamily: "'Special Elite', monospace" }}>Challenge not found</div>;
  }

  // Waiting state: less than 2 models
  if (challenge.models.length < 2) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ fontFamily: "'Courier Prime', monospace" }}>
              {lang === 'zh' ? '⏳ 等待更多模型参赛...' : '⏳ Waiting for more models...'}
            </p>
            <p style={{ fontSize: '0.9em', marginTop: '12px', color: '#666' }}>
              {lang === 'zh' ? '目前只有 1 个模型参加了这个挑战。' : 'Only 1 model has entered this challenge.'}
            </p>
            <Link href="/" style={{ display: 'inline-block', marginTop: '24px' }} className="btn-primary">
              {lang === 'zh' ? '← 返回挑战列表' : '← Back to Challenges'}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const title = lang === 'zh' ? challenge.titleCn : challenge.title;
  const desc = lang === 'zh' ? challenge.descCn : challenge.description;
  const idx = getChallengeIndex(challengeId);
  const next = getNextChallenge(challengeId);

  // Vote progress bars
  const winnerWins = tallies[winner]?.wins || 0;
  const loserWins = tallies[loser]?.wins || 0;
  const barTotal = winnerWins + loserWins || 1;
  const winnerPct = Math.max(Math.round(winnerWins / barTotal * 100), 2);
  const loserPct = Math.max(Math.round(loserWins / barTotal * 100), 2);

  return (
    <div className={shake ? 'animate-shake' : ''}>
      <Header />
      <main style={{ minHeight: '100vh' }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: '#C41E3A', color: '#F5F0E1', padding: '10px 24px', borderRadius: '8px',
            fontWeight: 600, zIndex: 100, fontFamily: "'Courier Prime', monospace",
          }}>
            {toast}
          </div>
        )}

        {/* KO Splash */}
        {koText && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, pointerEvents: 'none' }}>
            <span className="animate-ko" style={{
              fontFamily: "'Black Ops One', monospace",
              fontSize: 'clamp(4rem, 12vw, 8rem)',
              color: '#C41E3A',
              textShadow: '0 0 40px rgba(196,30,58,0.8), 4px 4px 0 #1A1A1A',
            }}>
              {koText}
            </span>
          </div>
        )}

        {/* Battle Header */}
        <div style={{ textAlign: 'center', padding: '2.5rem 0 1.5rem', borderBottom: '2px solid #1A1A1A' }}>
          {/* Difficulty + Category tags */}
          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{
              display: 'inline-block', fontFamily: "'Special Elite', monospace", fontSize: '0.7rem',
              letterSpacing: '0.1em', padding: '0.3rem 0.75rem', textTransform: 'uppercase',
              ...diffStyles[challenge.difficulty],
            }}>
              {t(`diff.${challenge.difficulty}`)}
            </span>
            <span style={{
              display: 'inline-block', fontFamily: "'Special Elite', monospace", fontSize: '0.7rem',
              letterSpacing: '0.1em', padding: '0.3rem 0.75rem', textTransform: 'uppercase',
              background: '#E8E3D4', border: '1px solid #666', color: '#4A4A4A',
            }}>
              {challenge.category}
            </span>
            {totalVotes > 0 && (
              <span style={{ fontSize: '0.85em', color: '#666', fontFamily: "'Courier Prime', monospace" }}>
                {lang === 'zh' ? `共 ${totalVotes} 票` : `${totalVotes} votes`}
              </span>
            )}
          </div>
          <h1 style={{
            fontFamily: "'Black Ops One', 'Special Elite', monospace",
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            {challenge.title}{challenge.titleCn !== challenge.title ? ` / ${challenge.titleCn}` : ''}
          </h1>
          <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: '0.9rem', color: '#4A4A4A', marginTop: '8px' }}>
            {desc}
          </p>
          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {CHALLENGES.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {i > 0 && <div style={{ width: '20px', height: '2px', background: '#666' }} />}
                <div style={{
                  width: '12px', height: '12px', border: '2px solid #1A1A1A',
                  background: i < idx ? '#FFE500' : i === idx ? '#C41E3A' : 'transparent',
                  boxShadow: i === idx ? '0 0 8px rgba(196,30,58,0.5)' : 'none',
                  transform: i === idx ? 'scale(1.2)' : 'none',
                  transition: 'all 0.3s',
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Combo counter */}
        {combo > 0 && (
          <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 40, textAlign: 'right', pointerEvents: 'none' }}>
            <div style={{ fontFamily: "'Black Ops One', monospace", fontSize: '3rem', color: '#FFE500', textShadow: '2px 2px 0 #1A1A1A', lineHeight: 1 }}>
              {combo}
            </div>
            <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '0.75rem', color: '#C41E3A', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              {combo >= 10 ? t('arcade.legendary') :
               combo >= 7 ? t('arcade.unstoppable') :
               combo >= 5 ? t('arcade.five') :
               combo >= 3 ? t('arcade.triple') :
               t('arcade.combo')}
            </div>
          </div>
        )}

        {/* Battle Arena */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', padding: '1.5rem 0' }}>
          {/* Side A */}
          <div style={{ position: 'relative' }}
            onMouseEnter={e => { const btn = e.currentTarget.querySelector('.fs-btn') as HTMLElement; if (btn) btn.style.opacity = '1'; }}
            onMouseLeave={e => { const btn = e.currentTarget.querySelector('.fs-btn') as HTMLElement; if (btn) btn.style.opacity = '0'; }}
          >
            <div style={{
              textAlign: 'center', fontFamily: "'Special Elite', monospace", fontSize: '0.85rem',
              letterSpacing: '0.15em', padding: '0.75rem', textTransform: 'uppercase',
              border: '1px solid #1A1A1A', borderBottom: 'none',
              background: revealed ? '#FFE500' : '#E8E3D4',
              fontWeight: revealed ? 700 : 400,
            }}>
              {revealed ? modelA : t('battle.model_a')}
              {revealed && tallies[modelA] && (
                <span style={{ display: 'inline-block', background: '#E8E3D4', border: '1px solid #1A1A1A', borderRadius: '6px', padding: '2px 10px', fontSize: '0.8em', color: '#C41E3A', fontWeight: 600, marginLeft: '8px' }}>
                  {tallies[modelA].elo}
                </span>
              )}
              {revealed && winner === modelA && ' 👑'}
            </div>
            {/* Fullscreen button */}
            <button
              className="fs-btn"
              onClick={() => goFullscreen('iframe-a')}
              style={{
                position: 'absolute', top: '52px', right: '8px', zIndex: 10,
                background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px',
                padding: '4px 8px', cursor: 'pointer', fontSize: '0.8em', opacity: 0, transition: 'opacity 0.2s',
              }}
            >
              ⛶ {lang === 'zh' ? '全屏' : 'Fullscreen'}
            </button>
            <iframe
              id="iframe-a"
              src={modelA ? `/challenges/${challengeId}/results/${modelA}/index.html` : ''}
              sandbox="allow-scripts allow-same-origin"
              style={{
                width: '100%', height: '500px', border: '2px solid #1A1A1A', background: '#fff',
                ...(revealed && winner === modelA ? { borderColor: '#C41E3A', boxShadow: '0 0 0 3px #C41E3A' } : {}),
              }}
            />
            <button
              onClick={() => doVote('a')}
              disabled={voted}
              style={{
                width: '100%', marginTop: '12px', fontFamily: "'Special Elite', monospace",
                fontSize: '0.9rem', letterSpacing: '0.1em', padding: '0.85rem', textTransform: 'uppercase',
                border: '2px solid #1A1A1A', cursor: voted ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                background: voted && winner === modelA ? '#C41E3A' : '#FFE500',
                color: voted && winner === modelA ? '#fff' : '#1A1A1A',
                borderColor: voted && winner === modelA ? '#C41E3A' : '#1A1A1A',
                opacity: voted && winner !== modelA ? 0.5 : 1,
              }}
            >
              {voting && !revealed ? '⏳ ...' : voted ? (winner === modelA ? t('battle.voted_left') : t('battle.pick_left')) : t('battle.pick_left')}
            </button>
          </div>

          {/* Side B */}
          <div style={{ position: 'relative' }}
            onMouseEnter={e => { const btn = e.currentTarget.querySelector('.fs-btn') as HTMLElement; if (btn) btn.style.opacity = '1'; }}
            onMouseLeave={e => { const btn = e.currentTarget.querySelector('.fs-btn') as HTMLElement; if (btn) btn.style.opacity = '0'; }}
          >
            <div style={{
              textAlign: 'center', fontFamily: "'Special Elite', monospace", fontSize: '0.85rem',
              letterSpacing: '0.15em', padding: '0.75rem', textTransform: 'uppercase',
              border: '1px solid #1A1A1A', borderBottom: 'none',
              background: revealed ? '#FFE500' : '#E8E3D4',
              fontWeight: revealed ? 700 : 400,
            }}>
              {revealed ? modelB : t('battle.model_b')}
              {revealed && tallies[modelB] && (
                <span style={{ display: 'inline-block', background: '#E8E3D4', border: '1px solid #1A1A1A', borderRadius: '6px', padding: '2px 10px', fontSize: '0.8em', color: '#C41E3A', fontWeight: 600, marginLeft: '8px' }}>
                  {tallies[modelB].elo}
                </span>
              )}
              {revealed && winner === modelB && ' 👑'}
            </div>
            <button
              className="fs-btn"
              onClick={() => goFullscreen('iframe-b')}
              style={{
                position: 'absolute', top: '52px', right: '8px', zIndex: 10,
                background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px',
                padding: '4px 8px', cursor: 'pointer', fontSize: '0.8em', opacity: 0, transition: 'opacity 0.2s',
              }}
            >
              ⛶ {lang === 'zh' ? '全屏' : 'Fullscreen'}
            </button>
            <iframe
              id="iframe-b"
              src={modelB ? `/challenges/${challengeId}/results/${modelB}/index.html` : ''}
              sandbox="allow-scripts allow-same-origin"
              style={{
                width: '100%', height: '500px', border: '2px solid #1A1A1A', background: '#fff',
                ...(revealed && winner === modelB ? { borderColor: '#C41E3A', boxShadow: '0 0 0 3px #C41E3A' } : {}),
              }}
            />
            <button
              onClick={() => doVote('b')}
              disabled={voted}
              style={{
                width: '100%', marginTop: '12px', fontFamily: "'Special Elite', monospace",
                fontSize: '0.9rem', letterSpacing: '0.1em', padding: '0.85rem', textTransform: 'uppercase',
                border: '2px solid #1A1A1A', cursor: voted ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                background: voted && winner === modelB ? '#C41E3A' : '#FFE500',
                color: voted && winner === modelB ? '#fff' : '#1A1A1A',
                borderColor: voted && winner === modelB ? '#C41E3A' : '#1A1A1A',
                opacity: voted && winner !== modelB ? 0.5 : 1,
              }}
            >
              {voting && !revealed ? '⏳ ...' : voted ? (winner === modelB ? t('battle.voted_right') : t('battle.pick_right')) : t('battle.pick_right')}
            </button>
          </div>
        </div>

        {/* Results after vote */}
        {voted && (
          <div className="animate-fade-in" style={{ padding: '1.5rem 0' }}>
            {/* Vote progress bars */}
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <h3 style={{ color: '#666', fontFamily: "'Special Elite', monospace", fontSize: '0.9rem' }}>
                🏆 {lang === 'zh' ? '社区投票' : 'Community Votes'}
              </h3>
            </div>
            {[
              { model: winner, wins: winnerWins, pct: winnerPct, isWinner: true },
              { model: loser, wins: loserWins, pct: loserPct, isWinner: false },
            ].map(({ model, wins, pct, isWinner }) => (
              <div key={model} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0' }}>
                <span style={{ minWidth: '140px', textAlign: 'right', fontSize: '0.85em', fontWeight: 600, fontFamily: "'Courier Prime', monospace" }}>
                  {model}
                </span>
                <div style={{ flex: 1, background: '#E8E3D4', borderRadius: '4px', height: '24px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px', width: `${pct}%`,
                    background: isWinner ? '#C41E3A' : '#666', opacity: isWinner ? 1 : 0.6,
                    display: 'flex', alignItems: 'center', padding: '0 8px',
                    fontSize: '0.8em', fontWeight: 600, color: '#fff', transition: 'width 0.6s ease',
                    minWidth: 'fit-content',
                  }}>
                    {wins}
                  </div>
                </div>
                <span style={{ minWidth: '45px', fontSize: '0.85em', color: '#666', fontFamily: "'Courier Prime', monospace" }}>
                  {pct}%
                </span>
              </div>
            ))}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {next && (
                <Link href={`/challenges/${next.id}`} onClick={cancelCountdown} className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                  {t('battle.next_challenge')}
                </Link>
              )}
              <button onClick={() => { cancelCountdown(); pickPair(); }} style={{
                fontFamily: "'Special Elite', monospace", fontSize: '0.85rem', letterSpacing: '0.1em',
                padding: '0.75rem 1.5rem', background: 'transparent', color: '#1A1A1A',
                border: '2px solid #1A1A1A', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s',
              }}>
                {t('battle.next_pair')}
              </button>
              <Link href={`/challenges/${challengeId}/gallery`} onClick={cancelCountdown} style={{
                fontFamily: "'Special Elite', monospace", fontSize: '0.85rem', letterSpacing: '0.1em',
                padding: '0.75rem 1.5rem', background: 'transparent', color: '#1A1A1A',
                border: '2px solid #1A1A1A', textDecoration: 'none', textTransform: 'uppercase',
              }}>
                🖼️ {lang === 'zh' ? '全部作品' : 'Gallery'}
              </Link>
              <Link href="/leaderboard" onClick={cancelCountdown} style={{
                fontFamily: "'Special Elite', monospace", fontSize: '0.85rem', letterSpacing: '0.1em',
                padding: '0.75rem 1.5rem', background: 'transparent', color: '#1A1A1A',
                border: '2px solid #1A1A1A', textDecoration: 'none', textTransform: 'uppercase',
              }}>
                📊 {lang === 'zh' ? '排行榜' : 'Leaderboard'}
              </Link>
              <button onClick={() => { cancelCountdown(); share(); }} style={{
                fontFamily: "'Special Elite', monospace", fontSize: '0.85rem', letterSpacing: '0.1em',
                padding: '0.75rem 1.5rem', background: 'transparent', color: '#1A1A1A',
                border: '2px solid #1A1A1A', cursor: 'pointer', textTransform: 'uppercase',
              }}>
                📤 {lang === 'zh' ? '分享' : 'Share'}
              </button>
            </div>
            {/* Auto-next countdown */}
            {countdown > 0 && (
              <p style={{ textAlign: 'center', marginTop: '12px', fontFamily: "'Courier Prime', monospace", fontSize: '0.85rem', color: '#C41E3A' }}>
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
