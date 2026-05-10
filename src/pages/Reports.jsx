import { useApp } from '../context/AppContext'
import { SectionHeader } from '../components/ui'
import { FileDown } from 'lucide-react'
import { exportOwnerSummaryPdf } from '../lib/reports/pdfReports'

export default function Reports() {
  const { project, expenses, timeline, totalSpent, totalPending, completionPct } = useApp()

  const generateOwnerSummary = () => {
    exportOwnerSummaryPdf({
      project,
      expenses,
      timeline,
      stats: { totalSpent, totalPending, completionPct },
    })
  }

  return (
    <div>
      <SectionHeader title="PDF Reports" sub="Generate beautiful branded PDF reports for owners and site reviews." />
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Available Reports</h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
          Reports are generated as PDF only with visual branding and financial summary blocks.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={generateOwnerSummary}>
            <FileDown size={15} />
            Owner Summary PDF
          </button>
        </div>
      </div>
    </div>
  )
}

