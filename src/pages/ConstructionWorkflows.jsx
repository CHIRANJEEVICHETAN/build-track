import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, FormGrid, FormField, Input, Modal } from '../components/ui'
import { Plus } from 'lucide-react'

const empty = { title: '', amount: '', status: 'Open', notes: '' }

function Board({ title, rows, onAdd, onDelete }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const save = () => {
    if (!form.title) return
    onAdd({ ...form, createdAt: new Date().toISOString() })
    setForm({ ...empty })
    setOpen(false)
  }
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <button className="btn-secondary" onClick={() => setOpen(true)}><Plus size={12} />Add</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <div key={r.id} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{r.title}</strong>
              <button className="btn-danger" onClick={() => onDelete(r.id)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.status} · ₹{Number(r.amount || 0).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>
      {open && (
        <Modal title={`Add ${title}`} onClose={() => setOpen(false)}>
          <FormGrid>
            <FormField label="Title" full><Input value={form.title} onChange={e => f('title', e.target.value)} /></FormField>
            <FormField label="Amount"><Input type="number" value={form.amount} onChange={e => f('amount', e.target.value)} /></FormField>
            <FormField label="Status"><Input value={form.status} onChange={e => f('status', e.target.value)} /></FormField>
            <FormField label="Notes" full><Input value={form.notes} onChange={e => f('notes', e.target.value)} /></FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn-primary" onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default function ConstructionWorkflows() {
  const {
    boqItems, addBoqItem, deleteBoqItem,
    purchaseOrders, addPurchaseOrder, deletePurchaseOrder,
    runningBills, addRunningBill, deleteRunningBill,
    changeOrders, addChangeOrder, deleteChangeOrder,
    snagItems, addSnagItem, deleteSnagItem,
  } = useApp()

  return (
    <div>
      <SectionHeader title="Construction Workflows" sub="BOQ, PO, running bills, change orders and snag list." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Board title="BOQ Items" rows={boqItems} onAdd={addBoqItem} onDelete={deleteBoqItem} />
        <Board title="Purchase Orders" rows={purchaseOrders} onAdd={addPurchaseOrder} onDelete={deletePurchaseOrder} />
        <Board title="Running Bills" rows={runningBills} onAdd={addRunningBill} onDelete={deleteRunningBill} />
        <Board title="Change Orders" rows={changeOrders} onAdd={addChangeOrder} onDelete={deleteChangeOrder} />
        <Board title="Snag List" rows={snagItems} onAdd={addSnagItem} onDelete={deleteSnagItem} />
      </div>
    </div>
  )
}

