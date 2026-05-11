import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Input } from '../components/ui'
import { parseCsvText, mapRows } from '../lib/import/csvImport'
import { Upload } from 'lucide-react'
import { STORAGE_KEYS } from '../lib/storageKeys'

const expenseMapping = {
  date: 'date',
  phase: 'phase',
  category: 'category',
  description: 'description',
  vendor: 'vendor',
  paymentMode: 'paymentMode',
  amount: 'amount',
  gst: 'gst',
  status: 'status',
  notes: 'notes',
}

export default function SearchAndImport() {
  const { expenses, materials, otherDebts, vendors, laborers, addExpense } = useApp()
  const [query, setQuery] = useState('')
  const [previewRows, setPreviewRows] = useState([])

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []
    const all = [
      ...expenses.map(e => ({ type: 'Expense', text: `${e.id} ${e.description} ${e.vendor}` })),
      ...materials.map(m => ({ type: 'Material', text: `${m.id} ${m.name} ${m.vendor}` })),
      ...otherDebts.map(d => ({ type: 'Other debt', text: `${d.id} ${d.title} ${d.creditorName || ''}` })),
      ...vendors.map(v => ({ type: 'Vendor', text: `${v.id} ${v.name} ${v.workType}` })),
      ...laborers.map(l => ({ type: 'Labor', text: `${l.id} ${l.name} ${l.role}` })),
    ]
    return all.filter(x => x.text.toLowerCase().includes(q)).slice(0, 60)
  }, [query, expenses, materials, otherDebts, vendors, laborers])

  const onCsvFile = async (file) => {
    const text = await file.text()
    const rows = parseCsvText(text)
    setPreviewRows(mapRows(rows, expenseMapping))
  }

  const importExpenses = () => {
    previewRows.forEach(row => addExpense({ ...row, total: Number(row.amount || 0) + (Number(row.amount || 0) * Number(row.gst || 0) / 100) }))
    setPreviewRows([])
  }

  const exportBackup = () => {
    const state = localStorage.getItem(STORAGE_KEYS.legacyState) || '{}'
    const blob = new Blob([state], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buildtrack-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <SectionHeader title="Search + CSV Import" sub="Global search (expenses, materials, other debts, vendors, labor) and CSV import (expenses)." />
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <Input placeholder="Search across expenses, materials, other debts, vendors, labor..." value={query} onChange={e => setQuery(e.target.value)} />
        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          {results.map((r, idx) => (
            <div key={idx} style={{ fontSize: 13, background: 'var(--bg-3)', borderRadius: 8, padding: '8px 10px' }}>
              <b>{r.type}</b> · {r.text}
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button className="btn-secondary" onClick={exportBackup}>Export Full Backup JSON</button>
        </div>
        <label className="btn-secondary" style={{ display: 'inline-flex', gap: 8, cursor: 'pointer' }}>
          <Upload size={14} />
          Upload Expenses CSV
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && onCsvFile(e.target.files[0])} />
        </label>
        {previewRows.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Preview rows: {previewRows.length}</p>
            <button className="btn-primary" onClick={importExpenses}>Import Previewed Rows</button>
          </div>
        )}
      </div>
    </div>
  )
}

