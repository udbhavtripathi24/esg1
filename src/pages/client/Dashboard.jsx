import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight, ArrowUpRight, ArrowRight, Droplet, Factory, FileSpreadsheet, HardHat, Info, Leaf, MapPin, Recycle,
  Target, Users, Zap,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, EmptyState, ProgressBar, Select } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useEsgOverview } from '../../hooks/useDashboard.js'
import { useKpiSeries, useKpiValues } from '../../hooks/useKpis.js'
import { LocationBars, Sparkline, StackedMonthly } from '../../components/analytics/charts.jsx'
import { SERIES, fmtValue } from '../../components/analytics/viz.js'
import { convertUnit, convertValue } from '../../components/analytics/units.js'
import { useReportingUnits } from '../../hooks/useUnits.js'

/**
 * The client's ESG performance for a financial year, from the approved data
 * sheets — the same figures, by the same rules, as the BRSR and the Admin
 * Console targets (backend: app/services/esg_overview.py).
 */

const ICONS = {
  energy_total: Zap, energy_renewable_share: Leaf, water_withdrawal: Droplet, waste_diverted_share: Recycle,
  women_workforce_share: Users, ltifr_employees: HardHat,
}
const TINTS = {
  energy_total: 'bg-amber-100 text-amber-600', energy_renewable_share: 'bg-brand-green/10 text-brand-greenDark',
  water_withdrawal: 'bg-blue-100 text-blue-600', waste_diverted_share: 'bg-emerald-100 text-emerald-700',
  women_workforce_share: 'bg-purple-100 text-purple-600', ltifr_employees: 'bg-orange-100 text-orange-600',
}
// The KPI behind each headline tile, for its 12-month sparkline.
const SPARK = {
  energy_total: 'energy_total_mj', energy_renewable_share: 'renewable_share_pct', water_withdrawal: 'water_withdrawal_total',
  waste_diverted_share: 'waste_diverted_pct', women_workforce_share: 'all_female_pct', ltifr_employees: 'ltifr_employees',
}
const SCOPES = [['scope1_total', 'Scope 1', 'Direct: fuel, DG sets, refrigerants, owned vehicles'],
  ['scope2_total', 'Scope 2', 'Purchased grid electricity'],
  ['scope3_total', 'Scope 3', 'Business travel, commuting, third-party equipment']]

const TARGET_STATUS = {
  on_track: ['On track', 'bg-brand-green/15 text-brand-greenDark', '#64BC44'],
  achieved: ['Achieved', 'bg-brand-green/15 text-brand-greenDark', '#4A9038'],
  at_risk: ['At risk', 'bg-amber-100 text-amber-800', '#F59E0B'],
  missed: ['Missed', 'bg-red-100 text-red-700', '#D03B3B'],
  partial: ['Partial year', 'bg-blue-50 text-blue-700', '#C9C8C3'],
  no_data: ['No data yet', 'bg-ink-100 text-ink-500', '#C9C8C3'],
}

function fmt(v, unit) {
  if (v === null || v === undefined) return '—'
  const digits = unit === '%' ? 1 : Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 1 ? 2 : 3
  return v.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: unit === '%' ? 1 : 0 })
}

function Change({ m, previousFy }) {
  if (m.change_pct === null || m.change_pct === undefined) {
    return <span className="text-[10px] text-ink-300">{m.previous === null ? `No FY ${previousFy} figure` : 'No change'}</span>
  }
  const up = m.change_pct > 0
  const tone = m.better === null ? 'text-ink-500' : m.better ? 'text-status-approved' : 'text-status-pending'
  const Arrow = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${tone}`}
      title={`FY ${previousFy}: ${fmt(m.previous, m.unit)} ${m.unit}`}>
      <Arrow size={12} />{Math.abs(m.change_pct).toFixed(1)}% vs FY {previousFy}
    </span>
  )
}

function Tile({ m, previousFy, spark }) {
  const Icon = ICONS[m.key] || Leaf
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <span className={`w-8 h-8 rounded-md flex items-center justify-center ${TINTS[m.key] || 'bg-surface-muted'}`}><Icon size={16} /></span>
        <Change m={m} previousFy={previousFy} />
      </div>
      <p className="text-[11px] text-ink-500 mt-3">{m.label}</p>
      <p className="mt-0.5 text-ink-900">
        <span className="text-xl font-semibold tabular-nums">{fmt(m.value, m.unit)}</span>
        {m.value !== null && m.unit && <span className="text-[11px] text-ink-500 ml-1">{m.unit}</span>}
      </p>
      {m.months !== null && m.months < 12 && <p className="text-[10px] text-amber-700 mt-1">{m.months} of 12 months reported</p>}
      <div className="mt-auto pt-2" aria-hidden="true"><Sparkline values={spark} /></div>
    </div>
  )
}

const scaledBy = (v, k) => (v === null || v === undefined ? v : v * k)

function ScopeChange({ item, previousFy }) {
  if (!item || item.value === null || item.previous === null || !item.previous) return null
  const pct = ((item.value - item.previous) / item.previous) * 100
  const Arrow = pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${pct > 0 ? 'text-status-pending' : 'text-status-approved'}`}>
      <Arrow size={12} />{Math.abs(pct).toFixed(1)}% vs FY {previousFy}
    </span>
  )
}

