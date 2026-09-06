import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Droplet, Recycle, Database } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Select, EmptyState } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useClientDashboard, useClientDashboardTasks } from '../../hooks/useDashboard.js'
import { useHistoricalTrend } from '../../hooks/useAnalytics.js'

/**
 * Dashboard V2 -- same deterministic/structural methodology as V1 (see
 * app/services/dashboard_service.py's module docstring). Adds a real
 * reporting-period selector (was locked to "current quarter" only) and
 * real sparklines on each KPI tile, reusing the exact same trend data
 * already proven correct in Analytics -- no new backend calls beyond
 * calling the existing historical-trend endpoint for the two KPIs this
 * page already cares about.
 *
 * Carbon Emissions is DELIBERATELY absent from active visualization —
 * no emission-factor methodology has been approved. Framework Status
 * and Reporting Calendar are DELIBERATELY absent — no framework-
 * tracking or scheduling model exists anywhere in this backend. None
 * of these are bugs; all three are explicit, disclosed deferrals.
 */

const TINT_COLORS = { amber: '#D97706', blue: '#2563EB', green: '#64BC44', purple: '#9333EA' }

function currentQuarterRange() {
  const now = new Date()
  const year = now.getFullYear()
  const q = Math.floor(now.getMonth() / 3)
  const start = new Date(year, q * 3, 1)
  const end = new Date(year, q * 3 + 3, 0)
  const iso = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { periodStart: iso(start), periodEnd: iso(end), label: `Q${q + 1} ${year}` }
}

const TASK_LABELS = { approved: 'Approved', awaiting_approval: 'Awaiting approval', not_submitted: 'Not submitted' }
const TASK_COLORS = { approved: 'text-status-approved', awaiting_approval: 'text-status-review', not_submitted: 'text-ink-400' }

