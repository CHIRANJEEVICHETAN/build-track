import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { computeMaterialDebtSnapshot } from '../utils/materialDebt'
import { computeOtherDebtSnapshot } from '../utils/otherDebt'
import { formatINR, formatINRFull, KpiCard, SectionHeader } from '../components/ui'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar, ComposedChart,
  Treemap, ResponsiveContainer,
} from 'recharts'
import {
  IndianRupee, TrendingUp, TrendingDown, Clock, Package, Users, Briefcase,
  CheckCircle, Activity, BarChart3, PieChart as PieIcon, Wallet, CreditCard,
  Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight, Gauge, Layers,
  DollarSign, Building2, Scale, CircleDollarSign, Receipt, UserCheck,
  Truck, Landmark, Timer, Target,
} from 'lucide-react'

const CHART_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4', '#84CC16']

const TABS = [
  { key: 'financial', label: 'Financial Overview', icon: IndianRupee },
  { key: 'expense', label: 'Expense Analytics', icon: Receipt },
  { key: 'material', label: 'Material & Inventory', icon: Package },
  { key: 'labor', label: 'Labor Analytics', icon: Users },
  { key: 'vendor', label: 'Vendor Analytics', icon: Truck },
  { key: 'debt', label: 'Debt Analytics', icon: Landmark },
  { key: 'timeline', label: 'Timeline & Progress', icon: Calendar },
  { key: 'cashflow', label: 'Cash Flow & Forecast', icon: Activity },
]

/* ── shared tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A2035', border: '1px solid #1E2A40', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      {label && <p style={{ color: '#94A3B8', marginBottom: 6, fontSize: 11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#F1F5F9', marginBottom: 2 }}>
          {p.name}: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
            {typeof p.value === 'number' && p.value >= 100
              ? `₹${p.value.toLocaleString('en-IN')}`
              : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

const PercentTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A2035', border: '1px solid #1E2A40', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      {label && <p style={{ color: '#94A3B8', marginBottom: 6, fontSize: 11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#F1F5F9', marginBottom: 2 }}>
          {p.name}: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{p.value}%</span>
        </p>
      ))}
    </div>
  )
}

/* ── chart card wrapper ── */
const ChartCard = ({ title, children, full, minH = 300 }) => (
  <div className="card" style={{ padding: 20, gridColumn: full ? '1 / -1' : undefined, minHeight: minH }}>
    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>{title}</h3>
    {children}
  </div>
)

const EmptyChart = ({ message = 'No data available yet' }) => (
  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: 13 }}>
    <BarChart3 size={32} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
    <p>{message}</p>
  </div>
)

const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }
const kpiRow = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }

/* ===================================================================
   MAIN COMPONENT
   =================================================================== */
