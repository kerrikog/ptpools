import { handleCors } from './_cors.js'

// Adds someone to a MailerLite list segment (Clinicians or Affiliates group) — this
// is NOT the customer-facing referral tracking path. That's the separate homepage
// signup forms in index.html, which POST directly to MailerLite's own hosted form
// endpoint and carry a `fields[affiliate_code]` value set by the ref-tracking script
// near the bottom of that file.
//
// This endpoint is called from the admin panel (admin/src/pages/Affiliates.tsx and
// Clinicians.tsx) once an application is approved/activated — not at application
// time — so people aren't emailed as affiliates/clinicians until you've actually
// approved them. Allowed origins for that cross-domain call are in api/_cors.js.
//
// Group IDs: 191723154647811757 = Clinicians, 191723158045197796 = Affiliates.
export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name, group_id } = req.body

  const ALLOWED_GROUPS = ['191723154647811757', '191723158045197796']
  if (!email || !group_id || !ALLOWED_GROUPS.includes(group_id)) {
    return res.status(400).json({ error: 'Missing or invalid fields' })
  }

  const apiKey = process.env.MAILERLITE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'MailerLite API key not configured' })
  }

  const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      email,
      fields: { name: name ?? '' },
      groups: [group_id]
    })
  })

  if (!mlRes.ok) {
    const err = await mlRes.json().catch(() => ({}))
    return res.status(mlRes.status).json({ error: err.message ?? 'MailerLite error' })
  }

  return res.status(200).json({ ok: true })
}
