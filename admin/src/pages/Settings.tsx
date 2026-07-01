import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [ksUrl, setKsUrl] = useState('')
  const [shopifyUrl, setShopifyUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (data) {
        const s = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
        setKsUrl(s.ks_campaign_url ?? '')
        setShopifyUrl(s.shopify_url ?? '')
      }
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    await Promise.all([
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
      <h1 style={s.title}>Settings</h1>

      <div style={s.card}>
        <div style={s.cardTitle}>Redirect URLs</div>
        <p style={s.cardDesc}>These URLs determine where affiliate links point in each campaign mode. Update these before switching modes.</p>

        <div style={s.field}>
          <label style={s.label}>Kickstarter Campaign URL</label>
          <input
            style={s.input}
            value={ksUrl}
            onChange={e => setKsUrl(e.target.value)}
            placeholder="https://www.kickstarter.com/projects/ptpools/theratank"
          />
          <span style={s.hint}>Affiliate links in KS mode become: {ksUrl || '[url]'}?ref=[handle]</span>
        </div>

        <div style={s.field}>
          <label style={s.label}>Shopify Discount Base URL</label>
          <input
            style={s.input}
            value={shopifyUrl}
            onChange={e => setShopifyUrl(e.target.value)}
            placeholder="https://ptpools.us/discount/"
          />
          <span style={s.hint}>Affiliate links in Shopify mode become: {shopifyUrl || '[url]'}[HANDLE]</span>
        </div>

        <button style={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}

const s: Record<string, any> = {
  title: { color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 28 },
  loading: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', padding: 40 },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '28px 32px' },
  cardTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginBottom: 8 },
  cardDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 28, lineHeight: 1.6 },
  field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' },
  input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' },
  saveBtn: { padding: '10px 24px', background: '#1F8A8C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' },
}