function DashboardKpiTile({ icon: Icon, label, value, unit, delta, trend, tint, sparkData }) {
  const color = TINT_COLORS[tint] || TINT_COLORS.green
  const bgTint = { amber: 'bg-amber-100 text-amber-600', blue: 'bg-blue-100 text-blue-600', green: 'bg-brand-green/10 text-brand-greenDark', purple: 'bg-purple-100 text-purple-600' }[tint]
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${bgTint}`}>
          <Icon size={16} />
        </div>
        {delta && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-amber-600' : 'text-status-approved'}`}>
            {trend === 'up' ? '↗' : '↘'} {delta}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold text-ink-900">
        {value}
        {unit && <span className="text-sm font-normal text-ink-500 ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-ink-500 mt-0.5">{label}</div>
      {sparkData && sparkData.length >= 2 && (
        <ResponsiveContainer width="100%" height={24} className="mt-2">
          <LineChart data={sparkData} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { periodStart, periodEnd, label: currentLabel } = currentQuarterRange()

  // Real historical periods, built the same way as Analytics -- the
  // union of periods with real data for the two KPIs this page shows.
  const energyTrend = useHistoricalTrend('energy.consumption')
  const waterTrend = useHistoricalTrend('water.withdrawal')
  const realPeriods = (() => {
    const seen = new Map()
    for (const q of [energyTrend, waterTrend]) {
      for (const point of q.data || []) seen.set(`${point.period_start}|${point.period_end}`, point)
    }
    return Array.from(seen.values()).sort((a, b) => new Date(b.period_start) - new Date(a.period_start))
  })()

  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const activePeriod = selectedPeriod || (realPeriods[0] ? { period_start: realPeriods[0].period_start, period_end: realPeriods[0].period_end } : { period_start: periodStart, period_end: periodEnd })
  const activeLabel = selectedPeriod
    ? `${activePeriod.period_start} — ${activePeriod.period_end}`
    : (realPeriods[0] ? `${realPeriods[0].period_start} — ${realPeriods[0].period_end} (most recent)` : currentLabel)

  const dashboardQuery = useClientDashboard(activePeriod.period_start, activePeriod.period_end)
  const tasksQuery = useClientDashboardTasks(activePeriod.period_start, activePeriod.period_end)

  const energySpark = (energyTrend.data || []).slice(-6).map((d) => ({ value: d.value }))
  const waterSpark = (waterTrend.data || []).slice(-6).map((d) => ({ value: d.value }))

  const periodSelector = (
    <div className="mb-5 max-w-xs">
      <label className="text-[10px] text-ink-500 mb-1 block">Reporting period</label>
      <Select
        value={selectedPeriod ? `${selectedPeriod.period_start}|${selectedPeriod.period_end}` : ''}
        onChange={(e) => {
          if (!e.target.value) { setSelectedPeriod(null); return }
          const [ps, pe] = e.target.value.split('|')
          setSelectedPeriod({ period_start: ps, period_end: pe })
        }}
      >
        {realPeriods.length === 0 && <option value="">{currentLabel} (no historical data yet)</option>}
        {realPeriods.map((p) => (
          <option key={p.period_start} value={`${p.period_start}|${p.period_end}`}>
            {p.period_start} — {p.period_end}
          </option>
        ))}
      </Select>
    </div>
  )

  if (dashboardQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard." subtitle={activeLabel} />
        {periodSelector}
        <LoadingState label="Loading dashboard…" />
      </div>
    )
  }
  if (dashboardQuery.isError) {
    return (
      <div>
        <PageHeader title="Dashboard." subtitle={activeLabel} />
        {periodSelector}
        <ErrorState
          message={dashboardQuery.error?.message || 'Could not load the dashboard.'}
          onRetry={() => dashboardQuery.refetch()}
        />
      </div>
    )
  }

  const data = dashboardQuery.data
  const hasAnyData = data.energy_consumption.value !== null || data.water_withdrawal.value !== null
  const fmtDelta = (pct) => (pct === null || pct === undefined) ? undefined : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  const trendFor = (pct) => (pct !== null && pct !== undefined && pct < 0) ? 'down' : 'up'

  if (!hasAnyData) {
    return (
      <div>
        <PageHeader title="Dashboard." subtitle={activeLabel} />
        {periodSelector}
        <div className="bg-white border border-surface-border rounded-lg">
          <EmptyState
            title="No approved data available"
            subtitle="Once a submission for this period is reviewed and approved, your dashboard will populate here."
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard." subtitle={activeLabel} />
      {periodSelector}

      <div className="mb-6">
        <p className="text-xs font-semibold text-ink-900 mb-3">ESG Performance Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiTile
            icon={Zap} label="Energy Consumption" tint="amber"
            value={data.energy_consumption.value !== null ? Math.round(data.energy_consumption.value).toLocaleString() : '—'}
            unit={data.energy_consumption.value !== null ? data.energy_consumption.unit : undefined}
            delta={fmtDelta(data.energy_qoq_percentage)} trend={trendFor(data.energy_qoq_percentage)}
            sparkData={energySpark}
          />
          <DashboardKpiTile
            icon={Droplet} label="Water Withdrawal" tint="blue"
            value={data.water_withdrawal.value !== null ? data.water_withdrawal.value.toLocaleString() : '—'}
            unit={data.water_withdrawal.value !== null ? data.water_withdrawal.unit : undefined}
            delta={fmtDelta(data.water_qoq_percentage)} trend={trendFor(data.water_qoq_percentage)}
            sparkData={waterSpark}
          />
          <DashboardKpiTile
            icon={Recycle} label="Water Recycled" tint="green"
            value={data.water_recycled_percentage !== null ? data.water_recycled_percentage.toFixed(0) : '—'}
            unit={data.water_recycled_percentage !== null ? '%' : undefined}
          />
          <DashboardKpiTile
            icon={Database} label="Domain Coverage" tint="purple"
            value={`${data.domain_completeness.approved_count}/${data.domain_completeness.total}`}
            unit="domains"
          />
        </div>
        {/* Carbon Emissions: honest deferred state, not a computed card. */}
        <p className="text-[10px] text-ink-300 mt-3">
          Carbon emissions: methodology not yet configured — awaiting approved emission-factor methodology.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="My Tasks" subtitle="Submission status for this reporting period">
          {tasksQuery.isLoading ? (
            <LoadingState label="Loading…" />
          ) : tasksQuery.isError ? (
            <ErrorState message="Could not load task status." onRetry={() => tasksQuery.refetch()} />
          ) : (
            <div className="space-y-3">
              {tasksQuery.data.map((t) => (
                <div key={t.upload_type_code} className="flex items-center justify-between border-b border-surface-border last:border-0 pb-3 last:pb-0">
                  <div>
                    <p className="text-xs font-medium text-ink-900">{t.display_name}</p>
                    <p className={`text-[10px] mt-0.5 ${TASK_COLORS[t.status]}`}>{TASK_LABELS[t.status]}</p>
                  </div>
                  {t.status !== 'approved' && (
                    <button
                      onClick={() => navigate('/client/upload-center')}
                      className="text-[10px] font-medium text-brand-green hover:underline"
                    >
                      Upload →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Domain Completeness" subtitle={`${data.domain_completeness.percentage}% of MVP domains approved this period`}>
          <div className="space-y-2.5">
            {Object.entries(data.domain_completeness.domains).map(([code, approved]) => (
              <div key={code} className="flex items-center justify-between text-[10px]">
                <span className="text-ink-700 capitalize">{code.replace('_data', '')}</span>
                <span className={approved ? 'text-status-approved font-medium' : 'text-ink-300'}>
                  {approved ? 'Approved' : 'Not yet'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
