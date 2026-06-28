import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabase'

interface Affiliate {
  id: string
  name: string
  email: string
  code: string
  ks_referral_url: string
  link_type: 'redirect' | 'landing'
  display_name: string
  photo_url: string
  quote: string
  video_embed_url: string
  discount_code: string
  commission_per_backer: number
  payout_method: string
  paypal_email: string
  status: 'pending' | 'active' | 'paused' | 'inactive'
  created_at: string
}

export default function Affiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('pending')
  const [selected, setSelected] = useState<Affiliate | null>(null)
  const [ksUrl, setKsUrl] = useState('')
  const [activating, setActivating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadAffiliates() }, [])

  async function loadAffiliates() {
    const { data } = await supabaseAdmin.from('affiliates').select('*').order('created_at', { ascending: false })
    setAffiliates(data ?? [])
  }

  async function handleActivate() {
    if (!selected || !ksUrl) { setMsg('Paste their Kickstarter referral URL first.'); return }
    setActivating(true)
    setMsg('')
    await supabaseAdmin.from('affiliates').update({ status: 'active', ks_referral_url: ksUrl }).eq('id', selected.id)
    await loadAffiliates()
    setSelected(null)
    setKsUrl('')
    setActivating(false)
  }

  async function handleStatus(id: string, status: Affiliate['status']) {
    await supabaseAdmin.from('affiliates').update({ status }).eq('id', id)
    loadAffiliates()
  }

  const filtered = affiliates.filter(a => filter === 'all' ? true : a.status === filter)
  const pendingCount = affiliates.filter(a => a.status === 'pending').length

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Affiliates {pendingCount > 0 && <span style={styles.badge}>{pendingCount} pending</span>}</h1>
        <div style={styles.filters}>
          {(['pending', 'active', 'all'] as const).map(f => (
            <button key={f} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div style={styles.activateBox}>
          <h3 style={styles.activateTitle}>Activate — {selected.name}</h3>
          <p style={styles.activateSub}>Paste their Kickstarter referral URL to generate their tracking link.</p>
          <input
            style={styles.input}
            value={ksUrl}
            onChange={e => setKsUrl(e.target.value)}
            placeholder="https://www.kickstarter.com/projects/…?ref=…"
          />
          {msg && <p style={styles.error}>{msg}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button style={styles.btnPrimary} onClick={handleActivate} disabled={activating}>
              {activating ? 'Activating…' : 'Activate & Generate Link'}
            </button>
            <button style={styles.btnGhost} onClick={() => { setSelected(null); setKsUrl('') }}>Cancel</button>
          </div>
          <p style={styles.linkPreview}>Their link: <strong>ptpools.us/ref/{selected.code}</strong></p>
        </div>
      )}

      {filtered.length === 0 && <p style={styles.empty}>No {filter === 'all' ? '' : filter} affiliates yet.</p>}

      <div style={styles.list}>
        {filtered.map(a => (
          <div key={a.id} style={styles.row}>
            <div style={styles.info}>
              <div style={styles.name}>{a.name} <span style={{ ...styles.statusChip, ...statusColor(a.status) }}>{a.status}</span></div>
              <div style={styles.meta}>{a.email} · {a.link_type} · /ref/{a.code}</div>
              {a.payout_method && <div style={styles.meta}>Payout: {a.payout_method}{a.paypal_email ? ` — ${a.paypal_email}` : ''}</div>}
            </div>
            <div style={styles.actions}>
              {a.status === 'pending' && (
                <button style={styles.btnPrimary} onClick={() => { setSelected(a); setKsUrl(a.ks_referral_url ?? '') }}>Activate</button>
              )}
              {a.status === 'active' && (
                <button style={styles.btnSmall} onClick={() => handleStatus(a.id, 'paused')}>Pause</button>
              )}
              {a.status === 'paused' && (
                <button style={styles.btnSmall} onClick={() => handleStatus(a.id, 'active')}>Resume</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function statusColor(status: string): React.CSSProperties {
  if (status === 'active') return { background: 'rgba(31,138,140,0.2)', color: '#1F8A8C' }
  if (status === 'pending') return { background: 'rgba(255,107,53,0.15)', color: '#FF6B35' }
  return { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 },
  h1: { color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 },
  badge: { background: '#FF6B35', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  filters: { display: 'flex', gap: 8 },
  filterBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  filterActive: { background: 'rgba(31,138,140,0.15)', border: '1px solid rgba(31,138,140,0.4)', color: '#1F8A8C' },
  activateBox: { background: 'rgba(31,138,140,0.08)', border: '1px solid rgba(31,138,140,0.3)', borderRadius: 12, padding: 24, marginBottom: 28 },
  activateTitle: { color: '#fff', margin: '0 0 6px', fontSize: 16 },
  activateSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 },
  linkPreview: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 12 },
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(31,138,140,0.25)', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(31,138,140,0.12)', borderRadius: 10, padding: '16px 20px', gap: 16 },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 },
  meta: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  statusChip: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  actions: { display: 'flex', gap: 8, flexShrink: 0 },
  btnPrimary: { padding: '10px 18px', background: '#1F8A8C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' },
  btnGhost: { padding: '10px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' },
  btnSmall: { padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  error: { color: '#FF6B35', fontSize: 13, margin: '8px 0 0' },
  empty: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
}
