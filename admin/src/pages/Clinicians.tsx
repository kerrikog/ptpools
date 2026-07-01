import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../lib/supabase'

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
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function Clinicians() {
  const [clinicians, setClinicians] = useState<Clinician[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadClinicians() }, [])

  async function loadClinicians() {
    const { data } = await supabaseAdmin
      .from('clinician_referrals')
      .select('*')
      .order('created_at', { ascending: false })
    setClinicians(data ?? [])
    setLoading(false)
  }

  async function handleApprove(id: string) {
    await supabaseAdmin.from('clinician_referrals').update({ status: 'approved' }).eq('id', id)
    loadClinicians()
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

      {filtered.length === 0 && <p style={s.empty}>No {filter === 'all' ? '' : filter} clinicians yet.</p>}

      <div style={s.list}>
        {filtered.map(c => {
          const refCode = c.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)
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
                    <div style={s.meta}>Referral link: <strong style={{ color: '#fff' }}>ptpools.us/ref/{refCode}</strong></div>
                  )}
                </div>
                <div style={s.actions}>
                  <button style={s.btnSmall} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                    {expanded === c.id ? 'Hide' : 'View'} Details
                  </button>
                  {c.status === 'pending' && (
                    <>
                      <button style={s.btnPrimary} onClick={() => handleApprove(c.id)}>Approve</button>
                      <button style={{ ...s.btnSmall, color: '#FF6B35' }} onClick={() => handleReject(c.id)}>Reject</button>
                    </>
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
