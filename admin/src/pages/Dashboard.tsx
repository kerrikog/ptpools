import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Phase = 'kickstarter' | 'shopify'

export default function Dashboard() {
  const [phase, setPhase] = useState<Phase>('kickstarter')
  const [affiliateCount, setAffiliateCount] = useState<{ approved: number; pending: number }>({ approved: 0, pending: 0 })
  const [clinicianCount, setClinicianCount] = useState<{ approved: number; pending: number }>({ approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [bulkConfirmed, setBulkConfirmed] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    async function load() {
      const [settingsRes, affApproved, affPending, clinApproved, clinPending] = await Promise.all([
        supabase.from('settings').select('key, value'),
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('clinician_referrals').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('clinician_referrals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      if (settingsRes.data) {
        const s = Object.fromEntries(settingsRes.data.map((r: any) => [r.key, r.value]))
        if (s.campaign_phase) setPhase(s.campaign_phase as Phase)
      }
      setAffiliateCount({ approved: affApproved.count ?? 0, pending: affPending.count ?? 0 })
      setClinicianCount({ approved: clinApproved.count ?? 0, pending: clinPending.count ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  async function confirmSwitch() {
    setSwitching(true)
    const newPhase: Phase = phase === 'kickstarter' ? 'shopify' : 'kickstarter'
    await supabase.from('settings').upsert({ key: 'campaign_phase', value: newPhase })
    setPhase(newPhase)
    setSwitching(false)
    setShowConfirm(false)
    setBulkConfirmed(false)
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  const switchingTo: Phase = phase === 'kickstarter' ? 'shopify' : 'kickstarter'

  return (
    <div>
      <h1 style={s.title}>Dashboard</h1>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statNum}>{affiliateCount.approved}</div>
          <div style={s.statLabel}>Approved Affiliates</div>
        </div>
        <div style={{ ...s.statCard, ...(affiliateCount.pending > 0 ? s.statCardAlert : {}) }}>
          <div style={{ ...s.statNum, color: affiliateCount.pending > 0 ? '#FF6B35' : '#1F8A8C' }}>{affiliateCount.pending}</div>
          <div style={s.statLabel}>Affiliates Pending</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statNum}>{clinicianCount.approved}</div>
          <div style={s.statLabel}>Approved Clinicians</div>
        </div>
        <div style={{ ...s.statCard, ...(clinicianCount.pending > 0 ? s.statCardAlert : {}) }}>
          <div style={{ ...s.statNum, color: clinicianCount.pending > 0 ? '#FF6B35' : '#1F8A8C' }}>{clinicianCount.pending}</div>
          <div style={s.statLabel}>Clinicians Pending</div>
        </div>
      </div>

      {/* Phase switch */}
      <div style={s.card}>
        <div style={s.cardTitle}>Campaign Mode</div>
        <div style={s.phaseDisplay}>
          <div style={s.phaseCurrent(phase)}>
            {phase === 'kickstarter' ? '🟠 Kickstarter Mode' : '🟢 Shopify Mode'}
          </div>
          <button style={s.switchBtn} onClick={() => setShowConfirm(true)}>
            Switch to {switchingTo === 'shopify' ? 'Shopify' : 'Kickstarter'}
          </button>
        </div>
        <div style={s.phaseDesc}>
          {phase === 'kickstarter'
            ? 'All affiliate links are currently pointing to your Kickstarter campaign.'
            : 'All affiliate links are currently pointing to Shopify discount codes.'}
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Switch to {switchingTo === 'shopify' ? 'Shopify' : 'Kickstarter'} Mode?</h2>
            <p style={s.modalBody}>
              {switchingTo === 'shopify'
                ? `This will immediately redirect every affiliate link (ptpools.us/ref/[handle]) to their individual Shopify discount code URL. Anyone clicking an affiliate link after this switch will land on Shopify — not Kickstarter.`
                : `This will immediately redirect every affiliate link back to the Kickstarter campaign. Anyone clicking an affiliate link after this switch will land on Kickstarter — not Shopify.`}
            </p>
            {switchingTo === 'shopify' && (
              <label style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={bulkConfirmed}
                  onChange={e => setBulkConfirmed(e.target.checked)}
                  style={{ marginRight: 10, width: 16, height: 16 }}
                />
                I have bulk created all affiliate discount codes in Shopify. If you haven't done this yet, cancel and ask your coder to run the bulk creation first.
              </label>
            )}
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => { setShowConfirm(false); setBulkConfirmed(false) }}>
                Cancel
              </button>
              <button
                style={s.confirmBtn(switchingTo === 'shopify' && !bulkConfirmed)}
                onClick={confirmSwitch}
                disabled={switching || (switchingTo === 'shopify' && !bulkConfirmed)}
              >
                {switching ? 'Switching...' : `Yes, Switch to ${switchingTo === 'shopify' ? 'Shopify' : 'Kickstarter'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, any> = {
  title: { color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 28 },
  loading: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', padding: 40 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 32 },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '20px 28px',
    minWidth: 140,
  },
  statCardAlert: { borderColor: 'rgba(255,107,53,0.3)' },
  statNum: { fontSize: 32, fontWeight: 700, color: '#1F8A8C', fontFamily: 'Inter, sans-serif' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'Inter, sans-serif' },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '28px 32px',
  },
  cardTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginBottom: 16 },
  phaseDisplay: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  phaseCurrent: (phase: Phase) => ({
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif',
    color: phase === 'kickstarter' ? '#FF6B35' : '#1F8A8C',
  }),
  switchBtn: {
    padding: '9px 20px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  phaseDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#0d2545',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: '36px 40px',
    maxWidth: 500,
    width: '90%',
  },
  modalTitle: { color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16 },
  modalBody: { color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.7, marginBottom: 24 },
  checkLabel: {
    display: 'flex', alignItems: 'flex-start',
    color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.6,
    marginBottom: 28, cursor: 'pointer',
  },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '10px 20px', background: 'none',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
    color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', fontSize: 14, cursor: 'pointer',
  },
  confirmBtn: (disabled: boolean) => ({
    padding: '10px 24px',
    background: disabled ? 'rgba(255,107,53,0.3)' : '#FF6B35',
    border: 'none', borderRadius: 8,
    color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
}
