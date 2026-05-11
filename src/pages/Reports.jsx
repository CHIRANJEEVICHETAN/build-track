import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SectionHeader } from '../components/ui'
import {
  FileDown, FileText, DollarSign, Users, Truck, Package,
  PieChart, CreditCard, Clock, Download, Loader2, BarChart3,
  TrendingUp, ClipboardList,
} from 'lucide-react'
import {
  exportOwnerSummaryPdf,
  exportExpenseReportPdf,
  exportVendorReportPdf,
  exportLaborReportPdf,
  exportMaterialReportPdf,
  exportBudgetReportPdf,
  exportDebtReportPdf,
  exportTimelineReportPdf,
  exportCashFlowReportPdf,
  exportFullProjectReportPdf,
} from '../lib/reports/pdfReports'

const reportDefs = [
  {
    group: 'Overview Reports',
    items: [
      {
        key: 'owner',
        title: 'Owner Summary',
        desc: 'Complete project overview with financials, debt, expense breakdown, phase progress, and key alerts for stakeholders.',
        icon: FileText,
        fn: exportOwnerSummaryPdf,
      },
      {
        key: 'full',
        title: 'Full Project Report',
        desc: 'Comprehensive multi-page report combining project overview, finances, vendors, labor, materials, debt, and timeline.',
        icon: ClipboardList,
        fn: exportFullProjectReportPdf,
      },
    ],
  },
  {
    group: 'Financial Reports',
    items: [
      {
        key: 'expense',
        title: 'Expense Report',
        desc: 'Detailed expense analysis with category, phase, vendor breakdowns, monthly trends, and full ledger.',
        icon: DollarSign,
        fn: exportExpenseReportPdf,
      },
      {
        key: 'budget',
        title: 'Budget Report',
        desc: 'Budget variance analysis with phase-wise and category-wise spending, health assessment, and buffer tracking.',
        icon: PieChart,
        fn: exportBudgetReportPdf,
      },
      {
        key: 'cashflow',
        title: 'Cash Flow Report',
        desc: 'Monthly cash flow tracking with inflow, outflow, net position, and cumulative totals.',
        icon: TrendingUp,
        fn: exportCashFlowReportPdf,
      },
      {
        key: 'debt',
        title: 'Debt Report',
        desc: 'Complete debt summary covering material debt, other debt, clearance rates, and outstanding balances.',
        icon: CreditCard,
        fn: exportDebtReportPdf,
      },
    ],
  },
  {
    group: 'Operational Reports',
    items: [
      {
        key: 'vendor',
        title: 'Vendor Report',
        desc: 'Vendor performance and payment tracking with contracted amounts, paid, pending, and overdue highlights.',
        icon: Truck,
        fn: exportVendorReportPdf,
      },
      {
        key: 'labor',
        title: 'Labor Report',
        desc: 'Worker details with role-wise cost breakdown, daily wages, attendance, overtime, and pending dues.',
        icon: Users,
        fn: exportLaborReportPdf,
      },
      {
        key: 'material',
        title: 'Material Report',
        desc: 'Inventory status, cost tracking, debt details, low stock alerts, and purchase mode distribution.',
        icon: Package,
        fn: exportMaterialReportPdf,
      },
      {
        key: 'timeline',
        title: 'Timeline Report',
        desc: 'Phase-wise progress, planned vs actual dates, delay analysis, and completion summary.',
        icon: Clock,
        fn: exportTimelineReportPdf,
      },
    ],
  },
]

export default function Reports() {
  const ctx = useApp()
  const [loading, setLoading] = useState({})

  const generate = async (key, fn) => {
    setLoading(prev => ({ ...prev, [key]: true }))
    try {
      await new Promise(r => setTimeout(r, 80))
      fn(ctx)
    } catch (err) {
      console.error(`Report generation failed: ${key}`, err)
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const generateAll = async () => {
    setLoading(prev => ({ ...prev, _all: true }))
    try {
      for (const group of reportDefs) {
        for (const item of group.items) {
          await new Promise(r => setTimeout(r, 120))
          item.fn(ctx)
        }
      }
    } catch (err) {
      console.error('Bulk report generation failed', err)
    } finally {
      setLoading(prev => ({ ...prev, _all: false }))
    }
  }

  return (
    <div>
      <SectionHeader
        title="PDF Reports"
        sub="Generate beautifully branded PDF reports for owners, site engineers, and financial reviews."
        action={
          <button
            className="btn-primary"
            onClick={generateAll}
            disabled={loading._all}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading._all ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
            {loading._all ? 'Generating...' : 'Generate All Reports'}
          </button>
        }
      />

      {reportDefs.map(group => (
        <div key={group.group} style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--amber)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <BarChart3 size={16} />
            {group.group}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {group.items.map(item => {
              const Icon = item.icon
              const isLoading = loading[item.key] || loading._all
              return (
                <div
                  key={item.key}
                  className="card"
                  style={{
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(245, 158, 11, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={18} style={{ color: 'var(--amber)' }} />
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                      {item.title}
                    </h4>
                  </div>

                  <p style={{
                    fontSize: 12,
                    color: 'var(--text-3)',
                    lineHeight: 1.5,
                    margin: 0,
                    flex: 1,
                  }}>
                    {item.desc}
                  </p>

                  <button
                    className="btn-primary"
                    onClick={() => generate(item.key, item.fn)}
                    disabled={isLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      width: '100%',
                      marginTop: 4,
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                  >
                    {isLoading ? <Loader2 size={14} className="spin" /> : <FileDown size={14} />}
                    {isLoading ? 'Generating...' : 'Generate PDF'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  )
}
