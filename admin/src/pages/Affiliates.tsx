import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabase'

interface Platform {
  type: string
  handle: string
  count: string
}

interface Affiliate {
  id: string
  name: string
  email: string
  code: string
  requested_handle: string
  niche: string
  platforms: Platform[]
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

function getPlatformUrl(type: string, handle: string): string | null {
  if (!handle) return null
  if (handle.startsWith('http')) return handle
  if (type === 'Website / Blog') return handle
  if (type === 'Podcast') return handle.startsWith('http') ? handle : null
  return null
}

function getSocialUrl(handle: string, platform?: string): string | null {
  if (!handle) return null
  if (handle.startsWith('http')) return handle
  const h = handle.replace('@', '').trim()
  if (!platform) return null
  const p = platform.toLowerCase()
  if (p.includes('instagram')) return `https://instagram.com/${h}`
  if (p.includes('tiktok')) return `https://tiktok.com/@${h}`
  if (p.includes('youtube')) return `https://youtube.com/@${h}`
  if (p.includes('facebook')) return `https://facebook.com/${h}`
  if (p.includes('x /') || p === 'x' || p.includes('twitter')) return `https://x.com/${h}`
  if (p.includes('pinterest')) return `https://pinterest.com/${h}`
  if (p.includes('linkedin')) return `https://linkedin.com/in/${h}`
  return null
}

export default function Affiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('pending')
  const [selected, setSelected] = useState<Affiliate | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [ksUrl, setKsUrl] = useState('')
  const [codeOverride, setCodeOverride] = useState('')
  const [activating, setActivating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadAffiliates() }, [])

  async function loadAffiliates() {
    const { data } = await supabaseAdmin.from('affiliates').select('*').order('created_at', { ascending: false })
    setAffiliates(data ?? [])
  }

  async function handleActivate() {
    if (!selected || !ksUrl) { setMsg('Paste their Kickstarter referral URL first.'); return }
    const finalCode = codeOverride.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || selected.requested_handle || selected.code
    setActivating(true)
    setMsg('')
    await supabaseAdmin.from('affiliates').update({ status: 'active', ks_referral_url: ksUrl, code: finalCode }).eq('id', selected.id)
    await loadAffiliates()
    setSelected(null)
    setKsUrl('')
    setCodeOverride('')
    setActivating(false)
  }

  async function handleReject(id: string) {
    if (!confirm('Reject this application?')) return
    await supabaseAdmin.from('affiliates').update({ status: 'inactive' }).eq('id', id)
    loadAffiliates()
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
          <p style={styles.activateSub}>Paste their Kickstarter referral URL, confirm their handle, and activate.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={styles.input} value={ksUrl} onChange={e => setKsUrl(e.target.value)} placeholder="https://www.kickstarter.com/projects/…?ref=…" />
            <input style={styles.input} value={codeOverride || selected.requested_handle || selected.code} onChange={e => setCodeOverride(e.target.value)} placeholder="Confirm vanity handle" />
            <p style={styles.linkPreview}>Their link: <strong>ptpools.us/ref/{codeOverride || selected.requested_handle || selected.code}</strong></p>
          </div>
          {msg && <p style={styles.error}>{msg}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button style={styles.btnPrimary} onClick={handleActivate} disabled={activating}>
              {activating ? 'Activating…' : 'Activate & Go Live'}
            </button>
            <button style={styles.btnGhost} onClick={() => { setSelected(null); setKsUrl(''); setCodeOverride('') }}>Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && <p style={styles.empty}>No {filter === 'all' ? '' : filter} affiliates yet.</p>}

      <div style={styles.list}>
        {filtered.map(a => (
          <div key={a.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.info}>
                <div style={styles.name}>
                  {a.name}
                  <span style={{ ...styles.statusChip, ...statusColor(a.status) }}>{a.status}</span>
                </div>
                <div style={styles.meta}><a href={`mailto:${a.email}`} style={styles.emailLink}>{a.email}</a></div>
                <div style={styles.meta}>Referral link: <strong style={{ color: '#fff' }}>ptpools.us/ref/{a.code}</strong></div>
                {a.payout_method && <div style={styles.meta}>Payout: {a.payout_method}{a.paypal_email ? ` — ${a.paypal_email}` : ''}</div>}
                {a.niche && <div style={styles.niche}>"{a.niche}"</div>}
              </div>
              <div style={styles.actions}>
                <button style={styles.btnSmall} onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                  {expanded === a.id ? 'Hide' : 'View'} Details
                </button>
                {a.status === 'pending' && (
                  <>
                    <button style={styles.btnPrimary} onClick={() => { setSelected(a); setKsUrl(a.ks_referral_url ?? '') }}>Activate</button>
                    <button style={{ ...styles.btnSmall, color: '#FF6B35' }} onClick={() => handleReject(a.id)}>Reject</button>
                  </>
                )}
                {a.status === 'active' && <button style={styles.btnSmall} onClick={() => handleStatus(a.id, 'paused')}>Pause</button>}
                {a.status === 'paused' && <button style={styles.btnSmall} onClick={() => handleStatus(a.id, 'active')}>Resume</button>}
              </div>
            </div>

            {expanded === a.id && (
              <div style={styles.expandedWrap}>
                <div style={styles.expandedTitle}>Platforms & Reach</div>
                {(a.platforms ?? []).length === 0 && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>No platforms listed.</p>}
                <div style={styles.platformList}>
                  {(a.platforms ?? []).map((p, i) => {
                    const url = getSocialUrl(p.handle, p.type) ?? getPlatformUrl(p.type, p.handle)
                    return (
                      <div key={i} style={styles.platformChip}>
                        <span style={styles.platformType}>{p.type}</span>
                        {url
                          ? <a href={url} target="_blank" rel="noreferrer" style={styles.platformHandle}>{p.handle}</a>
                          : <span style={styles.platformHandle}>{p.handle}</span>}
                        {p.count && <span style={styles.platformCount}>{p.count}</span>}
                      </div>
                    )
                  })}
                </div>
                {a.requested_handle && <div style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Requested handle: <strong style={{ color: '#fff', fontSize: 18 }}>{a.requested_handle}</strong></div>}
              </div>
            )}
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
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 },
  h1: { color: '#fff', fontSize: 30, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 14 },
  badge: { background: '#FF6B35', color: '#fff', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20 },
  filters: { display: 'flex', gap: 10 },
  filterBtn: { padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, sans-serif' },
  filterActive: { background: 'rgba(31,138,140,0.15)', border: '1px solid rgba(31,138,140,0.4)', color: '#1F8A8C' },
  activateBox: { background: 'rgba(31,138,140,0.08)', border: '1px solid rgba(31,138,140,0.3)', borderRadius: 14, padding: 32, marginBottom: 32 },
  activateTitle: { color: '#fff', margin: '0 0 8px', fontSize: 20 },
  activateSub: { color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 18 },
  linkPreview: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  input: { width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(31,138,140,0.25)', borderRadius: 8, color: '#fff', fontSize: 16, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(31,138,140,0.15)', borderRadius: 14, overflow: 'hidden' },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '28px 32px', gap: 24 },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  meta: { color: 'rgba(255,255,255,0.45)', fontSize: 15, marginBottom: 10, lineHeight: 1.6 },
  niche: { color: 'rgba(255,255,255,0.65)', fontSize: 15, fontStyle: 'italic', marginTop: 10, lineHeight: 1.8 },
  emailLink: { color: 'rgba(255,255,255,0.45)', textDecoration: 'none' },
  statusChip: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  payoutChip: { fontSize: 12, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', padding: '4px 12px', borderRadius: 20 },
  actions: { display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', alignItems: 'flex-start' },
  expandedWrap: { borderTop: '1px solid rgba(31,138,140,0.15)', padding: '32px 36px', background: 'rgba(0,0,0,0.2)' },
  expandedTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 20 },
  platformList: { display: 'flex', flexDirection: 'column', gap: 12 },
  platformChip: { display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px' },
  platformType: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, width: 160, flexShrink: 0 },
  platformHandle: { fontSize: 16, color: '#1F8A8C', textDecoration: 'none', flex: 1 },
  platformCount: { fontSize: 16, color: 'rgba(255,255,255,0.8)', flexShrink: 0, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', background: '#1F8A8C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, sans-serif' },
  btnGhost: { padding: '10px 18px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, sans-serif' },
  btnSmall: { padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' },
  error: { color: '#FF6B35', fontSize: 14, margin: '8px 0 0' },
  empty: { color: 'rgba(255,255,255,0.4)', fontSize: 16 },
}
