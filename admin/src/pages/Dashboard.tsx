import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Phase = 'prelaunch' | 'kickstarter' | 'shopify'

const PHASE_CONFIG: Record<Phase, { label: string; color: string; desc: string }> = {
  prelaunch: {
    label: 'Pre-Launch',
    color: '#7CB9E8',
    desc: 'Affiliate links point to ptpools.us — capturing email signups and recording the referring affiliate code. This is the starting phase.',
  },
  kickstarter: {
    label: 'Kickstarter',
    color: '#FF6B35',
    desc: 'All affiliate links point to your Kickstarter campaign with the affiliate ref code in the URL.',
  },
  shopify: {
    label: 'Shopify',
    color: '#1F8A8C',
    desc: 'All affiliate links point to individual Shopify discount code URLs.',
  },
}

export default function Dashboard() {
  const [phase, setPhase] = useState<Phase>('prelaunch')
  const [affiliateCount, setAffiliateCount] = useState<{ approved: number; pending: number }>({ approved: 0, pending: 0 })
  const [clinicianCount, setClinicianCount] = useState<{ approved: number; pending: number }>({ approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [targetPhase, setTargetPhase] = useState<Phase | null>(null)
  const [bulkConfirmed, setBulkConfirmed] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    async function load() {
      const [settingsRes, affApproved, affPending, clinApproved, clinPending] = await Promise.all([
        supabase.from('settings').select('key, value'),
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'active'),
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
    if (!targetPhase) return
    setSwitching(true)
    await supabase.from('settings').upsert({ key: 'campaign_phase', value: targetPhase })
    setPhase(targetPhase)
    setSwitching(false)
    setTargetPhase(null)
    setBulkConfirmed(false)
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  function getModalBody(target: Phase): string {
    if (target === 'prelaunch') {
      return `This will immediately redirect every affiliate link (ptpools.us/ref/[handle]) back to the ptpools.us signup page with the affiliate's ref code. Use this only if you need to pause the campaign and resume pre-launch list building.`
    }
    if (target === 'kickstarter') {
      return `This will immediately redirect every affiliate link (ptpools.us/ref/[handle]) to your Kickstarter campaign with the affiliate's ref code. Anyone clicking an affiliate link after this switch will land on Kickstarter.`
    }
    return `This will immediately redirect every affiliate link (ptpools.us/ref/[handle]) to their individual Shopify discount code URL. Anyone clicking an affiliate link after this switch will land on Shopify — not Kickstarter.`
  }

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
        <div style={s.segmented}>
          {(['prelaunch', 'kickstarter', 'shopify'] as Phase[]).map((p) => {
            const cfg = PHASE_CONFIG[p]
            const isActive = phase === p
            return (
              <button
                key={p}
                style={s.segBtn(isActive, cfg.color)}
                onClick={() => { if (!isActive) { setTargetPhase(p); setBulkConfirmed(false) } }}
                disabled={isActive}
              >
                <span style={s.segBtnLabel(isActive, cfg.color)}>{cfg.label}</span>
                {isActive && <span style={s.segBtnBadge(cfg.color)}>● Active</span>}
              </button>
            )
          })}
        </div>
        <div style={s.phaseDesc}>{PHASE_CONFIG[phase].desc}</div>
      </div>

      {/* Confirmation modal */}
      {targetPhase && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Switch to {PHASE_CONFIG[targetPhase].label} Mode?</h2>
            <p style={s.modalBody}>{getModalBody(targetPhase)}</p>
            {targetPhase === 'shopify' && (
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
              <button style={s.cancelBtn} onClick={() => { setTargetPhase(null); setBulkConfirmed(false) }}>
                Cancel
              </button>
              <button
                style={s.confirmBtn(targetPhase === 'shopify' && !bulkConfirmed, PHASE_CONFIG[targetPhase].color)}
                onClick={confirmSwitch}
                disabled={switching || (targetPhase === 'shopify' && !bulkConfirmed)}
              >
                {switching ? 'Switching...' : `Yes, Switch to ${PHASE_CONFIG[targetPhase].label}`}
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
  segmented: { display: 'flex', gap: 10, marginBottom: 16 },
  segBtn: (isActive: boolean, color: string) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 5,
    padding: '16px 12px',
    background: isActive ? `${color}1A` : 'rgba(255,255,255,0.04)',
    border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10,
    cursor: isActive ? 'default' : 'pointer',
    transition: 'all 0.15s ease',
  }),
  segBtnLabel: (isActive: boolean, color: string) => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: isActive ? color : 'rgba(255,255,255,0.5)',
  }),
  segBtnBadge: (color: string) => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    color,
    letterSpacing: 0.5,
  }),
  phaseDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 },
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
  confirmBtn: (disabled: boolean, color: string) => ({
    padding: '10px 24px',
    background: disabled ? 'rgba(255,255,255,0.08)' : color,
    border: 'none', borderRadius: 8,
    color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
    fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
}
