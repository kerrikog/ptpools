const GROUP_CLINICIANS = '191723154647811757'
const GROUP_AFFILIATES = '191723158045197796'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  const apiKey = process.env.MAILERLITE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'MailerLite not configured' })

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const [clinRes, affRes] = await Promise.all([
    fetch(`https://connect.mailerlite.com/api/groups/${GROUP_CLINICIANS}`, { headers }),
    fetch(`https://connect.mailerlite.com/api/groups/${GROUP_AFFILIATES}`, { headers }),
  ])

  const [clinData, affData] = await Promise.all([clinRes.json(), affRes.json()])

  return res.status(200).json({
    clinicians: clinData.data?.active_count ?? 0,
    affiliates: affData.data?.active_count ?? 0,
  })
}
