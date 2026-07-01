import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Page = 'dashboard' | 'blog' | 'affiliates'

interface Props {
  children: React.ReactNode
  page: Page
  onNavigate: (page: Page) => void
}

export default function Layout({ children, page, onNavigate }: Props) {
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <img src="/logo.png" alt="PT Pools" style={{ width: 80, height: 'auto', display: 'block', margin: '0 auto 12px' }} />
          <div style={styles.brandSub}>Admin Panel</div>
        </div>
        <nav style={styles.nav}>
          <button
            style={{ ...styles.navItem, ...(page === 'dashboard' ? styles.navActive : {}) }}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>
          <button
            style={{ ...styles.navItem, ...(page === 'affiliates' ? styles.navActive : {}) }}
            onClick={() => onNavigate('affiliates')}
          >
            Affiliates
          </button>
          <button
            style={{ ...styles.navItem, ...(page === 'blog' ? styles.navActive : {}) }}
            onClick={() => onNavigate('blog')}
          >
            Blog Posts
          </button>
        </nav>
        <button style={styles.signOut} onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#071e3d' },
  sidebar: {
    width: 220,
    background: '#061830',
    borderRight: '1px solid rgba(31,138,140,0.2)',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 0',
    flexShrink: 0,
  },
  sidebarTop: { padding: '0 24px 32px' },
  brand: { color: '#fff', fontSize: 20, fontWeight: 700 },
  brandSub: { color: '#1F8A8C', fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' },
  navItem: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
  },
  navActive: { background: 'rgba(31,138,140,0.15)', color: '#1F8A8C', fontWeight: 600 },
  signOut: {
    margin: '0 12px',
    padding: '10px 12px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
  },
  main: { flex: 1, padding: '40px 48px', overflowY: 'auto' },
}
