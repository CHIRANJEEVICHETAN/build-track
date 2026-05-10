import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, StatusBadge, Modal, FormGrid, FormField, Input, Select, EmptyState, formatINR, formatINRFull } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { validateOrThrow, expenseSchema } from '../lib/validation/schemas'
import { Plus, Trash2, Filter, Receipt, Download } from 'lucide-react'

const CATEGORIES = ['Material','Labor','Machinery','Transport','Rentals','Government','Interior','Electrical','Plumbing','Miscellaneous']
const PAYMENT_MODES = ['Cash','UPI','Bank Transfer','Cheque']
const STATUSES = ['Paid','Pending','Partial']

const emptyForm = { date: '', phase: '', category: '', description: '', vendor: '', paymentMode: 'Cash', amount: '', gst: '0', status: 'Paid', notes: '' }

export default function DailyExpenses() {
  const { expenses, addExpense, deleteExpense, phaseNames, totalSpent, totalPending } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [filter, setFilter] = useState({ phase: '', category: '', status: '', search: '' })

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const amount = parseFloat(form.amount) || 0
  const gst = parseFloat(form.gst) || 0
  const total = amount + (amount * gst / 100)

  const handleSubmit = () => {
    try {
      validateOrThrow(expenseSchema, form)
    } catch {
      return
    }
    addExpense({ ...form, total: total.toFixed(2) })
    setForm({ ...emptyForm })
    setShowModal(false)
  }

  const filtered = expenses.filter(e => {
    if (filter.phase && e.phase !== filter.phase) return false
    if (filter.category && e.category !== filter.category) return false
    if (filter.status && e.status !== filter.status) return false
    if (filter.search && !`${e.description} ${e.vendor} ${e.id}`.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const filteredTotal = filtered.filter(e => e.status === 'Paid').reduce((s, e) => s + (parseFloat(e.total) || 0), 0)

  return (
    <div>
      <SectionHeader
        title="Daily Expenses"
        sub={`${expenses.length} transactions · Spent: ${formatINR(totalSpent)} · Pending: ${formatINR(totalPending)}`}
        action={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Add Expense</button>}
      />

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {STATUSES.map(s => {
          const items = expenses.filter(e => e.status === s)
          const total = items.reduce((sum, e) => sum + (parseFloat(e.total) || 0), 0)
          const color = s === 'Paid' ? '#10B981' : s === 'Pending' ? '#EF4444' : '#F59E0B'
          return (
            <div key={s} className="card" style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{s}</p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color }}>{formatINR(total)}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{items.length} entries</p>
            </div>
          )
        })}
        <div className="card" style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Total Entries</p>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{expenses.length}</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>all time</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="input-field" style={{ flex: 1, minWidth: 200 }} placeholder="Search description, vendor, ID..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        <div style={{ width: 200, flexShrink: 0 }}>
          <Select
            persistKey={DROPDOWN_KEYS.phase}
            options={phaseNames}
            emptyLabel="All Phases"
            value={filter.phase}
            onChange={e => setFilter(f => ({ ...f, phase: e.target.value }))}
          />
        </div>
        <div style={{ width: 200, flexShrink: 0 }}>
          <Select
            persistKey={DROPDOWN_KEYS.expenseCategory}
            options={CATEGORIES}
            emptyLabel="All Categories"
            value={filter.category}
            onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          />
        </div>
        <div style={{ width: 180, flexShrink: 0 }}>
          <Select
            persistKey={DROPDOWN_KEYS.expenseStatus}
            options={STATUSES}
            emptyLabel="All Status"
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          />
        </div>
      </div>

      {filtered.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
          Showing {filtered.length} of {expenses.length} · Filtered paid total: <span style={{ color: '#10B981', fontFamily: 'JetBrains Mono' }}>{formatINRFull(filteredTotal)}</span>
        </p>
      )}

      <div className="table-container">
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} message="No expenses yet. Click 'Add Expense' to get started." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Date</th><th>Phase</th><th>Category</th><th>Description</th>
                <th>Vendor</th><th>Mode</th><th>Amount</th><th>GST</th><th>Total</th>
                <th>Status</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#F59E0B' }}>{e.id}</span></td>
                  <td style={{ color: 'var(--text-2)' }}>{e.date}</td>
                  <td><span style={{ fontSize: 12 }}>{e.phase}</span></td>
                  <td><span className="badge badge-gray">{e.category}</span></td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</td>
                  <td style={{ color: 'var(--text-2)' }}>{e.vendor}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{e.paymentMode}</td>
                  <td><span style={{ fontFamily: 'JetBrains Mono' }}>₹{parseFloat(e.amount).toLocaleString('en-IN')}</span></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{e.gst}%</td>
                  <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: e.status === 'Paid' ? '#10B981' : e.status === 'Pending' ? '#EF4444' : '#F59E0B' }}>₹{parseFloat(e.total).toLocaleString('en-IN')}</span></td>
                  <td><StatusBadge status={e.status} /></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12, maxWidth: 120 }}>{e.notes}</td>
                  <td><button className="btn-danger" onClick={() => deleteExpense(e.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Add Expense" onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Date">
              <Input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </FormField>
            <FormField label="Phase">
              <Select persistKey={DROPDOWN_KEYS.phase} options={phaseNames} value={form.phase} onChange={e => f('phase', e.target.value)} />
            </FormField>
            <FormField label="Category">
              <Select persistKey={DROPDOWN_KEYS.expenseCategory} options={CATEGORIES} value={form.category} onChange={e => f('category', e.target.value)} />
            </FormField>
            <FormField label="Payment Mode">
              <Select persistKey={DROPDOWN_KEYS.expensePaymentMode} options={PAYMENT_MODES} value={form.paymentMode} onChange={e => f('paymentMode', e.target.value)} />
            </FormField>
            <FormField label="Description" full>
              <Input value={form.description} onChange={e => f('description', e.target.value)} placeholder="What was purchased/paid for?" />
            </FormField>
            <FormField label="Vendor / Supplier">
              <Input value={form.vendor} onChange={e => f('vendor', e.target.value)} placeholder="Vendor name" />
            </FormField>
            <FormField label="Status">
              <Select persistKey={DROPDOWN_KEYS.expenseStatus} options={STATUSES} value={form.status} onChange={e => f('status', e.target.value)} />
            </FormField>
            <FormField label="Amount (₹)">
              <Input type="number" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="GST %">
              <Input type="number" value={form.gst} onChange={e => f('gst', e.target.value)} placeholder="0" min={0} max={28} />
            </FormField>
            <FormField label="Total (auto)">
              <Input readOnly value={`₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} style={{ color: '#F59E0B', fontFamily: 'JetBrains Mono' }} />
            </FormField>
            <FormField label="Notes" full>
              <Input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Any remarks..." />
            </FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}><Plus size={14} />Add Expense</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
