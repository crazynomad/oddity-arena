'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChallengeCard } from '@/components/ChallengeCard';
import { CHALLENGES } from '@/lib/challenges';
import { useI18n } from '@/lib/i18n';
import Link from 'next/link';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center border-b-2 border-ink">
          <h1 className="font-stamp text-[clamp(2.5rem,6vw,4rem)] tracking-[0.1em] uppercase leading-none">
            {t('hero.title')}
          </h1>
          <p className="font-mono text-base text-ink-light tracking-[0.05em] mt-4 max-w-lg mx-auto">
            {t('hero.subtitle')}
          </p>
          <Link
            href={`/challenges/${CHALLENGES[0].id}`}
            className="inline-block mt-8 font-typewriter text-sm tracking-[0.1em] px-8 py-4 bg-brand-yellow text-ink border-2 border-ink uppercase no-underline hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#1A1A1A] transition-all"
          >
            {t('hero.start')}
          </Link>
        </section>

        {/* How it Works */}
        <section className="py-12 border-b border-dashed border-ink-gray">
          <h2 className="font-typewriter text-sm tracking-[0.2em] uppercase mb-8">
            HOW IT WORKS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'PICK', titleCn: '选题', desc: 'Choose a coding challenge', descCn: '选择一个编程挑战' },
              { num: '02', title: 'COMPARE', titleCn: '对比', desc: 'See two anonymous AI outputs', descCn: '看两个匿名 AI 的输出' },
              { num: '03', title: 'VOTE', titleCn: '投票', desc: 'Pick the one you prefer', descCn: '选出你觉得更好的' },
              { num: '04', title: 'REVEAL', titleCn: '揭晓', desc: 'See which models made them', descCn: '揭晓是哪个模型' },
            ].map(step => (
              <div key={step.num} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 border-[3px] border-ink font-stamp text-xl mb-4">
                  {step.num}
                </div>
                <h3 className="font-typewriter text-base tracking-[0.1em] uppercase mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-ink-light">{step.descCn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Challenge Grid */}
        <section className="py-12">
          <h2 className="font-typewriter text-sm tracking-[0.2em] uppercase mb-8">
            CHALLENGES
            <span className="block font-serif-cn text-2xl md:text-3xl font-black tracking-normal mt-3">
              挑战列表
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
