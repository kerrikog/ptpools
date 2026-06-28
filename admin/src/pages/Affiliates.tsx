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
                  {a.payout_method && <span style={styles.payoutChip}>{a.payout_method}{a.paypal_email ? ` — ${a.paypal_email}` : ''}</span>}
                </div>
                <div style={styles.meta}><a href={`mailto:${a.email}`} style={styles.emailLink}>{a.email}</a> · /ref/{a.code}</div>
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
                {a.requested_handle && <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Requested handle: <strong style={{ color: '#fff' }}>{a.requested_handle}</strong></div>}
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
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 },
  h1: { color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 },
  badge: { background: '#FF6B35', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  filters: { display: 'flex', gap: 8 },
  filterBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  filterActive: { background: 'rgba(31,138,140,0.15)', border: '1px solid rgba(31,138,140,0.4)', color: '#1F8A8C' },
  activateBox: { background: 'rgba(31,138,140,0.08)', border: '1px solid rgba(31,138,140,0.3)', borderRadius: 12, padding: 24, marginBottom: 28 },
  activateTitle: { color: '#fff', margin: '0 0 6px', fontSize: 16 },
  activateSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 },
  linkPreview: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(31,138,140,0.25)', borderRadius: 8, color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(31,138,140,0.12)', borderRadius: 10, overflow: 'hidden' },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 28px', gap: 20 },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  meta: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 },
  niche: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  emailLink: { color: 'rgba(255,255,255,0.4)', textDecoration: 'none' },
  statusChip: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  payoutChip: { fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: 20 },
  actions: { display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' },
  expandedWrap: { borderTop: '1px solid rgba(31,138,140,0.12)', padding: '24px 28px', background: 'rgba(0,0,0,0.15)' },
  expandedTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  platformList: { display: 'flex', flexDirection: 'column', gap: 10 },
  platformChip: { display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 18px' },
  platformType: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, width: 140, flexShrink: 0 },
  platformHandle: { fontSize: 15, color: '#1F8A8C', textDecoration: 'none', flex: 1 },
  platformCount: { fontSize: 14, color: 'rgba(255,255,255,0.6)', flexShrink: 0, fontWeight: 600 },
  btnPrimary: { padding: '8px 16px', background: '#1F8A8C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  btnGhost: { padding: '8px 14px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  btnSmall: { padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  error: { color: '#FF6B35', fontSize: 13, margin: '8px 0 0' },
  empty: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
}
