// Shared "Felt nostalgic?" heart total, stored in Upstash Redis (added to the Vercel project from its Storage tab,
// which sets the KV_REST_API_* or UPSTASH_REDIS_REST_* environment variables).
// GET  /api/hearts -> { count }
// POST /api/hearts -> adds one heart, { count }
const KEY = 'nostalgia-hearts';

// the storage integration may add a custom prefix to the variable names, so find them by suffix
function env(suffix) {
  const name = Object.keys(process.env).find(k => k.endsWith(suffix) && process.env[k]);
  return name && process.env[name];
}

async function redis(cmd) {
  const url = env('KV_REST_API_URL') || env('REDIS_REST_URL');
  const token = env('KV_REST_API_TOKEN') || env('REDIS_REST_TOKEN');
  if (!url || !token) throw new Error('no Upstash REST settings');
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const count = req.method === 'POST' ? await redis(['INCR', KEY]) : +(await redis(['GET', KEY])) || 0;
    res.status(200).json({ count });
  } catch (err) {
    // names only, never values, so the setup can be checked from the browser
    const vars = Object.keys(process.env).filter(k => /KV|REDIS|UPSTASH/.test(k));
    res.status(500).json({ error: 'counter unavailable', reason: err.message, vars });
  }
};
