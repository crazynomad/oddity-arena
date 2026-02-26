import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challenge: string }> }
) {
  try {
    const { challenge } = await params;
    const { env } = getRequestContext();
    const db = env.DB;

    const rows = await db.prepare(
      'SELECT model, rating, votes FROM elo_ratings WHERE challenge = ? ORDER BY rating DESC'
    ).bind(challenge).all<{ model: string; rating: number; votes: number }>();

    const totalVotes = await db.prepare(
      'SELECT COUNT(*) as total FROM votes WHERE challenge = ?'
    ).bind(challenge).first<{ total: number }>();

    return NextResponse.json({
      challenge,
      totalVotes: totalVotes?.total || 0,
      ratings: rows.results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
