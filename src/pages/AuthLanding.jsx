import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  HardHat, ShieldCheck, FileText, Wallet, CalendarClock, Building2,
  ClipboardCheck, TrendingUp, ChevronRight, Lock, CheckCircle2,
} from 'lucide-react'

const FEATURES = [
  { icon: Wallet, title: 'Expense Control', text: 'Track paid, pending and partial spends with clear visibility.' },
  { icon: CalendarClock, title: 'Timeline Tracking', text: 'Monitor phase progress, delays and dependency risks.' },
  { icon: Building2, title: 'Vendor & Labor', text: 'Manage dues, contracts, payouts and reconciliation records.' },
  { icon: FileText, title: 'Private Documents', text: 'Store invoices and files in secure private storage.' },
  { icon: ClipboardCheck, title: 'Compliance Ready', text: 'Generate GST summaries and audit-oriented records.' },
  { icon: TrendingUp, title: 'Beautiful PDF Reports', text: 'Share polished owner reports in one click.' },
]

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function toFriendlyAuthMessage(error) {
  const raw = String(error?.message || '').toLowerCase()
  if (raw.includes('invalid login credentials')) return 'Invalid email or password. Please try again.'
  if (raw.includes('email not confirmed')) return 'Your email is not confirmed yet. Check inbox and verify first.'
  if (raw.includes('user already registered')) return 'An account with this email already exists. Please login.'
  if (raw.includes('password')) return 'Password should be at least 6 characters.'
  return 'Something went wrong. Please try again.'
}

export default function AuthLanding() {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [designation, setDesignation] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  const emailError = useMemo(() => {
    if (!email) return ''
    return isValidEmail(email) ? '' : 'Enter a valid email address'
  }, [email])

  const passwordError = useMemo(() => {
    if (!password) return ''
    return password.length >= 6 ? '' : 'Password must be at least 6 characters'
  }, [password])

  const fullNameError = useMemo(() => {
    if (mode !== 'signup') return ''
    if (!fullName) return 'Full name is required'
    return fullName.trim().length >= 2 ? '' : 'Enter your full name'
  }, [mode, fullName])

  const canSubmit = !loading
    && Boolean(email && password)
    && !emailError
    && !passwordError
    && (mode !== 'signup' || !fullNameError)

  const onSignup = async () => {
    if (!canSubmit) return
    setLoading(true)
    setMessage('')
    setMessageType('info')
    try {
      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        company: company.trim(),
        designation: designation.trim(),
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: payload },
      })
      if (error) throw error
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError && !signInData?.session) {
        setMessage('Account created. If confirmation is enabled in Supabase, verify email and then log in.')
        setMessageType('success')
        setMode('login')
      } else {
        setMessage('Account created and login successful.')
        setMessageType('success')
      }
    } catch (error) {
      setMessage(toFriendlyAuthMessage(error))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const onLogin = async () => {
    if (!canSubmit) return
    setLoading(true)
    setMessage('')
    setMessageType('info')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMessage('Login successful.')
      setMessageType('success')
    } catch (error) {
      setMessage(toFriendlyAuthMessage(error))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const onForgotPassword = async () => {
    if (!email || emailError) {
      setMessage('Enter your account email first to reset password.')
      setMessageType('error')
      return
    }
    setLoading(true)
    setMessage('')
    setMessageType('info')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      })
      if (error) throw error
      setMessage('Password reset email sent. Check your inbox.')
      setMessageType('success')
    } catch (error) {
      setMessage(toFriendlyAuthMessage(error))
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-grid auth-landing">
      <header className="auth-topbar">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <HardHat size={19} color="#F59E0B" />
          </div>
          <div className="auth-brand-copy">
            <h1>BuildTrack</h1>
            <p>Secure Construction ERP</p>
          </div>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-hero">
          <p className="auth-pill">
            <ShieldCheck size={14} />
            Private data per account with Supabase Auth + RLS
          </p>
          <h2>Track House Construction with Confidence</h2>
          <p className="auth-hero-sub">
            Plan, monitor, and report every phase from first excavation to final handover with secure, owner-level visibility.
          </p>
          <div className="auth-hero-cta">
            <button className="btn-primary" onClick={() => setMode('signup')}>
              Get Started
              <ChevronRight size={15} />
            </button>
            <button className="btn-secondary" onClick={() => setMode('login')}>Login</button>
          </div>
          <div className="auth-features-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="auth-feature-card">
                <div className="auth-feature-icon"><Icon size={15} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="auth-security-card">
            <Lock size={16} color="#10B981" />
            <div>
              <h4>Your project data is private</h4>
              <p>Every row is scoped to your authenticated account. Other visitors cannot access or modify your records.</p>
            </div>
          </div>
        </section>

        <section className="auth-panel-wrap">
          <div className="card auth-panel">
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setMessage('') }}
                disabled={loading}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setMessage('') }}
                disabled={loading}
              >
                Sign Up
              </button>
            </div>

            <div className="auth-form">
              {mode === 'signup' && (
                <>
                  <label htmlFor="auth-full-name" className="auth-label">Full Name</label>
                  <input
                    id="auth-full-name"
                    className="input-field"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    disabled={loading}
                  />
                  {fullNameError && <p className="auth-help-error">{fullNameError}</p>}

                  <label htmlFor="auth-phone" className="auth-label">Phone</label>
                  <input
                    id="auth-phone"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={loading}
                  />

                  <label htmlFor="auth-company" className="auth-label">Company / Project Name</label>
                  <input
                    id="auth-company"
                    className="input-field"
                    placeholder="e.g. BuildTrack Homes"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    disabled={loading}
                  />

                  <label htmlFor="auth-designation" className="auth-label">Role / Designation</label>
                  <input
                    id="auth-designation"
                    className="input-field"
                    placeholder="e.g. Home Owner / Engineer"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    disabled={loading}
                  />
                </>
              )}

              <label htmlFor="auth-email" className="auth-label">Email</label>
              <input
                id="auth-email"
                className="input-field"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
              {emailError && <p className="auth-help-error">{emailError}</p>}

              <label htmlFor="auth-password" className="auth-label">Password</label>
              <input
                id="auth-password"
                className="input-field"
                placeholder="Minimum 6 characters"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                onKeyDown={e => {
                  if (e.key !== 'Enter') return
                  if (mode === 'login') onLogin()
                  else onSignup()
                }}
              />
              {passwordError && <p className="auth-help-error">{passwordError}</p>}
              <p className="auth-help-muted">
                {mode === 'signup'
                  ? 'Create your secure owner account. You can invite others later.'
                  : 'Use the account credentials you created for this project.'}
              </p>

              <button className="btn-primary auth-submit" disabled={!canSubmit} onClick={mode === 'login' ? onLogin : onSignup}>
                {loading ? (mode === 'login' ? 'Logging in...' : 'Creating account...') : (mode === 'login' ? 'Login to Dashboard' : 'Create Account')}
              </button>
              {mode === 'login' && (
                <button
                  type="button"
                  className="btn-secondary auth-submit"
                  style={{ marginTop: 0 }}
                  disabled={loading}
                  onClick={onForgotPassword}
                >
                  Forgot Password?
                </button>
              )}
            </div>

            {message && (
              <p className={`auth-message ${messageType === 'error' ? 'error' : messageType === 'success' ? 'success' : ''}`}>
                {messageType === 'success' && <CheckCircle2 size={14} />}
                {message}
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="auth-footer">
        <p>Built for homeowners, contractors, and site engineers who need clarity over cost, schedule, and execution.</p>
      </footer>
    </div>
  )
}

