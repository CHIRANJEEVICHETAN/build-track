import { useApp } from '../context/AppContext'
import { SectionHeader, EmptyState } from '../components/ui'
import { History } from 'lucide-react'

export default function AuditTrail() {
  const { auditEvents } = useApp()
  return (
    <div>
      <SectionHeader title="Audit Trail" sub="Create / update / delete history across tracked entities." />
      <div className="table-container">
        {auditEvents.length === 0 ? <EmptyState icon={History} message="No audit events yet." /> : (
          <table>
            <thead><tr><th>When</th><th>Entity</th><th>ID</th><th>Action</th></tr></thead>
            <tbody>
              {auditEvents.map(a => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt || Date.now()).toLocaleString('en-IN')}</td>
                  <td>{a.entityType}</td>
                  <td>{a.entityId}</td>
                  <td>{a.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

