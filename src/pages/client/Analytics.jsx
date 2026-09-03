import { useState } from 'react'
import { Zap, Droplet, Recycle, Flame, Trash2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Select, EmptyState } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  useKpiSummary, useDomainSummary, useHistoricalTrend,
  usePeriodComparison, useCompleteness, useEnergyBreakdown,
} from '../../hooks/useAnalytics.js'

/**
 * Analytics V1 -- real-data KPI aggregation only. See
 * app/services/analytics_service.py's module docstring for the full
 * backend rationale.
 *
 * This page is a DELIBERATE, GROUND-UP REDESIGN of the old mock page,
 * not a data-swap of the old cards. The old page's entire premise (ESG
 * scores, computed Scope 1/2/3 CO2e, business-unit/region breakdowns,
 * fake ESG goals) has no real backend support and is not reproduced
 * here in any form -- not even as an empty/deferred card, since none of
 * those concepts exist in this platform's data model at all (unlike,
 * say, Carbon Emissions on the Dashboard, which is a real KPI concept
 * with a real deferred *methodology*, not a nonexistent one).
 *
 * Filters offered here are ONLY ones the real data genuinely supports:
 * KPI/domain and reporting period. Business Unit and Region are
 * deliberately NOT offered -- no real submission path in this
 * application ever populates either field today (confirmed during the
 * Analytics readiness investigation).
 */

const KPI_OPTIONS = [
  { code: 'energy.consumption', label: 'Energy Consumption', icon: Zap },
  { code: 'water.withdrawal', label: 'Water Withdrawal', icon: Droplet },
  { code: 'water.recycled', label: 'Water Recycled', icon: Recycle },
  { code: 'emissions.activity_data', label: 'Emissions Activity Data (raw)', icon: Flame },
  { code: 'waste.generated', label: 'Waste Generated', icon: Trash2 },
]

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

