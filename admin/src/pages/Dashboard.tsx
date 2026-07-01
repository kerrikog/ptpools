import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Phase = 'kickstarter' | 'shopify'

export default function Dashboard() {
  const [phase, setPhase] = useState<Phase>('kickstarter')
  const [ksUrl, setKsUrl] = useState('https://www.kickstarter.com/projects/ptpools/theratank')
  const [shopifyUrl, setShopifyUrl] = useState('https://ptpools.us/discount/')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [affiliateCount, setAffiliateCount] = useState<{ approved: number; pending: number }>({ approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [settingsRes, approvedRes, pendingRes] = await Promise.all([
        supabase.from('settings').select('key, value'),
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      if (settingsRes.data) {
        const s = Object.fromEntries(settingsRes.data.map((r: any) => [r.key, r.value]))
        if (s.campaign_phase) setPhase(s.campaign_phase as Phase)
        if (s.ks_campaign_url) setKsUrl(s.ks_campaign_url)
        if (s.shopify_url) setShopifyUrl(s.shopify_url)
      }
      setAffiliateCount({
        approved: approvedRes.count ?? 0,
        pending: pendingRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    await Promise.all([
      supabase.from('settings').upsert({ key: 'campaign_phase', value: phase }),
      supabase.from('settings').upsert({ key: 'ks_campaign_url', value: ksUrl }),
      supabase.from('settings').upsert({ key: 'shopify_url', value: shopifyUrl }),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  return (
    <div>
      <h1 style={s.title}>Dashboard</h1>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statNum}>{affiliateCount.approved}</div>
          <div style={s.statLabel}>Approved Affiliates</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: '#FF6B35' }}>{affiliateCount.pending}</div>
          <div style={s.statLabel}>Pending Review</div>
        </div>
      </div>

      {/* Phase switch */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <div style={s.cardTitle}>Campaign Phase</div>
            <div style={s.cardSub}>Flipping this switch updates every affiliate redirect link instantly.</div>
          </div>
          <div style={s.badge(phase)}>
            {phase === 'kickstarter' ? 'Kickstarter Mode' : 'Shopify Mode'}
          </div>
        </div>

        <div style={s.toggleRow}>
          <button
            style={s.phaseBtn(phase === 'kickstarter')}
            onClick={() => setPhase('kickstarter')}
          >
            Kickstarter
          </button>
          <button
            style={s.phaseBtn(phase === 'shopify')}
            onClick={() => setPhase('shopify')}
          >
            Shopify
          </button>
        </div>

        <div style={s.field}>
          <label style={s.label}>Kickstarter Campaign URL</label>
          <input
            style={s.input}
            value={ksUrl}
            onChange={e => setKsUrl(e.target.value)}
            placeholder="https://www.kickstarter.com/projects/ptpools/theratank"
          />
          <span style={s.hint}>Affiliate links become: {ksUrl}?ref=[handle]</span>
        </div>

        <div style={s.field}>
          <label style={s.label}>Shopify Discount Base URL</label>
          <input
            style={s.input}
            value={shopifyUrl}
            onChange={e => setShopifyUrl(e.target.value)}
            placeholder="https://ptpools.us/discount/"
          />
          <span style={s.hint}>Affiliate links become: {shopifyUrl}[HANDLE]</span>
        </div>

        <button style={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
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
  statNum: { fontSize: 32, fontWeight: 700, color: '#1F8A8C', fontFamily: 'Inter, sans-serif' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'Inter, sans-serif', letterSpacing: 0.5 },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '28px 32px',
  },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif', marginBottom: 4 },
  cardSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Inter, sans-serif' },
  badge: (phase: Phase) => ({
    background: phase === 'kickstarter' ? 'rgba(255,107,53,0.15)' : 'rgba(31,138,140,0.15)',
    color: phase === 'kickstarter' ? '#FF6B35' : '#1F8A8C',
    border: `1px solid ${phase === 'kickstarter' ? 'rgba(255,107,53,0.3)' : 'rgba(31,138,140,0.3)'}`,
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap' as const,
  }),
  toggleRow: { display: 'flex', gap: 10, marginBottom: 24 },
  phaseBtn: (active: boolean) => ({
    padding: '10px 24px',
    borderRadius: 8,
    border: active ? '1px solid #1F8A8C' : '1px solid rgba(255,255,255,0.15)',
    background: active ? 'rgba(31,138,140,0.2)' : 'rgba(255,255,255,0.05)',
    color: active ? '#1F8A8C' : 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' },
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
  },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' },
  saveBtn: {
    marginTop: 8,
    padding: '11px 28px',
    background: '#1F8A8C',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
  },
}
