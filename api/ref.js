const SUPABASE_URL = 'https://zejzzxvotrqxrfnduzdc.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const GA_MEASUREMENT_ID = 'G-WDSPLBG7K4'

export default async function handler(req, res) {
  const handle = req.query.handle?.toLowerCase()

  if (!handle || !/^[a-z0-9]{1,32}$/.test(handle)) return res.status(400).send('Invalid handle')

  // Look up affiliate and settings in parallel
  const [affiliateRes, settingsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/affiliates?handle=eq.${handle}&status=eq.approved&select=handle`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
  ])

  const affiliates = await affiliateRes.json()
  const settings = await settingsRes.json()

  if (!affiliates.length) return res.status(404).send('Referral link not found')

  const s = Object.fromEntries(settings.map((r) => [r.key, r.value]))
  const phase = s.campaign_phase ?? 'kickstarter'
  const ksUrl = s.ks_campaign_url ?? 'https://www.kickstarter.com/projects/ptpools/theratank'
  const shopifyUrl = s.shopify_url ?? 'https://ptpools.us/discount/'

  const destination = phase === 'kickstarter'
    ? `${ksUrl}?ref=${handle}`
    : `${shopifyUrl}${handle.toUpperCase()}`

  // Fire GA4 event — fire-and-forget so it never delays the redirect
  const secret = process.env.GA_MEASUREMENT_SECRET
  if (secret) {
    const clientId = req.headers['x-forwarded-for']?.split(',')[0].trim() ?? 'server'
    fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${secret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        events: [{
          name: 'affiliate_click',
          params: { handle, phase }
        }]
      })
    }).catch(() => {})
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.redirect(302, destination)
}
