import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { computeMaterialDebtSnapshot } from '../../utils/materialDebt'
import { computeOtherDebtSnapshot } from '../../utils/otherDebt'

/* ─── helpers ─── */

function formatCurrency(n) {
  const num = parseFloat(n) || 0
  return `Rs.${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function pct(part, whole) {
  if (!whole) return '0%'
  return `${Math.round((part / whole) * 100)}%`
}

function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
}

const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

/* ─── branding ─── */

const BRAND_BG = [13, 18, 32]
const AMBER = [245, 158, 11]
const WHITE = [241, 245, 249]
const SECTION_BG = [30, 41, 59]
const ALT_ROW = [248, 250, 252]
const TABLE_HEAD = [245, 158, 11]
const TABLE_HEAD_BLUE = [59, 130, 246]
const TABLE_HEAD_GREEN = [16, 185, 129]
const TABLE_HEAD_RED = [239, 68, 68]
const TABLE_HEAD_PURPLE = [139, 92, 246]

function title(doc, text, projectName) {
  doc.setFillColor(...BRAND_BG)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(...AMBER)
  doc.setFontSize(18)
  doc.text('BuildTrack', 14, 14)
  doc.setTextColor(...WHITE)
  doc.setFontSize(11)
  doc.text(text, 14, 22)
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(9)
  let y = 34
  doc.text(`Report Date: ${today()}`, 14, y)
  if (projectName) {
    doc.text(`Project: ${projectName}`, 100, y)
  }
  return y + 8
}

function sectionTitle(doc, text, y, color) {
  const c = color || SECTION_BG
  doc.setFillColor(...c)
  doc.roundedRect(14, y, 182, 8, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(text, 18, y + 5.6)
  doc.setTextColor(17, 24, 39)
  return y + 12
}

function addPageFooter(doc) {
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...BRAND_BG)
    doc.rect(0, 285, 210, 12, 'F')
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7)
    doc.text('BuildTrack Construction ERP', 14, 291)
    doc.text(`Page ${i} of ${pages}`, 190, 291, { align: 'right' })
  }
}

function checkPageBreak(doc, y, needed) {
  if (y + needed > 275) {
    doc.addPage()
    return 14
  }
  return y
}

const tableStyles = (headColor) => ({
  theme: 'striped',
  headStyles: { fillColor: headColor || TABLE_HEAD, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
  alternateRowStyles: { fillColor: ALT_ROW },
  styles: { cellPadding: 2, overflow: 'linebreak' },
  margin: { left: 14, right: 14 },
})

function kvTable(doc, y, pairs, headColor) {
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: pairs,
    ...tableStyles(headColor),
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
  })
  return doc.lastAutoTable.finalY + 6
}

/* ═══════════════════════════════════════════════════════════════
   1. OWNER SUMMARY
   ═══════════════════════════════════════════════════════════════ */

export function exportOwnerSummaryPdf(ctx) {
  const doc = new jsPDF()
  const { project, expenses, materials, otherDebts, vendors, timeline, phases,
    totalSpent, totalPending, budgetUsed,
    materialDebtTakenTotal, materialDebtClearedTotal, materialDebtOutstandingTotal,
    otherDebtTakenTotal, otherDebtClearedTotal, otherDebtOutstandingTotal,
    completionPct, completedPhases } = ctx

  let y = title(doc, 'Owner Summary Report', project.name)

  /* Project details */
  y = sectionTitle(doc, 'Project Details', y)
  const budget = parseFloat(project.plannedBudget) || 0
  const buffer = budget * ((parseFloat(project.emergencyBuffer) || 0) / 100)
  const remaining = Math.max(0, budget - totalSpent)

  y = kvTable(doc, y, [
    ['Project Name', project.name || '-'],
    ['Location', project.location || '-'],
    ['Floors', project.floors || '-'],
    ['Plot / Built-up Area', `${project.plotArea || '-'} / ${project.builtUpArea || '-'}`],
    ['Start Date', fmtDate(project.startDate)],
    ['Expected End', fmtDate(project.endDate)],
    ['Contractor Type', project.contractorType || '-'],
  ])

  /* Financial summary */
  y = checkPageBreak(doc, y, 50)
  y = sectionTitle(doc, 'Financial Summary', y)
  y = kvTable(doc, y, [
    ['Total Budget', formatCurrency(budget)],
    ['Total Spent', formatCurrency(totalSpent)],
    ['Remaining', formatCurrency(remaining)],
    ['Pending Payments', formatCurrency(totalPending)],
    ['Emergency Buffer', formatCurrency(buffer)],
    ['Budget Used', `${budgetUsed}%`],
  ], TABLE_HEAD_BLUE)

  /* Debt summary */
  y = checkPageBreak(doc, y, 50)
  y = sectionTitle(doc, 'Debt Summary', y)
  y = kvTable(doc, y, [
    ['Material Debt Taken', formatCurrency(materialDebtTakenTotal)],
    ['Material Debt Cleared', formatCurrency(materialDebtClearedTotal)],
    ['Material Debt Outstanding', formatCurrency(materialDebtOutstandingTotal)],
    ['Other Debt Taken', formatCurrency(otherDebtTakenTotal)],
    ['Other Debt Cleared', formatCurrency(otherDebtClearedTotal)],
    ['Other Debt Outstanding', formatCurrency(otherDebtOutstandingTotal)],
  ], TABLE_HEAD_RED)

  /* Expense breakdown by category */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Expense Breakdown by Category', y)
  const catMap = {}
  expenses.forEach(e => {
    const cat = e.category || 'Uncategorized'
    catMap[cat] = (catMap[cat] || 0) + (parseFloat(e.total) || 0)
  })
  const totalExp = Object.values(catMap).reduce((s, v) => s + v, 0)
  const catRows = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => [cat, formatCurrency(amt), pct(amt, totalExp)])
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount', '% of Total']],
    body: catRows,
    ...tableStyles(TABLE_HEAD_GREEN),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Phase progress */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Phase Progress', y)
  const phaseRows = timeline.map(t => [t.phase, t.status, fmtDate(t.plannedStart), fmtDate(t.plannedEnd), fmtDate(t.actualStart), fmtDate(t.actualEnd)])
  autoTable(doc, {
    startY: y,
    head: [['Phase', 'Status', 'Planned Start', 'Planned End', 'Actual Start', 'Actual End']],
    body: phaseRows,
    ...tableStyles(TABLE_HEAD_PURPLE),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Key alerts */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Key Alerts', y, [185, 28, 28])
  const alerts = []
  const overdueVendors = vendors.filter(v => (parseFloat(v.pendingAmount) || 0) > 0)
  if (overdueVendors.length) alerts.push([`${overdueVendors.length} vendor(s) with pending payments`])
  const delayedPhases = timeline.filter(t => t.status === 'Delayed')
  if (delayedPhases.length) alerts.push([`${delayedPhases.length} phase(s) delayed: ${delayedPhases.map(t => t.phase).join(', ')}`])
  const lowStock = materials.filter(m => {
    const bal = (parseFloat(m.qtyReceived) || 0) - (parseFloat(m.qtyUsed) || 0)
    return bal > 0 && bal <= 5
  })
  if (lowStock.length) alerts.push([`${lowStock.length} material(s) with low stock`])
  const totalDebtOut = materialDebtOutstandingTotal + otherDebtOutstandingTotal
  if (totalDebtOut > 0) alerts.push([`Total outstanding debt: ${formatCurrency(totalDebtOut)}`])
  if (!alerts.length) alerts.push(['No critical alerts at this time.'])
  autoTable(doc, {
    startY: y,
    head: [['Alert']],
    body: alerts,
    ...tableStyles(TABLE_HEAD_RED),
  })

  addPageFooter(doc)
  doc.save(`buildtrack-owner-summary-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   2. EXPENSE REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportExpenseReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, expenses, totalSpent, totalPending } = ctx

  let y = title(doc, 'Detailed Expense Report', project.name)

  /* Summary */
  y = sectionTitle(doc, 'Summary', y)
  const paid = expenses.filter(e => e.status === 'Paid')
  const pending = expenses.filter(e => e.status === 'Pending')
  const partial = expenses.filter(e => e.status === 'Partial')
  const totalAll = expenses.reduce((s, e) => s + (parseFloat(e.total) || 0), 0)

  y = kvTable(doc, y, [
    ['Total Expenses', `${expenses.length} entries | ${formatCurrency(totalAll)}`],
    ['Paid', `${paid.length} entries | ${formatCurrency(totalSpent)}`],
    ['Pending', `${pending.length} entries | ${formatCurrency(totalPending)}`],
    ['Partial', `${partial.length} entries | ${formatCurrency(partial.reduce((s, e) => s + (parseFloat(e.total) || 0), 0))}`],
  ])

  /* By category */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Expense by Category', y)
  const catMap = {}
  expenses.forEach(e => { const c = e.category || 'Other'; catMap[c] = (catMap[c] || 0) + (parseFloat(e.total) || 0) })
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount', '% of Total']],
    body: Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([c, a]) => [c, formatCurrency(a), pct(a, totalAll)]),
    ...tableStyles(TABLE_HEAD_GREEN),
  })
  y = doc.lastAutoTable.finalY + 6

  /* By phase */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Expense by Phase', y)
  const phaseMap = {}
  expenses.forEach(e => { const p = e.phase || 'Unassigned'; phaseMap[p] = (phaseMap[p] || 0) + (parseFloat(e.total) || 0) })
  autoTable(doc, {
    startY: y,
    head: [['Phase', 'Amount', '% of Total']],
    body: Object.entries(phaseMap).sort((a, b) => b[1] - a[1]).map(([p, a]) => [p, formatCurrency(a), pct(a, totalAll)]),
    ...tableStyles(TABLE_HEAD_BLUE),
  })
  y = doc.lastAutoTable.finalY + 6

  /* By vendor */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Expense by Vendor', y)
  const vendMap = {}
  expenses.forEach(e => { const v = e.vendor || 'N/A'; vendMap[v] = (vendMap[v] || 0) + (parseFloat(e.total) || 0) })
  autoTable(doc, {
    startY: y,
    head: [['Vendor', 'Amount', '% of Total']],
    body: Object.entries(vendMap).sort((a, b) => b[1] - a[1]).map(([v, a]) => [v, formatCurrency(a), pct(a, totalAll)]),
    ...tableStyles(TABLE_HEAD_PURPLE),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Monthly trend */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Monthly Trend', y)
  const monthMap = {}
  expenses.forEach(e => {
    if (!e.date) return
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = (monthMap[key] || 0) + (parseFloat(e.total) || 0)
  })
  autoTable(doc, {
    startY: y,
    head: [['Month', 'Amount']],
    body: Object.entries(monthMap).sort().map(([m, a]) => [m, formatCurrency(a)]),
    ...tableStyles(TABLE_HEAD),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Full ledger */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Full Expense Ledger', y)
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Category', 'Vendor', 'Phase', 'Amount', 'GST', 'Total', 'Status']],
    body: expenses.map(e => [
      fmtDate(e.date), e.description || '-', e.category || '-', e.vendor || '-', e.phase || '-',
      formatCurrency(e.amount), formatCurrency(e.gst), formatCurrency(e.total), e.status || '-',
    ]),
    ...tableStyles(TABLE_HEAD),
    styles: { cellPadding: 1.5, overflow: 'linebreak', fontSize: 7 },
  })

  addPageFooter(doc)
  doc.save(`buildtrack-expense-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   3. VENDOR REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportVendorReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, vendors } = ctx

  let y = title(doc, 'Vendor Report', project.name)

  const totalContracted = vendors.reduce((s, v) => s + (parseFloat(v.contractAmount) || 0), 0)
  const totalPaid = vendors.reduce((s, v) => s + (parseFloat(v.paidAmount) || 0), 0)
  const totalPending = vendors.reduce((s, v) => s + (parseFloat(v.pendingAmount) || 0), 0)

  /* Summary */
  y = sectionTitle(doc, 'Summary', y)
  y = kvTable(doc, y, [
    ['Total Vendors', String(vendors.length)],
    ['Total Contracted', formatCurrency(totalContracted)],
    ['Total Paid', formatCurrency(totalPaid)],
    ['Total Pending', formatCurrency(totalPending)],
  ])

  /* Vendor details */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Vendor Details', y)
  autoTable(doc, {
    startY: y,
    head: [['Name', 'Work Type', 'Advance', 'Contracted', 'Paid', 'Pending', 'Completion %']],
    body: vendors.map(v => [
      v.name || '-', v.workType || '-', formatCurrency(v.advanceAmount),
      formatCurrency(v.contractAmount), formatCurrency(v.paidAmount),
      formatCurrency(v.pendingAmount), `${v.completionPercent || 0}%`,
    ]),
    ...tableStyles(TABLE_HEAD_BLUE),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Payment status */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Vendor Payment Status Summary', y)
  const fullyPaid = vendors.filter(v => (parseFloat(v.pendingAmount) || 0) === 0 && (parseFloat(v.paidAmount) || 0) > 0).length
  const withPending = vendors.filter(v => (parseFloat(v.pendingAmount) || 0) > 0).length
  const notStarted = vendors.filter(v => (parseFloat(v.paidAmount) || 0) === 0 && (parseFloat(v.pendingAmount) || 0) === 0).length
  y = kvTable(doc, y, [
    ['Fully Paid', String(fullyPaid)],
    ['With Pending Dues', String(withPending)],
    ['No Payments Yet', String(notStarted)],
  ], TABLE_HEAD_GREEN)

  /* Overdue */
  const overdue = vendors.filter(v => (parseFloat(v.pendingAmount) || 0) > 0)
  if (overdue.length) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, 'Vendors with Pending Payments', y, [185, 28, 28])
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Work Type', 'Pending Amount']],
      body: overdue.map(v => [v.name || '-', v.workType || '-', formatCurrency(v.pendingAmount)]),
      ...tableStyles(TABLE_HEAD_RED),
    })
  }

  addPageFooter(doc)
  doc.save(`buildtrack-vendor-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   4. LABOR REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportLaborReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, laborers } = ctx

  let y = title(doc, 'Labor Report', project.name)

  const totalCost = laborers.reduce((s, w) => s + (parseFloat(w.totalPaid) || 0), 0)
  const totalPending = laborers.reduce((s, w) => s + (parseFloat(w.pendingDues) || 0), 0)
  const avgWage = laborers.length ? laborers.reduce((s, w) => s + (parseFloat(w.dailyWage) || 0), 0) / laborers.length : 0

  y = sectionTitle(doc, 'Summary', y)
  y = kvTable(doc, y, [
    ['Total Workers', String(laborers.length)],
    ['Total Cost', formatCurrency(totalCost)],
    ['Average Daily Wage', formatCurrency(avgWage)],
    ['Pending Dues', formatCurrency(totalPending)],
  ])

  /* Worker details */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Worker Details', y)
  autoTable(doc, {
    startY: y,
    head: [['Name', 'Role', 'Daily Wage', 'Days Worked', 'Overtime Hrs', 'Total Paid', 'Pending']],
    body: laborers.map(w => [
      w.name || '-', w.role || '-', formatCurrency(w.dailyWage),
      String(w.daysWorked || 0), String(w.overtimeHours || 0),
      formatCurrency(w.totalPaid), formatCurrency(w.pendingDues),
    ]),
    ...tableStyles(TABLE_HEAD_BLUE),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Role-wise breakdown */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Role-wise Cost Breakdown', y)
  const roleMap = {}
  laborers.forEach(w => {
    const r = w.role || 'Other'
    if (!roleMap[r]) roleMap[r] = { count: 0, cost: 0 }
    roleMap[r].count++
    roleMap[r].cost += parseFloat(w.totalPaid) || 0
  })
  autoTable(doc, {
    startY: y,
    head: [['Role', 'Workers', 'Total Cost', '% of Total']],
    body: Object.entries(roleMap).sort((a, b) => b[1].cost - a[1].cost).map(([r, d]) => [r, String(d.count), formatCurrency(d.cost), pct(d.cost, totalCost)]),
    ...tableStyles(TABLE_HEAD_GREEN),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Pending dues */
  const withDues = laborers.filter(w => (parseFloat(w.pendingDues) || 0) > 0)
  if (withDues.length) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, 'Workers with Pending Dues', y, [185, 28, 28])
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Role', 'Pending Amount']],
      body: withDues.map(w => [w.name || '-', w.role || '-', formatCurrency(w.pendingDues)]),
      ...tableStyles(TABLE_HEAD_RED),
    })
  }

  addPageFooter(doc)
  doc.save(`buildtrack-labor-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   5. MATERIAL & INVENTORY REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportMaterialReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, materials } = ctx

  let y = title(doc, 'Material & Inventory Report', project.name)

  const totalCost = materials.reduce((s, m) => s + (parseFloat(m.totalCost) || 0), 0)
  const lowStock = materials.filter(m => {
    const bal = (parseFloat(m.qtyReceived) || 0) - (parseFloat(m.qtyUsed) || 0)
    return bal > 0 && bal <= 5
  })

  y = sectionTitle(doc, 'Summary', y)
  y = kvTable(doc, y, [
    ['Total Materials', String(materials.length)],
    ['Total Cost', formatCurrency(totalCost)],
    ['Low Stock Items', String(lowStock.length)],
  ])

  /* Inventory table */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Material Inventory', y)
  autoTable(doc, {
    startY: y,
    head: [['Name', 'Vendor', 'Category', 'Ordered', 'Received', 'Used', 'Balance', 'Unit Price', 'Total Cost']],
    body: materials.map(m => {
      const bal = (parseFloat(m.qtyReceived) || 0) - (parseFloat(m.qtyUsed) || 0)
      return [
        m.name || '-', m.vendor || '-', m.category || '-',
        String(m.qtyOrdered || 0), String(m.qtyReceived || 0), String(m.qtyUsed || 0),
        String(Math.max(0, bal)), formatCurrency(m.unitPrice), formatCurrency(m.totalCost),
      ]
    }),
    ...tableStyles(TABLE_HEAD_BLUE),
    styles: { cellPadding: 1.5, overflow: 'linebreak', fontSize: 7 },
  })
  y = doc.lastAutoTable.finalY + 6

  /* Debt details */
  const debtMaterials = materials.filter(m => (m.purchaseDebt || 'cash') !== 'cash')
  if (debtMaterials.length) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, 'Material Debt Details', y)
    autoTable(doc, {
      startY: y,
      head: [['Material', 'Vendor', 'Debt Mode', 'Taken', 'Cleared', 'Outstanding']],
      body: debtMaterials.map(m => {
        const snap = computeMaterialDebtSnapshot(m)
        return [m.name || '-', m.vendor || '-', m.purchaseDebt || '-', formatCurrency(snap.taken), formatCurrency(snap.cleared), formatCurrency(snap.outstanding)]
      }),
      ...tableStyles(TABLE_HEAD_RED),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  /* Low stock */
  if (lowStock.length) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, 'Low Stock Items', y, [185, 28, 28])
    autoTable(doc, {
      startY: y,
      head: [['Material', 'Balance', 'Unit']],
      body: lowStock.map(m => {
        const bal = (parseFloat(m.qtyReceived) || 0) - (parseFloat(m.qtyUsed) || 0)
        return [m.name || '-', String(Math.max(0, bal)), m.unit || '-']
      }),
      ...tableStyles(TABLE_HEAD_RED),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  /* Purchase mode distribution */
  y = checkPageBreak(doc, y, 30)
  y = sectionTitle(doc, 'Purchase Mode Distribution', y)
  const modeMap = {}
  materials.forEach(m => { const mode = m.purchaseDebt || 'cash'; modeMap[mode] = (modeMap[mode] || 0) + 1 })
  autoTable(doc, {
    startY: y,
    head: [['Purchase Mode', 'Count', '% of Materials']],
    body: Object.entries(modeMap).map(([mode, count]) => [mode, String(count), pct(count, materials.length)]),
    ...tableStyles(TABLE_HEAD_GREEN),
  })

  addPageFooter(doc)
  doc.save(`buildtrack-material-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   6. BUDGET VARIANCE REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportBudgetReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, expenses, totalSpent, totalPending, budgetUsed } = ctx

  let y = title(doc, 'Budget Variance Report', project.name)

  const budget = parseFloat(project.plannedBudget) || 0
  const buffer = budget * ((parseFloat(project.emergencyBuffer) || 0) / 100)
  const remaining = Math.max(0, budget - totalSpent)

  y = sectionTitle(doc, 'Overall Budget Summary', y)
  y = kvTable(doc, y, [
    ['Planned Budget', formatCurrency(budget)],
    ['Total Spent', formatCurrency(totalSpent)],
    ['Remaining', formatCurrency(remaining)],
    ['Pending Commitments', formatCurrency(totalPending)],
    ['Emergency Buffer', formatCurrency(buffer)],
    ['Budget Utilization', `${budgetUsed}%`],
    ['Effective Remaining (excl. buffer)', formatCurrency(Math.max(0, remaining - buffer))],
  ])

  /* Phase-wise budget */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Phase-wise Spending', y)
  const phaseMap = {}
  expenses.forEach(e => {
    const p = e.phase || 'Unassigned'
    if (!phaseMap[p]) phaseMap[p] = { spent: 0, pending: 0 }
    if (e.status === 'Paid') phaseMap[p].spent += parseFloat(e.total) || 0
    else phaseMap[p].pending += parseFloat(e.total) || 0
  })
  autoTable(doc, {
    startY: y,
    head: [['Phase', 'Spent', 'Pending', 'Total', '% of Budget']],
    body: Object.entries(phaseMap).sort((a, b) => (b[1].spent + b[1].pending) - (a[1].spent + a[1].pending)).map(([p, d]) => {
      const total = d.spent + d.pending
      return [p, formatCurrency(d.spent), formatCurrency(d.pending), formatCurrency(total), pct(total, budget)]
    }),
    ...tableStyles(TABLE_HEAD_BLUE),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Category-wise */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Category-wise Spending', y)
  const catMap = {}
  expenses.forEach(e => { const c = e.category || 'Other'; catMap[c] = (catMap[c] || 0) + (parseFloat(e.total) || 0) })
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount', '% of Budget']],
    body: Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([c, a]) => [c, formatCurrency(a), pct(a, budget)]),
    ...tableStyles(TABLE_HEAD_GREEN),
  })
  y = doc.lastAutoTable.finalY + 6

  /* Health assessment */
  y = checkPageBreak(doc, y, 30)
  y = sectionTitle(doc, 'Budget Health Assessment', y)
  let healthStatus, healthColor
  if (budgetUsed <= 70) { healthStatus = 'Healthy'; healthColor = TABLE_HEAD_GREEN }
  else if (budgetUsed <= 90) { healthStatus = 'Warning - Approaching Limit'; healthColor = TABLE_HEAD }
  else { healthStatus = 'Critical - Over or Near Budget'; healthColor = TABLE_HEAD_RED }

  y = kvTable(doc, y, [
    ['Status', healthStatus],
    ['Budget Used', `${budgetUsed}%`],
    ['Months of Buffer (est.)', budget > 0 && totalSpent > 0 ? `~${Math.round((remaining / (totalSpent / Math.max(1, expenses.length))) * 30)} days` : 'N/A'],
  ], healthColor)

  addPageFooter(doc)
  doc.save(`buildtrack-budget-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   7. DEBT SUMMARY REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportDebtReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, materials, otherDebts,
    materialDebtTakenTotal, materialDebtClearedTotal, materialDebtOutstandingTotal,
    otherDebtTakenTotal, otherDebtClearedTotal, otherDebtOutstandingTotal } = ctx

  let y = title(doc, 'Debt Summary Report', project.name)

  const totalTaken = materialDebtTakenTotal + otherDebtTakenTotal
  const totalCleared = materialDebtClearedTotal + otherDebtClearedTotal
  const totalOutstanding = materialDebtOutstandingTotal + otherDebtOutstandingTotal

  y = sectionTitle(doc, 'Overall Debt KPIs', y)
  y = kvTable(doc, y, [
    ['Total Debt Taken', formatCurrency(totalTaken)],
    ['Total Debt Cleared', formatCurrency(totalCleared)],
    ['Total Outstanding', formatCurrency(totalOutstanding)],
    ['Clearance Rate', pct(totalCleared, totalTaken)],
  ], TABLE_HEAD_RED)

  /* Material debt */
  const debtMats = materials.filter(m => (m.purchaseDebt || 'cash') !== 'cash')
  if (debtMats.length) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, 'Material Debt', y)
    autoTable(doc, {
      startY: y,
      head: [['Material', 'Vendor', 'Debt Mode', 'Taken', 'Cleared', 'Outstanding']],
      body: debtMats.map(m => {
        const snap = computeMaterialDebtSnapshot(m)
        return [m.name || '-', m.vendor || '-', m.purchaseDebt || '-', formatCurrency(snap.taken), formatCurrency(snap.cleared), formatCurrency(snap.outstanding)]
      }),
      ...tableStyles(TABLE_HEAD_BLUE),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  /* Other debt */
  if (otherDebts.length) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, 'Other Debt', y)
    autoTable(doc, {
      startY: y,
      head: [['Description', 'Creditor', 'Taken', 'Cleared', 'Outstanding']],
      body: otherDebts.map(d => {
        const snap = computeOtherDebtSnapshot(d)
        return [d.description || '-', d.creditorName || '-', formatCurrency(snap.taken), formatCurrency(snap.cleared), formatCurrency(snap.outstanding)]
      }),
      ...tableStyles(TABLE_HEAD_PURPLE),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  /* Combined summary */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Combined Debt Summary', y)
  y = kvTable(doc, y, [
    ['Material Debt Outstanding', formatCurrency(materialDebtOutstandingTotal)],
    ['Other Debt Outstanding', formatCurrency(otherDebtOutstandingTotal)],
    ['Combined Outstanding', formatCurrency(totalOutstanding)],
  ], TABLE_HEAD)

  addPageFooter(doc)
  doc.save(`buildtrack-debt-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   8. TIMELINE & PROGRESS REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportTimelineReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, timeline, completionPct, completedPhases } = ctx

  let y = title(doc, 'Timeline & Progress Report', project.name)

  y = sectionTitle(doc, 'Project Timeline Overview', y)
  y = kvTable(doc, y, [
    ['Project Start', fmtDate(project.startDate)],
    ['Expected End', fmtDate(project.endDate)],
    ['Total Phases', String(timeline.length)],
    ['Completed', String(completedPhases)],
    ['Completion', `${completionPct}%`],
  ])

  /* Phase details */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, 'Phase Details', y)
  autoTable(doc, {
    startY: y,
    head: [['Phase', 'Status', 'Priority', 'Planned Start', 'Planned End', 'Actual Start', 'Actual End', 'Delay (days)']],
    body: timeline.map(t => {
      let delay = '-'
      if (t.plannedEnd && t.actualEnd) {
        const diff = Math.round((new Date(t.actualEnd) - new Date(t.plannedEnd)) / 86400000)
        delay = diff > 0 ? `+${diff}` : String(diff)
      } else if (t.plannedEnd && t.status === 'Delayed') {
        const diff = Math.round((new Date() - new Date(t.plannedEnd)) / 86400000)
        if (diff > 0) delay = `+${diff} (ongoing)`
      }
      return [t.phase, t.status, t.priority || '-', fmtDate(t.plannedStart), fmtDate(t.plannedEnd), fmtDate(t.actualStart), fmtDate(t.actualEnd), delay]
    }),
    ...tableStyles(TABLE_HEAD_PURPLE),
    styles: { cellPadding: 1.5, overflow: 'linebreak', fontSize: 7 },
  })
  y = doc.lastAutoTable.finalY + 6

  /* Delayed phases */
  const delayed = timeline.filter(t => t.status === 'Delayed')
  if (delayed.length) {
    y = checkPageBreak(doc, y, 40)
    y = sectionTitle(doc, 'Delayed Phases Analysis', y, [185, 28, 28])
    autoTable(doc, {
      startY: y,
      head: [['Phase', 'Planned End', 'Days Overdue']],
      body: delayed.map(t => {
        const days = t.plannedEnd ? Math.max(0, Math.round((new Date() - new Date(t.plannedEnd)) / 86400000)) : '-'
        return [t.phase, fmtDate(t.plannedEnd), String(days)]
      }),
      ...tableStyles(TABLE_HEAD_RED),
    })
    y = doc.lastAutoTable.finalY + 6
  }

  /* Completion summary */
  y = checkPageBreak(doc, y, 30)
  y = sectionTitle(doc, 'Completion Summary', y)
  const statusMap = {}
  timeline.forEach(t => { statusMap[t.status] = (statusMap[t.status] || 0) + 1 })
  y = kvTable(doc, y, Object.entries(statusMap).map(([s, c]) => [s, `${c} phase(s) (${pct(c, timeline.length)})`]), TABLE_HEAD_GREEN)

  addPageFooter(doc)
  doc.save(`buildtrack-timeline-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   9. CASH FLOW REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportCashFlowReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, cashFlow, expenses } = ctx

  let y = title(doc, 'Cash Flow Report', project.name)

  /* If cashFlow entries exist, use them */
  if (cashFlow && cashFlow.length) {
    y = sectionTitle(doc, 'Monthly Cash Flow', y)
    let cumulative = 0
    const rows = cashFlow.map(c => {
      const inflow = parseFloat(c.inflow) || 0
      const outflow = parseFloat(c.outflow) || 0
      const net = inflow - outflow
      cumulative += net
      return [c.month || c.date || '-', formatCurrency(inflow), formatCurrency(outflow), formatCurrency(net), formatCurrency(cumulative)]
    })
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Inflow', 'Outflow', 'Net', 'Cumulative']],
      body: rows,
      ...tableStyles(TABLE_HEAD_GREEN),
    })
    y = doc.lastAutoTable.finalY + 6

    const totalIn = cashFlow.reduce((s, c) => s + (parseFloat(c.inflow) || 0), 0)
    const totalOut = cashFlow.reduce((s, c) => s + (parseFloat(c.outflow) || 0), 0)
    y = sectionTitle(doc, 'Summary', y)
    y = kvTable(doc, y, [
      ['Total Inflow', formatCurrency(totalIn)],
      ['Total Outflow', formatCurrency(totalOut)],
      ['Net Cash Flow', formatCurrency(totalIn - totalOut)],
    ])
  } else {
    /* Derive from expenses by month */
    y = sectionTitle(doc, 'Monthly Outflow (from Expenses)', y)
    const monthMap = {}
    expenses.forEach(e => {
      if (!e.date) return
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] || 0) + (parseFloat(e.total) || 0)
    })
    let cumulative = 0
    const rows = Object.entries(monthMap).sort().map(([m, a]) => {
      cumulative += a
      return [m, formatCurrency(a), formatCurrency(cumulative)]
    })
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Outflow', 'Cumulative']],
      body: rows.length ? rows : [['No expense data', '-', '-']],
      ...tableStyles(TABLE_HEAD_GREEN),
    })
    y = doc.lastAutoTable.finalY + 6

    y = sectionTitle(doc, 'Summary', y)
    y = kvTable(doc, y, [
      ['Total Outflow', formatCurrency(cumulative)],
    ])
  }

  addPageFooter(doc)
  doc.save(`buildtrack-cashflow-report-${Date.now()}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   10. FULL PROJECT REPORT
   ═══════════════════════════════════════════════════════════════ */

export function exportFullProjectReportPdf(ctx) {
  const doc = new jsPDF()
  const { project, expenses, materials, otherDebts, laborers, vendors, timeline,
    totalSpent, totalPending, budgetUsed, completionPct, completedPhases,
    materialDebtTakenTotal, materialDebtClearedTotal, materialDebtOutstandingTotal,
    otherDebtTakenTotal, otherDebtClearedTotal, otherDebtOutstandingTotal,
    cashFlow } = ctx

  const budget = parseFloat(project.plannedBudget) || 0
  const remaining = Math.max(0, budget - totalSpent)

  let y = title(doc, 'Complete Project Report', project.name)

  /* ── 1. Project Overview ── */
  y = sectionTitle(doc, '1. Project Overview', y)
  y = kvTable(doc, y, [
    ['Project Name', project.name || '-'],
    ['Location', project.location || '-'],
    ['Floors', project.floors || '-'],
    ['Area', `${project.plotArea || '-'} / ${project.builtUpArea || '-'}`],
    ['Duration', `${fmtDate(project.startDate)} to ${fmtDate(project.endDate)}`],
    ['Contractor Type', project.contractorType || '-'],
    ['Completion', `${completionPct}%`],
  ])

  /* ── 2. Financial Summary ── */
  y = checkPageBreak(doc, y, 50)
  y = sectionTitle(doc, '2. Financial Summary', y)
  y = kvTable(doc, y, [
    ['Budget', formatCurrency(budget)],
    ['Spent', formatCurrency(totalSpent)],
    ['Remaining', formatCurrency(remaining)],
    ['Pending', formatCurrency(totalPending)],
    ['Budget Used', `${budgetUsed}%`],
  ], TABLE_HEAD_BLUE)

  /* ── 3. Expense Summary ── */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, '3. Expense Summary (Top Categories)', y)
  const catMap = {}
  expenses.forEach(e => { const c = e.category || 'Other'; catMap[c] = (catMap[c] || 0) + (parseFloat(e.total) || 0) })
  const totalExp = Object.values(catMap).reduce((s, v) => s + v, 0)
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount', '%']],
    body: Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, a]) => [c, formatCurrency(a), pct(a, totalExp)]),
    ...tableStyles(TABLE_HEAD_GREEN),
  })
  y = doc.lastAutoTable.finalY + 6

  /* ── 4. Vendor Summary ── */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, '4. Vendor Summary', y)
  if (vendors.length) {
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Work Type', 'Contracted', 'Paid', 'Pending']],
      body: vendors.map(v => [v.name || '-', v.workType || '-', formatCurrency(v.contractAmount), formatCurrency(v.paidAmount), formatCurrency(v.pendingAmount)]),
      ...tableStyles(TABLE_HEAD_BLUE),
    })
    y = doc.lastAutoTable.finalY + 6
  } else {
    doc.setFontSize(9); doc.text('No vendor data.', 14, y); y += 8
  }

  /* ── 5. Labor Summary ── */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, '5. Labor Summary', y)
  if (laborers.length) {
    const lCost = laborers.reduce((s, w) => s + (parseFloat(w.totalPaid) || 0), 0)
    const lPend = laborers.reduce((s, w) => s + (parseFloat(w.pendingDues) || 0), 0)
    y = kvTable(doc, y, [
      ['Workers', String(laborers.length)],
      ['Total Paid', formatCurrency(lCost)],
      ['Pending Dues', formatCurrency(lPend)],
    ], TABLE_HEAD_PURPLE)
  } else {
    doc.setFontSize(9); doc.text('No labor data.', 14, y); y += 8
  }

  /* ── 6. Material Summary ── */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, '6. Material Summary', y)
  if (materials.length) {
    const mCost = materials.reduce((s, m) => s + (parseFloat(m.totalCost) || 0), 0)
    y = kvTable(doc, y, [
      ['Materials', String(materials.length)],
      ['Total Cost', formatCurrency(mCost)],
    ], TABLE_HEAD_GREEN)
  } else {
    doc.setFontSize(9); doc.text('No material data.', 14, y); y += 8
  }

  /* ── 7. Debt Summary ── */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, '7. Debt Summary', y)
  const totalDebtOut = materialDebtOutstandingTotal + otherDebtOutstandingTotal
  y = kvTable(doc, y, [
    ['Material Debt Outstanding', formatCurrency(materialDebtOutstandingTotal)],
    ['Other Debt Outstanding', formatCurrency(otherDebtOutstandingTotal)],
    ['Total Outstanding', formatCurrency(totalDebtOut)],
  ], TABLE_HEAD_RED)

  /* ── 8. Timeline Summary ── */
  y = checkPageBreak(doc, y, 40)
  y = sectionTitle(doc, '8. Timeline Summary', y)
  const statusMap = {}
  timeline.forEach(t => { statusMap[t.status] = (statusMap[t.status] || 0) + 1 })
  y = kvTable(doc, y, [
    ['Total Phases', String(timeline.length)],
    ['Completed', String(completedPhases)],
    ...Object.entries(statusMap).filter(([s]) => s !== 'Completed').map(([s, c]) => [s, String(c)]),
  ], TABLE_HEAD_PURPLE)

  addPageFooter(doc)
  doc.save(`buildtrack-full-project-report-${Date.now()}.pdf`)
}
