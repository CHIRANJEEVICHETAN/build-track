import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader, formatINRFull } from '../components/ui'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ComplianceReports() {
  const { expenses } = useApp()
  const rows = useMemo(() => {
    const out = {}
    for (const e of expenses) {
      const key = `${(e.date || '').slice(0, 7)}|${e.vendor || 'Unknown'}`
      const base = Number(e.amount || 0)
      const gstPct = Number(e.gst || 0)
      const gstAmount = base * gstPct / 100
      if (!out[key]) out[key] = { period: (e.date || '').slice(0, 7), vendor: e.vendor || 'Unknown', taxable: 0, gst: 0, gross: 0 }
      out[key].taxable += base
      out[key].gst += gstAmount
      out[key].gross += Number(e.total || 0)
    }
    return Object.values(out).sort((a, b) => b.period.localeCompare(a.period))
  }, [expenses])

  const downloadPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('BuildTrack GST Compliance Summary', 14, 16)
    autoTable(doc, {
      startY: 24,
      head: [['Period', 'Vendor', 'Taxable', 'GST', 'Gross']],
      body: rows.map(r => [r.period || '-', r.vendor, formatINRFull(r.taxable), formatINRFull(r.gst), formatINRFull(r.gross)]),
      headStyles: { fillColor: [245, 158, 11] },
    })
    doc.save(`buildtrack-gst-summary-${Date.now()}.pdf`)
  }

  return (
    <div>
      <SectionHeader title="GST / Compliance Summary" sub="Period and vendor-wise GST-oriented summaries." />
      <div style={{ marginBottom: 10 }}>
        <button className="btn-primary" onClick={downloadPdf}>Download GST PDF</button>
      </div>
      <div className="table-container">
        <table>
          <thead><tr><th>Period</th><th>Vendor</th><th>Taxable</th><th>GST</th><th>Gross</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.period || '-'}</td>
                <td>{r.vendor}</td>
                <td>{formatINRFull(r.taxable)}</td>
                <td>{formatINRFull(r.gst)}</td>
                <td>{formatINRFull(r.gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

