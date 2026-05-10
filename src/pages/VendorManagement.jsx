import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, StatusBadge, Modal, FormGrid, FormField, Input, Select, EmptyState, formatINR } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { Plus, Building, Edit2, AlertTriangle, Phone } from 'lucide-react'

const WORK_TYPES = ['Material Supply','Civil Work','Electrical','Plumbing','Painting','Woodwork','Tile Work','Steel Supply','Sand & Aggregate','Roofing','Waterproofing','Transport','Equipment Rental','Other']
const STATUSES = ['Active','Completed','On Hold','Cancelled']

const emptyForm = { name: '', workType: '', phone: '', email: '', advancePaid: '0', totalAmount: '0', paidAmount: '0', dueDate: '', status: 'Active', notes: '' }

export default function VendorManagement() {
  const { vendors, addVendor, updateVendor, deleteVendor } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleOpen = (v = null) => {
    if (v) { setForm({ ...v }); setEditId(v.id) }
    else { setForm({ ...emptyForm }); setEditId(null) }
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.name) return
    const pendingAmount = (parseFloat(form.totalAmount) || 0) - (parseFloat(form.paidAmount) || 0)
    const data = { ...form, pendingAmount }
    if (editId) { updateVendor(editId, data); setEditId(null) }
    else addVendor(data)
    setShowModal(false)
    setForm({ ...emptyForm })
  }

  const totalContracted = vendors.reduce((s, v) => s + (parseFloat(v.totalAmount) || 0), 0)
  const totalPaid = vendors.reduce((s, v) => s + (parseFloat(v.paidAmount) || 0), 0)
  const totalPending = vendors.reduce((s, v) => s + (parseFloat(v.pendingAmount) || 0), 0)
  const overdue = vendors.filter(v => {
    if (!v.dueDate || parseFloat(v.pendingAmount) <= 0) return false
    return new Date(v.dueDate) < new Date()
  })

  return (
    <div>
      <SectionHeader
        title="Vendor Management"
        sub={`${vendors.length} vendors · Contracted: ${formatINR(totalContracted)} · Pending: ${formatINR(totalPending)}`}
        action={<button className="btn-primary" onClick={() => handleOpen()}><Plus size={15} />Add Vendor</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <SumCard label="Total Vendors" value={vendors.length} />
        <SumCard label="Total Contracted" value={formatINR(totalContracted)} color="#3B82F6" />
        <SumCard label="Total Paid" value={formatINR(totalPaid)} color="#10B981" />
        <SumCard label="Pending Dues" value={formatINR(totalPending)} color={totalPending > 0 ? '#EF4444' : '#10B981'} />
      </div>

      {overdue.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color="#EF4444" />
          <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>Overdue Payments:</span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{overdue.map(v => `${v.name} (${formatINR(v.pendingAmount)})`).join(', ')}</span>
        </div>
      )}

      <div className="table-container">
        {vendors.length === 0 ? (
          <EmptyState icon={Building} message="No vendors added yet. Add your suppliers and contractors." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Vendor</th><th>Work Type</th><th>Phone</th><th>Advance</th>
                <th>Total</th><th>Paid</th><th>Pending</th><th>Due Date</th><th>Status</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => {
                const pending = parseFloat(v.pendingAmount) || 0
                const isOverdue = v.dueDate && pending > 0 && new Date(v.dueDate) < new Date()
                return (
                  <tr key={v.id} style={{ background: isOverdue ? 'rgba(239,68,68,0.04)' : undefined }}>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#F59E0B' }}>{v.id}</span></td>
                    <td style={{ fontWeight: 600 }}>
                      {isOverdue && <AlertTriangle size={12} color="#EF4444" style={{ marginRight: 6, display: 'inline' }} />}
                      {v.name}
                    </td>
                    <td><span className="badge badge-blue">{v.workType}</span></td>
                    <td>
                      {v.phone && (
                        <a href={`tel:${v.phone}`} style={{ color: '#3B82F6', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                          <Phone size={12} />{v.phone}
                        </a>
                      )}
                    </td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#F59E0B' }}>₹{parseFloat(v.advancePaid || 0).toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono' }}>₹{parseFloat(v.totalAmount || 0).toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#10B981' }}>₹{parseFloat(v.paidAmount || 0).toLocaleString('en-IN')}</span></td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: pending > 0 ? (isOverdue ? '#EF4444' : '#F59E0B') : '#10B981' }}>
                        ₹{pending.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ color: isOverdue ? '#EF4444' : 'var(--text-2)', fontSize: 12, fontWeight: isOverdue ? 600 : 400 }}>{v.dueDate}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12, maxWidth: 120 }}>{v.notes}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpen(v)}><Edit2 size={12} /></button>
                        <button className="btn-danger" onClick={() => deleteVendor(v.id)}>✕</button>
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
        <Modal title={editId ? 'Edit Vendor' : 'Add Vendor'} onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Vendor Name" full>
              <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="Company or individual name" />
            </FormField>
            <FormField label="Work Type">
              <Select persistKey={DROPDOWN_KEYS.vendorWorkType} options={WORK_TYPES} value={form.workType} onChange={e => f('workType', e.target.value)} />
            </FormField>
            <FormField label="Status">
              <Select persistKey={DROPDOWN_KEYS.vendorStatus} options={STATUSES} value={form.status} onChange={e => f('status', e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="vendor@email.com" />
            </FormField>
            <FormField label="Advance Paid (₹)">
              <Input type="number" value={form.advancePaid} onChange={e => f('advancePaid', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Total Contract Amount (₹)">
              <Input type="number" value={form.totalAmount} onChange={e => f('totalAmount', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Amount Paid (₹)">
              <Input type="number" value={form.paidAmount} onChange={e => f('paidAmount', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Payment Due Date">
              <Input type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} />
            </FormField>
            <FormField label="Pending (preview)">
              <Input readOnly value={`₹${Math.max(0, (parseFloat(form.totalAmount)||0) - (parseFloat(form.paidAmount)||0)).toLocaleString('en-IN')}`} style={{ color: '#EF4444', fontFamily: 'JetBrains Mono' }} />
            </FormField>
            <FormField label="Notes" full>
              <Input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Contract details, remarks..." />
            </FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>{editId ? 'Update' : 'Add Vendor'}</button>
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
