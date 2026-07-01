import { useEffect, useState } from 'react'
import TrafficWidget from '../components/TrafficWidget'

const ML_STATS_URL = 'https://ptpools.us/api/mailerlite-stats'
const CLICKS_URL = 'https://ptpools.us/api/affiliate-clicks'

interface ClickRow { handle: string; clicks: number }

export default function Marketing() {
  const [emailStats, setEmailStats] = useState<{ total: number; clinicians: number; affiliates: number } | null>(null)
  const [emailLoading, setEmailLoading] = useState(true)
  const [emailError, setEmailError] = useState('')
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [clickRows, setClickRows] = useState<ClickRow[]>([])
  const [clicksLoading, setClicksLoading] = useState(false)
  const [clicksError, setClicksError] = useState('')
  const [clickRange, setClickRange] = useState<'7d' | '30d'>('7d')

  useEffect(() => {
    if (!leaderboardOpen) return
    setClicksLoading(true)
    setClicksError('')
    fetch(`${CLICKS_URL}?range=${clickRange}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setClicksError(data.error); setClicksLoading(false); return }
        setClickRows(data.rows ?? [])
        setClicksLoading(false)
      })
      .catch(() => { setClicksError('Could not load click data.'); setClicksLoading(false) })
  }, [leaderboardOpen, clickRange])

  useEffect(() => {
    fetch(ML_STATS_URL)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setEmailError(data.error); setEmailLoading(false); return }
        setEmailStats(data)
        setEmailLoading(false)
      })
      .catch(() => { setEmailError('Could not load email stats.'); setEmailLoading(false) })
  }, [])

  function emailNum(n: number) {
    return emailLoading ? '—' : emailError ? '—' : n.toLocaleString()
  }

  return (
    <div>
      <h1 style={s.title}>Marketing</h1>

      {/* Email List */}
      <div style={s.sectionLabel}>Email List</div>
      <div style={s.cardsRow}>
        <div style={s.card}>
          <div style={s.cardNum}>{emailNum(emailStats?.total ?? 0)}</div>
          <div style={s.cardLabel}>Main List</div>
        </div>
        <div style={s.card}>
          <div style={s.cardNum}>{emailNum((emailStats?.clinicians ?? 0) + (emailStats?.affiliates ?? 0))}</div>
          <div style={s.cardLabel}>Partners Total</div>
        </div>
        <div style={s.card}>
          <div style={s.cardNum}>{emailNum(emailStats?.clinicians ?? 0)}</div>
          <div style={s.cardLabel}>Clinicians</div>
        </div>
        <div style={s.card}>
          <div style={s.cardNum}>{emailNum(emailStats?.affiliates ?? 0)}</div>
          <div style={s.cardLabel}>Affiliates</div>
        </div>
      </div>
      {emailError && <div style={s.errorNote}>{emailError}</div>}

      {/* Traffic */}
      <TrafficWidget />

      {/* Affiliate Leaderboard */}
      <div style={s.leaderboardWrap}>
        <button style={s.leaderboardToggle} onClick={() => setLeaderboardOpen(o => !o)}>
          <div style={s.sectionLabel}>Affiliate Link Clicks</div>
          <span style={s.chevron}>{leaderboardOpen ? '▲' : '▼'}</span>
        </button>
        {leaderboardOpen && (
          <div style={s.leaderboardBody}>
            <div style={s.leaderboardHeader}>
              <div style={s.tabs}>
                <button style={s.tab(clickRange === '7d')} onClick={() => setClickRange('7d')}>7 days</button>
                <button style={s.tab(clickRange === '30d')} onClick={() => setClickRange('30d')}>30 days</button>
              </div>
            </div>
            {clicksLoading && <div style={s.placeholder}>Loading...</div>}
            {clicksError && <div style={{ ...s.placeholder, color: '#FF6B35' }}>{clicksError}</div>}
            {!clicksLoading && !clicksError && clickRows.length === 0 && (
              <div style={s.placeholder}>No clicks yet — data will appear here once affiliate links are used.</div>
            )}
            {!clicksLoading && !clicksError && clickRows.length > 0 && (
              <div style={s.leaderboardList}>
                {clickRows.map((row, i) => {
                  const max = clickRows[0].clicks
                  const pct = max > 0 ? Math.round((row.clicks / max) * 100) : 0
                  return (
                    <div key={row.handle} style={s.leaderRow}>
                      <span style={s.leaderRank}>#{i + 1}</span>
                      <span style={s.leaderHandle}>{row.handle}</span>
                      <div style={s.barWrap}>
                        <div style={{ ...s.bar, width: `${pct}%` }} />
                      </div>
                      <span style={s.leaderCount}>{row.clicks.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, any> = {
  title: { color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 28 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginBottom: 14 },
  cardsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  cardNum: { fontSize: 28, fontWeight: 700, color: '#1F8A8C', fontFamily: 'Inter, sans-serif', marginBottom: 4 },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif' },
  errorNote: { color: '#FF6B35', fontSize: 13, fontFamily: 'Inter, sans-serif', marginTop: -24, marginBottom: 36 },
  leaderboardWrap: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  leaderboardBody: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '20px 24px',
  },
  placeholder: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    lineHeight: 1.6,
  },
  leaderboardHeader: { display: 'flex', justifyContent: 'flex-end', marginBottom: 16 },
  tabs: { display: 'flex', gap: 6 },
  tab: (active: boolean) => ({
    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
    background: active ? 'rgba(31,138,140,0.2)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(31,138,140,0.4)' : '1px solid rgba(255,255,255,0.1)',
    color: active ? '#1F8A8C' : 'rgba(255,255,255,0.4)',
  }),
  leaderboardList: { display: 'flex', flexDirection: 'column', gap: 10 },
  leaderRow: { display: 'grid', gridTemplateColumns: '28px 140px 1fr 50px', alignItems: 'center', gap: 12 },
  leaderRank: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' },
  leaderHandle: { fontSize: 13, color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, textTransform: 'uppercase' as const },
  barWrap: { background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' },
  bar: { height: '100%', background: '#1F8A8C', borderRadius: 4, transition: 'width 0.4s ease' },
  leaderCount: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', textAlign: 'right' as const },
}
