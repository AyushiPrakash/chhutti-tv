// Shared "Felt nostalgic?" heart total, stored in Upstash Redis (added to the Vercel project from its Storage tab,
// which sets the KV_REST_API_* or UPSTASH_REDIS_REST_* environment variables).
// GET  /api/hearts -> { count }
// POST /api/hearts -> adds one heart, { count }
const KEY = 'nostalgia-hearts';

async function redis(cmd) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
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
    res.status(500).json({ error: 'counter unavailable' });
  }
};
