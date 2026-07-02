import { handleCors } from './_cors.js'

const GROUP_CLINICIANS = '191723154647811757'
const GROUP_AFFILIATES = '191723158045197796'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.MAILERLITE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'MailerLite not configured' })

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const [clinRes, affRes, totalRes] = await Promise.all([
    fetch(`https://connect.mailerlite.com/api/groups/${GROUP_CLINICIANS}`, { headers }),
    fetch(`https://connect.mailerlite.com/api/groups/${GROUP_AFFILIATES}`, { headers }),
    fetch('https://connect.mailerlite.com/api/subscribers?filter[status]=active&limit=1', { headers }),
  ])

  const [clinData, affData, totalData] = await Promise.all([clinRes.json(), affRes.json(), totalRes.json()])

  return res.status(200).json({
    total: totalData.meta?.total ?? 0,
    clinicians: clinData.data?.active_count ?? 0,
    affiliates: affData.data?.active_count ?? 0,
  })
}
