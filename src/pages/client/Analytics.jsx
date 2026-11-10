import { useState } from 'react'
import AiDrawer from '../../components/ai/AiDrawer.jsx'
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
 * - Analyze with AI: VISTA AI (summary and questions) for the year, location and domain shown in Performance.
 */

const VIEWS = [
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'demo', label: 'ESG Dashboard (Demo)', icon: LayoutDashboard },
]

function AnalyzeWithAiButton({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="group relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-xs font-medium shadow-sm hover:shadow-md transition-all overflow-hidden"
      style={{ background: 'linear-gradient(120deg, #1f6f0b 0%, #26890D 45%, #0f9f8f 100%)' }}>
      <Sparkles size={14} className="transition-transform group-hover:rotate-12" /> Analyze with AI
    </button>
  )
}

export default function Analytics() {
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'demo' ? 'demo' : 'performance'
  const [aiOpen, setAiOpen] = useState(false)
  // What the Performance view shows (FY, location, domain): the AI summary and questions use the same scope.
  const [context, setContext] = useState({})
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Your ESG performance from approved data, by year and location" action={<AnalyzeWithAiButton onClick={() => setAiOpen(true)} />} />
      <AiDrawer open={aiOpen} onClose={() => setAiOpen(false)} context={context} />
      <div className="flex gap-1 border-b border-surface-border mb-5" role="tablist">
        {VIEWS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={view === key}
            onClick={() => setParams(key === 'demo' ? { view: 'demo' } : {}, { replace: true })}
            className={`flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-xs border-b-2 -mb-px transition-colors ${view === key ? 'border-brand-green text-brand-greenDark font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
            <Icon size={13} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {view === 'demo' ? <EsgDemoDashboard embedded /> : <PerformanceView onContext={setContext} />}
    </div>
  )
}
