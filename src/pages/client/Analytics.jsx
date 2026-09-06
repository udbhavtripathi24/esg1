import { useState, useMemo } from 'react'
import { Zap, Droplet, Recycle, Flame, Trash2, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Area,
  RadialBarChart, RadialBar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Select, EmptyState } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  useKpiSummary, useDomainSummary, useHistoricalTrend,
  usePeriodComparison, useCompleteness, useEnergyBreakdown,
} from '../../hooks/useAnalytics.js'

/**
 * Analytics V4 -- same real-data-only backend as V1-V3 (see
 * app/services/analytics_service.py's module docstring). Adds
 * domain-specific color coding, a gradient area chart for trends, a
 * ranked "leaderboard" site chart, and an auto-generated plain-English
 * insight banner built from the exact same real period-over-period
 * number already shown elsewhere on the page -- never a new or
 * fabricated computation, just the existing number surfaced as a
 * sentence, matching a common real BI pattern (e.g. Power BI's own
 * "Insights" narration feature).
 *
 * Deliberately NOT included: a radar/spider chart comparing domains on
 * one shared scale. Energy (kWh, often in the thousands) and Water
 * (ML, often in the hundreds) plotted on the same radial axis would
 * visually imply a false equivalence between unrelated units -- exactly
 * the kind of "looks impressive but quietly misleads" visualization
 * this project has consistently avoided. Every chart here plots values
 * against their own real, correctly-labeled scale.
 */

const KPI_META = {
  'energy.consumption': { label: 'Energy', fullLabel: 'Energy Consumption', icon: Zap, color: '#64BC44', light: '#EAF6E4' },
  'water.withdrawal': { label: 'Water Withdrawn', fullLabel: 'Water Withdrawal', icon: Droplet, color: '#3B82F6', light: '#DBEAFE' },
  'water.recycled': { label: 'Water Recycled', fullLabel: 'Water Recycled', icon: Recycle, color: '#06B6D4', light: '#CFFAFE' },
  'emissions.activity_data': { label: 'Emissions', fullLabel: 'Emissions Activity Data (raw)', icon: Flame, color: '#EF4444', light: '#FEE2E2' },
  'waste.generated': { label: 'Waste', fullLabel: 'Waste Generated', icon: Trash2, color: '#78716C', light: '#F5F5F4' },
}
const KPI_OPTIONS = Object.entries(KPI_META).map(([code, meta]) => ({ code, ...meta }))

// Maps the domain-completeness codes (upload-type style: energy_data,
// water_data, etc.) to the same real per-domain colors used everywhere
// else on this page -- so the completeness dots for Energy and Water
// no longer look identical, matching each domain's actual identity.
const DOMAIN_DOT_COLORS = {
  energy_data: KPI_META['energy.consumption'].color,
  water_data: KPI_META['water.withdrawal'].color,
  emissions_data: KPI_META['emissions.activity_data'].color,
  waste_data: KPI_META['waste.generated'].color,
}

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

function compactNumber(n) {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px]">
      <p className="font-medium text-ink-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value?.toLocaleString()} {unit || ''}</p>
      ))}
    </div>
  )
}

