import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabase'

// Cross-domain call to the main site's serverless function (this admin app is a
// separate Vercel deployment) — see api/_cors.js for the allowed-origins list and
// api/mailerlite.js for what this actually does.
const MAILERLITE_URL = 'https://www.ptpools.us/api/mailerlite'
const MAILERLITE_GROUP_CLINICIANS = '191723154647811757'

interface Clinician {
  id: string
  name: string
  email: string
  credentials: string
  specialty: string
  practice_name: string
  paypal_email: string
  patient_focus: string
  referral_source: string
  code: string | null
  ks_referral_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

function defaultCode(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)
}

export default function Clinicians() {
  const [clinicians, setClinicians] = useState<Clinician[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Clinician | null>(null)
  const [codeOverride, setCodeOverride] = useState('')
  const [ksUrl, setKsUrl] = useState('')
  const [activating, setActivating] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadClinicians() }, [])

  async function loadClinicians() {
    const { data } = await supabaseAdmin
      .from('clinician_referrals')
      .select('*')
      .order('created_at', { ascending: false })
    setClinicians(data ?? [])
    setLoading(false)
  }

  // Approves (or, for a clinician already approved before a link existed, just
  // backfills) a real referral code — saved directly on their own
  // clinician_referrals row, not the affiliates table. `code` has to be
  // cross-checked against BOTH tables: a `unique` constraint only guards against
  // duplicates within one table, so without this check an affiliate and a
  // clinician could silently end up with the same code, making ptpools.us/ref/
  // <code> ambiguous.
  //
  // `ks_referral_url` is Kickstarter's own custom referral tag URL, created
  // manually on Kickstarter's Promotion dashboard (Kickstarter only tracks
  // pledges under a tag it recognizes — nothing automatic). ptpools.us/ref/
  // <code> just masks in front of it; api/ref.js reads this column directly.
  async function handleConfirmLink() {
    if (!selected || !codeOverride.trim()) { setMsg('Enter a referral code first.'); return }
    const finalCode = codeOverride.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    setActivating(true)
    setMsg('')

    const [{ data: clinicianClash }, { data: affiliateClash }] = await Promise.all([
      supabaseAdmin.from('clinician_referrals').select('id').eq('code', finalCode).neq('id', selected.id),
      supabaseAdmin.from('affiliates').select('id').eq('code', finalCode),
    ])
    if ((clinicianClash && clinicianClash.length > 0) || (affiliateClash && affiliateClash.length > 0)) {
      setMsg('That code is already taken — try another.')
      setActivating(false)
      return
    }

    const { error } = await supabaseAdmin
      .from('clinician_referrals')
      .update({ status: 'approved', code: finalCode, ks_referral_url: ksUrl || null })
      .eq('id', selected.id)

    if (error) {
      setMsg(error.message)
      setActivating(false)
      return
    }

    // Add to MailerLite's Clinicians group now that they're actually approved —
    // not done at application time, so pending applicants don't get emailed yet.
    fetch(MAILERLITE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: selected.email, name: selected.name, group_id: MAILERLITE_GROUP_CLINICIANS })
    }).catch(() => {})

    await loadClinicians()
    setSelected(null)
    setCodeOverride('')
    setKsUrl('')
    setActivating(false)
  }

  async function handleReject(id: string) {
    if (!confirm('Reject this clinician application?')) return
    await supabaseAdmin.from('clinician_referrals').update({ status: 'rejected' }).eq('id', id)
    loadClinicians()
  }

  const filtered = clinicians.filter(c => filter === 'all' ? true : c.status === filter)
  const pendingCount = clinicians.filter(c => c.status === 'pending').length

  if (loading) return <p style={s.empty}>Loading...</p>

  return (
    <div>
      <div style={s.pageHeader}>
        <h1 style={s.h1}>
          Clinicians
          {pendingCount > 0 && <span style={s.badge}>{pendingCount} pending</span>}
        </h1>
        <div style={s.filters}>
          {(['pending', 'approved', 'all'] as const).map(f => (
            <button
              key={f}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div style={s.activateBox}>
          <h3 style={s.activateTitle}>Confirm referral link — {selected.name}</h3>
          <p style={s.activateSub}>Paste their Kickstarter custom referral tag URL (create it on Kickstarter's Promotion dashboard first — this is what makes Kickstarter actually attribute pledges to them), confirm their vanity handle, and go live.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input style={s.input} value={ksUrl} onChange={e => setKsUrl(e.target.value)} placeholder="https://www.kickstarter.com/projects/…?ref=…" />
            <input style={s.input} value={codeOverride} onChange={e => setCodeOverride(e.target.value)} placeholder="Referral code" />
            <p style={s.linkPreview}>Their link: <strong>ptpools.us/ref/{codeOverride}</strong></p>
          </div>
          {msg && <p style={s.error}>{msg}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button style={s.btnPrimary} onClick={handleConfirmLink} disabled={activating}>
              {activating ? 'Saving…' : 'Confirm & Go Live'}
            </button>
            <button style={s.btnGhost} onClick={() => { setSelected(null); setCodeOverride(''); setKsUrl('') }}>Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 && <p style={s.empty}>No {filter === 'all' ? '' : filter} clinicians yet.</p>}

      <div style={s.list}>
        {filtered.map(c => {
          const realCode = c.code
          return (
            <div key={c.id} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.info}>
                  <div style={s.name}>
                    {c.name}
                    {c.credentials && <span style={s.cred}>{c.credentials}</span>}
                    <span style={{ ...s.statusChip, ...statusColor(c.status) }}>{c.status}</span>
                  </div>
                  <div style={s.meta}><a href={`mailto:${c.email}`} style={s.emailLink}>{c.email}</a></div>
                  {c.practice_name && <div style={s.meta}>{c.practice_name}</div>}
                  {c.specialty && <div style={s.meta}>{c.specialty}</div>}
                  {c.status === 'approved' && (
                    realCode
                      ? <div style={s.meta}>Referral link: <strong style={{ color: '#fff' }}>ptpools.us/ref/{realCode}</strong></div>
                      : <div style={s.meta}>No referral link issued yet.</div>
                  )}
                </div>
                <div style={s.actions}>
                  <button style={s.btnSmall} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                    {expanded === c.id ? 'Hide' : 'View'} Details
                  </button>
                  {c.status === 'pending' && (
                    <>
                      <button style={s.btnPrimary} onClick={() => { setSelected(c); setCodeOverride(c.code || defaultCode(c.name)); setKsUrl(c.ks_referral_url ?? ''); setMsg('') }}>Approve</button>
                      <button style={{ ...s.btnSmall, color: '#FF6B35' }} onClick={() => handleReject(c.id)}>Reject</button>
                    </>
                  )}
                  {c.status === 'approved' && !realCode && (
                    <button style={s.btnPrimary} onClick={() => { setSelected(c); setCodeOverride(c.code || defaultCode(c.name)); setKsUrl(c.ks_referral_url ?? ''); setMsg('') }}>Issue Referral Link</button>
                  )}
                  {c.status === 'approved' && (
                    <button style={{ ...s.btnSmall, color: '#FF6B35' }} onClick={() => handleReject(c.id)}>Revoke</button>
                  )}
                </div>
              </div>

              {expanded === c.id && (
                <div style={s.expanded}>
                  <div style={s.expandedGrid}>
                    {c.paypal_email && <Detail label="PayPal" value={c.paypal_email} />}
                    {c.patient_focus && <Detail label="Patient Focus" value={c.patient_focus} />}
                    {c.referral_source && <Detail label="How They Found Us" value={c.referral_source} />}
                    <Detail label="Applied" value={new Date(c.created_at).toLocaleDateString()} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.detail}>
      <div style={s.detailLabel}>{label}</div>
      <div style={s.detailValue}>{value}</div>
    </div>
  )
}

function statusColor(status: string): React.CSSProperties {
  if (status === 'approved') return { background: 'rgba(31,138,140,0.2)', color: '#1F8A8C' }
  if (status === 'pending') return { background: 'rgba(255,107,53,0.15)', color: '#FF6B35' }
  return { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
}

const s: Record<string, React.CSSProperties> = {
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
  btnGhost: { padding: '10px 18px', background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, sans-serif' },
  error: { color: '#FF6B35', fontSize: 14, margin: '8px 0 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(31,138,140,0.15)', borderRadius: 14, overflow: 'hidden' },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '28px 32px', gap: 24 },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  cred: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 400 },
  meta: { color: 'rgba(255,255,255,0.45)', fontSize: 15, marginBottom: 8, lineHeight: 1.6 },
  emailLink: { color: 'rgba(255,255,255,0.45)', textDecoration: 'none' },
  statusChip: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  actions: { display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap', alignItems: 'flex-start' },
  expanded: { borderTop: '1px solid rgba(31,138,140,0.15)', padding: '24px 32px', background: 'rgba(0,0,0,0.2)' },
  expandedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
  detail: {},
  detailLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontFamily: 'Inter, sans-serif' },
  detailValue: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 },
  btnPrimary: { padding: '10px 20px', background: '#1F8A8C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15, fontFamily: 'Inter, sans-serif' },
  btnSmall: { padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif' },
  empty: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontFamily: 'Inter, sans-serif' },
}
