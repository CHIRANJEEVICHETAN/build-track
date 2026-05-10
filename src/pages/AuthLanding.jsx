import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { HardHat } from 'lucide-react'

export default function AuthLanding() {
  const [mode, setMode] = useState('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const onSignup = async () => {
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setMessage('Signup successful. Check your email if confirmation is enabled, then log in.')
      setMode('login')
    } catch (error) {
      setMessage(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const onLogin = async () => {
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      setMessage(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-grid" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'grid', placeItems: 'center' }}>
            <HardHat size={18} color="#F59E0B" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>BuildTrack</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Secure Construction Tracking</p>
          </div>
        </div>

        {mode === 'landing' ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Track project expenses, timeline, vendors and reports securely per user account.</p>
            <button className="btn-primary" onClick={() => setMode('login')}>Login</button>
            <button className="btn-secondary" onClick={() => setMode('signup')}>Create Account</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <input className="input-field" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input-field" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            {mode === 'login'
              ? <button className="btn-primary" disabled={loading} onClick={onLogin}>{loading ? 'Logging in...' : 'Login'}</button>
              : <button className="btn-primary" disabled={loading} onClick={onSignup}>{loading ? 'Creating account...' : 'Sign Up'}</button>}
            <button className="btn-secondary" disabled={loading} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Need an account? Sign Up' : 'Have an account? Login'}
            </button>
            <button className="btn-secondary" disabled={loading} onClick={() => setMode('landing')}>Back</button>
          </div>
        )}

        {message && <p style={{ marginTop: 12, fontSize: 12, color: '#F59E0B' }}>{message}</p>}
      </div>
    </div>
  )
}

