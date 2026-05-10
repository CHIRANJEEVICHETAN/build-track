import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Input, FormGrid, FormField, Select, formatINRFull } from '../components/ui'
import { DROPDOWN_KEYS } from '../constants/dropdownKeys'
import { validateOrThrow, projectSchema } from '../lib/validation/schemas'
import { Save, Building2, Calendar, User2, Calculator } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'

const CONTRACTOR_TYPES = ['Labour Contract', 'Full Contract', 'Self Construction', 'Design & Build']

export default function ProjectOverview() {
  const { project, setProject, completionPct, totalSpent } = useApp()
  const [form, setForm] = useState({ ...project })
  const [saved, setSaved] = useState(false)

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = () => {
    try {
      validateOrThrow(projectSchema, form)
    } catch {
      return
    }
    setProject({ ...form, plannedBudget: parseFloat(form.plannedBudget) || 0 })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const today = new Date()
  const start = form.startDate ? parseISO(form.startDate) : null
  const end = form.endDate ? parseISO(form.endDate) : null
  const totalDays = start && end ? differenceInDays(end, start) : 0
  const elapsed = start ? Math.max(0, differenceInDays(today, start)) : 0
  const remaining = end ? Math.max(0, differenceInDays(end, today)) : 0
  const timeProgress = totalDays > 0 ? Math.min(100, Math.round((elapsed / totalDays) * 100)) : 0

  const budget = parseFloat(form.plannedBudget) || 0
  const buffer = budget * ((parseFloat(form.emergencyBuffer) || 10) / 100)
  const totalWithBuffer = budget + buffer

  return (
    <div>
      <SectionHeader
        title="Project Overview"
        sub="Master project information and configuration"
        action={
          <button className="btn-primary" onClick={handleSave}>
            <Save size={15} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Section icon={Building2} title="Project Details">
            <FormGrid>
              <FormField label="Project Name" full>
                <Input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. My Dream Home" />
              </FormField>
              <FormField label="Location">
                <Input value={form.location} onChange={e => f('location', e.target.value)} placeholder="City, State" />
              </FormField>
              <FormField label="Floors">
                <Input value={form.floors} onChange={e => f('floors', e.target.value)} placeholder="G+1, G+2..." />
              </FormField>
              <FormField label="Site Dimensions">
                <Input value={form.site} onChange={e => f('site', e.target.value)} placeholder="35' × 43'" />
              </FormField>
              <FormField label="Plot Area">
                <Input value={form.plotArea} onChange={e => f('plotArea', e.target.value)} placeholder="1505 sqft" />
              </FormField>
              <FormField label="Built-up Area">
                <Input value={form.builtUpArea} onChange={e => f('builtUpArea', e.target.value)} placeholder="2800 sqft" />
              </FormField>
              <FormField label="Contractor Type" full>
                <Select
                  persistKey={DROPDOWN_KEYS.contractorType}
                  options={CONTRACTOR_TYPES}
                  allowEmpty={false}
                  value={form.contractorType}
                  onChange={e => f('contractorType', e.target.value)}
                />
              </FormField>
            </FormGrid>
          </Section>

          <Section icon={Calendar} title="Schedule">
            <FormGrid>
              <FormField label="Start Date">
                <Input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} />
              </FormField>
              <FormField label="Expected Completion">
                <Input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)} />
              </FormField>
            </FormGrid>
            {totalDays > 0 && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-3)', borderRadius: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <StatBox label="Total Duration" value={`${totalDays} days`} />
                  <StatBox label="Days Elapsed" value={`${elapsed} days`} />
                  <StatBox label="Days Remaining" value={`${remaining} days`} color={remaining < 30 ? '#EF4444' : undefined} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                    <span>Time Elapsed</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#F59E0B' }}>{timeProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${timeProgress}%`, background: 'linear-gradient(90deg, #3B82F6, #06B6D4)' }} />
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section icon={User2} title="Team">
            <FormGrid>
              <FormField label="Architect Name">
                <Input value={form.architectName} onChange={e => f('architectName', e.target.value)} placeholder="Name / Firm" />
              </FormField>
              <FormField label="Site Engineer">
                <Input value={form.engineerName} onChange={e => f('engineerName', e.target.value)} placeholder="Name / Firm" />
              </FormField>
            </FormGrid>
          </Section>
        </div>

        {/* Budget sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section icon={Calculator} title="Budget Setup">
            <FormField label="Planned Budget (₹)">
              <Input type="number" value={form.plannedBudget} onChange={e => f('plannedBudget', e.target.value)} placeholder="5000000" />
            </FormField>
            <div style={{ marginTop: 12 }}>
              <FormField label="Emergency Buffer %">
                <Input type="number" value={form.emergencyBuffer} onChange={e => f('emergencyBuffer', e.target.value)} placeholder="10" min={0} max={50} />
              </FormField>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <BudgetLine label="Base Budget" value={formatINRFull(budget)} />
              <BudgetLine label={`Buffer (${form.emergencyBuffer || 10}%)`} value={formatINRFull(buffer)} color="#F59E0B" />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <BudgetLine label="Total with Buffer" value={formatINRFull(totalWithBuffer)} bold />
              </div>
              <BudgetLine label="Total Spent" value={formatINRFull(totalSpent)} color={totalSpent > budget ? '#EF4444' : '#10B981'} />
              <BudgetLine label="Available" value={formatINRFull(Math.max(0, totalWithBuffer - totalSpent))} color="#3B82F6" />
            </div>
          </Section>

          <div className="card" style={{ padding: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Construction Progress</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1E2A40" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#F59E0B" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50 * completionPct / 100} ${2 * Math.PI * 50}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 22, fontWeight: 700, color: '#F59E0B' }}>{completionPct}%</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Icon size={16} color="#F59E0B" />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: color || 'var(--text-1)' }}>{value}</p>
    </div>
  )
}

function BudgetLine({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: bold ? 700 : 600, color: color || 'var(--text-1)' }}>{value}</span>
    </div>
  )
}
