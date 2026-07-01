import { useEffect, useState } from 'react'
import TrafficWidget from '../components/TrafficWidget'

const ML_STATS_URL = 'https://ptpools.us/api/mailerlite-stats'

export default function Marketing() {
  const [emailStats, setEmailStats] = useState<{ clinicians: number; affiliates: number } | null>(null)
  const [emailLoading, setEmailLoading] = useState(true)
  const [emailError, setEmailError] = useState('')
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

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

  const total = emailStats ? emailStats.clinicians + emailStats.affiliates : 0

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
          <div style={s.cardNum}>{emailNum(total)}</div>
          <div style={s.cardLabel}>Total Subscribers</div>
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
            <div style={s.placeholder}>
              Affiliate click tracking isn't set up yet. Once the GA4 Measurement Protocol secret is added as a Vercel env var, clicks on every /ref/ link will be tracked and shown here as a leaderboard.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, any> = {
  title: { color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 28 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginBottom: 14 },
  cardsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 },
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
}