export default function Analytics() {
  const { periodStart, periodEnd, label } = currentQuarterRange()
  const [kpiCode, setKpiCode] = useState(KPI_OPTIONS[0].code)

  const summaryQuery = useKpiSummary(kpiCode, periodStart, periodEnd)
  const domainsQuery = useDomainSummary(periodStart, periodEnd)
  const trendQuery = useHistoricalTrend(kpiCode)
  const comparisonQuery = usePeriodComparison(kpiCode, periodStart, periodEnd)
  const completenessQuery = useCompleteness(periodStart, periodEnd)
  const energyBreakdownQuery = useEnergyBreakdown(periodStart, periodEnd)

  const selectedKpi = KPI_OPTIONS.find((k) => k.code === kpiCode)

  return (
    <div>
      <PageHeader title="Analytics" subtitle={`Real, as-reported KPI analysis for ${label} -- no scoring, no estimated emissions.`} />

      <div className="mb-5 max-w-xs">
        <label className="text-[10px] text-ink-500 mb-1 block">KPI</label>
        <Select value={kpiCode} onChange={(e) => setKpiCode(e.target.value)}>
          {KPI_OPTIONS.map((k) => <option key={k.code} value={k.code}>{k.label}</option>)}
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card title="Total" subtitle={selectedKpi.label}>
          {summaryQuery.isLoading ? <LoadingState label="Loading…" /> :
           summaryQuery.isError ? <ErrorState message="Could not load." onRetry={() => summaryQuery.refetch()} /> :
           summaryQuery.data.total === null ? <p className="text-xs text-ink-300 py-4">No approved data for this period.</p> : (
            <div>
              <p className="text-2xl font-semibold text-ink-900">{summaryQuery.data.total.toLocaleString()} <span className="text-sm font-normal text-ink-500">{summaryQuery.data.unit}</span></p>
              <p className="text-[10px] text-ink-300 mt-1">{summaryQuery.data.row_count} reported value{summaryQuery.data.row_count === 1 ? '' : 's'}</p>
              {summaryQuery.data.excluded_unrecognized_units.length > 0 && (
                <p className="text-[10px] text-status-review mt-1">
                  {summaryQuery.data.excluded_unrecognized_units.length} value(s) in unrecognized unit(s) ({summaryQuery.data.excluded_unrecognized_units.join(', ')}) excluded from this total.
                </p>
              )}
            </div>
          )}
        </Card>

        <Card title="Average" subtitle="Mean of individual reported values">
          {summaryQuery.isLoading ? <LoadingState label="Loading…" /> :
           summaryQuery.isError ? null :
           summaryQuery.data.average === null ? <p className="text-xs text-ink-300 py-4">—</p> : (
            <p className="text-2xl font-semibold text-ink-900">{summaryQuery.data.average.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm font-normal text-ink-500">{summaryQuery.data.unit}</span></p>
          )}
        </Card>

        <Card title="Period-over-Period" subtitle="vs. most recent prior period with data">
          {comparisonQuery.isLoading ? <LoadingState label="Loading…" /> :
           comparisonQuery.isError ? null :
           comparisonQuery.data.change_percentage === null ? <p className="text-xs text-ink-300 py-4">No comparable prior period.</p> : (
            <p className={`text-2xl font-semibold ${comparisonQuery.data.change_percentage >= 0 ? 'text-status-pending' : 'text-status-approved'}`}>
              {comparisonQuery.data.change_percentage >= 0 ? '+' : ''}{comparisonQuery.data.change_percentage.toFixed(1)}%
            </p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card title="By Site" subtitle={selectedKpi.label}>
          {summaryQuery.isLoading ? <LoadingState label="Loading…" /> :
           summaryQuery.isError ? null :
           summaryQuery.data.by_site.length === 0 ? <EmptyState title="No approved data" /> : (
            <div className="space-y-2.5">
              {summaryQuery.data.by_site.map((s) => (
                <div key={s.site_id ?? 'unassigned'} className="flex items-center justify-between text-[10px]">
                  <span className="text-ink-700">{s.site_id === null ? 'Unassigned' : `Site #${s.site_id}`}</span>
                  <span className="text-ink-900 font-medium">{s.value !== null ? `${s.value.toLocaleString()} ${s.unit}` : 'No convertible data'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="By Reported Unit" subtitle="Raw, as-reported -- not converted">
          {summaryQuery.isLoading ? <LoadingState label="Loading…" /> :
           summaryQuery.isError ? null :
           summaryQuery.data.by_unit.length === 0 ? <EmptyState title="No approved data" /> : (
            <div className="space-y-2.5">
              {summaryQuery.data.by_unit.map((u) => (
                <div key={u.unit} className="flex items-center justify-between text-[10px]">
                  <span className="text-ink-700">{u.unit}</span>
                  <span className="text-ink-900 font-medium">{u.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Historical Trend" subtitle={`${selectedKpi.label} across all approved reporting periods`} className="mb-5">
        {trendQuery.isLoading ? <LoadingState label="Loading…" /> :
         trendQuery.isError ? <ErrorState message="Could not load trend." onRetry={() => trendQuery.refetch()} /> :
         trendQuery.data.length === 0 ? <EmptyState title="No approved data yet" subtitle="A trend appears once at least one period has approved data." /> :
         trendQuery.data.length === 1 ? (
          <p className="text-xs text-ink-500 py-2">Only one approved reporting period exists so far ({trendQuery.data[0].value.toLocaleString()} {trendQuery.data[0].unit}) -- a trend needs at least two.</p>
        ) : (
          <TrendChart data={trendQuery.data} />
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card title="All KPIs This Period">
          {domainsQuery.isLoading ? <LoadingState label="Loading…" /> :
           domainsQuery.isError ? <ErrorState message="Could not load." onRetry={() => domainsQuery.refetch()} /> : (
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-ink-500">
                  <th className="font-medium py-1.5">KPI</th>
                  <th className="font-medium py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {domainsQuery.data.map((d) => (
                  <tr key={d.kpi_code} className="border-t border-surface-border">
                    <td className="py-2 text-ink-900">{d.display_name}</td>
                    <td className="py-2 text-right text-ink-700">{d.total !== null ? `${d.total.toLocaleString()} ${d.unit}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Domain Completeness" subtitle="MVP domains with an approved submission this period">
          {completenessQuery.isLoading ? <LoadingState label="Loading…" /> :
           completenessQuery.isError ? null : (
            <div>
              <p className="text-2xl font-semibold text-ink-900 mb-3">{completenessQuery.data.approved_count}/{completenessQuery.data.total}</p>
              <div className="space-y-2">
                {Object.entries(completenessQuery.data.domains).map(([code, approved]) => (
                  <div key={code} className="flex items-center justify-between text-[10px]">
                    <span className="text-ink-700 capitalize">{code.replace('_data', '')}</span>
                    <span className={approved ? 'text-status-approved font-medium' : 'text-ink-300'}>{approved ? 'Approved' : 'Not yet'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Energy Consumption by Type" subtitle="Only categories actually present in your reported data">
        {energyBreakdownQuery.isLoading ? <LoadingState label="Loading…" /> :
         energyBreakdownQuery.isError ? <ErrorState message="Could not load." onRetry={() => energyBreakdownQuery.refetch()} /> :
         energyBreakdownQuery.data.length === 0 ? <EmptyState title="No approved energy data for this period" /> : (
          <div className="space-y-2.5">
            {energyBreakdownQuery.data.map((e) => (
              <div key={e.energy_type} className="flex items-center justify-between text-[10px]">
                <span className="text-ink-700 capitalize">{e.energy_type}</span>
                <span className="text-ink-900 font-medium">{e.value.toLocaleString()} {e.unit}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function TrendChart({ data }) {
  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(0, ...values)
  const range = max - min || 1
  const w = 600, h = 140, pad = 20
  const stepX = (w - pad * 2) / (data.length - 1)
  const points = data.map((d, i) => `${pad + i * stepX},${h - pad - ((d.value - min) / range) * (h - pad * 2)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-40">
      <polyline points={points} fill="none" stroke="#64BC44" strokeWidth="2" />
      {data.map((d, i) => (
        <circle key={i} cx={pad + i * stepX} cy={h - pad - ((d.value - min) / range) * (h - pad * 2)} r="3" fill="#64BC44" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pad + i * stepX} y={h + 12} fontSize="9" textAnchor="middle" fill="#6B6B6B">
          {new Date(d.period_start).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
        </text>
      ))}
    </svg>
  )
}
