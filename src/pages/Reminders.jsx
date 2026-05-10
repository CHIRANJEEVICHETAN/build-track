import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, FormField, FormGrid, Input, Modal, EmptyState } from '../components/ui'
import { Bell, Plus } from 'lucide-react'

const emptyForm = { title: '', dueAt: '', sourceModule: '', notes: '' }

export default function Reminders() {
  const { reminders, queueReminder, completeReminder, deleteReminder } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const onSave = () => {
    if (!form.title || !form.dueAt) return
    queueReminder(form)
    setForm({ ...emptyForm })
    setShowModal(false)
  }

  return (
    <div>
      <SectionHeader
        title="Reminder Center"
        sub="Track payment due reminders, delayed phases, approvals, and permit actions."
        action={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Add Reminder</button>}
      />

      <div className="table-container">
        {reminders.length === 0 ? <EmptyState icon={Bell} message="No reminders yet." /> : (
          <table>
            <thead><tr><th>Title</th><th>Due</th><th>Source</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {reminders.map(r => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{new Date(r.dueAt || r.due_at || Date.now()).toLocaleString('en-IN')}</td>
                  <td>{r.sourceModule || '-'}</td>
                  <td>{r.status}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {r.status !== 'done' && <button className="btn-secondary" onClick={() => completeReminder(r.id)}>Mark Done</button>}
                    <button className="btn-danger" onClick={() => deleteReminder(r.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Add Reminder" onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Title" full><Input value={form.title} onChange={e => f('title', e.target.value)} /></FormField>
            <FormField label="Due At"><Input type="datetime-local" value={form.dueAt} onChange={e => f('dueAt', e.target.value)} /></FormField>
            <FormField label="Source Module"><Input value={form.sourceModule} onChange={e => f('sourceModule', e.target.value)} /></FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={onSave}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

