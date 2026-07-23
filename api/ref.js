// Public redirect endpoint for ptpools.us/ref/:handle (rewritten to this route by
// vercel.json). Looks up the code in BOTH the `affiliates` and `clinician_referrals`
// tables (they're kept separate — genuinely different applicant shapes — but a code
// can live in either one, cross-checked for collisions at save time in the admin
// panel), and 302s to wherever the current campaign phase points, tagging the
// destination with ?ref=<handle> so on-site JS (see the inline script near the
// bottom of index.html) can pick it up and attach it to MailerLite signups.
const SUPABASE_URL = 'https://zejzzxvotrqxrfnduzdc.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const GA_MEASUREMENT_ID = 'G-WDSPLBG7K4'

export default async function handler(req, res) {
  const handle = req.query.handle?.toLowerCase()

  if (!handle || !/^[a-z0-9]{1,32}$/.test(handle)) return res.status(400).send('Invalid handle')

  // Look up affiliate, clinician, and settings in parallel.
  // IMPORTANT (fixed 2026-07-23, two stacked bugs found via direct schema check):
  // 1. The `affiliates` table's real status values are 'pending' | 'active' | 'paused'
  //    | 'inactive' (set by admin/src/pages/Affiliates.tsx) — there is no 'approved'
  //    status, so this used to match nothing.
  // 2. There is no `handle` column on `affiliates` at all — confirmed directly against
  //    the live schema ("column affiliates.handle does not exist"). The real column
  //    holding this value is `code`. Both bugs together meant every referral link
  //    404'd, even for fully activated affiliates, even after fixing #1 alone.
  const [affiliateRes, clinicianRes, settingsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/affiliates?code=eq.${handle}&status=eq.active&select=code,ks_referral_url`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/clinician_referrals?code=eq.${handle}&status=eq.approved&select=code,ks_referral_url`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    }),
    fetch(`${SUPABASE_URL}/rest/v1/settings?select=key,value`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
  ])

  const affiliates = await affiliateRes.json()
  const clinicians = await clinicianRes.json()
  const settings = await settingsRes.json()

  if (!affiliates.length && !clinicians.length) return res.status(404).send('Referral link not found')

  // Whichever table matched — the vanity handle just needs to mask/forward to
  // whatever Kickstarter did for this specific person, not care which table
  // they came from.
  const match = affiliates[0] ?? clinicians[0]

  const s = Object.fromEntries(settings.map((r) => [r.key, r.value]))
  const phase = s.campaign_phase ?? 'prelaunch'
  const prelaunchUrl = s.prelaunch_url ?? 'https://ptpools.us'
  const ksCampaignUrl = s.ks_campaign_url ?? 'https://www.kickstarter.com/projects/ptpools/theratank'
  const shopifyUrl = s.shopify_url ?? 'https://ptpools.us/discount/'

  // During the kickstarter phase, each affiliate/clinician gets their OWN
  // Kickstarter-generated custom referral tag URL (Kickstarter only tracks
  // pledges under a tag it recognizes — that has to be created on Kickstarter's
  // own Promotion dashboard, then pasted into `ks_referral_url` in the admin
  // panel at activation time). ptpools.us/ref/<handle> is purely a pretty mask
  // in front of that real, Kickstarter-specific URL. Falls back to the generic
  // campaign URL + ?ref= only if that hasn't been set yet (e.g. activated
  // before their Kickstarter tag existed).
  const destination =
    phase === 'prelaunch'   ? `${prelaunchUrl}?ref=${handle}` :
    phase === 'kickstarter' ? (match.ks_referral_url || `${ksCampaignUrl}?ref=${handle}`) :
                              `${shopifyUrl}${handle.toUpperCase()}`

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
