const ALLOWED_ORIGINS = [
  'https://ptpools.us',
  'https://www.ptpools.us',
  'https://ptpools-admin.vercel.app',
]

export function handleCors(req, res) {
  const origin = req.headers['origin']
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}
