import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, StatusBadge, Modal, FormGrid, FormField, Input, Select, EmptyState } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { validateOrThrow, timelineSchema } from '../lib/validation/schemas'
import { differenceInDays, parseISO, format } from 'date-fns'
import { Calendar, Edit2 } from 'lucide-react'

const STATUSES = ['Not Started','In Progress','Completed','Delayed']

export default function TimelineTracker() {
  const { timeline, updateTimeline, timelineDependencyImpact } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editPhase, setEditPhase] = useState(null)
  const [form, setForm] = useState({})

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleOpen = (t) => {
    setEditPhase(t.phase)
    setForm({ ...t })
    setShowModal(true)
  }

  const handleSubmit = () => {
    try {
      validateOrThrow(timelineSchema, { ...form, phase: editPhase })
    } catch {
      return
    }
    const delay = (() => {
      if (!form.plannedEnd || !form.actualEnd) return 0
      const d = differenceInDays(parseISO(form.actualEnd), parseISO(form.plannedEnd))
      return d > 0 ? d : 0
    })()
    updateTimeline(editPhase, { ...form, delayDays: delay })
    setShowModal(false)
  }

  const completed = timeline.filter(t => t.status === 'Completed').length
  const inProgress = timeline.filter(t => t.status === 'In Progress').length
  const delayed = timeline.filter(t => t.status === 'Delayed').length
  const notStarted = timeline.filter(t => t.status === 'Not Started').length

  // Gantt range
  const allDates = timeline.flatMap(t => [t.plannedStart, t.plannedEnd, t.actualStart, t.actualEnd].filter(Boolean))
  const minDate = allDates.length ? allDates.reduce((a, b) => a < b ? a : b) : null
  const maxDate = allDates.length ? allDates.reduce((a, b) => a > b ? a : b) : null
  const totalRange = minDate && maxDate ? differenceInDays(parseISO(maxDate), parseISO(minDate)) || 1 : 1

  const getBar = (start, end, minDate) => {
    if (!start || !end || !minDate) return null
    const left = (differenceInDays(parseISO(start), parseISO(minDate)) / totalRange) * 100
    const width = Math.max(0.5, (differenceInDays(parseISO(end), parseISO(start)) / totalRange) * 100)
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100 - left)}%` }
  }

  return (
    <div>
      <SectionHeader
        title="Timeline Tracker"
        sub="Schedule, actual progress and delay tracking"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <SumCard label="Completed" value={completed} color="#10B981" />
        <SumCard label="In Progress" value={inProgress} color="#3B82F6" />
        <SumCard label="Delayed" value={delayed} color={delayed > 0 ? '#EF4444' : 'var(--text-1)'} />
        <SumCard label="Not Started" value={notStarted} color="var(--text-2)" />
      </div>

      {/* Gantt Chart */}
      {minDate && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="#F59E0B" />
            Gantt View
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 700 }}>
              {/* Date ruler */}
              <div style={{ display: 'flex', marginLeft: 160, marginBottom: 8, position: 'relative', height: 20 }}>
                {[0, 25, 50, 75, 100].map(pct => (
                  <div key={pct} style={{ position: 'absolute', left: `${pct}%`, fontSize: 10, color: 'var(--text-3)', transform: 'translateX(-50%)' }}>
                    {minDate && maxDate ? format(new Date(parseISO(minDate).getTime() + (pct / 100) * totalRange * 86400000), 'MMM d') : ''}
                  </div>
                ))}
              </div>
              {timeline.map((t, i) => {
                const planned = getBar(t.plannedStart, t.plannedEnd, minDate)
                const actual = getBar(t.actualStart, t.actualEnd, minDate)
                const color = { Completed: '#10B981', 'In Progress': '#3B82F6', Delayed: '#EF4444', 'Not Started': '#374151' }[t.status]
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ width: 160, flexShrink: 0, fontSize: 12, color: 'var(--text-2)', paddingRight: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.phase}
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: 28 }}>
                      <div style={{ position: 'absolute', inset: '6px 0', background: 'var(--bg-3)', borderRadius: 3 }} />
                      {planned && (
                        <div style={{ position: 'absolute', left: planned.left, width: planned.width, top: 4, height: 12, background: `${color}40`, borderRadius: 2, border: `1px solid ${color}60` }} />
                      )}
                      {actual && (
                        <div style={{ position: 'absolute', left: actual.left, width: actual.width, top: 12, height: 12, background: color, borderRadius: 2 }} />
                      )}
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', marginLeft: 160, gap: 20, marginTop: 8 }}>
                <LegendItem color="#F59E0B40" label="Planned" />
                <LegendItem color="#F59E0B" label="Actual" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Phase</th><th>Planned Start</th><th>Planned End</th>
              <th>Actual Start</th><th>Actual End</th><th>Delay (days)</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((t, i) => (
              <tr key={i} style={{ background: t.status === 'Delayed' ? 'rgba(239,68,68,0.03)' : t.status === 'In Progress' ? 'rgba(59,130,246,0.02)' : undefined }}>
                <td style={{ fontWeight: 600 }}>{t.phase}</td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{t.plannedStart}</td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{t.plannedEnd}</td>
                <td style={{ color: '#3B82F6', fontSize: 12 }}>{t.actualStart}</td>
                <td style={{ color: '#10B981', fontSize: 12 }}>{t.actualEnd}</td>
                <td>
                  {(t.delayDays || 0) > 0 ? (
                    <span style={{ fontFamily: 'JetBrains Mono', color: '#EF4444', fontWeight: 700 }}>{t.delayDays}d</span>
                  ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                </td>
                <td><StatusBadge status={t.status} /></td>
                <td>
                  <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpen(t)}><Edit2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Dependency Risk View</h3>
        <table>
          <thead><tr><th>Phase</th><th>Depends On</th><th>Risk</th></tr></thead>
          <tbody>
            {timelineDependencyImpact.map(row => (
              <tr key={row.phase}>
                <td>{row.phase}</td>
                <td>{row.predecessor || '—'}</td>
                <td style={{ color: row.hasCriticalRisk ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                  {row.hasCriticalRisk ? 'Critical Risk' : 'Normal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={`Update: ${editPhase}`} onClose={() => setShowModal(false)}>
          <FormGrid>
            <FormField label="Status" full>
              <Select
                persistKey={DROPDOWN_KEYS.timelineStatus}
                options={STATUSES}
                allowEmpty={false}
                value={form.status}
                onChange={e => f('status', e.target.value)}
              />
            </FormField>
            <FormField label="Planned Start">
              <Input type="date" value={form.plannedStart} onChange={e => f('plannedStart', e.target.value)} />
            </FormField>
            <FormField label="Planned End">
              <Input type="date" value={form.plannedEnd} onChange={e => f('plannedEnd', e.target.value)} />
            </FormField>
            <FormField label="Actual Start">
              <Input type="date" value={form.actualStart} onChange={e => f('actualStart', e.target.value)} />
            </FormField>
            <FormField label="Actual End">
              <Input type="date" value={form.actualEnd} onChange={e => f('actualEnd', e.target.value)} />
            </FormField>
          </FormGrid>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>Update</button>
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
      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 28, fontWeight: 700, color: color || 'var(--text-1)' }}>{value}</p>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
      <div style={{ width: 20, height: 8, background: color, borderRadius: 2 }} />
      {label}
    </div>
  )
}
