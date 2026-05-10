import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, hasSupabaseConfig } from '../lib/supabaseClient'
import { repos } from '../lib/repositories'
import { STORAGE_KEYS } from '../lib/storageKeys'
import { exportCurrentLocalBackup, hasCompletedMigration, markMigrationCompleted, readLegacyState } from '../lib/sync/migration'

const AppContext = createContext(null)

const DEFAULT_PHASES = [
  { id: 'PH-01', name: 'Pre-Construction', priority: 'High', plannedStart: '', plannedEnd: '' },
  { id: 'PH-02', name: 'Excavation', priority: 'High', plannedStart: '', plannedEnd: '' },
  { id: 'PH-03', name: 'Foundation', priority: 'High', plannedStart: '', plannedEnd: '' },
  { id: 'PH-04', name: 'Footings', priority: 'High', plannedStart: '', plannedEnd: '' },
  { id: 'PH-05', name: 'Columns', priority: 'High', plannedStart: '', plannedEnd: '' },
  { id: 'PH-06', name: 'Beams', priority: 'High', plannedStart: '', plannedEnd: '' },
  { id: 'PH-07', name: 'Slab', priority: 'High', plannedStart: '', plannedEnd: '' },
  { id: 'PH-08', name: 'Brick Work', priority: 'Medium', plannedStart: '', plannedEnd: '' },
  { id: 'PH-09', name: 'Plumbing', priority: 'Medium', plannedStart: '', plannedEnd: '' },
  { id: 'PH-10', name: 'Electrical', priority: 'Medium', plannedStart: '', plannedEnd: '' },
  { id: 'PH-11', name: 'Plastering', priority: 'Medium', plannedStart: '', plannedEnd: '' },
  { id: 'PH-12', name: 'Flooring', priority: 'Medium', plannedStart: '', plannedEnd: '' },
  { id: 'PH-13', name: 'Painting', priority: 'Low', plannedStart: '', plannedEnd: '' },
  { id: 'PH-14', name: 'Woodwork', priority: 'Low', plannedStart: '', plannedEnd: '' },
  { id: 'PH-15', name: 'Elevation', priority: 'Low', plannedStart: '', plannedEnd: '' },
  { id: 'PH-16', name: 'Interiors', priority: 'Low', plannedStart: '', plannedEnd: '' },
  { id: 'PH-17', name: 'Compound', priority: 'Low', plannedStart: '', plannedEnd: '' },
  { id: 'PH-18', name: 'Final Finishing', priority: 'Low', plannedStart: '', plannedEnd: '' },
]

const DEFAULT_PROJECT = {
  name: 'My House Construction',
  site: "35' × 43'",
  plotArea: '1505 sqft',
  builtUpArea: '2800 sqft',
  floors: 'G+1',
  location: 'Bengaluru',
  contractorType: 'Labour Contract',
  startDate: '',
  endDate: '',
  plannedBudget: 5000000,
  emergencyBuffer: 10,
  architectName: '',
  engineerName: '',
}

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEYS.legacyState)
    if (s) return JSON.parse(s)
  } catch {}
  return null
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.legacyState, JSON.stringify(state))
  } catch {}
}

let expCount = 1
let matCount = 1
let venCount = 1
let workerCount = 1