export default function Analytics() {
  const ctx = useApp()
  const {
    project, expenses, materials, otherDebts, laborers, vendors, timeline,
    totalSpent, totalPending, materialCost, laborCost,
    completionPct, completedPhases, budgetUsed,
    materialDebtTakenTotal, materialDebtClearedTotal, materialDebtOutstandingTotal,
    otherDebtTakenTotal, otherDebtClearedTotal, otherDebtOutstandingTotal,
    cashFlow, siteProgress, phases,
  } = ctx

  const [activeTab, setActiveTab] = useState('financial')

  /* ────────────────────────────────────────────
     SHARED COMPUTED VALUES
     ──────────────────────────────────────────── */
  const budget = parseFloat(project.plannedBudget) || 0
  const bufferPct = parseFloat(project.emergencyBuffer) || 10
  const bufferAmt = budget * (bufferPct / 100)
  const remaining = budget - totalSpent

  /* monthly expense aggregation */
  const monthlyData = useMemo(() => {
    const map = {}
    expenses.forEach(e => {
      if (!e.date) return
      const key = e.date.slice(0, 7)
      if (!map[key]) map[key] = { month: key, spent: 0, pending: 0 }
      if (e.status === 'Paid') map[key].spent += parseFloat(e.total) || 0
      else map[key].pending += parseFloat(e.total) || 0
    })
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [expenses])

  const burnRate = useMemo(() => {
    if (!monthlyData.length) return 0
    const totalMonthlySpent = monthlyData.reduce((s, m) => s + m.spent, 0)
    return totalMonthlySpent / monthlyData.length
  }, [monthlyData])

  /* ════════════════════════════════════════════
     TAB 1: FINANCIAL OVERVIEW
     ════════════════════════════════════════════ */
  const financialTab = useMemo(() => {
    const donutData = [
      { name: 'Spent', value: totalSpent },
      { name: 'Remaining', value: Math.max(0, remaining - bufferAmt) },
      { name: 'Buffer', value: bufferAmt },
    ].filter(d => d.value > 0)

    // cumulative spending
    let cumulative = 0
    const cumulativeData = monthlyData.map(m => {
      cumulative += m.spent
      return { month: m.month, spent: m.spent, cumulative }
    })

    // spending velocity (month-over-month change)
    const velocityData = monthlyData.map((m, i) => {
      const prev = i > 0 ? monthlyData[i - 1].spent : 0
      const change = m.spent - prev
      return { month: m.month, change, positive: change >= 0 }
    })

    // budget health radial
    const healthData = [
      { name: 'Budget Used', value: Math.min(budgetUsed, 100), fill: budgetUsed >= 90 ? '#EF4444' : budgetUsed >= 70 ? '#F59E0B' : '#10B981' },
    ]

    return { donutData, cumulativeData, velocityData, healthData }
  }, [totalSpent, remaining, bufferAmt, monthlyData, budgetUsed])

  /* ════════════════════════════════════════════
     TAB 2: EXPENSE ANALYTICS
     ════════════════════════════════════════════ */
  const [expensePeriod, setExpensePeriod] = useState('monthly')

  const expenseTab = useMemo(() => {
    const paid = expenses.filter(e => e.status === 'Paid')
    const totalExp = expenses.reduce((s, e) => s + (parseFloat(e.total) || 0), 0)
    const avgExp = expenses.length ? totalExp / expenses.length : 0
    const highestExp = expenses.length ? Math.max(...expenses.map(e => parseFloat(e.total) || 0)) : 0
    const paidCount = expenses.filter(e => e.status === 'Paid').length
    const paymentRate = expenses.length ? Math.round((paidCount / expenses.length) * 100) : 0

    // by category
    const catMap = {}
    paid.forEach(e => { catMap[e.category || 'Other'] = (catMap[e.category || 'Other'] || 0) + (parseFloat(e.total) || 0) })
    const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

    // by phase
    const phaseMap = {}
    paid.forEach(e => { if (e.phase) phaseMap[e.phase] = (phaseMap[e.phase] || 0) + (parseFloat(e.total) || 0) })
    const phaseData = Object.entries(phaseMap).map(([name, value]) => ({ name: name.length > 14 ? name.slice(0, 14) + '..' : name, value })).sort((a, b) => b.value - a.value)

    // by vendor top 10
    const vendorMap = {}
    paid.forEach(e => { if (e.vendor) vendorMap[e.vendor] = (vendorMap[e.vendor] || 0) + (parseFloat(e.total) || 0) })
    const vendorData = Object.entries(vendorMap).map(([name, value]) => ({ name: name.length > 16 ? name.slice(0, 16) + '..' : name, value })).sort((a, b) => b.value - a.value).slice(0, 10)

    // by status
    const statusMap = {}
    expenses.forEach(e => { statusMap[e.status || 'Other'] = (statusMap[e.status || 'Other'] || 0) + (parseFloat(e.total) || 0) })
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    const statusColors = { Paid: '#10B981', Pending: '#F59E0B', Partial: '#3B82F6', Other: '#64748B' }

    // trend by period
    const trendMap = {}
    expenses.forEach(e => {
      if (!e.date) return
      let key
      if (expensePeriod === 'daily') key = e.date.slice(0, 10)
      else if (expensePeriod === 'weekly') {
        const d = new Date(e.date)
        const startOfWeek = new Date(d)
        startOfWeek.setDate(d.getDate() - d.getDay())
        key = startOfWeek.toISOString().slice(0, 10)
      } else key = e.date.slice(0, 7)
      if (!trendMap[key]) trendMap[key] = { period: key, amount: 0 }
      trendMap[key].amount += parseFloat(e.total) || 0
    })
    const trendData = Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period))

    // top 10 expenses
    const top10 = [...expenses].sort((a, b) => (parseFloat(b.total) || 0) - (parseFloat(a.total) || 0)).slice(0, 10)

    return { totalExp, avgExp, highestExp, paymentRate, catData, phaseData, vendorData, statusData, statusColors, trendData, top10 }
  }, [expenses, expensePeriod])

  /* ════════════════════════════════════════════
     TAB 3: MATERIAL & INVENTORY
     ════════════════════════════════════════════ */
  const materialTab = useMemo(() => {
    const totalMatCost = materials.reduce((s, m) => s + (parseFloat(m.totalCost) || 0), 0)
    const avgUnitPrice = materials.length ? materials.reduce((s, m) => s + (parseFloat(m.unitPrice) || 0), 0) / materials.length : 0
    const lowStockCount = materials.filter(m => {
      const bal = (parseFloat(m.receivedQty) || 0) - (parseFloat(m.usedQty) || 0)
      return bal <= (parseFloat(m.orderedQty) || 0) * 0.1 && bal >= 0
    }).length

    // by category
    const catMap = {}
    materials.forEach(m => { catMap[m.category || 'Other'] = (catMap[m.category || 'Other'] || 0) + (parseFloat(m.totalCost) || 0) })
    const catData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

    // stock levels top 10
    const stockData = [...materials].sort((a, b) => (parseFloat(b.totalCost) || 0) - (parseFloat(a.totalCost) || 0)).slice(0, 10).map(m => ({
      name: (m.name || '').length > 12 ? (m.name || '').slice(0, 12) + '..' : (m.name || ''),
      ordered: parseFloat(m.orderedQty) || 0,
      received: parseFloat(m.receivedQty) || 0,
      used: parseFloat(m.usedQty) || 0,
    }))

    // debt breakdown by vendor
    const debtByVendor = {}
    materials.forEach(m => {
      const snap = computeMaterialDebtSnapshot(m)
      if (snap.taken <= 0) return
      const v = m.vendor || 'Unknown'
      if (!debtByVendor[v]) debtByVendor[v] = { name: v, taken: 0, cleared: 0, outstanding: 0 }
      debtByVendor[v].taken += snap.taken
      debtByVendor[v].cleared += snap.cleared
      debtByVendor[v].outstanding += snap.outstanding
    })
    const debtData = Object.values(debtByVendor).sort((a, b) => b.taken - a.taken)

    // purchase mode
    const modeMap = { cash: 0, half_on_debt: 0, full_on_debt: 0 }
    materials.forEach(m => {
      const mode = m.purchaseDebt || 'cash'
      modeMap[mode] = (modeMap[mode] || 0) + 1
    })
    const modeData = [
      { name: 'Cash', value: modeMap.cash },
      { name: 'Half on Debt', value: modeMap.half_on_debt },
      { name: 'Full on Debt', value: modeMap.full_on_debt },
    ].filter(d => d.value > 0)

    // consumption rate
    const consumptionData = [...materials].filter(m => (parseFloat(m.receivedQty) || 0) > 0).sort((a, b) => {
      const rateA = (parseFloat(a.usedQty) || 0) / (parseFloat(a.receivedQty) || 1)
      const rateB = (parseFloat(b.usedQty) || 0) / (parseFloat(b.receivedQty) || 1)
      return rateB - rateA
    }).slice(0, 10).map(m => ({
      name: (m.name || '').length > 12 ? (m.name || '').slice(0, 12) + '..' : (m.name || ''),
      rate: Math.round(((parseFloat(m.usedQty) || 0) / (parseFloat(m.receivedQty) || 1)) * 100),
    }))

    return { totalMatCost, avgUnitPrice, lowStockCount, catData, stockData, debtData, modeData, consumptionData }
  }, [materials])

  /* ════════════════════════════════════════════
     TAB 4: LABOR ANALYTICS
     ════════════════════════════════════════════ */
  const laborTab = useMemo(() => {
    const totalLaborCost = laborers.reduce((s, l) => s + (parseFloat(l.totalPaid) || 0), 0)
    const avgDailyWage = laborers.length ? laborers.reduce((s, l) => s + (parseFloat(l.dailyWage) || 0), 0) / laborers.length : 0
    const totalPendingDues = laborers.reduce((s, l) => s + (parseFloat(l.pendingDues) || 0), 0)

    // by role
    const roleMap = {}
    laborers.forEach(l => { roleMap[l.role || 'Other'] = (roleMap[l.role || 'Other'] || 0) + (parseFloat(l.totalPaid) || 0) })
    const roleData = Object.entries(roleMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

    // worker-wise top 10
    const workerData = [...laborers].sort((a, b) => (parseFloat(b.totalPaid) || 0) - (parseFloat(a.totalPaid) || 0)).slice(0, 10).map(l => ({
      name: (l.name || '').length > 14 ? (l.name || '').slice(0, 14) + '..' : (l.name || ''),
      paid: parseFloat(l.totalPaid) || 0,
      pending: parseFloat(l.pendingDues) || 0,
    }))

    // wage distribution
    const wageRanges = [
      { range: '0-500', min: 0, max: 500 },
      { range: '500-800', min: 500, max: 800 },
      { range: '800-1200', min: 800, max: 1200 },
      { range: '1200-1500', min: 1200, max: 1500 },
      { range: '1500+', min: 1500, max: Infinity },
    ]
    const wageData = wageRanges.map(r => ({
      range: r.range,
      count: laborers.filter(l => {
        const w = parseFloat(l.dailyWage) || 0
        return w >= r.min && w < r.max
      }).length,
    }))

    // days worked distribution
    const daysData = [...laborers].sort((a, b) => (parseFloat(b.daysWorked) || 0) - (parseFloat(a.daysWorked) || 0)).slice(0, 10).map(l => ({
      name: (l.name || '').length > 12 ? (l.name || '').slice(0, 12) + '..' : (l.name || ''),
      days: parseFloat(l.daysWorked) || 0,
    }))

    // overtime
    const overtimeData = laborers.filter(l => (parseFloat(l.overtime) || 0) > 0).sort((a, b) => (parseFloat(b.overtime) || 0) - (parseFloat(a.overtime) || 0)).slice(0, 10).map(l => ({
      name: (l.name || '').length > 12 ? (l.name || '').slice(0, 12) + '..' : (l.name || ''),
      overtime: parseFloat(l.overtime) || 0,
    }))

    return { totalLaborCost, avgDailyWage, totalPendingDues, roleData, workerData, wageData, daysData, overtimeData }
  }, [laborers])

  /* ════════════════════════════════════════════
     TAB 5: VENDOR ANALYTICS
     ════════════════════════════════════════════ */
  const vendorTab = useMemo(() => {
    const totalContracted = vendors.reduce((s, v) => s + (parseFloat(v.totalContracted) || 0), 0)
    const totalPaidV = vendors.reduce((s, v) => s + (parseFloat(v.totalPaid) || 0), 0)
    const totalPendingV = vendors.reduce((s, v) => s + (parseFloat(v.pendingAmount) || 0), 0)

    // payment status per vendor
    const paymentStatus = [...vendors].sort((a, b) => (parseFloat(b.totalContracted) || 0) - (parseFloat(a.totalContracted) || 0)).slice(0, 10).map(v => ({
      name: (v.name || '').length > 14 ? (v.name || '').slice(0, 14) + '..' : (v.name || ''),
      paid: parseFloat(v.totalPaid) || 0,
      pending: parseFloat(v.pendingAmount) || 0,
    }))

    // top vendors by contract
    const topVendors = [...vendors].sort((a, b) => (parseFloat(b.totalContracted) || 0) - (parseFloat(a.totalContracted) || 0)).slice(0, 10).map(v => ({
      name: (v.name || '').length > 14 ? (v.name || '').slice(0, 14) + '..' : (v.name || ''),
      value: parseFloat(v.totalContracted) || 0,
    }))

    // work type distribution
    const typeMap = {}
    vendors.forEach(v => { typeMap[v.workType || 'Other'] = (typeMap[v.workType || 'Other'] || 0) + 1 })
    const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

    // payment completion rate
    const completionRate = vendors.map(v => ({
      name: (v.name || '').length > 12 ? (v.name || '').slice(0, 12) + '..' : (v.name || ''),
      rate: (parseFloat(v.totalContracted) || 0) > 0
        ? Math.round(((parseFloat(v.totalPaid) || 0) / (parseFloat(v.totalContracted) || 1)) * 100)
        : 0,
    })).sort((a, b) => b.rate - a.rate).slice(0, 10)

    // overdue vendors
    const overdue = vendors.filter(v => (parseFloat(v.pendingAmount) || 0) > 0).sort((a, b) => (parseFloat(b.pendingAmount) || 0) - (parseFloat(a.pendingAmount) || 0))

    return { totalContracted, totalPaidV, totalPendingV, paymentStatus, topVendors, typeData, completionRate, overdue }
  }, [vendors])

  /* ════════════════════════════════════════════
     TAB 6: DEBT ANALYTICS
     ════════════════════════════════════════════ */
  const debtTab = useMemo(() => {
    const totalDebtTaken = materialDebtTakenTotal + otherDebtTakenTotal
    const totalDebtCleared = materialDebtClearedTotal + otherDebtClearedTotal
    const totalDebtOutstanding = materialDebtOutstandingTotal + otherDebtOutstandingTotal
    const clearanceRate = totalDebtTaken > 0 ? Math.round((totalDebtCleared / totalDebtTaken) * 100) : 0

    // combined overview
    const combinedData = [
      { name: 'Material Debt', taken: materialDebtTakenTotal, cleared: materialDebtClearedTotal, outstanding: materialDebtOutstandingTotal },
      { name: 'Other Debt', taken: otherDebtTakenTotal, cleared: otherDebtClearedTotal, outstanding: otherDebtOutstandingTotal },
    ]

    // material debt by vendor
    const matDebtByVendor = {}
    materials.forEach(m => {
      const snap = computeMaterialDebtSnapshot(m)
      if (snap.taken <= 0) return
      const v = m.vendor || 'Unknown'
      matDebtByVendor[v] = (matDebtByVendor[v] || 0) + snap.outstanding
    })
    const matDebtVendorData = Object.entries(matDebtByVendor).map(([name, value]) => ({
      name: name.length > 14 ? name.slice(0, 14) + '..' : name, value,
    })).sort((a, b) => b.value - a.value).slice(0, 10)

    // other debt by creditor
    const odByCreditor = {}
    otherDebts.forEach(d => {
      const snap = computeOtherDebtSnapshot(d)
      const key = d.creditorName || d.creditorType || 'Unknown'
      if (!odByCreditor[key]) odByCreditor[key] = { name: key.length > 14 ? key.slice(0, 14) + '..' : key, outstanding: 0, cleared: 0 }
      odByCreditor[key].outstanding += snap.outstanding
      odByCreditor[key].cleared += snap.cleared
    })
    const odCreditorData = Object.values(odByCreditor).sort((a, b) => b.outstanding - a.outstanding).slice(0, 10)

    // clearance progress radials
    const matClearancePct = materialDebtTakenTotal > 0 ? Math.round((materialDebtClearedTotal / materialDebtTakenTotal) * 100) : 0
    const odClearancePct = otherDebtTakenTotal > 0 ? Math.round((otherDebtClearedTotal / otherDebtTakenTotal) * 100) : 0

    // debt timeline
    const debtTimeline = []
    materials.forEach(m => {
      if (!m.date) return
      const snap = computeMaterialDebtSnapshot(m)
      if (snap.taken <= 0) return
      debtTimeline.push({ date: m.date.slice(0, 7), type: 'material', taken: snap.taken, cleared: snap.cleared })
    })
    otherDebts.forEach(d => {
      if (!d.date) return
      const snap = computeOtherDebtSnapshot(d)
      if (snap.taken <= 0) return
      debtTimeline.push({ date: d.date.slice(0, 7), type: 'other', taken: snap.taken, cleared: snap.cleared })
    })
    const dtMap = {}
    debtTimeline.forEach(d => {
      if (!dtMap[d.date]) dtMap[d.date] = { month: d.date, taken: 0, cleared: 0 }
      dtMap[d.date].taken += d.taken
      dtMap[d.date].cleared += d.cleared
    })
    const dtData = Object.values(dtMap).sort((a, b) => a.month.localeCompare(b.month))

    return { totalDebtTaken, totalDebtCleared, totalDebtOutstanding, clearanceRate, combinedData, matDebtVendorData, odCreditorData, matClearancePct, odClearancePct, dtData }
  }, [materials, otherDebts, materialDebtTakenTotal, materialDebtClearedTotal, materialDebtOutstandingTotal, otherDebtTakenTotal, otherDebtClearedTotal, otherDebtOutstandingTotal])

  /* ════════════════════════════════════════════
     TAB 7: TIMELINE & PROGRESS
     ════════════════════════════════════════════ */
  const timelineTab = useMemo(() => {
    const totalPhases = timeline.length
    const completed = timeline.filter(t => t.status === 'Completed').length
    const inProgress = timeline.filter(t => t.status === 'In Progress').length
    const delayed = timeline.filter(t => t.status === 'Delayed').length

    // status distribution
    const statusMap = {}
    timeline.forEach(t => { statusMap[t.status || 'Not Started'] = (statusMap[t.status || 'Not Started'] || 0) + 1 })
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    const statusColors = { Completed: '#10B981', 'In Progress': '#3B82F6', Delayed: '#EF4444', 'Not Started': '#64748B' }

    // gantt-style data
    const now = Date.now()
    const ganttData = timeline.map(t => {
      const ps = t.plannedStart ? new Date(t.plannedStart).getTime() : null
      const pe = t.plannedEnd ? new Date(t.plannedEnd).getTime() : null
      const as_ = t.actualStart ? new Date(t.actualStart).getTime() : null
      const ae = t.actualEnd ? new Date(t.actualEnd).getTime() : null
      const plannedDays = ps && pe ? Math.max(1, Math.round((pe - ps) / 86400000)) : 0
      const actualDays = as_ ? Math.max(1, Math.round(((ae || now) - as_) / 86400000)) : 0
      return { name: t.phase.length > 14 ? t.phase.slice(0, 14) + '..' : t.phase, planned: plannedDays, actual: actualDays }
    })

    // delay analysis
    const delayData = timeline.map(t => {
      const pe = t.plannedEnd ? new Date(t.plannedEnd).getTime() : null
      const ae = t.actualEnd ? new Date(t.actualEnd).getTime() : null
      let delayDays = 0
      if (pe && ae) {
        delayDays = Math.max(0, Math.round((ae - pe) / 86400000))
      } else if (pe && !ae && t.status === 'Delayed') {
        delayDays = Math.max(0, Math.round((now - pe) / 86400000))
      }
      return { name: t.phase.length > 14 ? t.phase.slice(0, 14) + '..' : t.phase, delay: delayDays }
    }).filter(d => d.delay > 0).sort((a, b) => b.delay - a.delay)

    // completion trend from siteProgress
    const progressTrend = [...siteProgress].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(s => ({
      date: (s.date || '').slice(0, 10),
      completion: parseFloat(s.completionPct) || 0,
    }))

    // priority distribution from phases
    const priorityMap = {}
    ;(phases || []).forEach(p => { priorityMap[p.priority || 'Medium'] = (priorityMap[p.priority || 'Medium'] || 0) + 1 })
    const priorityData = Object.entries(priorityMap).map(([name, value]) => ({ name, value }))

    return { totalPhases, completed, inProgress, delayed, statusData, statusColors, ganttData, delayData, progressTrend, priorityData }
  }, [timeline, siteProgress, phases])

  /* ════════════════════════════════════════════
     TAB 8: CASH FLOW & FORECAST
     ════════════════════════════════════════════ */
  const cashFlowTab = useMemo(() => {
    const sorted = [...cashFlow].sort((a, b) => (a.month || '').localeCompare(b.month || ''))

    const cfData = sorted.map(c => ({
      month: c.month || '',
      inflow: parseFloat(c.inflow) || 0,
      outflow: parseFloat(c.outflow) || 0,
      net: (parseFloat(c.inflow) || 0) - (parseFloat(c.outflow) || 0),
    }))

    // cumulative
    let cumPos = 0
    const cumulativeData = cfData.map(c => {
      cumPos += c.net
      return { ...c, cumulative: cumPos }
    })

    // projected exhaustion
    const monthsRemaining = burnRate > 0 ? Math.ceil(remaining / burnRate) : null

    return { cfData, cumulativeData, monthsRemaining }
  }, [cashFlow, burnRate, remaining])

  /* ────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <SectionHeader
        title="Analytics"
        sub="Comprehensive insights and visual breakdowns of your construction project"
      />

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4,
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-0)', paddingTop: 8,
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s',
                border: isActive ? '1px solid #F59E0B' : '1px solid var(--border)',
                background: isActive ? 'rgba(245,158,11,0.12)' : 'var(--bg-2)',
                color: isActive ? '#F59E0B' : 'var(--text-2)',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ══════════ TAB 1: FINANCIAL ══════════ */}
      {activeTab === 'financial' && (
        <div>
          <div style={kpiRow}>
            <KpiCard label="Total Budget" value={formatINR(budget)} sub={`Buffer: ${formatINR(bufferAmt)}`} icon={IndianRupee} color="#3B82F6" />
            <KpiCard label="Total Spent" value={formatINR(totalSpent)} sub={`${budgetUsed}% of budget`} icon={TrendingUp} color="#F59E0B" />
            <KpiCard label="Remaining" value={formatINR(remaining)} sub={remaining < 0 ? 'Over budget!' : 'Available'} icon={Activity} color="#10B981" />
            <KpiCard label="Pending Payments" value={formatINR(totalPending)} sub={`${expenses.filter(e => e.status === 'Pending').length} pending`} icon={Clock} color="#EF4444" />
            <KpiCard label="Budget Used" value={`${budgetUsed}%`} sub={budgetUsed >= 90 ? 'Critical' : budgetUsed >= 70 ? 'Warning' : 'Healthy'} icon={Gauge} color={budgetUsed >= 90 ? '#EF4444' : budgetUsed >= 70 ? '#F59E0B' : '#10B981'} />
            <KpiCard label="Burn Rate" value={formatINR(burnRate)} sub="Avg. spent per month" icon={TrendingDown} color="#8B5CF6" />
          </div>

          <div style={grid2}>
            {/* Budget vs Actual Donut */}
            <ChartCard title="Budget vs Actual">
              {financialTab.donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={financialTab.donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={105} paddingAngle={3} dataKey="value">
                      {financialTab.donutData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Budget Health Gauge */}
            <ChartCard title="Budget Health">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={financialTab.healthData} barSize={20}>
                  <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                  <text x="50%" y="55%" textAnchor="middle" fill="var(--text-1)" fontSize={28} fontWeight={700} fontFamily="JetBrains Mono">
                    {budgetUsed}%
                  </text>
                  <text x="50%" y="65%" textAnchor="middle" fill="var(--text-3)" fontSize={12}>
                    Budget Used
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Monthly Spending Trend - full width */}
          <div style={{ marginBottom: 16 }}>
            <ChartCard title="Monthly Spending Trend (Cumulative)" full>
              {financialTab.cumulativeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={financialTab.cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} />
                    <Area yAxisId="left" type="monotone" dataKey="spent" fill="rgba(245,158,11,0.15)" stroke="#F59E0B" strokeWidth={2} name="Monthly Spent" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} name="Cumulative" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* Spending Velocity */}
          <ChartCard title="Spending Velocity (Month-over-Month Change)" full>
            {financialTab.velocityData.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={financialTab.velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="change" name="Change" radius={[4, 4, 0, 0]}>
                    {financialTab.velocityData.map((entry, i) => (
                      <Cell key={i} fill={entry.change >= 0 ? '#EF4444' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="Need at least 2 months of data" />}
          </ChartCard>
        </div>
      )}

      {/* ══════════ TAB 2: EXPENSE ══════════ */}
      {activeTab === 'expense' && (
        <div>
          <div style={kpiRow}>
            <KpiCard label="Total Expenses" value={formatINR(expenseTab.totalExp)} sub={`${expenses.length} transactions`} icon={Receipt} color="#F59E0B" />
            <KpiCard label="Avg Expense" value={formatINR(expenseTab.avgExp)} sub="Per transaction" icon={BarChart3} color="#3B82F6" />
            <KpiCard label="Highest Expense" value={formatINR(expenseTab.highestExp)} sub="Single transaction" icon={ArrowUpRight} color="#EF4444" />
            <KpiCard label="Payment Rate" value={`${expenseTab.paymentRate}%`} sub="Paid completion" icon={CheckCircle} color="#10B981" />
          </div>

          <div style={grid2}>
            {/* By Category */}
            <ChartCard title="Expense by Category">
              {expenseTab.catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={expenseTab.catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {expenseTab.catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* By Status */}
            <ChartCard title="Expense by Status">
              {expenseTab.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={expenseTab.statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {expenseTab.statusData.map((entry, i) => <Cell key={i} fill={expenseTab.statusColors[entry.name] || CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <div style={grid2}>
            {/* By Phase */}
            <ChartCard title="Expense by Phase">
              {expenseTab.phaseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={expenseTab.phaseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* By Vendor */}
            <ChartCard title="Top 10 Vendors by Expense">
              {expenseTab.vendorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={expenseTab.vendorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* Trend with period selector */}
          <ChartCard title="Expense Trend" full>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['daily', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  onClick={() => setExpensePeriod(p)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: expensePeriod === p ? '1px solid #F59E0B' : '1px solid var(--border)',
                    background: expensePeriod === p ? 'rgba(245,158,11,0.12)' : 'var(--bg-3)',
                    color: expensePeriod === p ? '#F59E0B' : 'var(--text-3)',
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {expenseTab.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={expenseTab.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="amount" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} name="Amount" />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          {/* Top 10 Expenses Table */}
          <ChartCard title="Top 10 Expenses" full minH={0}>
            {expenseTab.top10.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['#', 'ID', 'Date', 'Description', 'Category', 'Phase', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenseTab.top10.map((e, i) => (
                      <tr key={e.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--text-3)' }}>{i + 1}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-2)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{e.id}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>{(e.date || '').slice(0, 10)}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-1)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>{e.category}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>{e.phase}</td>
                        <td style={{ padding: '8px 10px', color: '#F59E0B', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{formatINRFull(e.total)}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: e.status === 'Paid' ? 'rgba(16,185,129,0.15)' : e.status === 'Pending' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                            color: e.status === 'Paid' ? '#10B981' : e.status === 'Pending' ? '#F59E0B' : '#3B82F6',
                          }}>
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyChart message="No expenses recorded yet" />}
          </ChartCard>
        </div>
      )}

      {/* ══════════ TAB 3: MATERIAL ══════════ */}
      {activeTab === 'material' && (
        <div>
          <div style={kpiRow}>
            <KpiCard label="Total Materials" value={materials.length} sub="Items tracked" icon={Package} color="#F59E0B" />
            <KpiCard label="Total Material Cost" value={formatINR(materialTab.totalMatCost)} sub="All materials" icon={IndianRupee} color="#3B82F6" />
            <KpiCard label="Avg Unit Price" value={formatINR(materialTab.avgUnitPrice)} sub="Per material" icon={BarChart3} color="#8B5CF6" />
            <KpiCard label="Low Stock" value={materialTab.lowStockCount} sub="Items below 10%" icon={AlertTriangle} color="#EF4444" />
          </div>

          <div style={grid2}>
            {/* Cost by Category */}
            <ChartCard title="Material Cost by Category">
              {materialTab.catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={materialTab.catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {materialTab.catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Purchase Mode */}
            <ChartCard title="Purchase Mode Distribution">
              {materialTab.modeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={materialTab.modeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {materialTab.modeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* Stock Levels */}
          <ChartCard title="Stock Levels (Top 10 by Cost)" full>
            {materialTab.stockData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={materialTab.stockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="ordered" fill="#3B82F6" name="Ordered" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" fill="#10B981" name="Received" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="used" fill="#F59E0B" name="Used" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <div style={grid2}>
            {/* Debt Breakdown */}
            <ChartCard title="Material Debt Breakdown">
              {materialTab.debtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={materialTab.debtData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="taken" stackId="a" fill="#EF4444" name="Taken" />
                    <Bar dataKey="cleared" stackId="a" fill="#10B981" name="Cleared" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No material debt recorded" />}
            </ChartCard>

            {/* Consumption Rate */}
            <ChartCard title="Material Consumption Rate">
              {materialTab.consumptionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={materialTab.consumptionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={100} />
                    <Tooltip content={<PercentTooltip />} />
                    <Bar dataKey="rate" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Usage %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 4: LABOR ══════════ */}
      {activeTab === 'labor' && (
        <div>
          <div style={kpiRow}>
            <KpiCard label="Total Workers" value={laborers.length} sub="Active workforce" icon={Users} color="#F59E0B" />
            <KpiCard label="Total Labor Cost" value={formatINR(laborTab.totalLaborCost)} sub="Total paid" icon={IndianRupee} color="#3B82F6" />
            <KpiCard label="Avg Daily Wage" value={formatINR(laborTab.avgDailyWage)} sub="Per worker" icon={BarChart3} color="#8B5CF6" />
            <KpiCard label="Pending Dues" value={formatINR(laborTab.totalPendingDues)} sub="Unpaid wages" icon={Clock} color="#EF4444" />
          </div>

          <div style={grid2}>
            {/* By Role */}
            <ChartCard title="Labor Cost by Role">
              {laborTab.roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={laborTab.roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {laborTab.roleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Wage Distribution */}
            <ChartCard title="Wage Distribution">
              {laborers.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={laborTab.wageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Workers" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* Worker-wise breakdown */}
          <ChartCard title="Worker-wise Cost Breakdown (Top 10)" full>
            {laborTab.workerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={laborTab.workerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="paid" stackId="a" fill="#10B981" name="Paid" />
                  <Bar dataKey="pending" stackId="a" fill="#EF4444" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <div style={grid2}>
            {/* Days Worked */}
            <ChartCard title="Days Worked (Top 10)">
              {laborTab.daysData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={laborTab.daysData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="days" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Days" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Overtime */}
            <ChartCard title="Overtime Analysis">
              {laborTab.overtimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={laborTab.overtimeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="overtime" fill="#F97316" radius={[0, 4, 4, 0]} name="Overtime Hours" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No overtime data recorded" />}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 5: VENDOR ══════════ */}
      {activeTab === 'vendor' && (
        <div>
          <div style={kpiRow}>
            <KpiCard label="Total Vendors" value={vendors.length} sub="Registered" icon={Truck} color="#F59E0B" />
            <KpiCard label="Total Contracted" value={formatINR(vendorTab.totalContracted)} sub="Contract value" icon={IndianRupee} color="#3B82F6" />
            <KpiCard label="Total Paid" value={formatINR(vendorTab.totalPaidV)} sub="Disbursed" icon={CheckCircle} color="#10B981" />
            <KpiCard label="Total Pending" value={formatINR(vendorTab.totalPendingV)} sub="Outstanding" icon={Clock} color="#EF4444" />
          </div>

          <div style={grid2}>
            {/* Payment Status */}
            <ChartCard title="Vendor Payment Status">
              {vendorTab.paymentStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={vendorTab.paymentStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="paid" stackId="a" fill="#10B981" name="Paid" />
                    <Bar dataKey="pending" stackId="a" fill="#EF4444" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Work Type Distribution */}
            <ChartCard title="Work Type Distribution">
              {vendorTab.typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={vendorTab.typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {vendorTab.typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          <div style={grid2}>
            {/* Top Vendors by Contract */}
            <ChartCard title="Top Vendors by Contract Value">
              {vendorTab.topVendors.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={vendorTab.topVendors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Contract Value" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Payment Completion Rate */}
            <ChartCard title="Vendor Payment Completion Rate">
              {vendorTab.completionRate.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={vendorTab.completionRate} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={100} />
                    <Tooltip content={<PercentTooltip />} />
                    <Bar dataKey="rate" fill="#10B981" radius={[0, 4, 4, 0]} name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* Overdue Vendors Table */}
          <ChartCard title="Vendors with Pending Payments" full minH={0}>
            {vendorTab.overdue.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['#', 'Vendor', 'Work Type', 'Contracted', 'Paid', 'Pending', 'Advance'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendorTab.overdue.map((v, i) => (
                      <tr key={v.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--text-3)' }}>{i + 1}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-1)', fontWeight: 600 }}>{v.name}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-2)' }}>{v.workType}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-2)', fontFamily: 'JetBrains Mono' }}>{formatINRFull(v.totalContracted)}</td>
                        <td style={{ padding: '8px 10px', color: '#10B981', fontFamily: 'JetBrains Mono' }}>{formatINRFull(v.totalPaid)}</td>
                        <td style={{ padding: '8px 10px', color: '#EF4444', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{formatINRFull(v.pendingAmount)}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-2)', fontFamily: 'JetBrains Mono' }}>{formatINRFull(v.advanceGiven)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyChart message="No vendors with pending payments" />}
          </ChartCard>
        </div>
      )}

      {/* ══════════ TAB 6: DEBT ══════════ */}
      {activeTab === 'debt' && (
        <div>
          <div style={kpiRow}>
            <KpiCard label="Total Debt Taken" value={formatINR(debtTab.totalDebtTaken)} sub="All sources" icon={Landmark} color="#EF4444" />
            <KpiCard label="Total Cleared" value={formatINR(debtTab.totalDebtCleared)} sub="Repaid" icon={CheckCircle} color="#10B981" />
            <KpiCard label="Outstanding" value={formatINR(debtTab.totalDebtOutstanding)} sub="Current balance" icon={Scale} color="#F59E0B" />
            <KpiCard label="Clearance Rate" value={`${debtTab.clearanceRate}%`} sub="Debt repayment progress" icon={Target} color="#3B82F6" />
          </div>

          {/* Combined Overview */}
          <ChartCard title="Debt Overview: Material vs Other" full>
            {(debtTab.totalDebtTaken > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={debtTab.combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="taken" fill="#EF4444" name="Taken" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cleared" fill="#10B981" name="Cleared" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" fill="#F59E0B" name="Outstanding" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No debt recorded" />}
          </ChartCard>

          <div style={grid2}>
            {/* Material Debt by Vendor */}
            <ChartCard title="Material Debt by Vendor (Outstanding)">
              {debtTab.matDebtVendorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={debtTab.matDebtVendorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} name="Outstanding" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No material debt outstanding" />}
            </ChartCard>

            {/* Other Debt by Creditor */}
            <ChartCard title="Other Debt by Creditor">
              {debtTab.odCreditorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={debtTab.odCreditorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="outstanding" fill="#EF4444" name="Outstanding" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="cleared" fill="#10B981" name="Cleared" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No other debts recorded" />}
            </ChartCard>
          </div>

          <div style={grid2}>
            {/* Debt Clearance Radials */}
            <ChartCard title="Debt Clearance Progress">
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 260 }}>
                {/* Material Debt */}
                <div style={{ textAlign: 'center' }}>
                  <ResponsiveContainer width={160} height={160}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="95%" startAngle={180} endAngle={0}
                      data={[{ value: debtTab.matClearancePct, fill: '#10B981' }]} barSize={14}>
                      <RadialBar background clockWise dataKey="value" cornerRadius={8} />
                      <text x="50%" y="55%" textAnchor="middle" fill="var(--text-1)" fontSize={20} fontWeight={700} fontFamily="JetBrains Mono">
                        {debtTab.matClearancePct}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, marginTop: 4 }}>Material Debt</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatINR(materialDebtClearedTotal)} / {formatINR(materialDebtTakenTotal)}</p>
                </div>
                {/* Other Debt */}
                <div style={{ textAlign: 'center' }}>
                  <ResponsiveContainer width={160} height={160}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="95%" startAngle={180} endAngle={0}
                      data={[{ value: debtTab.odClearancePct, fill: '#3B82F6' }]} barSize={14}>
                      <RadialBar background clockWise dataKey="value" cornerRadius={8} />
                      <text x="50%" y="55%" textAnchor="middle" fill="var(--text-1)" fontSize={20} fontWeight={700} fontFamily="JetBrains Mono">
                        {debtTab.odClearancePct}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, marginTop: 4 }}>Other Debt</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatINR(otherDebtClearedTotal)} / {formatINR(otherDebtTakenTotal)}</p>
                </div>
              </div>
            </ChartCard>

            {/* Debt Timeline */}
            <ChartCard title="Debt Timeline">
              {debtTab.dtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={debtTab.dtData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} />
                    <Area type="monotone" dataKey="taken" fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth={2} name="Taken" />
                    <Area type="monotone" dataKey="cleared" fill="rgba(16,185,129,0.15)" stroke="#10B981" strokeWidth={2} name="Cleared" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No dated debt entries" />}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 7: TIMELINE ══════════ */}
      {activeTab === 'timeline' && (
        <div>
          <div style={kpiRow}>
            <KpiCard label="Total Phases" value={timelineTab.totalPhases} sub="Construction phases" icon={Layers} color="#3B82F6" />
            <KpiCard label="Completed" value={timelineTab.completed} sub="Finished" icon={CheckCircle} color="#10B981" />
            <KpiCard label="In Progress" value={timelineTab.inProgress} sub="Currently active" icon={Activity} color="#F59E0B" />
            <KpiCard label="Delayed" value={timelineTab.delayed} sub="Behind schedule" icon={AlertTriangle} color="#EF4444" />
          </div>

          <div style={grid2}>
            {/* Status Distribution */}
            <ChartCard title="Phase Status Distribution">
              {timelineTab.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={timelineTab.statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {timelineTab.statusData.map((entry, i) => (
                        <Cell key={i} fill={timelineTab.statusColors[entry.name] || CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>

            {/* Priority Distribution */}
            <ChartCard title="Phase Priority Distribution">
              {timelineTab.priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={timelineTab.priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {timelineTab.priorityData.map((entry, i) => {
                        const colorMap = { High: '#EF4444', Medium: '#F59E0B', Low: '#3B82F6' }
                        return <Cell key={i} fill={colorMap[entry.name] || CHART_COLORS[i]} />
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart />}
            </ChartCard>
          </div>

          {/* Gantt-style Phase Timeline */}
          <ChartCard title="Phase Timeline (Planned vs Actual Days)" full>
            {timelineTab.ganttData.some(d => d.planned > 0 || d.actual > 0) ? (
              <ResponsiveContainer width="100%" height={Math.max(300, timelineTab.ganttData.length * 32)}>
                <BarChart data={timelineTab.ganttData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'Days', position: 'insideBottomRight', offset: -5, fill: '#64748B', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="planned" fill="#3B82F6" name="Planned Days" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="actual" fill="#F59E0B" name="Actual Days" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No timeline dates set yet" />}
          </ChartCard>

          <div style={grid2}>
            {/* Delay Analysis */}
            <ChartCard title="Delay Analysis (Days Overdue)">
              {timelineTab.delayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={timelineTab.delayData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="delay" fill="#EF4444" radius={[0, 4, 4, 0]} name="Delay (Days)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No delays detected" />}
            </ChartCard>

            {/* Completion Trend */}
            <ChartCard title="Completion Trend Over Time">
              {timelineTab.progressTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timelineTab.progressTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<PercentTooltip />} />
                    <Line type="monotone" dataKey="completion" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} name="Completion %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No site progress entries" />}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ══════════ TAB 8: CASH FLOW ══════════ */}
      {activeTab === 'cashflow' && (
        <div>
          <div style={kpiRow}>
            <KpiCard
              label="Total Inflow"
              value={formatINR(cashFlowTab.cfData.reduce((s, c) => s + c.inflow, 0))}
              sub="All sources"
              icon={ArrowUpRight} color="#10B981"
            />
            <KpiCard
              label="Total Outflow"
              value={formatINR(cashFlowTab.cfData.reduce((s, c) => s + c.outflow, 0))}
              sub="All payments"
              icon={ArrowDownRight} color="#EF4444"
            />
            <KpiCard
              label="Net Position"
              value={formatINR(cashFlowTab.cumulativeData.length ? cashFlowTab.cumulativeData[cashFlowTab.cumulativeData.length - 1].cumulative : 0)}
              sub="Current balance"
              icon={Wallet} color="#3B82F6"
            />
            <KpiCard
              label="Budget Exhaustion"
              value={cashFlowTab.monthsRemaining ? `~${cashFlowTab.monthsRemaining} mo` : 'N/A'}
              sub={cashFlowTab.monthsRemaining ? `At ${formatINR(burnRate)}/mo burn` : 'No spending data'}
              icon={Timer} color="#8B5CF6"
            />
          </div>

          {/* Monthly Cash Flow */}
          <ChartCard title="Monthly Cash Flow (Inflow vs Outflow)" full>
            {cashFlowTab.cfData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashFlowTab.cfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="inflow" fill="#10B981" name="Inflow" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" fill="#EF4444" name="Outflow" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart message="No cash flow entries yet" />}
          </ChartCard>

          <div style={grid2}>
            {/* Net Cash Flow Trend */}
            <ChartCard title="Net Cash Flow Trend">
              {cashFlowTab.cfData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={cashFlowTab.cfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="net" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 3 }} name="Net Flow" />
                    <Line type="monotone" dataKey={() => 0} stroke="#64748B" strokeWidth={1} strokeDasharray="4 4" name="Zero Line" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No cash flow data" />}
            </ChartCard>

            {/* Cumulative Cash Position */}
            <ChartCard title="Cumulative Cash Position">
              {cashFlowTab.cumulativeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={cashFlowTab.cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="cumulative" fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth={2} name="Cumulative" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart message="No cash flow data" />}
            </ChartCard>
          </div>

          {/* Projected Budget Exhaustion */}
          <ChartCard title="Budget Projection" full minH={0}>
            <div style={{ padding: '20px 0' }}>
              {burnRate > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                      At the current burn rate of <span style={{ color: '#F59E0B', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{formatINRFull(burnRate)}</span> per month:
                    </p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 160 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Remaining Budget</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: remaining >= 0 ? '#10B981' : '#EF4444', fontFamily: 'JetBrains Mono' }}>{formatINRFull(remaining)}</p>
                      </div>
                      <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 160 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Months Until Exhaustion</p>
                        <p style={{ fontSize: 20, fontWeight: 700, color: (cashFlowTab.monthsRemaining || 0) <= 3 ? '#EF4444' : '#F59E0B', fontFamily: 'JetBrains Mono' }}>
                          {cashFlowTab.monthsRemaining ? `${cashFlowTab.monthsRemaining} months` : 'N/A'}
                        </p>
                      </div>
                      <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 160 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Budget Status</p>
                        <p style={{
                          fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono',
                          color: budgetUsed >= 90 ? '#EF4444' : budgetUsed >= 70 ? '#F59E0B' : '#10B981',
                        }}>
                          {budgetUsed >= 90 ? 'Critical' : budgetUsed >= 70 ? 'Warning' : 'Healthy'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Mini progress */}
                  <div style={{ width: 200, textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
                      <svg viewBox="0 0 120 120" width="120" height="120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-3)" strokeWidth="10" />
                        <circle cx="60" cy="60" r="52" fill="none"
                          stroke={budgetUsed >= 90 ? '#EF4444' : budgetUsed >= 70 ? '#F59E0B' : '#10B981'}
                          strokeWidth="10" strokeLinecap="round"
                          strokeDasharray={`${Math.min(budgetUsed, 100) * 3.267} 326.7`}
                          transform="rotate(-90 60 60)"
                        />
                        <text x="60" y="56" textAnchor="middle" fill="var(--text-1)" fontSize="22" fontWeight="700" fontFamily="JetBrains Mono">{budgetUsed}%</text>
                        <text x="60" y="72" textAnchor="middle" fill="var(--text-3)" fontSize="10">used</text>
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyChart message="Add expenses to see budget projections" />
              )}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
