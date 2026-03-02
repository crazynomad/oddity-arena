'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { CHALLENGES } from '@/lib/challenges';

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
}

type DeepDiveData = Record<string, Record<string, DeepDiveEntry>>;

function formatKB(bytes: number): string {
  return (bytes / 1024).toFixed(1);
}

function formatDate(ts: string, lang: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StatsPage() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<DeepDiveData>({});
  const [loading, setLoading] = useState(true);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const results: DeepDiveData = {};
      await Promise.all(
        CHALLENGES.map(async (c) => {
          try {
            const res = await fetch(`/challenges/${c.id}/deep-dive.json`);
            if (res.ok) {
              results[c.id] = await res.json();
            }
          } catch {
            // skip failed fetches
          }
        })
      );
      setData(results);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Collect all unique models across all challenges
  const allModels = Array.from(
    new Set(
      Object.values(data).flatMap((challenge) =>
        Object.keys(challenge)
      )
    )
  ).sort();

  // Per-model aggregates
  const modelAggregates = allModels.map((model) => {
    let totalSize = 0;
    let count = 0;
    let totalRounds = 0;
    const entries: DeepDiveEntry[] = [];
    for (const challengeId of Object.keys(data)) {
      const entry = data[challengeId]?.[model];
      if (entry) {
        totalSize += entry.file_size_bytes;
        totalRounds += entry.rounds;
        count++;
        entries.push(entry);
      }
    }
    return {
      model,
      totalSize,
      avgSize: count > 0 ? totalSize / count : 0,
      count,
      totalRounds,
      avgRounds: count > 0 ? totalRounds / count : 0,
      entries,
    };
  }).sort((a, b) => b.totalSize - a.totalSize);

  // Max file size for bar chart scaling
  const maxFileSize = Math.max(
    ...Object.values(data).flatMap((challenge) =>
      Object.values(challenge).map((e) => e.file_size_bytes)
    ),
    1
  );

  const challengeIds = CHALLENGES.map((c) => c.id).filter((id) => data[id]);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Header */}
        <div className="text-center py-10 border-b-2 border-ink">
          <h1 className="font-stamp text-2xl md:text-3xl tracking-[0.1em] uppercase">
            {t('stats.title')}
          </h1>
          <p className="font-mono text-sm text-ink-light mt-2">
            {t('stats.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 font-mono text-ink-gray">Loading...</div>
        ) : (
          <>
            {/* Model Aggregates */}
            <section style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
              <h2 className="font-typewriter" style={{
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderBottom: '1px dashed #666',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
              }}>
                {t('stats.model_overview')}
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1A1A1A' }}>
                      <th className="font-typewriter" style={thStyle}>{t('stats.model')}</th>
                      <th className="font-typewriter" style={{ ...thStyle, textAlign: 'right' }}>{t('stats.challenges_completed')}</th>
                      <th className="font-typewriter" style={{ ...thStyle, textAlign: 'right' }}>{t('stats.total_size')}</th>
                      <th className="font-typewriter" style={{ ...thStyle, textAlign: 'right' }}>{t('stats.avg_size')}</th>
                      <th className="font-typewriter" style={{ ...thStyle, textAlign: 'right' }}>{t('stats.avg_rounds')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelAggregates.map((m, i) => (
                      <tr
                        key={m.model}
                        onClick={() => setExpandedModel(expandedModel === m.model ? null : m.model)}
                        style={{
                          borderBottom: '1px dashed #666',
                          cursor: 'pointer',
                          background: expandedModel === m.model ? 'rgba(255, 229, 0, 0.1)' : i === 0 ? 'rgba(255, 229, 0, 0.05)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td className="font-typewriter" style={{ ...tdStyle, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                          {i === 0 && '👑 '}{m.model}
                        </td>
                        <td className="font-mono" style={{ ...tdStyle, textAlign: 'right', fontSize: '0.8rem' }}>
                          {m.count} / {challengeIds.length}
                        </td>
                        <td className="font-mono" style={{ ...tdStyle, textAlign: 'right', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {formatKB(m.totalSize)} KB
                        </td>
                        <td className="font-mono" style={{ ...tdStyle, textAlign: 'right', fontSize: '0.8rem' }}>
                          {formatKB(m.avgSize)} KB
                        </td>
                        <td className="font-mono" style={{ ...tdStyle, textAlign: 'right', fontSize: '0.8rem' }}>
                          {m.avgRounds.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Expanded detail */}
              {expandedModel && (
                <div style={{
                  marginTop: '1rem',
                  border: '2px solid #1A1A1A',
                  background: '#E8E3D4',
                  padding: '1rem',
                }}>
                  <h3 className="font-typewriter" style={{
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                  }}>
                    {expandedModel} — {t('stats.details')}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '0.75rem',
                  }}>
                    {modelAggregates
                      .find((m) => m.model === expandedModel)
                      ?.entries.map((entry) => {
                        const challenge = CHALLENGES.find((c) => c.id === entry.challenge);
                        return (
                          <div key={entry.challenge} style={{
                            border: '1px solid #1A1A1A',
                            background: '#F5F0E1',
                            padding: '0.75rem',
                          }}>
                            <div className="font-typewriter" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                              {lang === 'zh' ? challenge?.titleCn : challenge?.title}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                              <span className="font-mono" style={metaLabelStyle}>{t('stats.file_size')}</span>
                              <span className="font-mono" style={metaValueStyle}>{formatKB(entry.file_size_bytes)} KB</span>
                              <span className="font-mono" style={metaLabelStyle}>{t('stats.rounds')}</span>
                              <span className="font-mono" style={metaValueStyle}>{entry.rounds}</span>
                              <span className="font-mono" style={metaLabelStyle}>{t('stats.driver')}</span>
                              <span className="font-mono" style={metaValueStyle}>{entry.driver}</span>
                              <span className="font-mono" style={metaLabelStyle}>{t('stats.tools')}</span>
                              <span className="font-mono" style={metaValueStyle}>{entry.tools_used.join(', ')}</span>
                              <span className="font-mono" style={metaLabelStyle}>{t('stats.time')}</span>
                              <span className="font-mono" style={metaValueStyle}>{formatDate(entry.timestamp, lang)}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </section>

            {/* Model × Challenge Grid */}
            <section style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
              <h2 className="font-typewriter" style={{
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderBottom: '1px dashed #666',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
              }}>
                {t('stats.grid_title')}
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1A1A1A' }}>
                      <th className="font-typewriter" style={thStyle}>{t('stats.model')}</th>
                      {challengeIds.map((id) => {
                        const c = CHALLENGES.find((ch) => ch.id === id);
                        return (
                          <th key={id} className="font-typewriter" style={{ ...thStyle, textAlign: 'center', fontSize: '0.6rem' }}>
                            {lang === 'zh' ? c?.titleCn : c?.title}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {allModels.map((model) => (
                      <tr key={model} style={{ borderBottom: '1px dashed #666' }}>
                        <td className="font-typewriter" style={{ ...tdStyle, fontSize: '0.7rem', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {model}
                        </td>
                        {challengeIds.map((id) => {
                          const entry = data[id]?.[model];
                          return (
                            <td key={id} className="font-mono" style={{
                              ...tdStyle,
                              textAlign: 'center',
                              fontSize: '0.7rem',
                              color: entry ? '#1A1A1A' : '#999',
                            }}>
                              {entry ? `${formatKB(entry.file_size_bytes)}` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="font-mono" style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.5rem', textAlign: 'right' }}>
                {t('stats.unit_kb')}
              </p>
            </section>

            {/* Per-Challenge Bar Charts */}
            <section style={{ paddingTop: '1rem', paddingBottom: '2rem' }}>
              <h2 className="font-typewriter" style={{
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderBottom: '1px dashed #666',
                paddingBottom: '0.5rem',
                marginBottom: '1.5rem',
              }}>
                {t('stats.chart_title')}
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '1.5rem',
              }}>
                {challengeIds.map((id) => {
                  const challenge = CHALLENGES.find((c) => c.id === id);
                  const entries = Object.values(data[id] || {}).sort(
                    (a, b) => b.file_size_bytes - a.file_size_bytes
                  );
                  const localMax = Math.max(...entries.map((e) => e.file_size_bytes), 1);

                  return (
                    <div key={id} style={{
                      border: '2px solid #1A1A1A',
                      background: '#F5F0E1',
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '2px solid #1A1A1A',
                        background: '#E8E3D4',
                      }}>
                        <h3 className="font-typewriter" style={{
                          fontSize: '0.8rem',
                          letterSpacing: '0.08em',
                        }}>
                          {lang === 'zh' ? challenge?.titleCn : challenge?.title}
                        </h3>
                      </div>
                      <div style={{ padding: '0.75rem 1rem' }}>
                        {entries.map((entry) => (
                          <div key={entry.model} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.4rem',
                          }}>
                            <span className="font-mono" style={{
                              fontSize: '0.6rem',
                              width: '100px',
                              flexShrink: 0,
                              textAlign: 'right',
                              color: '#4A4A4A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {entry.model}
                            </span>
                            <div style={{
                              flex: 1,
                              height: '14px',
                              background: '#E8E3D4',
                              border: '1px solid #1A1A1A',
                              position: 'relative',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${(entry.file_size_bytes / localMax) * 100}%`,
                                background: entry.file_size_bytes === localMax ? '#FFE500' : '#1A1A1A',
                                transition: 'width 0.6s ease-out',
                              }} />
                            </div>
                            <span className="font-mono" style={{
                              fontSize: '0.6rem',
                              width: '45px',
                              flexShrink: 0,
                              color: '#666',
                            }}>
                              {formatKB(entry.file_size_bytes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

// Shared inline styles
const thStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: '0.75rem 0.5rem',
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.5rem',
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#666',
};

const metaValueStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#1A1A1A',
  textAlign: 'right',
};
