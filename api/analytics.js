import { GoogleAuth } from 'google-auth-library'

const PROPERTY_ID = '543849436'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const serviceAccount = JSON.parse(process.env.GA_SERVICE_ACCOUNT)

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })

  const client = await auth.getClient()
  const token = await client.getAccessToken()

  const range = req.query.range === '30d' ? 30 : 7

  const body = {
    dateRanges: [{ startDate: `${range}daysAgo`, endDate: 'today' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'newUsers' },
    ],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 8,
  }

  const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!gaRes.ok) {
    const err = await gaRes.json().catch(() => ({}))
    return res.status(gaRes.status).json({ error: err.error?.message ?? 'GA4 error' })
  }

  const data = await gaRes.json()
  return res.status(200).json(data)
}
