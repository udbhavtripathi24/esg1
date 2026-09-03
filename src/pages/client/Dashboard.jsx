import { useNavigate } from 'react-router-dom'
import { Zap, Droplet, Recycle, Database } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, KpiTile, EmptyState } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useClientDashboard, useClientDashboardTasks } from '../../hooks/useDashboard.js'

/**
 * Dashboard V1 — deterministic/structural methodology only. See
 * app/services/dashboard_service.py's module docstring.
 *
 * Carbon Emissions is DELIBERATELY absent from active visualization — no
 * emission-factor methodology has been approved. Framework Status and
 * Reporting Calendar are DELIBERATELY absent — no framework-tracking or
 * scheduling model exists anywhere in this backend. None of these are
 * bugs; all three are explicit, disclosed deferrals, not omissions.
 *
 * The mock's decorative sparkline curves under each card are NOT
 * reproduced — they implied continuous historical trend data that
 * doesn't exist (only two period totals are ever compared, for QoQ).
 * Drawing a fake curve would visually fabricate precision the real data
 * doesn't have.
 */

function currentQuarterRange() {
  const now = new Date()
  const year = now.getFullYear()
  const q = Math.floor(now.getMonth() / 3)
  const startMonth = q * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0)
  const iso = (d) => d.toISOString().slice(0, 10)
  return { periodStart: iso(start), periodEnd: iso(end), label: `Q${q + 1} ${year}` }
}

const TASK_LABELS = { approved: 'Approved', awaiting_approval: 'Awaiting approval', not_submitted: 'Not submitted' }
const TASK_COLORS = { approved: 'text-status-approved', awaiting_approval: 'text-status-review', not_submitted: 'text-ink-400' }

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { periodStart, periodEnd, label } = currentQuarterRange()

  const dashboardQuery = useClientDashboard(periodStart, periodEnd)
  const tasksQuery = useClientDashboardTasks(periodStart, periodEnd)

  if (dashboardQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard." subtitle={`${label} reporting period`} />
        <LoadingState label="Loading dashboard…" />
      </div>
    )
  }
  if (dashboardQuery.isError) {
    return (
      <div>
        <PageHeader title="Dashboard." subtitle={`${label} reporting period`} />
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
        <PageHeader title="Dashboard." subtitle={`${label} reporting period`} />
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
      <PageHeader title="Dashboard." subtitle={`${label} reporting period`} />

      <div className="mb-6">
        <p className="text-xs font-semibold text-ink-900 mb-3">ESG Performance Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            icon={Zap} label="Energy Consumption" tint="amber"
            value={data.energy_consumption.value !== null ? Math.round(data.energy_consumption.value).toLocaleString() : '—'}
            unit={data.energy_consumption.value !== null ? data.energy_consumption.unit : undefined}
            delta={fmtDelta(data.energy_qoq_percentage)} trend={trendFor(data.energy_qoq_percentage)}
          />
          <KpiTile
            icon={Droplet} label="Water Withdrawal" tint="blue"
            value={data.water_withdrawal.value !== null ? data.water_withdrawal.value.toLocaleString() : '—'}
            unit={data.water_withdrawal.value !== null ? data.water_withdrawal.unit : undefined}
            delta={fmtDelta(data.water_qoq_percentage)} trend={trendFor(data.water_qoq_percentage)}
          />
          <KpiTile
            icon={Recycle} label="Water Recycled" tint="green"
            value={data.water_recycled_percentage !== null ? data.water_recycled_percentage.toFixed(0) : '—'}
            unit={data.water_recycled_percentage !== null ? '%' : undefined}
          />
          <KpiTile
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
