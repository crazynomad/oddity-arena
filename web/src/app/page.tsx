'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChallengeCard } from '@/components/ChallengeCard';
import { CHALLENGES } from '@/lib/challenges';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function HomePage() {
  const { t, lang } = useI18n();

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '80px 0 40px', borderBottom: '2px solid #1A1A1A' }}>
          <h1 style={{
            fontFamily: "'Black Ops One', 'Special Elite', monospace",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            ODDITY ARENA
            <span style={{
              display: 'block',
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '0.35em',
              letterSpacing: '0.3em',
              color: '#4A4A4A',
              marginTop: '8px',
            }}>
              不 现 实 竞 技 场
            </span>
          </h1>
          <p style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: '1rem',
            color: '#4A4A4A',
            letterSpacing: '0.05em',
            marginTop: '16px',
          }}>
            {lang === 'zh' ? 'AI 模型进场，你来体验，你来裁决。' : 'AI models enter. Code comes out. You decide who wins.'}
          </p>
          <p style={{
            color: '#666',
            marginTop: '24px',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}>
            {lang === 'zh'
              ? <>这不是又一个聊天机器人跑分榜。在这里，AI 模型构建真正的应用 — 游戏、3D 模拟、动画 — 由<strong style={{ color: '#1A1A1A' }}>你</strong>来评判高下。</>
              : <>This isn&apos;t another chatbot benchmark. Here AI models build real apps — games, 3D sims, animations — and <strong style={{ color: '#1A1A1A' }}>you</strong> judge who&apos;s better.</>
            }
          </p>
          <Link
            href={`/challenges/${CHALLENGES[0].id}`}
            className="btn-primary"
            style={{ display: 'inline-block', marginTop: '32px' }}
          >
            {t('hero.start')}
          </Link>
        </section>

        {/* Three Tracks */}
        <section style={{ padding: '2rem 0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.25rem',
          }}>
            <Link href="#challenges" style={{
              textAlign: 'center',
              padding: '2.5rem 1.5rem',
              border: '1px solid #1A1A1A',
              background: '#F5F0E1',
              textDecoration: 'none',
              color: '#1A1A1A',
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎨</div>
              <h3 style={{ fontFamily: "'Special Elite', monospace", fontSize: '1rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                {lang === 'zh' ? '代码' : 'Code'}
              </h3>
              <p style={{ color: '#666', fontSize: '0.9em' }}>
                {lang === 'zh' ? '同一个 Prompt，完整应用。比拼代码实力。' : 'Same prompt, full apps. Pure coding power.'}
              </p>
              <div style={{ marginTop: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  padding: '0.3rem 0.75rem',
                  border: '1px solid #666',
                  color: '#666',
                  textTransform: 'uppercase',
                }}>
                  {lang === 'zh' ? `${CHALLENGES.length} 个挑战` : `${CHALLENGES.length} challenges`}
                </span>
              </div>
            </Link>

            {[
              { emoji: '🛠️', title: lang === 'zh' ? '技能' : 'Skills', desc: lang === 'zh' ? '相同工具，不同模型。谁用得更好？' : 'Same tools, different models. Who uses them better?' },
              { emoji: '🤖', title: lang === 'zh' ? '智能体' : 'Agent', desc: lang === 'zh' ? '一个目标，完全自主。AI 能搞定吗？' : 'One goal, full autonomy. Can AI handle it?' },
            ].map((track) => (
              <div key={track.title} style={{
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                border: '1px solid #1A1A1A',
                background: '#F5F0E1',
                opacity: 0.45,
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{track.emoji}</div>
                <h3 style={{ fontFamily: "'Special Elite', monospace", fontSize: '1rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {track.title}
                </h3>
                <p style={{ color: '#666', fontSize: '0.9em' }}>{track.desc}</p>
                <div style={{ marginTop: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    padding: '0.3rem 0.75rem',
                    border: '1px dashed #666',
                    color: '#666',
                    textTransform: 'uppercase',
                  }}>
                    {lang === 'zh' ? '即将推出' : 'Coming Soon'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section style={{ padding: '3rem 0', borderBottom: '1px dashed #666' }}>
          <h2 style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            HOW IT WORKS
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
            marginTop: '2rem',
          }}>
            {[
              { num: '01', title: 'PICK', desc: lang === 'zh' ? '选择一个编程挑战' : 'Choose a coding challenge' },
              { num: '02', title: 'COMPARE', desc: lang === 'zh' ? '看两个匿名 AI 的输出' : 'See two anonymous AI outputs' },
              { num: '03', title: 'VOTE', desc: lang === 'zh' ? '选出你觉得更好的' : 'Pick the one you prefer' },
              { num: '04', title: 'REVEAL', desc: lang === 'zh' ? '揭晓是哪个模型' : 'See which models made them' },
            ].map(step => (
              <div key={step.num} style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  border: '3px solid #1A1A1A',
                  fontFamily: "'Black Ops One', monospace",
                  fontSize: '1.25rem',
                  marginBottom: '1rem',
                }}>
                  {step.num}
                </div>
                <h3 style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '1.1rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#4A4A4A', lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Challenge Grid */}
        <section id="challenges" style={{ padding: '3rem 0' }}>
          <h2 style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            CHALLENGES
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}>
            {CHALLENGES.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
