import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Modal, FormGrid, FormField, Input, EmptyState, formatINR } from '../components/ui'
import VendorPicker from '../components/VendorPicker'
import { computeOtherDebtSnapshot, formatOtherDebtCreditor } from '../utils/otherDebt'
import { Plus, Wallet, Edit2 } from 'lucide-react'

const emptyForm = {
  title: '',
  creditorType: 'vendor',
  creditorName: '',
  amountTaken: '',
  amountCleared: '',
  date: '',
  notes: '',
}

export default function OtherDebtTracker() {
  const { otherDebts, addOtherDebt, updateOtherDebt, deleteOtherDebt } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [filter, setFilter] = useState('')
  const [formError, setFormError] = useState('')

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleOpen = (row = null) => {
    setFormError('')
    if (row) {
      setForm({
        ...emptyForm,
        ...row,
        creditorType: row.creditorType || 'vendor',
        creditorName: row.creditorName || '',
        amountTaken: row.debtAmountTaken != null ? String(row.debtAmountTaken) : '',
        amountCleared: row.debtAmountCleared != null ? String(row.debtAmountCleared) : '',
        date: row.date || '',
        notes: row.notes || '',
      })
      setEditId(row.id)
    } else {
      setForm({ ...emptyForm })
      setEditId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = () => {
    const title = String(form.title || '').trim()
    if (!title) {
      setFormError('Add a short description for this debt.')
      return
    }
    const creditorName = String(form.creditorName || '').trim()
    if (!creditorName) {
      setFormError('Enter who lent the money (vendor name or person).')
      return
    }
    let taken = Math.max(0, parseFloat(form.amountTaken) || 0)
    if (taken <= 0) {
      setFormError('Debt taken must be greater than zero.')
      return
    }
    let cleared = Math.max(0, parseFloat(form.amountCleared) || 0)
    cleared = Math.min(cleared, taken)
    const outstanding = Math.max(0, taken - cleared)
    setFormError('')
    const data = {
      title,
      creditorType: form.creditorType || 'vendor',
      creditorName,
      date: form.date || '',
      notes: String(form.notes || '').trim(),
      debtAmountTaken: taken,
      debtAmountCleared: cleared,
      debtOutstanding: outstanding,
    }
    if (editId) {
      updateOtherDebt(editId, data)
      setEditId(null)
    } else {
      addOtherDebt(data)
    }
    setShowModal(false)
    setForm({ ...emptyForm })
  }

  const filtered = otherDebts.filter(d => {
    if (!filter) return true
    const q = filter.toLowerCase()
    const blob = `${d.title} ${d.creditorName} ${formatOtherDebtCreditor(d)}`.toLowerCase()
    return blob.includes(q)
  })

  const takenSum = otherDebts.reduce((s, d) => s + computeOtherDebtSnapshot(d).taken, 0)
  const clearedSum = otherDebts.reduce((s, d) => s + computeOtherDebtSnapshot(d).cleared, 0)
  const outSum = otherDebts.reduce((s, d) => s + computeOtherDebtSnapshot(d).outstanding, 0)

  return (
    <div>
      <SectionHeader
        title="Other debts"
        sub={`${otherDebts.length} entries · Track loans and pay-later obligations that are not tied to material lines.`}
        action={<button className="btn-primary" onClick={() => handleOpen()}><Plus size={15} />Add debt</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <SumCard label="Other debt taken" value={formatINR(takenSum)} color="#6366F1" />
        <SumCard label="Other debt cleared" value={formatINR(clearedSum)} color="#22C55E" />
        <SumCard label="Other debt outstanding" value={formatINR(outSum)} color={outSum > 0 ? '#EF4444' : '#10B981'} />
      </div>

      <input className="input-field" style={{ maxWidth: 320, marginBottom: 16 }} placeholder="Search description or creditor..." value={filter} onChange={e => setFilter(e.target.value)} />

      <div className="table-container">
        {filtered.length === 0 ? (
          <EmptyState icon={Wallet} message="No other debts yet. Add personal loans, advances, or non-material credit here." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Creditor</th>
                <th>Taken</th>
                <th>Cleared</th>
                <th>Outstanding</th>
                <th>Date</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const { taken, cleared, outstanding } = computeOtherDebtSnapshot(d)
                return (
                  <tr key={d.id}>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6366F1' }}>{d.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 160 }} title={formatOtherDebtCreditor(d)}>{formatOtherDebtCreditor(d)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#6366F1' }}>₹{taken.toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#22C55E' }}>₹{cleared.toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600, color: outstanding > 0 ? '#EF4444' : 'var(--text-3)' }}>₹{outstanding.toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{d.date || '—'}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-3)', maxWidth: 140 }} title={d.notes}>{d.notes ? (d.notes.length > 40 ? `${d.notes.slice(0, 40)}…` : d.notes) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }} type="button" onClick={() => handleOpen(d)}><Edit2 size={12} /></button>
                        <button className="btn-danger" type="button" onClick={() => deleteOtherDebt(d.id)}>✕</button>
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
        <Modal title={editId ? 'Edit other debt' : 'Add other debt'} onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="What is this debt for?" full>
              <Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Personal loan, Equipment advance, Site advance" />
            </FormField>
            <FormField label="Creditor type" full>
              <select className="input-field" value={form.creditorType || 'vendor'} onChange={e => f('creditorType', e.target.value)}>
                <option value="vendor">Vendor / supplier (non-material)</option>
                <option value="other">Other person or lender</option>
              </select>
            </FormField>
            <FormField label={form.creditorType === 'vendor' ? 'Creditor (vendor from list)' : 'Creditor name'} full>
              {form.creditorType === 'vendor' ? (
                <VendorPicker value={form.creditorName} onChange={e => f('creditorName', e.target.value)} emptyLabel="— Select vendor —" />
              ) : (
                <Input value={form.creditorName} onChange={e => f('creditorName', e.target.value)} placeholder="Who lent the money?" />
              )}
            </FormField>
            <FormField label="Debt taken (₹)">
              <Input type="number" value={form.amountTaken} onChange={e => f('amountTaken', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Debt cleared (₹)">
              <Input type="number" value={form.amountCleared} onChange={e => f('amountCleared', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="As of date">
              <Input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </FormField>
            <FormField label="Notes" full>
              <Input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Optional reference, EMI terms, etc." />
            </FormField>
            <FormField label="Preview" full>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, fontFamily: 'JetBrains Mono' }}>
                {(() => {
                  const taken = Math.max(0, parseFloat(form.amountTaken) || 0)
                  const cleared = taken === 0 ? 0 : Math.min(Math.max(0, parseFloat(form.amountCleared) || 0), taken)
                  const out = Math.max(0, taken - cleared)
                  return `Taken: ${formatINR(taken)} · Cleared: ${formatINR(cleared)} · Outstanding: ${formatINR(out)}`
                })()}
              </p>
            </FormField>
          </FormGrid>
          {formError && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12, marginBottom: 0 }}>{formError}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" type="button" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" type="button" onClick={handleSubmit}>{editId ? 'Update' : 'Add debt'}</button>
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