export default function Dashboard() {
  const [fy, setFy] = useState(null)
  const q = useEsgOverview(fy)
  const year = q.data?.fy
  const hasData = (q.data?.years || []).length > 0
  const spark = useKpiSeries({ codes: Object.values(SPARK).concat(SCOPES.map((x) => x[0])).join(','), by: 'month', fy: year },
    null, { enabled: hasData })
  const ghg = useKpiValues({ codes: 'ghg_total,scope1_total,scope2_total,scope3_total', fy: year }, null, { enabled: hasData })
  const energyByLoc = useKpiSeries({ codes: 'energy_total_mj,renewable_share_pct', by: 'location', fy: year }, null, { enabled: hasData })
  // Admin Console → Units: show energy, water, emissions and waste in the company's units.
  const prefs = useReportingUnits()
  const inUnits = (m) => {
    const c = convertValue(m.value, m.unit, prefs)
    return { ...m, value: c.value, unit: c.unit, previous: m.previous === null || m.previous === undefined ? m.previous : m.previous * c.scale }
  }
  const em = convertUnit('tCO₂e', 1, prefs)
  const en = convertUnit('GJ', 0.001, prefs)

  if (q.isLoading) return <LoadingState label="Loading your ESG figures…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load the dashboard.'} onRetry={() => q.refetch()} />
  const d = q.data
  const metrics = d.metrics.map(inUnits)
  const head = metrics.slice(0, 6)
  const more = metrics.slice(6)
  const gaps = d.coverage.sheets.filter((s) => s.months < 12)

  return (
    <div>
      <PageHeader title="Dashboard." subtitle={`ESG performance for FY ${d.fy}, from your approved data sheets`} />

      {d.years.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="w-48">
            <label htmlFor="dash-fy" className="block text-[10px] text-ink-500 mb-1">Financial year</label>
            <Select id="dash-fy" value={d.fy} onChange={(e) => setFy(e.target.value)}>
              {d.years.map((y) => <option key={y} value={y}>FY {y}</option>)}
            </Select>
          </div>
          <p className="text-[10px] text-ink-500 flex items-center gap-1 pb-2">
            <Info size={12} /> The same figures as your BRSR. Changes compare with FY {d.previous_fy}.
          </p>
        </div>
      )}

      {d.years.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="No approved data yet"
          subtitle="Upload your data sheets in the Upload Center. Once they are approved, your energy, water, waste, people and safety figures appear here."
          action={<Link to="/client/upload-center" className="text-sm text-brand-green hover:underline">Go to the Upload Center</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {head.map((m) => <Tile key={m.key} m={m} previousFy={d.previous_fy} spark={spark.data?.series?.[SPARK[m.key]]} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            <Card className="lg:col-span-2" title="Greenhouse gas emissions" icon={Factory}
              action={<Link to="/client/analytics" className="text-xs text-brand-green hover:underline inline-flex items-center gap-1">Analytics <ArrowRight size={12} /></Link>}>
              <div className="grid sm:grid-cols-[13rem_1fr] gap-4">
                <div>
                  <p className="text-[11px] text-ink-500">Scope 1 + 2, FY {d.fy}</p>
                  <p className="text-ink-900"><span className="text-3xl font-semibold tabular-nums">{fmtValue(scaledBy(ghg.data?.items?.ghg_total?.value, em.scale), 0)}</span>
                    <span className="text-xs text-ink-500 ml-1">{em.unit}</span></p>
                  <ScopeChange item={ghg.data?.items?.ghg_total} previousFy={d.previous_fy} />
                  <ul className="mt-4 space-y-2.5">
                    {SCOPES.map(([code, label, hint], i) => (
                      <li key={code} className="flex gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm mt-1 shrink-0" style={{ background: SERIES[i] }} aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="flex justify-between text-[11px]"><span className="text-ink-900 font-medium">{label}</span>
                            <span className="tabular-nums text-ink-900">{fmtValue(scaledBy(ghg.data?.items?.[code]?.value, em.scale), 1)}</span></p>
                          <p className="text-[10px] text-ink-500 truncate" title={hint}>{hint}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-0">
                  {spark.data && <StackedMonthly months={spark.data.labels} series={spark.data.series} unit={em.unit} scale={em.scale} height={230}
                    parts={SCOPES.map(([c, l]) => [c, l])} />}
                </div>
              </div>
            </Card>
            <Card title="Energy by location" icon={MapPin}>
              <p className="text-[10px] text-ink-500 mb-2">FY {d.fy} · {en.unit} · share of the total</p>
              {energyByLoc.data && <LocationBars labels={energyByLoc.data.labels} values={energyByLoc.data.series.energy_total_mj} unit={en.unit} scale={en.scale} />}
              {energyByLoc.data && (
                <div className="mt-4 pt-3 border-t border-surface-border">
                  <p className="text-[11px] font-medium text-ink-900 mb-2">Renewable share by location</p>
                  <ul className="space-y-2">
                    {energyByLoc.data.labels.map((l, i) => {
                      const v = energyByLoc.data.series.renewable_share_pct?.[i]
                      return (
                        <li key={l}>
                          <p className="flex justify-between text-[10px] mb-1"><span className="text-ink-700">{l}</span>
                            <span className="tabular-nums text-ink-900 font-medium">{v === null || v === undefined ? '—' : `${fmtValue(v, 1)}%`}</span></p>
                          <ProgressBar pct={Math.max(0, Math.min(100, v || 0))} />
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
            <Card className="lg:col-span-2" title="Targets" icon={Target}
              action={<Link to="/client/admin-console?tab=targets" className="text-xs text-brand-green hover:underline">Manage targets</Link>}>
              {d.targets.length === 0 ? (
                <p className="text-xs text-ink-500">No targets yet. Set goals for energy, water, waste or people in Admin Console → Targets.</p>
              ) : (
                <div className="divide-y divide-surface-border">
                  {d.targets.map((t0) => {
                    const k = convertUnit(t0.unit, 1, prefs)
                    const t = { ...t0, unit: k.unit, current: scaledBy(t0.current, k.scale), target_value: scaledBy(t0.target_value, k.scale) }
                    const [label, badge, bar] = TARGET_STATUS[t.status] || TARGET_STATUS.no_data
                    return (
                      <div key={t.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-ink-900">{t.title}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge}`}>{label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1"><ProgressBar pct={Math.max(0, Math.min(100, t.progress ?? 0))} color={bar} /></div>
                          <span className="text-[10px] text-ink-500 whitespace-nowrap tabular-nums">
                            {fmt(t.current, t.unit)} → {fmt(t.target_value, t.unit)} {t.unit} by FY {t.target_fy}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card title="Data sheets" icon={FileSpreadsheet}
              action={<Link to="/client/upload-center" className="text-xs text-brand-green hover:underline">Upload Center</Link>}>
              <p className="text-2xl font-semibold text-ink-900 tabular-nums">{d.coverage.complete}<span className="text-sm text-ink-500 font-normal"> of {d.coverage.total}</span></p>
              <p className="text-[11px] text-ink-500 mb-2">complete for all 12 months of FY {d.fy}</p>
              <ProgressBar pct={(d.coverage.complete / d.coverage.total) * 100} />
              {gaps.length > 0 && (
                <ul className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                  {gaps.map((s) => (
                    <li key={s.sheet} className="flex justify-between text-[11px]">
                      <span className="text-ink-700 truncate mr-2">{s.title}</span>
                      <span className={s.months ? 'text-amber-700' : 'text-ink-300'}>{s.months ? `${s.months}/12 months` : 'Not uploaded'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="mt-5" title="More figures" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] text-ink-500 border-b border-surface-border">
                    <th className="px-5 py-2 font-medium">Figure</th>
                    <th className="px-3 py-2 font-medium text-right">FY {d.fy}</th>
                    <th className="px-3 py-2 font-medium text-right">FY {d.previous_fy}</th>
                    <th className="px-5 py-2 font-medium text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {more.map((m) => (
                    <tr key={m.key} className="border-b border-surface-border last:border-0">
                      <td className="px-5 py-2.5 text-ink-900">{m.label} <span className="text-ink-300">{m.unit}</span></td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-900">{fmt(m.value, m.unit)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-500">{fmt(m.previous, m.unit)}</td>
                      <td className="px-5 py-2.5 text-right"><Change m={m} previousFy={d.previous_fy} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-[10px] text-ink-300 mt-3">
            Scope 1, 2 and 3 are calculated from the DG-set, HVAC, travel, commute and energy sheets with the factors in Admin Console → Factors Directory.
          </p>
        </>
      )}
    </div>
  )
}
