import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, StatusBadge, Modal, FormGrid, FormField, Input, Select, EmptyState, formatINRFull, formatINR } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Plus, Edit2 } from 'lucide-react'

const emptyForm = { phase: '', plannedBudget: '' }

export default function BudgetPlanning() {
  const { project, phaseNames, expenses, mergedDropdownOptions } = useApp()
  const phaseOptions = mergedDropdownOptions(DROPDOWN_KEYS.phase, phaseNames)
  const [budgets, setBudgets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bt_phase_budgets') || '[]') } catch { return [] }
  })
  const [showModal, setShowModal] = useState(false)
  const [editPhase, setEditPhase] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })

  const saveBudgets = (b) => {
    setBudgets(b)
    localStorage.setItem('bt_phase_budgets', JSON.stringify(b))
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleOpen = (phase = null) => {
    if (phase) {
      const existing = budgets.find(b => b.phase === phase)
      setForm({ phase, plannedBudget: existing?.plannedBudget || '' })
      setEditPhase(phase)
    } else {
      setForm({ ...emptyForm })
      setEditPhase(null)
    }
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.phase) return
    const updated = budgets.filter(b => b.phase !== form.phase)
    saveBudgets([...updated, { phase: form.phase, plannedBudget: parseFloat(form.plannedBudget) || 0 }])
    setShowModal(false)
  }

  // Build analysis rows
  const rows = phaseOptions.map(phase => {
    const bEntry = budgets.find(b => b.phase === phase)
    const planned = bEntry?.plannedBudget || 0
    const actual = expenses.filter(e => e.phase === phase && e.status === 'Paid').reduce((s, e) => s + (parseFloat(e.total) || 0), 0)
    const diff = planned - actual
    const overPct = planned > 0 ? ((actual - planned) / planned * 100).toFixed(1) : 0
    const status = !planned ? 'Not Set' : actual > planned * 1.1 ? 'Exceeded' : actual > planned * 0.8 ? 'Warning' : 'Within Budget'
    return { phase, planned, actual, diff, overPct, status }
  })

  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0)
  const totalActual = rows.reduce((s, r) => s + r.actual, 0)
  const overBudget = rows.filter(r => r.status === 'Exceeded').length
  const underBudget = rows.filter(r => r.status === 'Within Budget').length

  const chartData = rows.filter(r => r.planned > 0 || r.actual > 0).map(r => ({
    name: r.phase.length > 10 ? r.phase.slice(0, 10) + '…' : r.phase,
    Planned: r.planned,
    Actual: r.actual,
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1A2035', border: '1px solid #1E2A40', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <p style={{ color: '#94A3B8', marginBottom: 6, fontSize: 11 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>₹{(p.value || 0).toLocaleString('en-IN')}</span></p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Budget Planning"
        sub="Phase-wise planned vs actual spend analysis"
        action={<button className="btn-primary" onClick={() => handleOpen()}><Plus size={15} />Set Phase Budget</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <SumCard label="Total Planned" value={formatINR(totalPlanned || project.plannedBudget)} color="#3B82F6" />
        <SumCard label="Total Actual" value={formatINR(totalActual)} color="#F59E0B" />
        <SumCard label="Variance" value={formatINR(Math.abs((totalPlanned || project.plannedBudget) - totalActual))} color={totalActual > (totalPlanned || project.plannedBudget) ? '#EF4444' : '#10B981'} />
        <SumCard label="Over Budget Phases" value={overBudget} color={overBudget > 0 ? '#EF4444' : '#10B981'} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Planned vs Actual by Phase</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="Planned" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Phase</th><th>Planned Budget</th><th>Actual Spend</th><th>Variance</th><th>Over %</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.phase} style={{ background: r.status === 'Exceeded' ? 'rgba(239,68,68,0.03)' : r.status === 'Warning' ? 'rgba(245,158,11,0.02)' : undefined }}>
                <td style={{ fontWeight: 600 }}>{r.phase}</td>
                <td>
                  <span style={{ fontFamily: 'JetBrains Mono', color: r.planned ? '#3B82F6' : 'var(--text-3)' }}>
                    {r.planned ? formatINRFull(r.planned) : '—'}
                  </span>
                </td>
                <td><span style={{ fontFamily: 'JetBrains Mono', color: r.actual > 0 ? '#F59E0B' : 'var(--text-3)' }}>{r.actual > 0 ? formatINRFull(r.actual) : '—'}</span></td>
                <td>
                  {r.planned > 0 || r.actual > 0 ? (
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: r.diff >= 0 ? '#10B981' : '#EF4444' }}>
                      {r.diff >= 0 ? '+' : ''}{formatINRFull(r.diff)}
                    </span>
                  ) : '—'}
                </td>
                <td>
                  {r.planned > 0 && r.actual > 0 ? (
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: parseFloat(r.overPct) > 0 ? '#EF4444' : '#10B981' }}>
                      {parseFloat(r.overPct) > 0 ? '+' : ''}{r.overPct}%
                    </span>
                  ) : '—'}
                </td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleOpen(r.phase)}>
                    <Edit2 size={11} />
                    {r.planned > 0 ? 'Edit' : 'Set'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Set Phase Budget" onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Phase" full>
              {editPhase ? (
                <Input readOnly value={editPhase} />
              ) : (
                <Select
                  persistKey={DROPDOWN_KEYS.phase}
                  options={phaseNames}
                  emptyLabel="— Select Phase —"
                  value={form.phase}
                  onChange={e => f('phase', e.target.value)}
                />
              )}
            </FormField>
            <FormField label="Planned Budget (₹)" full>
              <Input type="number" value={form.plannedBudget} onChange={e => f('plannedBudget', e.target.value)} placeholder="Enter budget for this phase" />
            </FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>Save Budget</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SumCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: color || 'var(--text-1)' }}>{value}</p>
    </div>
  )
}
