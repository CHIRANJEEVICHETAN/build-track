import { useCallback, useEffect, useState } from 'react'
import { AppProvider } from './context/AppContext'
import { NavigationProvider } from './context/NavigationContext'
import Dashboard from './pages/Dashboard'
import ProjectOverview from './pages/ProjectOverview'
import DailyExpenses from './pages/DailyExpenses'
import MaterialTracker from './pages/MaterialTracker'
import OtherDebtTracker from './pages/OtherDebtTracker'
import LaborTracker from './pages/LaborTracker'
import VendorManagement from './pages/VendorManagement'
import BudgetPlanning from './pages/BudgetPlanning'
import TimelineTracker from './pages/TimelineTracker'
import { SiteProgress, DocumentTracker, CashFlow } from './pages/Misc'
import Reminders from './pages/Reminders'
import ConstructionWorkflows from './pages/ConstructionWorkflows'
import PaymentReconciliation from './pages/PaymentReconciliation'
import ComplianceReports from './pages/ComplianceReports'
import Reports from './pages/Reports'
import SearchAndImport from './pages/SearchAndImport'
import AuditTrail from './pages/AuditTrail'
import AuthLanding from './pages/AuthLanding'
import { hasSupabaseConfig, supabase } from './lib/supabaseClient'

import {
  LayoutDashboard, Settings, Receipt, Package, Users, Building,
  PieChart, Calendar, Camera, FileText, TrendingUp, ChevronLeft,
  ChevronRight, HardHat, Menu, X, Bell, ClipboardList, ShieldCheck, ScrollText, Search, History, Wallet
} from 'lucide-react'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'project', label: 'Project Overview', icon: Settings, component: ProjectOverview },
  { id: 'expenses', label: 'Daily Expenses', icon: Receipt, component: DailyExpenses },
  { id: 'materials', label: 'Material Tracker', icon: Package, component: MaterialTracker },
  { id: 'other-debts', label: 'Other debts', icon: Wallet, component: OtherDebtTracker },
  { id: 'labor', label: 'Labor Tracker', icon: Users, component: LaborTracker },
  { id: 'vendors', label: 'Vendor Management', icon: Building, component: VendorManagement },
  { id: 'budget', label: 'Budget Planning', icon: PieChart, component: BudgetPlanning },
  { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp, component: CashFlow },
  { id: 'timeline', label: 'Timeline Tracker', icon: Calendar, component: TimelineTracker },
  { id: 'site', label: 'Site Progress', icon: Camera, component: SiteProgress },
  { id: 'documents', label: 'Documents', icon: FileText, component: DocumentTracker },
  { id: 'reminders', label: 'Reminders', icon: Bell, component: Reminders },
  { id: 'workflows', label: 'Construction Processes', icon: ClipboardList, component: ConstructionWorkflows },
  { id: 'reconcile', label: 'Reconciliation', icon: ScrollText, component: PaymentReconciliation },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, component: ComplianceReports },
  { id: 'reports', label: 'PDF Reports', icon: FileText, component: Reports },
  { id: 'search', label: 'Search & Import', icon: Search, component: SearchAndImport },
  { id: 'audit', label: 'Audit Trail', icon: History, component: AuditTrail },
]

