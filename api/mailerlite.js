export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
