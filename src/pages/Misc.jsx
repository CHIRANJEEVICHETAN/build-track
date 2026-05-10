import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Modal, FormGrid, FormField, Input, Select, EmptyState, formatINR, formatINRFull } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { Plus, Camera, FileText, TrendingUp, Edit2, Trash2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import { uploadDocumentFile, deleteDocumentFile, getDocumentSignedUrl } from '../lib/storage/documents'

// ─── SITE PROGRESS ─────────────────────────────────────────────────────────

const emptyProgress = { date: '', phase: '', workCompleted: '', completionPct: '', issues: '', nextSteps: '' }

export function SiteProgress() {
  const { siteProgress, addSiteProgress, deleteSiteProgress, phaseNames } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyProgress })
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = () => {
    if (!form.date || !form.phase) return
    addSiteProgress(form)
    setForm({ ...emptyProgress })
    setShowModal(false)
  }

  return (
    <div>
      <SectionHeader
        title="Site Progress"
        sub="Daily construction activity log"
        action={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Log Progress</button>}
      />
      <div className="table-container">
        {siteProgress.length === 0 ? (
          <EmptyState icon={Camera} message="No progress entries yet. Log your daily construction activity." />
        ) : (
          <table>
            <thead>
              <tr><th>Date</th><th>Phase</th><th>Work Completed</th><th>%</th><th>Issues</th><th>Next Steps</th><th></th></tr>
            </thead>
            <tbody>
              {siteProgress.map(s => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{s.date}</td>
                  <td><span className="badge badge-blue">{s.phase}</span></td>
                  <td style={{ maxWidth: 220 }}>{s.workCompleted}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{s.completionPct}%</span>
                      <div style={{ width: 50, height: 4, background: 'var(--bg-4)', borderRadius: 2 }}>
                        <div style={{ width: `${Math.min(100, s.completionPct)}%`, height: '100%', background: '#F59E0B', borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ color: s.issues ? '#EF4444' : 'var(--text-3)', fontSize: 12 }}>{s.issues || '—'}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12, maxWidth: 180 }}>{s.nextSteps}</td>
                  <td><button className="btn-danger" onClick={() => deleteSiteProgress(s.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <Modal title="Log Site Progress" onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Date"><Input type="date" value={form.date} onChange={e => f('date', e.target.value)} /></FormField>
            <FormField label="Phase"><Select persistKey={DROPDOWN_KEYS.phase} options={phaseNames} value={form.phase} onChange={e => f('phase', e.target.value)} /></FormField>
            <FormField label="Work Completed" full><Input value={form.workCompleted} onChange={e => f('workCompleted', e.target.value)} placeholder="Describe work done today..." /></FormField>
            <FormField label="Completion %"><Input type="number" value={form.completionPct} onChange={e => f('completionPct', e.target.value)} placeholder="0-100" min={0} max={100} /></FormField>
            <FormField label="Issues (if any)"><Input value={form.issues} onChange={e => f('issues', e.target.value)} placeholder="Any problems?" /></FormField>
            <FormField label="Next Steps" full><Input value={form.nextSteps} onChange={e => f('nextSteps', e.target.value)} placeholder="Plan for tomorrow..." /></FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>Log Progress</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── DOCUMENT TRACKER ───────────────────────────────────────────────────────

const DOC_TYPES = ['Invoice','Receipt','Approval','Drawing','Warranty','Contract','Quotation','Bank Statement','Insurance','Permit','Other']

const emptyDoc = { type: '', fileName: '', date: '', vendor: '', remarks: '', filePath: '', fileUrl: '' }

export function DocumentTracker() {
  const openDocument = async (doc) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (doc.filePath) {
      const signed = await getDocumentSignedUrl(doc.filePath)
      if (signed) window.open(signed, '_blank', 'noopener,noreferrer')
    }
  }

  const { documents, addDocument, deleteDocument, vendors, mergedDropdownOptions } = useApp()
  const docTypeOptions = mergedDropdownOptions(DROPDOWN_KEYS.docType, DOC_TYPES)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyDoc })
  const [uploading, setUploading] = useState(false)
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async () => {
    if (!form.fileName) return
    addDocument(form)
    setForm({ ...emptyDoc })
    setShowModal(false)
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const up = await uploadDocumentFile(file)
      setForm(prev => ({
        ...prev,
        fileName: prev.fileName || file.name,
        filePath: up.filePath || '',
        fileUrl: up.publicUrl || '',
      }))
    } catch (error) {
      console.error('Document upload failed', error)
    } finally {
      setUploading(false)
    }
  }

  const typeCount = docTypeOptions.reduce((acc, t) => {
    acc[t] = documents.filter(d => d.type === t).length
    return acc
  }, {})

  return (
    <div>
      <SectionHeader
        title="Document Tracker"
        sub={`${documents.length} documents tracked`}
        action={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15} />Add Document</button>}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {docTypeOptions.filter(t => typeCount[t] > 0).map(t => (
          <span key={t} className="badge badge-gray">{t}: {typeCount[t]}</span>
        ))}
      </div>
      <div className="table-container">
        {documents.length === 0 ? (
          <EmptyState icon={FileText} message="No documents tracked yet. Add your invoices, contracts, and permits." />
        ) : (
          <table>
            <thead>
              <tr><th>Type</th><th>File Name</th><th>Date</th><th>Vendor</th><th>Remarks</th><th></th></tr>
            </thead>
            <tbody>
              {documents.map(d => (
                <tr key={d.id}>
                  <td><span className="badge badge-blue">{d.type}</span></td>
                  <td style={{ fontWeight: 600, color: '#3B82F6' }}>
                    {(d.filePath || d.fileUrl)
                      ? <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => openDocument(d)}>{d.fileName}</button>
                      : d.fileName}
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{d.date}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{d.vendor}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{d.remarks}</td>
                  <td>
                    <button
                      className="btn-danger"
                      onClick={async () => {
                        if (d.filePath) await deleteDocumentFile(d.filePath)
                        deleteDocument(d.id)
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <Modal title="Add Document" onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Document Type"><Select persistKey={DROPDOWN_KEYS.docType} options={DOC_TYPES} value={form.type} onChange={e => f('type', e.target.value)} /></FormField>
            <FormField label="File Name / Reference"><Input value={form.fileName} onChange={e => f('fileName', e.target.value)} placeholder="INV-2024-001.pdf" /></FormField>
            <FormField label="Upload File" full>
              <input type="file" className="input-field" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              {uploading && <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>Uploading...</p>}
            </FormField>
            <FormField label="Date"><Input type="date" value={form.date} onChange={e => f('date', e.target.value)} /></FormField>
            <FormField label="Related Vendor"><Input value={form.vendor} onChange={e => f('vendor', e.target.value)} placeholder="Vendor / Party name" /></FormField>
            <FormField label="Remarks" full><Input value={form.remarks} onChange={e => f('remarks', e.target.value)} placeholder="Any notes..." /></FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>Add Document</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── CASH FLOW PLANNER ──────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const emptyCF = { month: '', year: new Date().getFullYear(), plannedSpend: '', actualSpend: '', upcomingExpenses: '', notes: '' }

export function CashFlow() {
  const { cashFlow, addCashFlow, updateCashFlow, deleteCashFlow, expenses } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...emptyCF })
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleOpen = (cf = null) => {
    if (cf) { setForm({ ...cf }); setEditId(cf.id) }
    else { setForm({ ...emptyCF }); setEditId(null) }
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.month) return
    const diff = (parseFloat(form.plannedSpend) || 0) - (parseFloat(form.actualSpend) || 0)
    const data = { ...form, diff }
    if (editId) { updateCashFlow(editId, data); setEditId(null) }
    else addCashFlow(data)
    setShowModal(false)
    setForm({ ...emptyCF })
  }

  const totalPlanned = cashFlow.reduce((s, c) => s + (parseFloat(c.plannedSpend) || 0), 0)
  const totalActual = cashFlow.reduce((s, c) => s + (parseFloat(c.actualSpend) || 0), 0)

  const monthIndex = (m) => {
    const i = MONTHS.indexOf(m)
    return i >= 0 ? i : 999
  }
  const chartData = [...cashFlow].sort((a, b) => {
    const y = (a.year || 0) - (b.year || 0)
    if (y !== 0) return y
    return monthIndex(a.month) - monthIndex(b.month)
  }).map(c => ({
    name: `${c.month} ${c.year}`,
    Planned: parseFloat(c.plannedSpend) || 0,
    Actual: parseFloat(c.actualSpend) || 0,
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1A2035', border: '1px solid #1E2A40', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
        <p style={{ color: '#94A3B8', marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>
          {p.name}: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>₹{(p.value||0).toLocaleString('en-IN')}</span>
        </p>)}
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Cash Flow Planner"
        sub="Monthly financial planning and projections"
        action={<button className="btn-primary" onClick={() => handleOpen()}><Plus size={15} />Add Month</button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <SumCard label="Total Planned" value={formatINR(totalPlanned)} color="#3B82F6" />
        <SumCard label="Total Actual" value={formatINR(totalActual)} color="#F59E0B" />
        <SumCard label="Variance" value={formatINR(Math.abs(totalPlanned - totalActual))} color={totalActual > totalPlanned ? '#EF4444' : '#10B981'} />
      </div>
      {chartData.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Monthly Cash Flow</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => formatINR(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="Planned" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="table-container">
        {cashFlow.length === 0 ? (
          <EmptyState icon={TrendingUp} message="No cash flow data yet. Add monthly plans." />
        ) : (
          <table>
            <thead>
              <tr><th>Month</th><th>Planned Spend</th><th>Actual Spend</th><th>Variance</th><th>Upcoming Expenses</th><th>Notes</th><th></th></tr>
            </thead>
            <tbody>
              {cashFlow.map(c => {
                const diff = (parseFloat(c.plannedSpend)||0) - (parseFloat(c.actualSpend)||0)
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.month} {c.year}</td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#3B82F6' }}>₹{parseFloat(c.plannedSpend||0).toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', color: '#F59E0B' }}>₹{parseFloat(c.actualSpend||0).toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: diff >= 0 ? '#10B981' : '#EF4444' }}>{diff >= 0 ? '+' : ''}{formatINRFull(diff)}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{c.upcomingExpenses}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{c.notes}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpen(c)}><Edit2 size={12} /></button>
                        <button className="btn-danger" onClick={() => deleteCashFlow(c.id)}>✕</button>
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
        <Modal title={editId ? 'Edit Month' : 'Add Month'} onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Month">
              <Select persistKey={DROPDOWN_KEYS.cashflowMonth} options={MONTHS} value={form.month} onChange={e => f('month', e.target.value)} />
            </FormField>
            <FormField label="Year">
              <Input type="number" value={form.year} onChange={e => f('year', e.target.value)} />
            </FormField>
            <FormField label="Planned Spend (₹)">
              <Input type="number" value={form.plannedSpend} onChange={e => f('plannedSpend', e.target.value)} />
            </FormField>
            <FormField label="Actual Spend (₹)">
              <Input type="number" value={form.actualSpend} onChange={e => f('actualSpend', e.target.value)} />
            </FormField>
            <FormField label="Upcoming Major Expenses" full>
              <Input value={form.upcomingExpenses} onChange={e => f('upcomingExpenses', e.target.value)} placeholder="e.g. Steel delivery ₹2L, Electrician payment..." />
            </FormField>
            <FormField label="Notes" full>
              <Input value={form.notes} onChange={e => f('notes', e.target.value)} />
            </FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>{editId ? 'Update' : 'Add Month'}</button>
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
