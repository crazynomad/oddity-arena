// GET /api/leaderboard/:challenge — Get ELO rankings + vote tallies

export async function onRequestGet(context) {
  const { env, params } = context;
  const challenge = params.challenge;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=30',
  };

  try {
    // ELO ratings
    const elo = await env.DB.prepare(
      'SELECT model, rating, votes FROM elo_ratings WHERE challenge = ? ORDER BY rating DESC'
    ).bind(challenge).all();

    // Vote tallies (wins)
    const wins = await env.DB.prepare(
      'SELECT winner as model, COUNT(*) as wins FROM votes WHERE challenge = ? GROUP BY winner'
    ).bind(challenge).all();

    // Total votes
    const total = await env.DB.prepare(
      'SELECT COUNT(*) as total FROM votes WHERE challenge = ?'
    ).bind(challenge).first();

    return Response.json({
      challenge,
      totalVotes: total?.total || 0,
      ratings: elo.results,
      wins: Object.fromEntries((wins.results || []).map(r => [r.model, r.wins])),
    }, { headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}
