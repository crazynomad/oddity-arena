// POST /api/vote — Record a vote
// Body: { challenge, winner, loser, fingerprint?, turnstile? }

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { challenge, winner, loser } = body;

    if (!challenge || !winner || !loser) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    // Optional: Turnstile verification
    if (env.TURNSTILE_SECRET && body.turnstile) {
      const formData = new FormData();
      formData.append('secret', env.TURNSTILE_SECRET);
      formData.append('response', body.turnstile);
      formData.append('remoteip', request.headers.get('CF-Connecting-IP'));
      const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: formData });
      const outcome = await result.json();
      if (!outcome.success) {
        return Response.json({ error: 'Turnstile verification failed' }, { status: 403, headers: corsHeaders });
      }
    }

    // Simple fingerprint from IP + UA for basic dedup
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ua = request.headers.get('User-Agent') || 'unknown';
    const fingerprint = body.fingerprint || await digestMessage(`${ip}:${ua}`);

    // Check for duplicate vote (same fingerprint, same challenge, same pair within 1 hour)
    const existing = await env.DB.prepare(
      'SELECT id FROM votes WHERE challenge = ? AND fingerprint = ? AND created_at > datetime("now", "-1 hour") AND ((winner = ? AND loser = ?) OR (winner = ? AND loser = ?))'
    ).bind(challenge, fingerprint, winner, loser, loser, winner).first();

    if (existing) {
      return Response.json({ error: 'Already voted on this pair recently' }, { status: 429, headers: corsHeaders });
    }

    // Record vote
    await env.DB.prepare(
      'INSERT INTO votes (challenge, winner, loser, fingerprint, ip_country, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
    ).bind(challenge, winner, loser, fingerprint, request.headers.get('CF-IPCountry') || 'XX').run();

    // Update ELO ratings
    await updateElo(env.DB, challenge, winner, loser);

    // Get updated tallies
    const tallies = await getTallies(env.DB, challenge);

    return Response.json({ success: true, tallies }, { headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

async function updateElo(db, challenge, winner, loser, K = 32) {
  // Get current ratings
  const getOrCreate = async (model) => {
    let row = await db.prepare('SELECT rating FROM elo_ratings WHERE challenge = ? AND model = ?').bind(challenge, model).first();
    if (!row) {
      await db.prepare('INSERT INTO elo_ratings (challenge, model, rating, votes) VALUES (?, ?, 1500, 0)').bind(challenge, model).run();
      return 1500;
    }
    return row.rating;
  };

  const rW = await getOrCreate(winner);
  const rL = await getOrCreate(loser);

  const eW = 1 / (1 + Math.pow(10, (rL - rW) / 400));
  const eL = 1 / (1 + Math.pow(10, (rW - rL) / 400));

  const newW = Math.round(rW + K * (1 - eW));
  const newL = Math.round(rL + K * (0 - eL));

  await db.prepare('UPDATE elo_ratings SET rating = ?, votes = votes + 1 WHERE challenge = ? AND model = ?').bind(newW, challenge, winner).run();
  await db.prepare('UPDATE elo_ratings SET rating = ?, votes = votes + 1 WHERE challenge = ? AND model = ?').bind(newL, challenge, loser).run();
}

async function getTallies(db, challenge) {
  const rows = await db.prepare(
    'SELECT winner as model, COUNT(*) as wins FROM votes WHERE challenge = ? GROUP BY winner'
  ).bind(challenge).all();

  // Also get from loser side
  const losses = await db.prepare(
    'SELECT loser as model, COUNT(*) as losses FROM votes WHERE challenge = ? GROUP BY loser'
  ).bind(challenge).all();

  // Merge into { model: { wins, losses } }
  const tallies = {};
  for (const r of rows.results) {
    tallies[r.model] = tallies[r.model] || { wins: 0, losses: 0 };
    tallies[r.model].wins = r.wins;
  }
  for (const r of losses.results) {
    tallies[r.model] = tallies[r.model] || { wins: 0, losses: 0 };
    tallies[r.model].losses = r.losses;
  }
  return tallies;
}

async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
