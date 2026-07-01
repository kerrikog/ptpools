import { useEffect, useState } from 'react'

interface ChannelRow {
  channel: string
  sessions: number
}

const ANALYTICS_URL = 'https://ptpools.us/api/analytics'

export default function TrafficWidget() {
  const [data, setData] = useState<ChannelRow[]>([])
  const [totals, setTotals] = useState({ sessions: 0, pageviews: 0, newUsers: 0 })
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
        }))
        const sessions = rows.reduce((s, r) => s + r.sessions, 0)
        const pageviews = (json.rows ?? []).reduce((s: number, r: any) => s + parseInt(r.metricValues[1].value), 0)
        const newUsers = (json.rows ?? []).reduce((s: number, r: any) => s + parseInt(r.metricValues[2].value), 0)
        setData(rows)
        setTotals({ sessions, pageviews, newUsers })
        setLoading(false)
      })
      .catch(() => { setError('Could not load analytics.'); setLoading(false) })
  }, [range])

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.sectionLabel}>Traffic</div>
        <div style={s.tabs}>
          <button style={s.tab(range === '7d')} onClick={() => setRange('7d')}>7 days</button>
          <button style={s.tab(range === '30d')} onClick={() => setRange('30d')}>30 days</button>
        </div>
      </div>

      {loading && <div style={s.state}>Loading...</div>}
      {error && <div style={{ ...s.state, color: '#FF6B35' }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Metric cards */}
          <div style={s.cardsRow}>
            <div style={s.metricCard}>
              <div style={s.metricNum}>{totals.sessions.toLocaleString()}</div>
              <div style={s.metricLabel}>Sessions</div>
            </div>
            <div style={s.metricCard}>
              <div style={s.metricNum}>{totals.pageviews.toLocaleString()}</div>
              <div style={s.metricLabel}>Page Views</div>
            </div>
            <div style={s.metricCard}>
              <div style={s.metricNum}>{totals.newUsers.toLocaleString()}</div>
              <div style={s.metricLabel}>New Users</div>
            </div>
            <div style={s.metricCard}>
              <div style={s.metricNum}>{data[0]?.channel ?? '—'}</div>
              <div style={s.metricLabel}>Top Source</div>
            </div>
          </div>

          {/* Source breakdown */}
          {data.length > 0 && (
            <div style={s.sources}>
              {data.map(row => {
                const pct = totals.sessions > 0 ? Math.round((row.sessions / totals.sessions) * 100) : 0
                return (
                  <div key={row.channel} style={s.sourceRow}>
                    <span style={s.sourceName}>{row.channel}</span>
                    <div style={s.barWrap}>
                      <div style={{ ...s.bar, width: `${pct}%` }} />
                    </div>
                    <span style={s.sourcePct}>{pct}%</span>
                    <span style={s.sourceNum}>{row.sessions.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          )}

          {data.length === 0 && <div style={s.state}>No data yet — check back in 48 hours.</div>}
        </>
      )}
    </div>
  )
}

const s: Record<string, any> = {
  wrap: { marginBottom: 32 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' },
  tabs: { display: 'flex', gap: 6 },
  tab: (active: boolean) => ({
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
    background: active ? 'rgba(31,138,140,0.2)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(31,138,140,0.4)' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#1F8A8C' : 'rgba(255,255,255,0.4)',
  }),
  cardsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  metricCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  metricNum: { fontSize: 28, fontWeight: 700, color: '#1F8A8C', fontFamily: 'Inter, sans-serif', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' },
  sources: { display: 'flex', flexDirection: 'column', gap: 10 },
  sourceRow: { display: 'grid', gridTemplateColumns: '160px 1fr 40px 60px', alignItems: 'center', gap: 12 },
  sourceName: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  barWrap: { background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' },
  bar: { height: '100%', background: '#1F8A8C', borderRadius: 4, transition: 'width 0.4s ease' },
  sourcePct: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', textAlign: 'right' as const },
  sourceNum: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', textAlign: 'right' as const },
  state: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '8px 0' },
}
