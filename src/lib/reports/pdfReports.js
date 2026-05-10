import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function title(doc, text) {
  doc.setFillColor(13, 18, 32)
  doc.rect(0, 0, 210, 26, 'F')
  doc.setTextColor(245, 158, 11)
  doc.setFontSize(18)
  doc.text('BuildTrack', 14, 15)
  doc.setTextColor(241, 245, 249)
  doc.setFontSize(11)
  doc.text(text, 14, 22)
}

export function exportOwnerSummaryPdf({ project, stats, expenses, timeline }) {
  const doc = new jsPDF()
  title(doc, 'Owner Summary Report')
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(12)
  doc.text(`Project: ${project.name || '-'}`, 14, 36)
  doc.text(`Location: ${project.location || '-'}`, 14, 42)
  doc.text(`Report date: ${new Date().toLocaleDateString('en-IN')}`, 14, 48)

  autoTable(doc, {
    startY: 56,
    head: [['Metric', 'Value']],
    body: [
      ['Total Budget', `₹${Number(project.plannedBudget || 0).toLocaleString('en-IN')}`],
      ['Total Spent', `₹${Number(stats.totalSpent || 0).toLocaleString('en-IN')}`],
      ['Pending', `₹${Number(stats.totalPending || 0).toLocaleString('en-IN')}`],
      ['Completion', `${stats.completionPct || 0}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Recent Expense', 'Category', 'Amount', 'Status']],
    body: expenses.slice(0, 10).map(e => [e.description, e.category, `₹${Number(e.total || 0).toLocaleString('en-IN')}`, e.status]),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Phase', 'Status', 'Planned End', 'Actual End']],
    body: timeline.slice(0, 12).map(t => [t.phase, t.status, t.plannedEnd || '-', t.actualEnd || '-']),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
  })

  doc.save(`buildtrack-owner-summary-${Date.now()}.pdf`)
}

