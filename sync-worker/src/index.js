// Gousto Meal Planner — cloud sync Worker
// Stores one JSON state blob per "sync code". The code is a bearer secret:
// anyone with it can read/write that blob, so it must be long & random.
// Data is keyed by SHA-256(code) so raw codes are never used as KV keys.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function keyFor(code) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gousto:' + code));
  return 'st_' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    if (url.pathname !== '/state') return json({ error: 'not found' }, 404);

    const code = (url.searchParams.get('code') || '').trim();
    if (code.length < 8) return json({ error: 'invalid code' }, 400);
    const key = await keyFor(code);

    if (req.method === 'GET') {
      const stored = await env.KV.get(key, 'json');
      return json(stored || { version: 0, data: null });
    }

    if (req.method === 'PUT') {
      let body;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      const incomingVer = Number(body.version) || 0;
      const current = await env.KV.get(key, 'json');
      const curVer = current ? Number(current.version) || 0 : 0;

      // Client is behind — hand back the authoritative newer state instead of clobbering.
      if (current && incomingVer <= curVer) {
        return json({ ok: false, conflict: true, ...current });
      }

      const record = { version: incomingVer, data: body.data, updatedAt: Date.now() };
      await env.KV.put(key, JSON.stringify(record));
      return json({ ok: true, version: record.version, updatedAt: record.updatedAt });
    }

    return json({ error: 'method not allowed' }, 405);
  },
};
