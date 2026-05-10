import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, FormGrid, FormField, Input, Modal } from '../components/ui'
import { Plus } from 'lucide-react'

const emptyPay = { entityId: '', amount: '', mode: 'UPI', reference: '', notes: '', date: '' }
const emptyRec = { bankDate: '', bankAmount: '', mappedPaymentId: '', status: 'Unmatched', notes: '' }

export default function PaymentReconciliation() {
  const { paymentEvents, addPaymentEvent, deletePaymentEvent, reconciliationEntries, addReconciliationEntry, deleteReconciliationEntry } = useApp()
  const [payModal, setPayModal] = useState(false)
  const [recModal, setRecModal] = useState(false)
  const [payForm, setPayForm] = useState({ ...emptyPay })
  const [recForm, setRecForm] = useState({ ...emptyRec })
  const fp = (k, v) => setPayForm(prev => ({ ...prev, [k]: v }))
  const fr = (k, v) => setRecForm(prev => ({ ...prev, [k]: v }))

  return (
    <div>
      <SectionHeader title="Payment & Reconciliation" sub="Track partial payments and reconcile with bank statements." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Payment Ledger</h3>
            <button className="btn-secondary" onClick={() => setPayModal(true)}><Plus size={12} />Add Payment</button>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Entity</th><th>Amount</th><th>Mode</th><th></th></tr></thead>
            <tbody>
              {paymentEvents.map(p => (
                <tr key={p.id}>
                  <td>{p.date}</td><td>{p.entityId}</td><td>₹{Number(p.amount || 0).toLocaleString('en-IN')}</td><td>{p.mode}</td>
                  <td><button className="btn-danger" onClick={() => deletePaymentEvent(p.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Bank Reconciliation</h3>
            <button className="btn-secondary" onClick={() => setRecModal(true)}><Plus size={12} />Add Entry</button>
          </div>
          <table>
            <thead><tr><th>Bank Date</th><th>Amount</th><th>Mapped Payment</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {reconciliationEntries.map(r => (
                <tr key={r.id}>
                  <td>{r.bankDate}</td><td>₹{Number(r.bankAmount || 0).toLocaleString('en-IN')}</td><td>{r.mappedPaymentId || '-'}</td><td>{r.status}</td>
                  <td><button className="btn-danger" onClick={() => deleteReconciliationEntry(r.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {payModal && (
        <Modal title="Add Payment Event" onClose={() => setPayModal(false)}>
          <FormGrid>
            <FormField label="Date"><Input type="date" value={payForm.date} onChange={e => fp('date', e.target.value)} /></FormField>
            <FormField label="Entity ID"><Input value={payForm.entityId} onChange={e => fp('entityId', e.target.value)} /></FormField>
            <FormField label="Amount"><Input type="number" value={payForm.amount} onChange={e => fp('amount', e.target.value)} /></FormField>
            <FormField label="Mode"><Input value={payForm.mode} onChange={e => fp('mode', e.target.value)} /></FormField>
            <FormField label="Reference"><Input value={payForm.reference} onChange={e => fp('reference', e.target.value)} /></FormField>
            <FormField label="Notes"><Input value={payForm.notes} onChange={e => fp('notes', e.target.value)} /></FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn-primary" onClick={() => { addPaymentEvent(payForm); setPayForm({ ...emptyPay }); setPayModal(false) }}>Save</button>
          </div>
        </Modal>
      )}
      {recModal && (
        <Modal title="Add Reconciliation Entry" onClose={() => setRecModal(false)}>
          <FormGrid>
            <FormField label="Bank Date"><Input type="date" value={recForm.bankDate} onChange={e => fr('bankDate', e.target.value)} /></FormField>
            <FormField label="Bank Amount"><Input type="number" value={recForm.bankAmount} onChange={e => fr('bankAmount', e.target.value)} /></FormField>
            <FormField label="Mapped Payment ID"><Input value={recForm.mappedPaymentId} onChange={e => fr('mappedPaymentId', e.target.value)} /></FormField>
            <FormField label="Status"><Input value={recForm.status} onChange={e => fr('status', e.target.value)} /></FormField>
            <FormField label="Notes" full><Input value={recForm.notes} onChange={e => fr('notes', e.target.value)} /></FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn-primary" onClick={() => { addReconciliationEntry(recForm); setRecForm({ ...emptyRec }); setRecModal(false) }}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

