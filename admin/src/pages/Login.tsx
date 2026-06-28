import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src="/logo.png" alt="PT Pools" style={styles.logoImg} />
        <div style={styles.subtitle}>Admin Panel</div>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#061830',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(31,138,140,0.3)',
    borderRadius: 16,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 380,
  },
  logoImg: {
    display: 'block',
    height: 100,
    width: 'auto',
    margin: '0 auto 8px',
    filter: 'drop-shadow(0 0 20px rgba(31,138,140,0.4))',
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: '#1F8A8C',
    textAlign: 'center',
    marginBottom: 36,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(31,138,140,0.3)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
  },
  btn: {
    marginTop: 8,
    padding: '14px',
    background: '#1F8A8C',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  error: { color: '#FF6B35', fontSize: 13, margin: 0 },
}
