import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, StatusBadge, Modal, FormGrid, FormField, Input, Select, EmptyState, formatINR } from '../components/ui'
import VendorPicker from '../components/VendorPicker'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { Plus, Package, AlertTriangle, Edit2 } from 'lucide-react'
import { computeMaterialDebtSnapshot, formatMaterialCreditor, getDebtTakenFactor } from '../utils/materialDebt'

const UNITS = ['bags','kg','tons','cft','sqft','nos','liters','meters','rolls','boxes']
const MATERIALS = ['Cement','Steel','Sand','Jelly / Aggregate','Bricks','Blocks','Tiles','Paint','Wood','Electrical Wire','PVC Pipes','Water Proofing','Putty','Primer','Gravel','Fly Ash','TMT Bars','Binding Wire','Shuttering Plates','Other']

const emptyForm = {
  name: '', unit: 'bags', orderedQty: '', receivedQty: '', usedQty: '', unitRate: '', vendor: '', date: '', notes: '',
  purchaseDebt: 'cash',
  debtCreditorType: 'vendor',
  debtCreditorName: '',
  debtCleared: '',
}

export default function MaterialTracker() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [filter, setFilter] = useState('')
  const [formError, setFormError] = useState('')

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleOpen = (mat = null) => {
    setFormError('')
    if (mat) {
      setForm({
        ...emptyForm,
        ...mat,
        purchaseDebt: mat.purchaseDebt || 'cash',
        debtCreditorType: mat.debtCreditorType || 'vendor',
        debtCreditorName: mat.debtCreditorName || '',
        debtCleared: mat.materialDebtCleared != null && mat.materialDebtCleared !== '' ? String(mat.materialDebtCleared) : '',
      })
      setEditId(mat.id)
    } else {
      setForm({ ...emptyForm })
      setEditId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.name) return
    const purchaseDebt = form.purchaseDebt || 'cash'
    const debtCreditorType = purchaseDebt === 'cash' ? 'vendor' : (form.debtCreditorType || 'vendor')
    if (purchaseDebt !== 'cash' && debtCreditorType === 'other' && !String(form.debtCreditorName || '').trim()) {
      setFormError('Enter the name of the person who extended credit.')
      return
    }
    setFormError('')
    const ordered = parseFloat(form.orderedQty) || 0
    const received = parseFloat(form.receivedQty) || 0
    const used = parseFloat(form.usedQty) || 0
    const balance = received - used
    const totalCost = (parseFloat(form.unitRate) || 0) * received
    const wastage = received > 0 ? ((Math.max(0, used - received) / received) * 100).toFixed(1) : 0
    const debtTaken = totalCost * getDebtTakenFactor(purchaseDebt)
    let debtCleared = purchaseDebt === 'cash' ? 0 : (parseFloat(form.debtCleared) || 0)
    debtCleared = Math.min(Math.max(0, debtCleared), debtTaken)
    const debtOutstanding = Math.max(0, debtTaken - debtCleared)
    const data = {
      ...form,
      purchaseDebt,
      debtCreditorType: purchaseDebt === 'cash' ? 'vendor' : debtCreditorType,
      debtCreditorName: purchaseDebt === 'cash' ? '' : (debtCreditorType === 'other' ? String(form.debtCreditorName || '').trim() : ''),
      balance,
      totalCost,
      wastage,
      materialDebtTaken: debtTaken,
      materialDebtCleared: debtCleared,
      materialDebtOutstanding: debtOutstanding,
    }
    if (editId) { updateMaterial(editId, data); setEditId(null) }
    else addMaterial(data)
    setShowModal(false)
    setForm({ ...emptyForm })
  }

  const filtered = materials.filter(m => {
    if (!filter) return true
    const q = filter.toLowerCase()
    const creditor = formatMaterialCreditor(m).toLowerCase()
    return m.name?.toLowerCase().includes(q) || m.vendor?.toLowerCase().includes(q) || creditor.includes(q)
  })

  const totalCost = materials.reduce((s, m) => s + (parseFloat(m.totalCost) || 0), 0)
  const debtTakenSum = materials.reduce((s, m) => s + computeMaterialDebtSnapshot(m).taken, 0)
  const debtClearedSum = materials.reduce((s, m) => s + computeMaterialDebtSnapshot(m).cleared, 0)
  const debtOutstandingSum = materials.reduce((s, m) => s + computeMaterialDebtSnapshot(m).outstanding, 0)
  const lowStock = materials.filter(m => {
    const bal = parseFloat(m.balance) || 0
    const ord = parseFloat(m.orderedQty) || 1
    return bal / ord < 0.15
  })

  return (
    <div>
      <SectionHeader
        title="Material Tracker"
        sub={`${materials.length} materials · Total cost: ${formatINR(totalCost)} · ${lowStock.length} low stock alerts`}
        action={<button className="btn-primary" onClick={() => handleOpen()}><Plus size={15} />Add Material</button>}
      />

      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#EF4444" />
          <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>Low Stock:</span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{lowStock.map(m => m.name).join(', ')}</span>
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <SumCard label="Total Materials" value={materials.length} />
        <SumCard label="Total Cost" value={formatINR(totalCost)} color="#F59E0B" />
        <SumCard label="Debt taken (materials)" value={formatINR(debtTakenSum)} color="#A855F7" />
        <SumCard label="Debt cleared" value={formatINR(debtClearedSum)} color="#22C55E" />
        <SumCard label="Outstanding debt" value={formatINR(debtOutstandingSum)} color={debtOutstandingSum > 0 ? '#EF4444' : '#10B981'} />
        <SumCard label="Low Stock" value={lowStock.length} color={lowStock.length > 0 ? '#EF4444' : '#10B981'} />
        <SumCard label="Avg Wastage" value={materials.length ? `${(materials.reduce((s, m) => s + (parseFloat(m.wastage) || 0), 0) / materials.length).toFixed(1)}%` : '0%'} color="#8B5CF6" />
      </div>

      <input className="input-field" style={{ maxWidth: 320, marginBottom: 16 }} placeholder="Search material or vendor..." value={filter} onChange={e => setFilter(e.target.value)} />

      <div className="table-container">
        {filtered.length === 0 ? (
          <EmptyState icon={Package} message="No materials tracked yet. Add your first material." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Material</th><th>Unit</th><th>Ordered</th><th>Received</th>
                <th>Used</th><th>Balance</th><th>Unit Rate</th><th>Total Cost</th>
                <th>Wastage</th><th>Vendor</th><th>Credit</th><th>Creditor</th><th>Debt</th><th>Cleared</th><th>O/S</th><th>Date</th><th>Stock</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const bal = parseFloat(m.balance) ?? ((parseFloat(m.receivedQty)||0) - (parseFloat(m.usedQty)||0))
                const ord = parseFloat(m.orderedQty) || 1
                const pct = bal / ord
                const stockStatus = pct < 0.15 ? 'Critical' : pct < 0.3 ? 'Low' : 'OK'
                const stockColor = { Critical: '#EF4444', Low: '#F59E0B', OK: '#10B981' }[stockStatus]
                const { taken: dTaken, cleared: dCleared, outstanding: dOut } = computeMaterialDebtSnapshot(m)
                const mode = m.purchaseDebt || 'cash'
                const creditLabel = mode === 'half_on_debt' ? 'Half' : mode === 'full_on_debt' ? 'Full' : '—'
                return (
                  <tr key={m.id}>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#F59E0B' }}>{m.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{m.unit}</td>
                    <td><span style={{ fontFamily: 'JetBrains Mono' }}>{m.orderedQty}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#3B82F6' }}>{m.receivedQty}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#F59E0B' }}>{m.usedQty}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: stockColor }}>{bal.toFixed(1)}</span></td>
                    <td style={{ color: 'var(--text-2)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>₹{parseFloat(m.unitRate || 0).toLocaleString('en-IN')}</td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#10B981' }}>₹{parseFloat(m.totalCost || 0).toLocaleString('en-IN')}</span></td>
                    <td style={{ color: parseFloat(m.wastage) > 5 ? '#EF4444' : 'var(--text-2)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{m.wastage}%</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{m.vendor}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{creditLabel}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 11, maxWidth: 120 }} title={formatMaterialCreditor(m)}>{formatMaterialCreditor(m)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#A855F7' }}>₹{dTaken.toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#22C55E' }}>₹{dCleared.toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600, color: dOut > 0 ? '#EF4444' : 'var(--text-3)' }}>₹{dOut.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{m.date}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: stockColor }}>{stockStatus}</span>
                        <div style={{ width: 60, height: 4, background: 'var(--bg-4)', borderRadius: 2 }}>
                          <div style={{ width: `${Math.min(100, pct * 100)}%`, height: '100%', background: stockColor, borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleOpen(m)}><Edit2 size={12} /></button>
                        <button className="btn-danger" onClick={() => deleteMaterial(m.id)}>✕</button>
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
        <Modal title={editId ? 'Edit Material' : 'Add Material'} onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Material Name" full>
              <Select
                persistKey={DROPDOWN_KEYS.materialName}
                options={MATERIALS}
                emptyLabel="— Select material —"
                value={form.name}
                onChange={e => f('name', e.target.value)}
              />
            </FormField>
            <FormField label="Unit">
              <Select persistKey={DROPDOWN_KEYS.materialUnit} options={UNITS} value={form.unit} onChange={e => f('unit', e.target.value)} />
            </FormField>
            <FormField label="Ordered Qty">
              <Input type="number" value={form.orderedQty} onChange={e => f('orderedQty', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Received Qty">
              <Input type="number" value={form.receivedQty} onChange={e => f('receivedQty', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Used Qty">
              <Input type="number" value={form.usedQty} onChange={e => f('usedQty', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Unit Rate (₹)">
              <Input type="number" value={form.unitRate} onChange={e => f('unitRate', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Vendor" full>
              <VendorPicker value={form.vendor} onChange={e => f('vendor', e.target.value)} />
            </FormField>
            <FormField label="Date">
              <Input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </FormField>
            <FormField label="Purchase payment" full>
              <select className="input-field" value={form.purchaseDebt || 'cash'} onChange={e => f('purchaseDebt', e.target.value)}>
                <option value="cash">Cash / paid upfront (no material debt)</option>
                <option value="half_on_debt">Half on debt — 50% of line total as credit</option>
                <option value="full_on_debt">Full on debt — 100% of line total as credit</option>
              </select>
            </FormField>
            {(form.purchaseDebt === 'half_on_debt' || form.purchaseDebt === 'full_on_debt') && (
              <>
                <FormField label="Credit from">
                  <select className="input-field" value={form.debtCreditorType || 'vendor'} onChange={e => f('debtCreditorType', e.target.value)}>
                    <option value="vendor">Vendor (uses Supplier name above)</option>
                    <option value="other">Other person</option>
                  </select>
                </FormField>
                {form.debtCreditorType === 'other' && (
                  <FormField label="Creditor name">
                    <Input value={form.debtCreditorName} onChange={e => f('debtCreditorName', e.target.value)} placeholder="Who gave credit?" />
                  </FormField>
                )}
                <FormField label="Debt cleared (₹)">
                  <Input type="number" value={form.debtCleared} onChange={e => f('debtCleared', e.target.value)} placeholder="0" />
                </FormField>
                <FormField label="Preview" full>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, fontFamily: 'JetBrains Mono' }}>
                    {(() => {
                      const received = parseFloat(form.receivedQty) || 0
                      const totalCost = (parseFloat(form.unitRate) || 0) * received
                      const taken = totalCost * getDebtTakenFactor(form.purchaseDebt)
                      const cleared = Math.min(Math.max(0, parseFloat(form.debtCleared) || 0), taken)
                      const out = Math.max(0, taken - cleared)
                      return `Debt taken: ${formatINR(taken)} · Cleared: ${formatINR(cleared)} · Outstanding: ${formatINR(out)}`
                    })()}
                  </p>
                </FormField>
              </>
            )}
          </FormGrid>
          {formError && (
            <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12, marginBottom: 0 }}>{formError}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>{editId ? 'Update' : 'Add Material'}</button>
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
