const SUPABASE_URL = 'https://zejzzxvotrqxrfnduzdc.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

// Scheduled by vercel.json (crons) to ping the Supabase REST API on a regular
// cadence — a Supabase free-tier project auto-pauses after a stretch of no API
// traffic, and this keeps it counted as active. Paired with a pg_cron/pg_net job
// on the Supabase side that does the same thing from the other direction.
export default async function handler(req, res) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key&limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
    res.status(200).json({ ok: response.ok, status: response.status, ts: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) })
  }
}
