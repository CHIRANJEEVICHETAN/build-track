import { useApp } from '../context/AppContext'
import { KpiCard, formatINR, formatINRFull, StatusBadge } from '../components/ui'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts'
import {
  IndianRupee, TrendingUp, Clock, AlertTriangle, Package, Users,
  CheckCircle, Activity, Building2, Landmark, CircleDollarSign, Scale, Wallet, CreditCard
} from 'lucide-react'

const CHART_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4', '#84CC16']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A2035', border: '1px solid #1E2A40', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      {label && <p style={{ color: '#94A3B8', marginBottom: 6, fontSize: 11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#F1F5F9', marginBottom: 2 }}>
          {p.name}: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>₹{(p.value || 0).toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const {
    project, expenses, materials, vendors, laborers, timeline,
    totalSpent, totalPending, materialCost, laborCost,
    completionPct, completedPhases, budgetUsed,
    materialDebtTakenTotal, materialDebtClearedTotal, materialDebtOutstandingTotal,
    otherDebtTakenTotal, otherDebtClearedTotal, otherDebtOutstandingTotal,
  } = useApp()

  const remaining = (project.plannedBudget || 0) - totalSpent
  const bufferAmt = (project.plannedBudget || 0) * ((project.emergencyBuffer || 10) / 100)

  // Category breakdown
  const catMap = {}
  expenses.filter(e => e.status === 'Paid').forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + (parseFloat(e.total) || 0)
  })
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Monthly trend
  const monthMap = {}
  expenses.forEach(e => {
    if (!e.date) return
    const key = e.date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { month: key, spent: 0, pending: 0 }
    if (e.status === 'Paid') monthMap[key].spent += parseFloat(e.total) || 0
    else monthMap[key].pending += parseFloat(e.total) || 0
  })
  const monthData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

  // Phase spending
  const phaseMap = {}
  expenses.filter(e => e.status === 'Paid').forEach(e => {
    if (e.phase) phaseMap[e.phase] = (phaseMap[e.phase] || 0) + (parseFloat(e.total) || 0)
  })
  const phaseData = Object.entries(phaseMap).map(([name, value]) => ({ name: name.slice(0, 12), value })).sort((a, b) => b.value - a.value).slice(0, 8)

  const overBudgetVendors = vendors.filter(v => (parseFloat(v.pendingAmount) || 0) > 0)
  const delayedPhases = timeline.filter(t => t.status === 'Delayed')
  const lowStock = materials.filter(m => {
    const bal = (parseFloat(m.receivedQty) || 0) - (parseFloat(m.usedQty) || 0)
    return bal <= (parseFloat(m.orderedQty) || 0) * 0.1 && bal >= 0
  })

  const budgetHealth = budgetUsed >= 90 ? 'Critical' : budgetUsed >= 70 ? 'Warning' : 'Safe'
  const healthColor = budgetHealth === 'Critical' ? '#EF4444' : budgetHealth === 'Warning' ? '#F59E0B' : '#10B981'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#F59E0B" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{project.name || 'Construction Project'}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{project.location} · {project.floors} · {project.builtUpArea}</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginTop: 16, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Overall Construction Progress</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>{completionPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
            <span>{completedPhases} of {timeline.length} phases complete</span>
            <span>Budget Health: <span style={{ color: healthColor, fontWeight: 600 }}>{budgetHealth}</span></span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <KpiCard label="Total Budget" value={formatINR(project.plannedBudget)} sub={`Buffer: ${formatINR(bufferAmt)}`} icon={IndianRupee} color="#3B82F6" />
        <KpiCard label="Total Spent" value={formatINR(totalSpent)} sub={`${budgetUsed}% of budget used`} icon={TrendingUp} color="#F59E0B" />
        <KpiCard label="Remaining" value={formatINR(remaining)} sub="Available budget" icon={Activity} color="#10B981" />
        <KpiCard label="Pending Payments" value={formatINR(totalPending)} sub={`${expenses.filter(e => e.status === 'Pending').length} transactions`} icon={Clock} color="#EF4444" />
        <KpiCard label="Material debt taken" value={formatINR(materialDebtTakenTotal)} sub="Credit on material purchases" icon={Landmark} color="#A855F7" />
        <KpiCard label="Material debt cleared" value={formatINR(materialDebtClearedTotal)} sub="Repaid toward material credit" icon={CircleDollarSign} color="#22C55E" />
        <KpiCard label="Material debt outstanding" value={formatINR(materialDebtOutstandingTotal)} sub={materialDebtOutstandingTotal > 0 ? 'Still owed on materials' : 'No material credit balance'} icon={Scale} color={materialDebtOutstandingTotal > 0 ? '#EF4444' : '#10B981'} />
        <KpiCard label="Other debt taken" value={formatINR(otherDebtTakenTotal)} sub="Non-material loans & credit" icon={Wallet} color="#6366F1" />
        <KpiCard label="Other debt cleared" value={formatINR(otherDebtClearedTotal)} sub="Repaid on other debts" icon={CircleDollarSign} color="#22C55E" />
        <KpiCard label="Other debt outstanding" value={formatINR(otherDebtOutstandingTotal)} sub={otherDebtOutstandingTotal > 0 ? 'Tracked on Other debts page' : 'No other debt balance'} icon={CreditCard} color={otherDebtOutstandingTotal > 0 ? '#EF4444' : '#10B981'} />
        <KpiCard label="Material Cost" value={formatINR(materialCost)} sub={`${catData.length} categories`} icon={Package} color="#8B5CF6" />
        <KpiCard label="Labor Cost" value={formatINR(laborCost)} sub={`${laborers.length} workers`} icon={Users} color="#F97316" />
        <KpiCard label="Completion" value={`${completionPct}%`} sub={`${completedPhases}/${timeline.length} phases`} icon={CheckCircle} color="#10B981" />
        <KpiCard label="Alerts" value={overBudgetVendors.length + delayedPhases.length + lowStock.length + (materialDebtOutstandingTotal > 0 ? 1 : 0) + (otherDebtOutstandingTotal > 0 ? 1 : 0) + (budgetUsed >= 80 ? 1 : 0)} sub="Active issues" icon={AlertTriangle} color="#EF4444" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 16 }}>
        {/* Category Pie */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Spend by Category</h3>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-3)', fontSize: 13 }}>No expense data yet</div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Monthly Expense Trend</h3>
          {monthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="spent" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 4 }} name="Paid" />
                <Line type="monotone" dataKey="pending" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} strokeDasharray="4 2" name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-3)', fontSize: 13 }}>No expense data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Phase spending bar */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Phase-wise Spending</h3>
          {phaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={phaseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-3)', fontSize: 13 }}>No phase data yet</div>
          )}
        </div>

        {/* Alerts panel */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} color="#EF4444" />
            Active Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {overBudgetVendors.length > 0 && (
              <AlertItem color="#EF4444" title={`${overBudgetVendors.length} vendor payments due`} sub={overBudgetVendors.slice(0, 2).map(v => v.name).join(', ')} />
            )}
            {delayedPhases.length > 0 && (
              <AlertItem color="#F59E0B" title={`${delayedPhases.length} phases delayed`} sub={delayedPhases.slice(0, 2).map(p => p.phase).join(', ')} />
            )}
            {lowStock.length > 0 && (
              <AlertItem color="#8B5CF6" title={`${lowStock.length} materials low stock`} sub={lowStock.slice(0, 2).map(m => m.name).join(', ')} />
            )}
            {materialDebtOutstandingTotal > 0 && (
              <AlertItem color="#A855F7" title="Material credit outstanding" sub={`${formatINRFull(materialDebtOutstandingTotal)} owed on tracked purchases`} />
            )}
            {otherDebtOutstandingTotal > 0 && (
              <AlertItem color="#6366F1" title="Other debt outstanding" sub={`${formatINRFull(otherDebtOutstandingTotal)} — see Other debts page`} />
            )}
            {budgetUsed >= 80 && (
              <AlertItem color="#EF4444" title={`Budget ${budgetUsed}% consumed`} sub="Review upcoming expenses" />
            )}
            {overBudgetVendors.length === 0 && delayedPhases.length === 0 && lowStock.length === 0 && materialDebtOutstandingTotal <= 0 && otherDebtOutstandingTotal <= 0 && budgetUsed < 80 && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)', fontSize: 13 }}>
                <CheckCircle size={28} color="#10B981" style={{ margin: '0 auto 8px' }} />
                <p>All clear — no active alerts</p>
              </div>
            )}
          </div>

          {/* Budget Health Meter */}
          <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-3)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
              <span>Budget Utilization</span>
              <span style={{ color: healthColor, fontWeight: 700 }}>{budgetUsed}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(budgetUsed, 100)}%`, background: healthColor }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-3)' }}>
              <span>Safe (&lt;70%)</span><span>Warning (70-90%)</span><span>Critical (&gt;90%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline quick view */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Phase Progress Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {timeline.filter((t, i, arr) => arr.findIndex(x => x.phase === t.phase) === i).map((t, i) => {
            const color = { Completed: '#10B981', 'In Progress': '#3B82F6', Delayed: '#EF4444', 'Not Started': '#374151' }[t.status] || '#374151'
            return (
              <div key={t.phase} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{t.phase}</p>
                <StatusBadge status={t.status} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AlertItem({ color, title, sub }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 8, padding: '10px 12px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 2 }}>{title}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</p>}
    </div>
  )
}
