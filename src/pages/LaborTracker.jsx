import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Modal, FormGrid, FormField, Input, Select, EmptyState, formatINR, formatINRFull } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { Plus, Users, Edit2 } from 'lucide-react'

const ROLES = ['Mason','Helper','Electrician','Plumber','Painter','Carpenter','Tile Worker','Supervisor','Welder','Other']

const emptyForm = { name: '', role: '', dailyWage: '', daysWorked: '', overtime: '0', paid: '0', notes: '' }

export default function LaborTracker() {
  const { laborers, addLaborer, updateLaborer, deleteLaborer, mergedDropdownOptions } = useApp()
  const roleOptions = mergedDropdownOptions(DROPDOWN_KEYS.laborRole, ROLES)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const calcPayable = (fm) => {
    const base = (parseFloat(fm.dailyWage) || 0) * (parseFloat(fm.daysWorked) || 0)
    const ot = parseFloat(fm.overtime) || 0
    return base + ot
  }

  const handleOpen = (w = null) => {
    if (w) { setForm({ ...w }); setEditId(w.id) }
    else { setForm({ ...emptyForm }); setEditId(null) }
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.name) return
    const totalPayable = calcPayable(form)
    const pending = totalPayable - (parseFloat(form.paid) || 0)
    const data = { ...form, totalPayable, pending }
    if (editId) { updateLaborer(editId, data); setEditId(null) }
    else addLaborer(data)
    setShowModal(false)
    setForm({ ...emptyForm })
  }

  const totalPayable = laborers.reduce((s, w) => s + (parseFloat(w.totalPayable) || 0), 0)
  const totalPaid = laborers.reduce((s, w) => s + (parseFloat(w.paid) || 0), 0)
  const totalPending = laborers.reduce((s, w) => s + (parseFloat(w.pending) || 0), 0)

  const roleBreakdown = roleOptions.reduce((acc, r) => {
    acc[r] = laborers.filter(w => w.role === r).length
    return acc
  }, {})

  return (
    <div>
      <SectionHeader
        title="Labor Tracker"
        sub={`${laborers.length} workers · Payable: ${formatINR(totalPayable)} · Pending: ${formatINR(totalPending)}`}
        action={<button className="btn-primary" onClick={() => handleOpen()}><Plus size={15} />Add Worker</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <SumCard label="Total Workers" value={laborers.length} />
        <SumCard label="Total Payable" value={formatINR(totalPayable)} color="#F59E0B" />
        <SumCard label="Total Paid" value={formatINR(totalPaid)} color="#10B981" />
        <SumCard label="Pending Dues" value={formatINR(totalPending)} color={totalPending > 0 ? '#EF4444' : '#10B981'} />
      </div>

      {/* Role breakdown */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {roleOptions.filter(r => roleBreakdown[r] > 0).map(r => (
          <span key={r} className="badge badge-blue">{r}: {roleBreakdown[r]}</span>
        ))}
      </div>

      <div className="table-container">
        {laborers.length === 0 ? (
          <EmptyState icon={Users} message="No workers added yet. Add your workforce." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Role</th><th>Daily Wage</th><th>Days</th>
                <th>Overtime</th><th>Total Payable</th><th>Paid</th><th>Pending</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {laborers.map(w => {
                const pending = parseFloat(w.pending) || 0
                return (
                  <tr key={w.id} style={{ background: pending > 0 ? 'rgba(239,68,68,0.03)' : undefined }}>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#F59E0B' }}>{w.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td><span className="badge badge-purple">{w.role}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono' }}>₹{parseFloat(w.dailyWage).toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#3B82F6' }}>{w.daysWorked}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#F59E0B' }}>₹{parseFloat(w.overtime || 0).toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>₹{parseFloat(w.totalPayable || 0).toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#10B981' }}>₹{parseFloat(w.paid || 0).toLocaleString('en-IN')}</span></td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: pending > 0 ? '#EF4444' : '#10B981' }}>
                        ₹{pending.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{w.notes}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpen(w)}><Edit2 size={12} /></button>
                        <button className="btn-danger" onClick={() => deleteLaborer(w.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editId ? 'Edit Worker' : 'Add Worker'} onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Worker Name">
              <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Full name" />
            </FormField>
            <FormField label="Role">
              <Select persistKey={DROPDOWN_KEYS.laborRole} options={ROLES} value={form.role} onChange={e => f('role', e.target.value)} />
            </FormField>
            <FormField label="Daily Wage (₹)">
              <Input type="number" value={form.dailyWage} onChange={e => f('dailyWage', e.target.value)} placeholder="600" />
            </FormField>
            <FormField label="Days Worked">
              <Input type="number" value={form.daysWorked} onChange={e => f('daysWorked', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Overtime Amount (₹)">
              <Input type="number" value={form.overtime} onChange={e => f('overtime', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Amount Paid (₹)">
              <Input type="number" value={form.paid} onChange={e => f('paid', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Total Payable (preview)">
              <Input readOnly value={`₹${calcPayable(form).toLocaleString('en-IN')}`} style={{ color: '#F59E0B', fontFamily: 'JetBrains Mono' }} />
            </FormField>
            <FormField label="Pending (preview)">
              <Input readOnly value={`₹${Math.max(0, calcPayable(form) - (parseFloat(form.paid)||0)).toLocaleString('en-IN')}`} style={{ color: '#EF4444', fontFamily: 'JetBrains Mono' }} />
            </FormField>
            <FormField label="Notes" full>
              <Input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Any remarks..." />
            </FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>{editId ? 'Update' : 'Add Worker'}</button>
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
