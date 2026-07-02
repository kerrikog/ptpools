import { handleCors } from './_cors.js'

export default async function handler(req, res) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Missing token' })

  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return res.status(500).json({ error: 'reCAPTCHA not configured' })

  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`,
  })

  const data = await r.json()

  if (!data.success || data.score < 0.5) {
    return res.status(400).json({ error: 'Security check failed' })
  }

  return res.status(200).json({ ok: true })
}
