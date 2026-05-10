import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function formatINR(n) {
  const num = parseFloat(n) || 0
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`
  return `₹${num.toLocaleString('en-IN')}`
}

export function formatINRFull(n) {
  const num = parseFloat(n) || 0
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function StatusBadge({ status }) {
  const map = {
    'Paid': 'badge-green',
    'Completed': 'badge-green',
    'In Progress': 'badge-blue',
    'Pending': 'badge-yellow',
    'Partial': 'badge-yellow',
    'Not Started': 'badge-gray',
    'Delayed': 'badge-red',
    'Within Budget': 'badge-green',
    'Warning': 'badge-yellow',
    'Exceeded': 'badge-red',
    'Safe': 'badge-green',
    'Critical': 'badge-red',
    'Active': 'badge-green',
    'Inactive': 'badge-gray',
    'High': 'badge-red',
    'Medium': 'badge-yellow',
    'Low': 'badge-blue',
  }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-6">
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>
}

export function FormField({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

export function Input(props) {
  return <input className="input-field" {...props} />
}

export function Select({
  options = [],
  persistKey,
  emptyLabel = '— Select —',
  allowEmpty = true,
  value,
  onChange,
  disabled,
  className,
  style,
  ...rest
}) {
  const { mergedDropdownOptions, addDropdownOption } = useApp()
  const opts = persistKey ? mergedDropdownOptions(persistKey, options) : [...options]
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const selectEl = (
    <select
      className={`input-field${className ? ` ${className}` : ''}`}
      style={persistKey ? { flex: 1, minWidth: 0, ...style } : style}
      value={value}
      onChange={onChange}
      disabled={disabled}
      {...rest}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {opts.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )

  const commitAdd = () => {
    if (!persistKey) return
    const t = draft.trim()
    if (!t) return
    addDropdownOption(persistKey, t, options)
    onChange?.({ target: { value: t } })
    setDraft('')
    setAdding(false)
  }

  if (!persistKey) {
    return selectEl
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
        {selectEl}
        <button
          type="button"
          className="btn-secondary"
          style={{ flexShrink: 0, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setAdding(a => !a); setDraft('') }}
          title="Add new option"
          aria-label="Add new option"
        >
          <Plus size={17} strokeWidth={2.25} />
        </button>
      </div>
      {adding && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input-field"
            placeholder="New option name…"
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), commitAdd())}
            style={{ flex: '1 1 160px', minWidth: 120 }}
          />
          <button type="button" className="btn-primary" onClick={commitAdd}>Add</button>
          <button type="button" className="btn-secondary" onClick={() => { setAdding(false); setDraft('') }}>Cancel</button>
        </div>
      )}
    </div>
  )
}

export function KpiCard({ label, value, sub, color = 'var(--amber)', icon: Icon }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {Icon && <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>}
      </div>
      <div className="stat-number" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  )
}

export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      {Icon && <Icon size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />}
      <p style={{ fontSize: 14 }}>{message || 'No data yet. Add your first entry.'}</p>
    </div>
  )
}
