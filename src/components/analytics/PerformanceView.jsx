import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Info, Lightbulb, Minus } from 'lucide-react'
import { Card, EmptyState, Select } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useKpiSeries, useKpiValues } from '../../hooks/useKpis.js'
import { ChartFrame, LocationBars, SeriesTable, StackedMonthly, TrendChart } from './charts.jsx'
import { DOMAINS, changePct, changeTone, codesOf, fmtValue, monthLabel, monthLong, scaled, themeOf } from './viz.js'
import { withUnits } from './units.js'
import { useReportingUnits } from '../../hooks/useUnits.js'

const ALL_CODES = [...new Set(DOMAINS.flatMap(codesOf))].join(',')
const TONE = { good: 'text-status-approved', bad: 'text-status-pending', neutral: 'text-ink-500' }

export function Change({ value, previous, better, previousFy, small }) {
  const pct = changePct(value, previous)
  if (pct === null) return <span className="text-[10px] text-ink-300">{previous === null || previous === undefined ? `No FY ${previousFy} figure` : '—'}</span>
  const tone = changeTone(pct, better)
  const Arrow = Math.abs(pct) < 0.05 ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 ${small ? 'text-[10px]' : 'text-[11px]'} font-medium ${TONE[tone]}`}>
      <Arrow size={small ? 11 : 13} aria-hidden="true" />{Math.abs(pct).toFixed(1)}%
      <span className="font-normal text-ink-500 ml-0.5">vs FY {previousFy}</span>
    </span>
  )
}

/** Analytics → Performance: one ESG domain at a time, from approved data, with filters on top. */
export default function PerformanceView({ companyId = null }) {
  const [fy, setFy] = useState(null)
  const [location, setLocation] = useState('')
  const [domainKey, setDomainKey] = useState('energy')
  // Admin Console → Units: energy, water, emissions and waste in the company's chosen units.
  const prefs = useReportingUnits(companyId)
  const domains = useMemo(() => DOMAINS.map((d) => withUnits(d, prefs)), [prefs])
  const domain = domains.find((d) => d.key === domainKey)
  const base = { fy: fy || undefined, location: location || undefined }
  const values = useKpiValues({ codes: ALL_CODES, ...base }, companyId)
  const year = values.data?.fy
  const monthCodes = [domain.headline.code, ...domain.mix.parts.map((p) => p[0])].join(',')
  const month = useKpiSeries({ codes: monthCodes, by: 'month', fy: year, location: location || undefined }, companyId, { enabled: !!year })
  const prev = useKpiSeries({ codes: domain.headline.code, by: 'month', fy: values.data?.previous_fy, location: location || undefined }, companyId, { enabled: !!year })
  const byLoc = useKpiSeries({ codes: domain.headline.code, by: 'location', fy: year }, companyId, { enabled: !!year && !location })

  if (values.isLoading) return <Card><LoadingState label="Loading your ESG figures…" /></Card>
  if (values.isError) return <Card><ErrorState message={values.error?.message || 'Could not load the figures.'} onRetry={() => values.refetch()} /></Card>
  const v = values.data
  if (!v.years.length) {
    return <Card><EmptyState icon={Info} title="No approved data yet" subtitle="Charts appear once data sheets are uploaded and approved in the Upload Center." /></Card>
  }
  const item = (code) => v.items[code] || {}
  const h = domain.headline
  const theme = themeOf(domain.key)
  const months = month.data?.labels || []
  const cy = (month.data?.series?.[h.code] || []).map((x) => scaled(x, h.scale))
  const py = (prev.data?.series?.[h.code] || []).map((x) => scaled(x, h.scale))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label htmlFor="an-fy" className="block text-[10px] text-ink-500 mb-1">Financial year</label>
          <Select id="an-fy" value={v.fy} onChange={(e) => setFy(e.target.value)}>
            {[...new Set([...v.years, v.fy])].sort().reverse().map((y) => <option key={y} value={y}>FY {y}</option>)}
          </Select>
        </div>
        <div className="w-56">
          <label htmlFor="an-loc" className="block text-[10px] text-ink-500 mb-1">Location</label>
          <Select id="an-loc" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All locations</option>
            {v.locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
        </div>
        <p className="text-[10px] text-ink-500 flex items-center gap-1 pb-2">
          <Info size={12} /> From approved data sheets — the same figures as the KPI catalogue, BRSR and GRI.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" role="tablist" aria-label="ESG domain">
        {domains.map((d) => {
          const it = item(d.headline.code)
          const Icon = d.icon
          const t = themeOf(d.key)
          const Mark = t.mark
          const on = d.key === domainKey
          return (
            <button key={d.key} type="button" role="tab" aria-selected={on} onClick={() => setDomainKey(d.key)}
              className={`group relative overflow-hidden text-left rounded-xl border p-3 pt-3.5 transition-all duration-200 ${on ? 'shadow-md -translate-y-0.5' : 'hover:shadow-md hover:-translate-y-0.5'}`}
              style={{
                borderColor: on ? t.accent : '#E6E5E1',
                background: on ? `linear-gradient(135deg, ${t.soft} 0%, #ffffff 85%)` : `linear-gradient(135deg, ${t.soft}99 0%, #ffffff 60%)`,
                boxShadow: on ? `0 0 0 1px ${t.accent}, 0 6px 16px -6px ${t.accent}66` : undefined,
              }}>
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${t.accent}, ${t.deep})` }} aria-hidden="true" />
              <Mark size={64} strokeWidth={1.25} aria-hidden="true"
                className="absolute -right-3 -bottom-3 transition-transform duration-300 group-hover:scale-110"
                style={{ color: t.accent, opacity: on ? 0.22 : 0.13 }} />
              <span className="relative flex items-center gap-2 text-[11px] font-semibold text-ink-900">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.deep})` }}>
                  <Icon size={13} className="text-white" aria-hidden="true" />
                </span>
                {d.label}
              </span>
              <span className="relative block mt-2 text-[18px] font-semibold text-ink-900 tabular-nums leading-tight">
                {fmtValue(scaled(it.value, d.headline.scale))}
                <span className="text-[10px] font-normal text-ink-500 ml-1">{d.headline.unit === 'per million hours' ? 'LTIFR' : d.headline.unit}</span>
              </span>
              <span className="relative"><Change value={it.value} previous={it.previous} better={it.better} previousFy={v.previous_fy} small /></span>
            </button>
          )
        })}
      </div>

      <Insights domain={domain} v={v} months={months} cy={cy} byLoc={location ? null : byLoc.data} location={location} />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[[h.code, h.label, h.unit, h.scale], ...domain.tiles].slice(0, 4).map(([code, label, unit, scale]) => {
          const it = item(code)
          return (
            <div key={code} className="relative overflow-hidden bg-white border border-surface-border rounded-xl p-4 pl-5 hover:shadow-sm transition-shadow">
              <span className="absolute left-0 inset-y-0 w-1" style={{ background: `linear-gradient(180deg, ${theme.accent}, ${theme.deep})` }} aria-hidden="true" />
              <p className="text-[11px] text-ink-500">{label}</p>
              <p className="mt-1 text-ink-900">
                <span className="text-xl font-semibold tabular-nums">{fmtValue(scaled(it.value, scale))}</span>
                <span className="text-[10px] text-ink-500 ml-1">{unit}</span>
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <Change value={it.value} previous={it.previous} better={it.better} previousFy={v.previous_fy} small />
                <span className="text-[10px] text-ink-300 tabular-nums">FY {v.previous_fy}: {fmtValue(scaled(it.previous, scale))}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <ChartFrame title={`${h.label}, month by month`} subtitle={`FY ${v.fy} against FY ${v.previous_fy} · ${h.unit}`}
          table={<SeriesTable rowLabels={months} formatRow={(m) => monthLabel(m).split(' ')[0]} unit={h.unit}
            columns={[{ label: `FY ${v.fy}`, values: cy }, { label: `FY ${v.previous_fy}`, values: py }]} />}>
          {month.isLoading ? <LoadingState label="Loading…" /> : (
            <TrendChart months={months} current={cy} previous={py} fy={v.fy} previousFy={v.previous_fy} unit={h.unit} color={theme.deep} />
          )}
        </ChartFrame>
        <ChartFrame title={domain.mix.title} subtitle={`FY ${v.fy} by month · ${domain.mix.unit}${domain.mix.latest ? ' · headcount at month end' : ''}`}
          table={<SeriesTable rowLabels={months} formatRow={(m) => monthLabel(m).split(' ')[0]} unit={domain.mix.unit}
            columns={domain.mix.parts.map(([code, label]) => ({ label, values: (month.data?.series?.[code] || []).map((x) => scaled(x, domain.mix.scale)) }))} />}>
          {month.isLoading ? <LoadingState label="Loading…" /> : (
            <StackedMonthly months={months} parts={domain.mix.parts} series={month.data?.series || {}} unit={domain.mix.unit} scale={domain.mix.scale} colors={domain.mix.colors} />
          )}
        </ChartFrame>
      </div>

      {!location && (
        <ChartFrame title={`${h.label} by location`} subtitle={`FY ${v.fy} · ${h.unit} · share of the company total`}
          table={byLoc.data && <SeriesTable rowLabels={byLoc.data.labels} unit={h.unit}
            columns={[{ label: `FY ${v.fy}`, values: (byLoc.data.series[h.code] || []).map((x) => scaled(x, h.scale)) }]} />}>
          {byLoc.isLoading || !byLoc.data ? <LoadingState label="Loading…" /> : (
            <LocationBars labels={byLoc.data.labels} values={byLoc.data.series[h.code]} unit={h.unit} scale={h.scale} color={theme.deep} colorLight={theme.accent} />
          )}
        </ChartFrame>
      )}
      {v.skipped && Object.keys(v.skipped).length > 0 && domainKey === 'emissions' && (
        <p className="text-[10px] text-ink-500">Some rows could not be classified and are left out (not estimated). The KPI catalogue lists them.</p>
      )}
    </div>
  )
}

/** Plain-English facts read off the numbers already on the page — nothing new is computed. */
function Insights({ domain, v, months, cy, byLoc, location }) {
  const lines = useMemo(() => {
    const h = domain.headline
    const it = v.items[h.code] || {}
    const out = []
    if (it.value !== null && it.value !== undefined) {
      const pct = changePct(it.value, it.previous)
      const tone = changeTone(pct, it.better)
      let s = `${h.label}: ${fmtValue(scaled(it.value, h.scale))} ${h.unit} in FY ${v.fy}`
      if (pct !== null) s += `, ${Math.abs(pct).toFixed(1)}% ${pct > 0 ? 'higher' : 'lower'} than FY ${v.previous_fy}${tone === 'good' ? ' — an improvement' : tone === 'bad' ? ' — moving the wrong way' : ''}`
      out.push(s + '.')
    }
    const pts = months.map((m, i) => [m, cy[i]]).filter(([, x]) => x !== null && x !== undefined)
    if (pts.length > 2 && h.unit !== '%' && h.unit !== 'people') {
      const top = pts.reduce((a, b) => (b[1] > a[1] ? b : a))
      if (top[1] > 0) out.push(`Highest month: ${monthLong(top[0])} at ${fmtValue(top[1])} ${h.unit}.`)
    }
    if (byLoc && byLoc.labels.length > 1 && h.unit !== '%' && !h.unit.startsWith('per')) {
      const vals = byLoc.series[h.code] || []
      const total = vals.reduce((a, x) => a + (x || 0), 0)
      const i = vals.indexOf(Math.max(...vals.map((x) => x || 0)))
      if (total > 0 && i >= 0) out.push(`${byLoc.labels[i]} accounts for ${Math.round((vals[i] / total) * 100)}% of it.`)
    }
    if (domain.key === 'emissions') {
      const s3 = v.items.scope3_total?.value
      if (s3) out.push(`Scope 3 adds ${fmtValue(s3)} tCO₂e from business travel, commuting and third-party equipment.`)
    }
    return out
  }, [domain, v, months, cy, byLoc])
  const t = themeOf(domain.key)
  const Icon = domain.icon
  const Mark = t.mark
  return (
    <div className="relative overflow-hidden rounded-xl border px-5 py-4"
      style={{ borderColor: `${t.accent}55`, background: `linear-gradient(110deg, ${t.soft} 0%, #ffffff 70%)` }}>
      <Mark size={150} strokeWidth={1} aria-hidden="true" className="absolute -right-6 -top-8 pointer-events-none"
        style={{ color: t.accent, opacity: 0.12 }} />
      <div className="relative flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex items-center gap-3 md:w-72 shrink-0">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center shadow"
            style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.deep})` }}>
            <Icon size={22} className="text-white" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-ink-900 leading-tight">{domain.label}</p>
            <p className="text-[10px] text-ink-500 mt-0.5">{t.tagline}</p>
            <p className="text-[10px] text-ink-500 mt-0.5">FY {v.fy}{location ? ` · ${location}` : ' · all locations'}</p>
          </div>
        </div>
        {lines.length > 0 && (
          <div className="flex gap-2.5 md:border-l md:pl-4" style={{ borderColor: `${t.accent}44` }}>
            <Lightbulb size={15} className="mt-0.5 shrink-0" style={{ color: t.deep }} aria-hidden="true" />
            <ul className="text-[11px] text-ink-900 space-y-1">
              {lines.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
