import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Login from './pages/Login'
import Layout from './components/Layout'
import BlogPosts from './pages/BlogPosts'
import Affiliates from './pages/Affiliates'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Clinicians from './pages/Clinicians'
import Marketing from './pages/Marketing'

type Page = 'dashboard' | 'marketing' | 'blog' | 'affiliates' | 'clinicians' | 'settings'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState<Page>('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) checkAdmin(data.session.user.id)
      else setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
      else { setIsAdmin(false); setChecking(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(userId: string) {
    const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).single()
    setIsAdmin(!!data)
    setChecking(false)
  }

  if (checking) return <div style={{ background: '#061830', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F8A8C', fontFamily: 'Inter, sans-serif' }}>Loading…</div>
  if (!session) return <Login />
  if (!isAdmin) return <div style={{ background: '#061830', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>Access denied.</div>

  return (
    <Layout page={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'marketing' && <Marketing />}
      {page === 'blog' && <BlogPosts />}
      {page === 'affiliates' && <Affiliates />}
      {page === 'clinicians' && <Clinicians />}
      {page === 'settings' && <Settings />}
    </Layout>
  )
}