function genId(prefix, list, field = 'id') {
  const nums = list.map(i => parseInt((i[field] || '').replace(/\D/g, '')) || 0)
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix}-${String(next).padStart(4, '0')}`
}

export function AppProvider({ children, session }) {
  const saved = loadState()
  const userId = session?.user?.id || null
  const scopedId = useCallback((raw) => {
    if (!userId) return String(raw)
    return `${userId}:${raw}`
  }, [userId])

  const [project, setProject] = useState(saved?.project || DEFAULT_PROJECT)
  const [phases, setPhases] = useState(saved?.phases || DEFAULT_PHASES)
  const [expenses, setExpenses] = useState(saved?.expenses || [])
  const [materials, setMaterials] = useState(saved?.materials || [])
  const [laborers, setLaborers] = useState(saved?.laborers || [])
  const [vendors, setVendors] = useState(saved?.vendors || [])
  const [timeline, setTimeline] = useState(saved?.timeline || DEFAULT_PHASES.map(p => ({
    phase: p.name,
    plannedStart: '',
    plannedEnd: '',
    actualStart: '',
    actualEnd: '',
    status: 'Not Started',
  })))
  const [siteProgress, setSiteProgress] = useState(saved?.siteProgress || [])
  const [documents, setDocuments] = useState(saved?.documents || [])
  const [cashFlow, setCashFlow] = useState(saved?.cashFlow || [])
  const [customLists, setCustomLists] = useState(saved?.customLists || {})
  const [auditEvents, setAuditEvents] = useState(saved?.auditEvents || [])
  const [reminders, setReminders] = useState(saved?.reminders || [])
  const [boqItems, setBoqItems] = useState(saved?.boqItems || [])
  const [purchaseOrders, setPurchaseOrders] = useState(saved?.purchaseOrders || [])
  const [runningBills, setRunningBills] = useState(saved?.runningBills || [])
  const [changeOrders, setChangeOrders] = useState(saved?.changeOrders || [])
  const [snagItems, setSnagItems] = useState(saved?.snagItems || [])
  const [paymentEvents, setPaymentEvents] = useState(saved?.paymentEvents || [])
  const [reconciliationEntries, setReconciliationEntries] = useState(saved?.reconciliationEntries || [])
  const [loadingCloud, setLoadingCloud] = useState(false)

  const mergedDropdownOptions = useCallback((key, defaults = []) => {
    const extras = customLists[key] || []
    const seen = new Set()
    const out = []
    for (const item of [...defaults, ...extras]) {
      const s = String(item ?? '').trim()
      if (!s || seen.has(s)) continue
      seen.add(s)
      out.push(s)
    }
    return out
  }, [customLists])

  const addDropdownOption = useCallback((key, raw, defaults = []) => {
    const t = String(raw ?? '').trim()
    if (!t) return
    const merged = mergedDropdownOptions(key, defaults)
    if (merged.includes(t)) return
    setCustomLists(prev => ({ ...prev, [key]: [...(prev[key] || []), t] }))
  }, [mergedDropdownOptions])

  const addAuditEvent = useCallback((evt) => {
    const next = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...evt,
    }
    setAuditEvents(prev => [next, ...prev].slice(0, 5000))
    return next
  }, [])

  const queueReminder = useCallback((rem) => {
    const item = {
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...rem,
    }
    setReminders(prev => [item, ...prev])
    return item
  }, [])

  const completeReminder = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'done' } : r))
  const deleteReminder = (id) => setReminders(prev => prev.filter(r => r.id !== id))

  const addBoqItem = (row) => setBoqItems(prev => [{ ...row, id: crypto.randomUUID() }, ...prev])
  const updateBoqItem = (id, patch) => setBoqItems(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  const deleteBoqItem = (id) => setBoqItems(prev => prev.filter(r => r.id !== id))

  const addPurchaseOrder = (row) => setPurchaseOrders(prev => [{ ...row, id: crypto.randomUUID() }, ...prev])
  const updatePurchaseOrder = (id, patch) => setPurchaseOrders(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  const deletePurchaseOrder = (id) => setPurchaseOrders(prev => prev.filter(r => r.id !== id))

  const addRunningBill = (row) => setRunningBills(prev => [{ ...row, id: crypto.randomUUID() }, ...prev])
  const updateRunningBill = (id, patch) => setRunningBills(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  const deleteRunningBill = (id) => setRunningBills(prev => prev.filter(r => r.id !== id))

  const addChangeOrder = (row) => setChangeOrders(prev => [{ ...row, id: crypto.randomUUID() }, ...prev])
  const updateChangeOrder = (id, patch) => setChangeOrders(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  const deleteChangeOrder = (id) => setChangeOrders(prev => prev.filter(r => r.id !== id))

  const addSnagItem = (row) => setSnagItems(prev => [{ ...row, id: crypto.randomUUID() }, ...prev])
  const updateSnagItem = (id, patch) => setSnagItems(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
  const deleteSnagItem = (id) => setSnagItems(prev => prev.filter(r => r.id !== id))

  const addPaymentEvent = (row) => setPaymentEvents(prev => [{ ...row, id: crypto.randomUUID() }, ...prev])
  const deletePaymentEvent = (id) => setPaymentEvents(prev => prev.filter(r => r.id !== id))
  const addReconciliationEntry = (row) => setReconciliationEntries(prev => [{ ...row, id: crypto.randomUUID() }, ...prev])
  const deleteReconciliationEntry = (id) => setReconciliationEntries(prev => prev.filter(r => r.id !== id))

  const snapshot = useMemo(() => ({
    project, phases, expenses, materials, laborers, vendors, timeline, siteProgress,
    documents, cashFlow, customLists, auditEvents, reminders, boqItems, purchaseOrders,
    runningBills, changeOrders, snagItems, paymentEvents, reconciliationEntries,
  }), [
    project, phases, expenses, materials, laborers, vendors, timeline, siteProgress,
    documents, cashFlow, customLists, auditEvents, reminders, boqItems, purchaseOrders,
    runningBills, changeOrders, snagItems, paymentEvents, reconciliationEntries,
  ])

  useEffect(() => {
    saveState(snapshot)
  }, [snapshot])

  const migrateLegacyToSupabase = useCallback(async () => {
    if (!hasSupabaseConfig || hasCompletedMigration() || !userId) return
    const legacy = readLegacyState()
    if (!legacy) return
    exportCurrentLocalBackup()
    try {
      await repos.projects.upsert([{ user_id: userId, payload: legacy.project || DEFAULT_PROJECT }], 'user_id')
      await repos.phases.upsert((legacy.phases || []).map(p => ({
        user_id: userId,
        id: scopedId(p.id),
        name: p.name,
        priority: p.priority,
        planned_start: p.plannedStart || null,
        planned_end: p.plannedEnd || null,
      })), 'id')
      await repos.timelineEntries.upsert((legacy.timeline || []).map(t => ({ user_id: userId, phase: t.phase, payload: t })))
      await repos.expenses.upsert((legacy.expenses || []).map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
      await repos.materials.upsert((legacy.materials || []).map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
      await repos.laborers.upsert((legacy.laborers || []).map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
      await repos.vendors.upsert((legacy.vendors || []).map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
      await repos.siteProgress.upsert((legacy.siteProgress || []).map((e, i) => ({ user_id: userId, id: Number(e.id) || (Date.now() + i), payload: e })), 'id')
      await repos.documents.upsert((legacy.documents || []).map((e, i) => ({ user_id: userId, id: Number(e.id) || (Date.now() + i), payload: e })), 'id')
      await repos.cashflow.upsert((legacy.cashFlow || []).map((e, i) => ({ user_id: userId, id: Number(e.id) || (Date.now() + i), payload: e })), 'id')
      const customRows = Object.entries(legacy.customLists || {}).flatMap(([listKey, values]) =>
        (values || []).map(v => ({ user_id: userId, list_key: listKey, option_value: String(v || '').trim() })).filter(v => v.option_value),
      )
      await repos.customLists.upsert(customRows, 'user_id,list_key,option_value')
      markMigrationCompleted()
    } catch (error) {
      console.error('Legacy migration failed', error)
    }
  }, [userId, scopedId])

  const loadCloudData = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !userId) return
    setLoadingCloud(true)
    try {
      const [
        prj, phaseRows, expRows, matRows, laborRows, vendorRows, tRows, siteRows, docRows, cfRows,
        customRows, reminderRows, auditRows, boqRows, poRows, rbRows, coRows, snagRows, payRows, recRows,
      ] = await Promise.all([
        repos.projects.list(),
        repos.phases.list(),
        repos.expenses.list(),
        repos.materials.list(),
        repos.laborers.list(),
        repos.vendors.list(),
        repos.timelineEntries.list(),
        repos.siteProgress.list(),
        repos.documents.list(),
        repos.cashflow.list(),
        repos.customLists.list(),
        repos.reminders.list(),
        repos.auditEvents.list(),
        repos.boqItems.list(),
        repos.purchaseOrders.list(),
        repos.runningBills.list(),
        repos.changeOrders.list(),
        repos.snagItems.list(),
        repos.paymentEvents.list(),
        repos.reconciliationEntries.list(),
      ])
      if (prj[0]?.payload) setProject(prj[0].payload)
      if (phaseRows.length) setPhases(phaseRows.map(p => ({
        id: String(p.id || '').split(':').pop(), name: p.name, priority: p.priority, plannedStart: p.planned_start || '', plannedEnd: p.planned_end || '',
      })))
      if (expRows.length) setExpenses(expRows.map(r => r.payload))
      if (matRows.length) setMaterials(matRows.map(r => r.payload))
      if (laborRows.length) setLaborers(laborRows.map(r => r.payload))
      if (vendorRows.length) setVendors(vendorRows.map(r => r.payload))
      if (tRows.length) setTimeline(tRows.map(r => r.payload))
      if (siteRows.length) setSiteProgress(siteRows.map(r => r.payload))
      if (docRows.length) setDocuments(docRows.map(r => r.payload))
      if (cfRows.length) setCashFlow(cfRows.map(r => r.payload))
      if (customRows.length) {
        const next = {}
        for (const r of customRows) {
          next[r.list_key] = [...(next[r.list_key] || []), r.option_value]
        }
        setCustomLists(next)
      }
      if (reminderRows.length) setReminders(reminderRows.map(r => r.payload || r))
      if (auditRows.length) setAuditEvents(auditRows.map(r => r.payload || r))
      if (boqRows.length) setBoqItems(boqRows.map(r => r.payload || r))
      if (poRows.length) setPurchaseOrders(poRows.map(r => r.payload || r))
      if (rbRows.length) setRunningBills(rbRows.map(r => r.payload || r))
      if (coRows.length) setChangeOrders(coRows.map(r => r.payload || r))
      if (snagRows.length) setSnagItems(snagRows.map(r => r.payload || r))
      if (payRows.length) setPaymentEvents(payRows.map(r => r.payload || r))
      if (recRows.length) setReconciliationEntries(recRows.map(r => r.payload || r))
    } catch (error) {
      console.error('Cloud load failed', error)
    } finally {
      setLoadingCloud(false)
    }
  }, [userId])

  useEffect(() => {
    migrateLegacyToSupabase()
    loadCloudData()
  }, [migrateLegacyToSupabase, loadCloudData])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return
    const channel = supabase.channel('buildtrack-sync').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'expenses' },
      () => loadCloudData(),
    ).subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadCloudData])

  useEffect(() => {
    if (!hasSupabaseConfig || !userId) return
    const debounce = setTimeout(async () => {
      try {
        await repos.projects.upsert([{ user_id: userId, payload: project }], 'user_id')
        await repos.expenses.upsert(expenses.map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
        await repos.materials.upsert(materials.map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
        await repos.laborers.upsert(laborers.map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
        await repos.vendors.upsert(vendors.map(e => ({ user_id: userId, id: scopedId(e.id), payload: e })), 'id')
        await repos.timelineEntries.upsert(timeline.map(t => ({ user_id: userId, phase: t.phase, payload: t })))
        await repos.siteProgress.upsert(siteProgress.map(s => ({ user_id: userId, id: Number(s.id) || Date.now(), payload: s })), 'id')
        await repos.documents.upsert(documents.map(d => ({ user_id: userId, id: Number(d.id) || Date.now(), payload: d, file_path: d.filePath || null })), 'id')
        await repos.cashflow.upsert(cashFlow.map(c => ({ user_id: userId, id: Number(c.id) || Date.now(), payload: c })), 'id')
        await repos.reminders.upsert(reminders.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
        await repos.auditEvents.upsert(auditEvents.map(a => ({ user_id: userId, id: a.id, payload: a })), 'id')
        await repos.boqItems.upsert(boqItems.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
        await repos.purchaseOrders.upsert(purchaseOrders.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
        await repos.runningBills.upsert(runningBills.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
        await repos.changeOrders.upsert(changeOrders.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
        await repos.snagItems.upsert(snagItems.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
        await repos.paymentEvents.upsert(paymentEvents.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
        await repos.reconciliationEntries.upsert(reconciliationEntries.map(r => ({ user_id: userId, id: r.id, payload: r })), 'id')
      } catch (error) {
        console.error('Cloud sync failed', error)
      }
    }, 450)
    return () => clearTimeout(debounce)
  }, [userId, scopedId,
    project, expenses, materials, laborers, vendors, timeline, siteProgress, documents, cashFlow,
    reminders, auditEvents, boqItems, purchaseOrders, runningBills, changeOrders, snagItems,
    paymentEvents, reconciliationEntries,
  ])

  // Computed stats
  const totalSpent = expenses.filter(e => e.status === 'Paid').reduce((s, e) => s + (parseFloat(e.total) || 0), 0)
  const totalPending = expenses.filter(e => e.status === 'Pending').reduce((s, e) => s + (parseFloat(e.total) || 0), 0)
  const materialCost = expenses.filter(e => e.category === 'Material' && e.status === 'Paid').reduce((s, e) => s + (parseFloat(e.total) || 0), 0)
  const laborCost = expenses.filter(e => e.category === 'Labor' && e.status === 'Paid').reduce((s, e) => s + (parseFloat(e.total) || 0), 0)
  const completedPhases = timeline.filter(t => t.status === 'Completed').length
  const completionPct = timeline.length ? Math.round((completedPhases / timeline.length) * 100) : 0
  const budgetUsed = project.plannedBudget ? Math.round((totalSpent / project.plannedBudget) * 100) : 0

  const addExpense = (data) => {
    const id = genId('EXP', expenses)
    const row = { ...data, id }
    setExpenses(prev => [row, ...prev])
    addAuditEvent({ entityType: 'expense', entityId: id, action: 'create', afterState: row })
    if (row.status !== 'Paid') {
      queueReminder({ title: `Expense ${id} pending`, dueAt: new Date().toISOString(), sourceModule: 'expenses', payload: row })
    }
  }
  const deleteExpense = (id) => {
    const before = expenses.find(e => e.id === id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    addAuditEvent({ entityType: 'expense', entityId: id, action: 'delete', beforeState: before })
  }

  const addMaterial = (data) => {
    const id = genId('MAT', materials)
    setMaterials(prev => [{ ...data, id }, ...prev])
  }
  const updateMaterial = (id, data) => setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  const deleteMaterial = (id) => setMaterials(prev => prev.filter(m => m.id !== id))

  const addLaborer = (data) => {
    const id = genId('WRK', laborers)
    setLaborers(prev => [{ ...data, id }, ...prev])
  }
  const updateLaborer = (id, data) => setLaborers(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
  const deleteLaborer = (id) => setLaborers(prev => prev.filter(l => l.id !== id))

  const addVendor = (data) => {
    const id = genId('VEN', vendors)
    setVendors(prev => [{ ...data, id }, ...prev])
  }
  const updateVendor = (id, data) => setVendors(prev => prev.map(v => v.id === id ? { ...v, ...data } : v))
  const deleteVendor = (id) => setVendors(prev => prev.filter(v => v.id !== id))

  const updateTimeline = (phase, data) => {
    setTimeline(prev => prev.map(t => t.phase === phase ? { ...t, ...data } : t))
    if (data?.status === 'Delayed') {
      queueReminder({ title: `${phase} delayed`, dueAt: new Date().toISOString(), sourceModule: 'timeline', payload: data })
    }
  }

  const addSiteProgress = (data) => setSiteProgress(prev => [{ ...data, id: Date.now() }, ...prev])
  const deleteSiteProgress = (id) => setSiteProgress(prev => prev.filter(s => s.id !== id))

  const addDocument = (data) => setDocuments(prev => [{ ...data, id: Date.now() }, ...prev])
  const deleteDocument = (id) => setDocuments(prev => prev.filter(d => d.id !== id))

  const addCashFlow = (data) => setCashFlow(prev => [...prev, { ...data, id: Date.now() }])
  const updateCashFlow = (id, data) => setCashFlow(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  const deleteCashFlow = (id) => setCashFlow(prev => prev.filter(c => c.id !== id))

  const phaseNames = phases.map(p => p.name)

  const timelineDependencyImpact = useMemo(() => {
    const delayed = timeline.filter(t => t.status === 'Delayed').map(t => t.phase)
    return timeline.map((t, idx) => ({
      phase: t.phase,
      predecessor: idx > 0 ? timeline[idx - 1].phase : null,
      hasCriticalRisk: idx > 0 && delayed.includes(timeline[idx - 1].phase),
    }))
  }, [timeline])

  const value = {
    project, setProject,
    phases, setPhases,
    expenses, addExpense, deleteExpense,
    materials, addMaterial, updateMaterial, deleteMaterial,
    laborers, addLaborer, updateLaborer, deleteLaborer,
    vendors, addVendor, updateVendor, deleteVendor,
    timeline, updateTimeline,
    siteProgress, addSiteProgress, deleteSiteProgress,
    documents, addDocument, deleteDocument,
    cashFlow, addCashFlow, updateCashFlow, deleteCashFlow,
    phaseNames,
    customLists, mergedDropdownOptions, addDropdownOption,
    reminders, queueReminder, completeReminder, deleteReminder,
    auditEvents, addAuditEvent,
    boqItems, addBoqItem, updateBoqItem, deleteBoqItem,
    purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
    runningBills, addRunningBill, updateRunningBill, deleteRunningBill,
    changeOrders, addChangeOrder, updateChangeOrder, deleteChangeOrder,
    snagItems, addSnagItem, updateSnagItem, deleteSnagItem,
    paymentEvents, addPaymentEvent, deletePaymentEvent,
    reconciliationEntries, addReconciliationEntry, deleteReconciliationEntry,
    timelineDependencyImpact,
    hasSupabaseConfig, loadingCloud,
    userId,
    // stats
    totalSpent, totalPending, materialCost, laborCost,
    completionPct, completedPhases, budgetUsed,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
