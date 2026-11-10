import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, LayoutDashboard, Sparkles } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import PerformanceView from '../../components/analytics/PerformanceView.jsx'
import EsgDemoDashboard from './EsgDemoDashboard.jsx'

/**
 * Analytics.
 *
 * - Performance: every chart is a KPI from the KPI library (backend: app/kpis), computed from the
 *   approved data sheets — the same numbers as the Dashboard, KPI catalogue, BRSR and GRI — by financial
 *   year and location, with last year alongside.
 * - ESG Dashboard (Demo): the illustrative multi-domain dashboard (illustrative data only), moved here
 *   from its own menu item; /client/esg-demo-dashboard now opens this tab.
 */

const VIEWS = [
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'demo', label: 'ESG Dashboard (Demo)', icon: LayoutDashboard },
]

function AnalyzeWithAiButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      {open && (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      )}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-brand-green/40 text-brand-green text-xs font-medium hover:bg-brand-green/5 transition-colors relative z-20"
      >
        <Sparkles size={14} /> Analyze with AI
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-brand-green/30 rounded-lg shadow-lg z-20 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-900 mb-1.5">
            <Sparkles size={13} className="text-brand-green" /> AI Analytics Assistant
          </p>
          <p className="text-[11px] text-ink-500 leading-relaxed mb-3">
            AI-powered analysis of this data -- trend explanations, anomaly detection, and plain-English
            summaries -- will be available here once AI is enabled for this workspace.
          </p>
          <button
            onClick={() => setOpen(false)}
            className="text-[11px] font-medium text-brand-green hover:underline"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  )
}

export default function Analytics() {
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'demo' ? 'demo' : 'performance'
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Your ESG performance from approved data, by year and location" action={<AnalyzeWithAiButton />} />
      <div className="flex gap-1 border-b border-surface-border mb-5" role="tablist">
        {VIEWS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={view === key}
            onClick={() => setParams(key === 'demo' ? { view: 'demo' } : {}, { replace: true })}
            className={`flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-xs border-b-2 -mb-px transition-colors ${view === key ? 'border-brand-green text-brand-greenDark font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
            <Icon size={13} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {view === 'demo' ? <EsgDemoDashboard embedded /> : <PerformanceView />}
    </div>
  )
}
