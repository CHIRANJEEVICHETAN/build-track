import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, StatusBadge, Modal, FormGrid, FormField, Input, Select, EmptyState, formatINR } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { Plus, Package, AlertTriangle, Edit2 } from 'lucide-react'

const UNITS = ['bags','kg','tons','cft','sqft','nos','liters','meters','rolls','boxes']
const MATERIALS = ['Cement','Steel','Sand','Jelly / Aggregate','Bricks','Blocks','Tiles','Paint','Wood','Electrical Wire','PVC Pipes','Water Proofing','Putty','Primer','Gravel','Fly Ash','TMT Bars','Binding Wire','Shuttering Plates','Other']

const emptyForm = { name: '', unit: 'bags', orderedQty: '', receivedQty: '', usedQty: '', unitRate: '', vendor: '', date: '', notes: '' }

export default function MaterialTracker() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [filter, setFilter] = useState('')

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleOpen = (mat = null) => {
    if (mat) { setForm({ ...mat }); setEditId(mat.id) }
    else { setForm({ ...emptyForm }); setEditId(null) }
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.name) return
    const ordered = parseFloat(form.orderedQty) || 0
    const received = parseFloat(form.receivedQty) || 0
    const used = parseFloat(form.usedQty) || 0
    const balance = received - used
    const totalCost = (parseFloat(form.unitRate) || 0) * received
    const wastage = received > 0 ? ((Math.max(0, used - received) / received) * 100).toFixed(1) : 0
    const data = { ...form, balance, totalCost, wastage }
    if (editId) { updateMaterial(editId, data); setEditId(null) }
    else addMaterial(data)
    setShowModal(false)
    setForm({ ...emptyForm })
  }

  const filtered = materials.filter(m =>
    !filter || m.name?.toLowerCase().includes(filter.toLowerCase()) || m.vendor?.toLowerCase().includes(filter.toLowerCase())
  )

  const totalCost = materials.reduce((s, m) => s + (parseFloat(m.totalCost) || 0), 0)
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <SumCard label="Total Materials" value={materials.length} />
        <SumCard label="Total Cost" value={formatINR(totalCost)} color="#F59E0B" />
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
                <th>Wastage</th><th>Vendor</th><th>Date</th><th>Stock</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const bal = parseFloat(m.balance) ?? ((parseFloat(m.receivedQty)||0) - (parseFloat(m.usedQty)||0))
                const ord = parseFloat(m.orderedQty) || 1
                const pct = bal / ord
                const stockStatus = pct < 0.15 ? 'Critical' : pct < 0.3 ? 'Low' : 'OK'
                const stockColor = { Critical: '#EF4444', Low: '#F59E0B', OK: '#10B981' }[stockStatus]
                return (
                  <tr key={m.id}>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#F59E0B' }}>{m.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{m.unit}</td>
                    <td><span style={{ fontFamily: 'JetBrains Mono' }}>{m.orderedQty}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#3B82F6' }}>{m.receivedQty}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#F59E0B' }}>{m.usedQty}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: stockColor }}>{bal.toFixed(1)}</span></td>
                    <td style={{ color: 'var(--text-2)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>₹{parseFloat(m.unitRate).toLocaleString('en-IN')}</td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#10B981' }}>₹{parseFloat(m.totalCost || 0).toLocaleString('en-IN')}</span></td>
                    <td style={{ color: parseFloat(m.wastage) > 5 ? '#EF4444' : 'var(--text-2)', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{m.wastage}%</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{m.vendor}</td>
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
            <FormField label="Vendor">
              <Input value={form.vendor} onChange={e => f('vendor', e.target.value)} placeholder="Supplier name" />
            </FormField>
            <FormField label="Date">
              <Input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </FormField>
          </FormGrid>
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
