import { useEffect, useState } from 'react'

interface ChannelRow {
  channel: string
  sessions: number
  pageviews: number
  newUsers: number
}

const ANALYTICS_URL = import.meta.env.VITE_SITE_URL
  ? `${import.meta.env.VITE_SITE_URL}/api/analytics`
  : 'https://ptpools.us/api/analytics'

export default function TrafficWidget() {
  const [data, setData] = useState<ChannelRow[]>([])
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`${ANALYTICS_URL}?range=${range}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); setLoading(false); return }
        const rows: ChannelRow[] = (json.rows ?? []).map((row: any) => ({
          channel: row.dimensionValues[0].value,
          sessions: parseInt(row.metricValues[0].value),
          pageviews: parseInt(row.metricValues[1].value),
          newUsers: parseInt(row.metricValues[2].value),
        }))
        setData(rows)
        setLoading(false)
      })
      .catch(() => { setError('Could not load analytics.'); setLoading(false) })
  }, [range])

  const totalSessions = data.reduce((s, r) => s + r.sessions, 0)
  const totalPageviews = data.reduce((s, r) => s + r.pageviews, 0)
  const totalNew = data.reduce((s, r) => s + r.newUsers, 0)

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.title}>Traffic</div>
        <div style={s.tabs}>
          <button style={s.tab(range === '7d')} onClick={() => setRange('7d')}>7 days</button>
          <button style={s.tab(range === '30d')} onClick={() => setRange('30d')}>30 days</button>
        </div>
      </div>

      {loading && <div style={s.state}>Loading...</div>}
      {error && <div style={{ ...s.state, color: '#FF6B35' }}>{error}</div>}

      {!loading && !error && (
        <>
          <div style={s.totals}>
            <div style={s.total}>
              <div style={s.totalNum}>{totalSessions.toLocaleString()}</div>
              <div style={s.totalLabel}>Sessions</div>
            </div>
            <div style={s.total}>
              <div style={s.totalNum}>{totalPageviews.toLocaleString()}</div>
              <div style={s.totalLabel}>Page Views</div>
            </div>
            <div style={s.total}>
              <div style={s.totalNum}>{totalNew.toLocaleString()}</div>
              <div style={s.totalLabel}>New Users</div>
            </div>
          </div>

          <div style={s.tableWrap}>
            <div style={s.tableHead}>
              <span>Source</span>
              <span>Sessions</span>
              <span>Views</span>
            </div>
            {data.length === 0 && <div style={s.state}>No data yet — check back after 48 hours.</div>}
            {data.map(row => (
              <div key={row.channel} style={s.tableRow}>
                <span style={s.channel}>{row.channel}</span>
                <span>{row.sessions.toLocaleString()}</span>
                <span>{row.pageviews.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const s: Record<string, any> = {
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '24px 28px', marginTop: 24 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' },
  tabs: { display: 'flex', gap: 6 },
  tab: (active: boolean) => ({
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
    background: active ? 'rgba(31,138,140,0.2)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(31,138,140,0.4)' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#1F8A8C' : 'rgba(255,255,255,0.4)',
  }),
  totals: { display: 'flex', gap: 24, marginBottom: 20 },
  total: {},
  totalNum: { fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' },
  totalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', marginTop: 2 },
  tableWrap: { display: 'flex', flexDirection: 'column', gap: 2 },
  tableHead: { display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '6px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', letterSpacing: 1 },
  tableRow: { display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '10px 10px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.03)', borderRadius: 6 },
  channel: { color: '#fff', fontWeight: 500 },
  state: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '16px 0' },
}