function Sidebar({ current, setCurrent, collapsed, setCollapsed, isMobile, mobileOpen, onCloseMobile }) {
  return (
    <aside style={{
      width: collapsed ? 60 : 224,
      background: 'var(--bg-1)',
      borderRight: '1px solid var(--border)',
      height: '100vh',
      position: 'fixed',
      left: isMobile ? (mobileOpen ? 0 : -260) : 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
      transition: 'width 0.2s ease, left 0.2s ease',
      overflowX: 'hidden',
    }}>
      {/* Logo + collapse toggle (column when narrow so chevron is not clipped by overflow) */}
      <div style={{
        minHeight: collapsed ? 76 : 60,
        display: 'flex',
        flexDirection: collapsed ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 6 : 10,
        padding: collapsed ? '10px 6px' : '0 18px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <HardHat size={17} color="#F59E0B" />
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.1 }}>BuildTrack</p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em' }}>CONSTRUCTION ERP</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            marginLeft: collapsed ? 0 : 'auto',
            padding: 6,
            borderRadius: 8,
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {PAGES.map(p => {
          const Icon = p.icon
          const active = current === p.id
          return (
            <button
              key={p.id}
              onClick={() => { setCurrent(p.id); if (isMobile) onCloseMobile?.() }}
              className={`nav-item ${active ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '9px' : '9px 14px', border: active ? undefined : '1px solid transparent' }}
              title={collapsed ? p.label : undefined}
            >
              <Icon size={16} />
              {!collapsed && <span>{p.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>
          <p>Data stored locally</p>
          <p style={{ color: 'rgba(245,158,11,0.6)' }}>BuildTrack v1.0</p>
        </div>
      )}
    </aside>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig)
  const [current, setCurrent] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 992)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !session?.user?.id) {
      setProfile(null)
      return
    }
    let mounted = true
    const loadProfile = async () => {
      const fallbackProfile = {
        full_name: session.user.user_metadata?.full_name || '',
        phone: session.user.user_metadata?.phone || '',
        company: session.user.user_metadata?.company || '',
        designation: session.user.user_metadata?.designation || '',
        email: session.user.email || '',
      }
      const { data } = await supabase
        .from('profiles')
        .select('full_name,phone,company,designation,email')
        .eq('id', session.user.id)
        .maybeSingle()
      if (!mounted) return
      if (data) setProfile(data)
      else {
        setProfile(fallbackProfile)
        await supabase.from('profiles').upsert({
          id: session.user.id,
          full_name: fallbackProfile.full_name || null,
          phone: fallbackProfile.phone || null,
          company: fallbackProfile.company || null,
          designation: fallbackProfile.designation || null,
          email: fallbackProfile.email || null,
          updated_at: new Date().toISOString(),
        })
      }
    }
    loadProfile()
    return () => { mounted = false }
  }, [session])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session || null)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null)
      setAuthReady(true)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const page = PAGES.find(p => p.id === current)
  const PageComponent = page?.component

  const goToPage = useCallback((pageId) => {
    setCurrent(pageId)
    setMobileOpen(false)
  }, [])

  const sidebarWidth = isMobile ? 0 : (collapsed ? 60 : 224)

  if (!authReady) {
    return <div className="bg-grid" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><p>Loading...</p></div>
  }

  if (hasSupabaseConfig && !session) {
    return <AuthLanding />
  }

  return (
    <AppProvider session={session}>
      <NavigationProvider goToPage={goToPage}>
      <div className="bg-grid" style={{ minHeight: '100vh' }}>
        {/* Mobile overlay */}
        {mobileOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 39 }} onClick={() => setMobileOpen(false)} />
        )}

        <Sidebar
          current={current}
          setCurrent={goToPage}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main */}
        <main style={{ marginLeft: sidebarWidth, minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
          {/* Top bar */}
          <div style={{
            height: 60,
            background: 'rgba(13,18,32,0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isMobile && (
                <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => setMobileOpen(v => !v)}>
                  {mobileOpen ? <X size={14} /> : <Menu size={14} />}
                </button>
              )}
              {PAGES.find(p => p.id === current)?.icon && (
                (() => { const Icon = PAGES.find(p => p.id === current)?.icon; return <Icon size={16} color="#F59E0B" /> })()
              )}
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{page?.label}</span>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            {session && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-2)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.16)', color: '#F59E0B', fontWeight: 700, fontSize: 12, display: 'grid', placeItems: 'center' }}>
                  {(profile?.full_name || session.user?.email || 'U').trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ lineHeight: 1.1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{profile?.full_name || 'User'}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {profile?.designation || 'Member'}{profile?.company ? ` · ${profile.company}` : ''}
                  </p>
                </div>
              </div>
            )}
            {hasSupabaseConfig && session && (
              <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => supabase.auth.signOut()}>
                Logout
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '28px 28px', maxWidth: 1400 }}>
            {PageComponent && <PageComponent />}
          </div>
        </main>
      </div>
      </NavigationProvider>
    </AppProvider>
  )
}

export default App
