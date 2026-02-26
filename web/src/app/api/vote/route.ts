import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(str)).then(buf =>
    Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  );
}

export async function POST(request: NextRequest) {
  try {
    const { challenge, winner, loser } = await request.json();
    if (!challenge || !winner || !loser) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Fingerprint dedup
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const ua = request.headers.get('user-agent') || 'unknown';
    const fingerprint = await sha256(`${ip}:${ua}`);
    const country = request.headers.get('cf-ipcountry') || 'XX';

    const { env } = getRequestContext();
    const db = env.DB;

    // Check duplicate
    const existing = await db.prepare(
      'SELECT id FROM votes WHERE challenge = ? AND fingerprint = ? AND winner = ? AND loser = ?'
    ).bind(challenge, fingerprint, winner, loser).first();

    if (existing) {
      return NextResponse.json({ error: 'Duplicate vote' }, { status: 429 });
    }

    // Insert vote
    await db.prepare(
      'INSERT INTO votes (challenge, winner, loser, fingerprint, ip_country, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(challenge, winner, loser, fingerprint, country, new Date().toISOString()).run();

    // ELO calculation
    const K = 32;
    const getElo = async (model: string) => {
      const row = await db.prepare(
        'SELECT rating, votes FROM elo_ratings WHERE challenge = ? AND model = ?'
      ).bind(challenge, model).first<{ rating: number; votes: number }>();
      return row || { rating: 1200, votes: 0 };
    };

    const wElo = await getElo(winner);
    const lElo = await getElo(loser);

    const expectedW = 1 / (1 + Math.pow(10, (lElo.rating - wElo.rating) / 400));
    const expectedL = 1 - expectedW;

    const newWRating = Math.round(wElo.rating + K * (1 - expectedW));
    const newLRating = Math.round(lElo.rating + K * (0 - expectedL));

    // Upsert ELO
    await db.batch([
      db.prepare(
        'INSERT INTO elo_ratings (challenge, model, rating, votes) VALUES (?, ?, ?, 1) ON CONFLICT(challenge, model) DO UPDATE SET rating = ?, votes = votes + 1'
      ).bind(challenge, winner, newWRating, newWRating),
      db.prepare(
        'INSERT INTO elo_ratings (challenge, model, rating, votes) VALUES (?, ?, ?, 1) ON CONFLICT(challenge, model) DO UPDATE SET rating = ?, votes = votes + 1'
      ).bind(challenge, loser, newLRating, newLRating),
    ]);

    // Return tallies
    const tallies: Record<string, { wins: number; elo: number }> = {};
    const rows = await db.prepare(
      'SELECT model, rating, votes FROM elo_ratings WHERE challenge = ?'
    ).bind(challenge).all<{ model: string; rating: number; votes: number }>();

    for (const r of rows.results) {
      tallies[r.model] = { wins: r.votes, elo: r.rating };
    }

    return NextResponse.json({ success: true, tallies });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