function KpiOverviewCard({ kpi, selected, onClick, periodStart, periodEnd }) {
  const summaryQuery = useKpiSummary(kpi.code, periodStart, periodEnd)
  const comparisonQuery = usePeriodComparison(kpi.code, periodStart, periodEnd)
  const trendQuery = useHistoricalTrend(kpi.code)
  const Icon = kpi.icon

  const loading = summaryQuery.isLoading || trendQuery.isLoading
  const total = summaryQuery.data?.total ?? null
  const unit = summaryQuery.data?.unit
  const change = comparisonQuery.data?.change_percentage
  const sparkData = (trendQuery.data || []).slice(-6).map((d) => ({ value: d.value }))

  return (
    <button
      onClick={onClick}
      className={`text-left border rounded-xl p-3.5 transition-all duration-150 ${
        selected ? 'shadow-md scale-[1.02] border-transparent' : 'border-surface-border bg-white hover:shadow-sm hover:-translate-y-0.5'
      }`}
      style={selected ? { backgroundColor: kpi.light, boxShadow: `0 0 0 1.5px ${kpi.color}` } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: selected ? kpi.color : '#6B6B6B' }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: selected ? kpi.color : kpi.light }}>
            <Icon size={11} color={selected ? '#fff' : kpi.color} />
          </span>
          {kpi.label}
        </span>
        {change !== null && change !== undefined && (
          <span className={`flex items-center gap-0.5 text-[9px] font-semibold ${change >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-8 flex items-center"><div className="w-16 h-4 bg-surface-muted rounded animate-pulse" /></div>
      ) : (
        <p className="text-lg font-semibold text-ink-900">
          {total !== null ? compactNumber(total) : '—'}
          {total !== null && <span className="text-[9px] font-normal text-ink-400 ml-1">{unit}</span>}
        </p>
      )}
      {sparkData.length >= 2 && (
        <ResponsiveContainer width="100%" height={28}>
          <LineChart data={sparkData} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
            <Line type="monotone" dataKey="value" stroke={kpi.color} strokeWidth={1.75} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </button>
  )
}

/** Plain-English summary of the real period-over-period number already
 * computed elsewhere -- surfaces it as a sentence, invents nothing new. */
function InsightBanner({ kpi, comparisonQuery, summaryQuery }) {
  if (comparisonQuery.isLoading || summaryQuery.isLoading) return null
  const change = comparisonQuery.data?.change_percentage
  const total = summaryQuery.data?.total
  if (change === null || change === undefined || total === null) return null

  const direction = change >= 0 ? 'increased' : 'decreased'
  const tone = change >= 0 ? 'from-amber-50 to-amber-50/30 border-amber-200 text-amber-800' : 'from-emerald-50 to-emerald-50/30 border-emerald-200 text-emerald-800'

  return (
    <div className={`flex items-start gap-2.5 rounded-lg border bg-gradient-to-r ${tone} px-4 py-3 mb-5 text-xs`}>
      <Sparkles size={15} className="mt-0.5 shrink-0" />
      <p>
        <span className="font-semibold">{kpi.fullLabel}</span> has {direction} by <span className="font-semibold">{Math.abs(change).toFixed(1)}%</span> compared
        to the most recent prior period with data, reaching a total of <span className="font-semibold">{total.toLocaleString()} {summaryQuery.data.unit}</span> this period.
      </p>
    </div>
  )
}

export default function Analytics() {
  const { periodStart, periodEnd, label: currentLabel } = currentQuarterRange()
  const [kpiCode, setKpiCode] = useState(KPI_OPTIONS[0].code)

  const trendEnergy = useHistoricalTrend('energy.consumption')
  const trendWaterWithdrawal = useHistoricalTrend('water.withdrawal')
  const trendWaterRecycled = useHistoricalTrend('water.recycled')
  const trendEmissions = useHistoricalTrend('emissions.activity_data')
  const trendWaste = useHistoricalTrend('waste.generated')
  const allTrendQueries = [trendEnergy, trendWaterWithdrawal, trendWaterRecycled, trendEmissions, trendWaste]
  const allTrendsUpdatedAt = allTrendQueries.map((q) => q.dataUpdatedAt).join(',')

  const realPeriods = useMemo(() => {
    const seen = new Map()
    for (const query of allTrendQueries) {
      for (const point of query.data || []) {
        seen.set(`${point.period_start}|${point.period_end}`, point)
      }
    }
    return Array.from(seen.values()).sort((a, b) => new Date(b.period_start) - new Date(a.period_start))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allTrendsUpdatedAt intentionally stands in for all 5 query results together
  }, [allTrendsUpdatedAt])

  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const activePeriod = selectedPeriod || (realPeriods[0] ? { period_start: realPeriods[0].period_start, period_end: realPeriods[0].period_end } : { period_start: periodStart, period_end: periodEnd })
  const activeLabel = selectedPeriod
    ? `${activePeriod.period_start} — ${activePeriod.period_end}`
    : (realPeriods[0] ? `${realPeriods[0].period_start} — ${realPeriods[0].period_end} (most recent)` : currentLabel)

  const summaryQuery = useKpiSummary(kpiCode, activePeriod.period_start, activePeriod.period_end)
  const domainsQuery = useDomainSummary(activePeriod.period_start, activePeriod.period_end)
  const trendQuery = useHistoricalTrend(kpiCode)
  const comparisonQuery = usePeriodComparison(kpiCode, activePeriod.period_start, activePeriod.period_end)
  const completenessQuery = useCompleteness(activePeriod.period_start, activePeriod.period_end)
  const energyBreakdownQuery = useEnergyBreakdown(activePeriod.period_start, activePeriod.period_end)

  const selectedKpi = KPI_OPTIONS.find((k) => k.code === kpiCode)
  const sortedBySite = summaryQuery.data?.by_site
    ? [...summaryQuery.data.by_site].filter((s) => s.value !== null).sort((a, b) => b.value - a.value)
    : []

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Real, as-reported KPI analysis -- no scoring, no estimated emissions." />

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {KPI_OPTIONS.map((k) => (
          <KpiOverviewCard
            key={k.code} kpi={k} selected={k.code === kpiCode}
            onClick={() => setKpiCode(k.code)}
            periodStart={activePeriod.period_start} periodEnd={activePeriod.period_end}
          />
        ))}
      </div>

      <InsightBanner kpi={selectedKpi} comparisonQuery={comparisonQuery} summaryQuery={summaryQuery} />

      <p className="text-[10px] text-ink-400 mb-4">Showing detail for <span className="font-medium" style={{ color: selectedKpi.color }}>{selectedKpi.fullLabel}</span> — {activeLabel}</p>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card title="Total" subtitle={selectedKpi.fullLabel}>
          {summaryQuery.isLoading ? <LoadingState label="Loading…" /> :
           summaryQuery.isError ? <ErrorState message="Could not load." onRetry={() => summaryQuery.refetch()} /> :
           summaryQuery.data.total === null ? <p className="text-xs text-ink-300 py-4">No approved data for this period.</p> : (
            <div>
              <p className="text-2xl font-semibold" style={{ color: selectedKpi.color }}>{summaryQuery.data.total.toLocaleString()} <span className="text-sm font-normal text-ink-500">{summaryQuery.data.unit}</span></p>
              <p className="text-[10px] text-ink-300 mt-1">{summaryQuery.data.row_count} reported value{summaryQuery.data.row_count === 1 ? '' : 's'}</p>
              {summaryQuery.data.excluded_unrecognized_units.length > 0 && (
                <p className="text-[10px] text-status-review mt-1">
                  {summaryQuery.data.excluded_unrecognized_units.length} value(s) in unrecognized unit(s) ({summaryQuery.data.excluded_unrecognized_units.join(', ')}) excluded.
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
            <p className={`text-2xl font-semibold flex items-center gap-1.5 ${comparisonQuery.data.change_percentage >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {comparisonQuery.data.change_percentage >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {comparisonQuery.data.change_percentage >= 0 ? '+' : ''}{comparisonQuery.data.change_percentage.toFixed(1)}%
            </p>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card title="By Site" subtitle={`${selectedKpi.fullLabel} — ranked highest to lowest`}>
          {summaryQuery.isLoading ? <LoadingState label="Loading…" /> :
           summaryQuery.isError ? null :
           sortedBySite.length === 0 ? <EmptyState title="No approved data" /> : (
            <ResponsiveContainer width="100%" height={Math.max(160, sortedBySite.length * 44)}>
              <BarChart data={sortedBySite.map((s) => ({
                name: s.site_id === null ? 'Unassigned' : `Site #${s.site_id}`, value: s.value,
              }))} layout="vertical" margin={{ left: 10, right: 30, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={compactNumber} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip content={<ChartTooltip unit={summaryQuery.data.unit} />} />
                <Bar dataKey="value" name={selectedKpi.fullLabel} radius={[0, 6, 6, 0]}>
                  <LabelList dataKey="value" position="right" formatter={compactNumber} style={{ fontSize: 9, fill: '#6B6B6B' }} />
                  {sortedBySite.map((_, i) => <Cell key={i} fill={selectedKpi.color} fillOpacity={1 - i * 0.12} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="By Reported Unit" subtitle="Raw, as-reported -- not converted">
          {summaryQuery.isLoading ? <LoadingState label="Loading…" /> :
           summaryQuery.isError ? null :
           summaryQuery.data.by_unit.length === 0 ? <EmptyState title="No approved data" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summaryQuery.data.by_unit.map((u) => ({ name: u.unit, value: u.total }))} margin={{ left: 0, right: 10, top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEE" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={compactNumber} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Total" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="value" position="top" formatter={compactNumber} style={{ fontSize: 9, fill: '#6B6B6B' }} />
                  {summaryQuery.data.by_unit.map((_, i) => <Cell key={i} fill={i === 0 ? selectedKpi.color : '#D1D5DB'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card title="Historical Trend" subtitle={`${selectedKpi.fullLabel} across all approved reporting periods -- value and period-over-period % change`} className="mb-5">
        {trendQuery.isLoading ? <LoadingState label="Loading…" /> :
         trendQuery.isError ? <ErrorState message="Could not load trend." onRetry={() => trendQuery.refetch()} /> :
         trendQuery.data.length === 0 ? <EmptyState title="No approved data yet" subtitle="A trend appears once at least one period has approved data." /> :
         trendQuery.data.length === 1 ? (
          <p className="text-xs text-ink-500 py-2">Only one approved reporting period exists so far ({trendQuery.data[0].value.toLocaleString()} {trendQuery.data[0].unit}) -- a trend needs at least two.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendQuery.data.map((d, i, arr) => ({
              name: new Date(d.period_start).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
              value: d.value, unit: d.unit,
              // Real arithmetic on the same real, already-fetched trend
              // points -- never a new API call, never fabricated. The
              // first point has no prior period to compare against, so
              // it correctly has no % change, matching the same
              // "first period -> no fabricated comparison" rule used
              // everywhere else in this app.
              pctChange: i === 0 || arr[i - 1].value === 0 ? null : ((d.value - arr[i - 1].value) / arr[i - 1].value) * 100,
            }))} margin={{ left: 0, right: 20, top: 20 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedKpi.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={selectedKpi.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="value" tick={{ fontSize: 10 }} tickFormatter={compactNumber} />
              <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null
                return (
                  <div className="bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px]">
                    <p className="font-medium text-ink-900 mb-1">{label}</p>
                    {payload.map((p, i) => (
                      <p key={i} style={{ color: p.color }}>
                        {p.name}: {p.value === null ? '—' : p.dataKey === 'pctChange' ? `${p.value.toFixed(1)}%` : `${p.value.toLocaleString()} ${trendQuery.data[0]?.unit || ''}`}
                      </p>
                    ))}
                  </div>
                )
              }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area yAxisId="value" type="monotone" dataKey="value" name={selectedKpi.fullLabel} stroke={selectedKpi.color} strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 4, fill: selectedKpi.color }} activeDot={{ r: 6 }} />
              <Line yAxisId="pct" type="monotone" dataKey="pctChange" name="Period-over-period %" stroke="#1F2937" strokeWidth={1.75} strokeDasharray="4 3" dot={{ r: 3, fill: '#1F2937' }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card title="All KPIs This Period" subtitle="Each KPI uses its own unit -- shown separately, not on one chart">
          {domainsQuery.isLoading ? <LoadingState label="Loading…" /> :
           domainsQuery.isError ? <ErrorState message="Could not load." onRetry={() => domainsQuery.refetch()} /> : (
            <div className="grid grid-cols-2 gap-3">
              {domainsQuery.data.map((d) => {
                const meta = KPI_META[d.kpi_code]
                return (
                  <div key={d.kpi_code} className="rounded-lg p-3 border" style={{ borderColor: meta?.light, backgroundColor: meta?.light }}>
                    <p className="text-[10px] mb-1 font-medium" style={{ color: meta?.color }}>{d.display_name}</p>
                    <p className="text-lg font-semibold text-ink-900">
                      {d.total !== null ? compactNumber(d.total) : '—'}
                      {d.total !== null && <span className="text-[10px] font-normal text-ink-400 ml-1">{d.unit}</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Domain Completeness" subtitle="MVP domains with an approved submission this period">
          {completenessQuery.isLoading ? <LoadingState label="Loading…" /> :
           completenessQuery.isError ? null : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <RadialBarChart
                  width={140} height={140} innerRadius="65%" outerRadius="100%"
                  data={[{ name: 'Completeness', value: completenessQuery.data.percentage }]}
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar background={{ fill: '#F1F5F1' }} dataKey="value" cornerRadius={8} fill={selectedKpi.color} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div>
                <p className="text-2xl font-semibold text-ink-900 mb-2">{completenessQuery.data.approved_count}/{completenessQuery.data.total}</p>
                <div className="space-y-1">
                  {Object.entries(completenessQuery.data.domains).map(([code, approved]) => {
                    const domainColor = DOMAIN_DOT_COLORS[code] || '#64BC44'
                    return (
                      <div key={code} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: approved ? domainColor : '#E5E7EB' }} />
                        <span className="text-ink-700 capitalize">{code.replace('_data', '')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Energy Consumption by Type" subtitle="Only categories actually present in your reported data">
        {energyBreakdownQuery.isLoading ? <LoadingState label="Loading…" /> :
         energyBreakdownQuery.isError ? <ErrorState message="Could not load." onRetry={() => energyBreakdownQuery.refetch()} /> :
         energyBreakdownQuery.data.length === 0 ? <EmptyState title="No approved energy data for this period" /> : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={energyBreakdownQuery.data} dataKey="value" nameKey="energy_type"
                  innerRadius={50} outerRadius={80} paddingAngle={2}
                  label={({ energy_type, percent }) => `${energy_type} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#B0B0B0', strokeWidth: 1 }}
                >
                  {energyBreakdownQuery.data.map((_, i) => (
                    <Cell key={i} fill={['#64BC44', '#2E7D32', '#8BC34A', '#C5E1A5'][i % 4]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 w-full">
              {energyBreakdownQuery.data.map((e, i) => (
                <div key={e.energy_type} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-ink-700 capitalize">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#64BC44', '#2E7D32', '#8BC34A', '#C5E1A5'][i % 4] }} />
                    {e.energy_type}
                  </span>
                  <span className="text-ink-900 font-medium">{e.value.toLocaleString()} {e.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
