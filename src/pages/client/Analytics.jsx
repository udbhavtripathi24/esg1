import { useState } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import { Select } from '../../components/ui.jsx'
import { benchmarkingData, analyticsFilters } from '../../data/mockData'

const scores = [
  { label: 'Overall ESG Score', ...benchmarkingData.overall },
  { label: 'Environmental Score', ...benchmarkingData.environmental },
  { label: 'Social Score', ...benchmarkingData.social },
  { label: 'Governance Score', ...benchmarkingData.governance },
]

export default function Analytics() {
  const [year, setYear] = useState(analyticsFilters.years[0])
  const [quarter, setQuarter] = useState(analyticsFilters.quarters[0])
  const [businessUnit, setBusinessUnit] = useState(analyticsFilters.businessUnits[0])
  const [region, setRegion] = useState(analyticsFilters.regions[0])

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Analyze ESG performance through interactive dashboards and business intelligence insights." />

      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="bg-ink-900 text-white text-[10px] px-4 py-2 flex items-center justify-between">
          <span>Power BI · ESG Performance Dashboard</span>
          <span className="text-white/50">Data updated 5/20/26</span>
        </div>

        <div className="p-5">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">ESG Performance Dashboard</h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div>
              <label className="text-[10px] text-ink-500 mb-1 block">Year</label>
              <Select value={year} onChange={(e) => setYear(e.target.value)}>
                {analyticsFilters.years.map((y) => <option key={y}>{y}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-ink-500 mb-1 block">Quarter</label>
              <Select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                {analyticsFilters.quarters.map((q) => <option key={q}>{q}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-ink-500 mb-1 block">Business Unit</label>
              <Select value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)}>
                {analyticsFilters.businessUnits.map((b) => <option key={b}>{b}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-ink-500 mb-1 block">Region</label>
              <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                {analyticsFilters.regions.map((r) => <option key={r}>{r}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
            {scores.map((s) => (
              <div key={s.label} className="border border-surface-border rounded-lg p-4">
                <p className="text-xs text-ink-500">{s.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-sm font-semibold text-ink-900">{s.score}</span>
                </div>
                <p className="text-[10px] text-status-approved mt-0.5">Goal {s.goal} ({s.delta})</p>
                <svg className="mt-2 w-full h-6" viewBox="0 0 100 24" preserveAspectRatio="none">
                  <polyline points="0,18 25,14 50,15 75,7 100,3" fill="none" stroke="#64BC44" strokeWidth="2" />
                </svg>
              </div>
            ))}
            <div className="border border-surface-border rounded-lg p-4">
              <p className="text-xs text-ink-500">Total GHG Emissions (ktCO2e)</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm font-semibold text-ink-900">{benchmarkingData.totalEmissions.value}</span>
                <span className="text-[10px] font-medium text-status-approved">↓ {benchmarkingData.totalEmissions.delta}</span>
              </div>
              <p className="text-[10px] text-ink-300 mt-0.5">{benchmarkingData.totalEmissions.vsLabel}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-5">
            <div className="border border-surface-border rounded-lg p-4">
              <p className="text-xs font-medium text-ink-900 mb-3">GHG Emissions (ktCO2e) by Scope</p>
              <EmissionsBarChart data={benchmarkingData.emissionsByScope} />
            </div>
            <div className="border border-surface-border rounded-lg p-4">
              <p className="text-xs font-medium text-ink-900 mb-3">ESG Score Trend</p>
              <ScoreTrendChart trend={benchmarkingData.scoreTrend} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                {benchmarkingData.scoreTrend.series.map((s) => (
                  <span key={s.label} className="flex items-center gap-1 text-[9px] text-ink-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="border border-surface-border rounded-lg p-4">
              <p className="text-xs font-medium text-ink-900 mb-3">ESG Score by Business Unit</p>
              <div className="space-y-3 mt-4">
                {benchmarkingData.scoreByBusinessUnit.map((b) => (
                  <div key={b.unit} className="flex items-center gap-3 text-[10px]">
                    <span className="w-24 text-ink-700 truncate">{b.unit}</span>
                    <div className="flex-1 h-2.5 bg-surface-muted rounded-full overflow-hidden">
                      <div className="h-2.5 rounded-full" style={{ width: `${b.value}%`, backgroundColor: b.color }} />
                    </div>
                    <span className="w-8 text-right text-ink-900 font-medium">{b.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-5">
            <div className="border border-surface-border rounded-lg p-4">
              <p className="text-xs font-medium text-ink-900 mb-3">Energy Consumption by Source</p>
              <div className="flex items-center justify-center py-2">
                <DonutMini data={benchmarkingData.energyBySource} />
              </div>
              <div className="space-y-1.5 mt-2">
                {benchmarkingData.energyBySource.map((e) => (
                  <div key={e.label} className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 text-ink-700">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} /> {e.label}
                    </span>
                    <span className="text-ink-500">{e.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-surface-border rounded-lg p-4 lg:col-span-2">
              <p className="text-xs font-medium text-ink-900 mb-3">ESG Goals Progress</p>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-ink-500">
                    <th className="font-medium py-1.5">Goal</th>
                    <th className="font-medium py-1.5">Target</th>
                    <th className="font-medium py-1.5">Progress</th>
                    <th className="font-medium py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkingData.goals.map((g) => (
                    <tr key={g.goal} className="border-t border-surface-border">
                      <td className="py-2 text-ink-900">{g.goal}</td>
                      <td className="py-2 text-ink-700">{g.target}</td>
                      <td className="py-2 w-32">
                        <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${g.progress}%`, backgroundColor: g.status === 'On Track' ? '#2E9E4F' : '#D98A1F' }}
                          />
                        </div>
                      </td>
                      <td className="py-2">
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: g.status === 'On Track' ? '#2E9E4F' : '#D98A1F' }}
                        >
                          ● {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-surface-border rounded-lg p-4">
            <p className="text-xs font-medium text-ink-900 mb-3">GHG Emissions by Region (ktCO2e)</p>
            <GhgByRegion data={benchmarkingData.ghgByRegion} />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmissionsBarChart({ data }) {
  const totals = data.map((d) => d.scope1 + d.scope2 + d.scope3)
  const max = Math.max(...totals)
  return (
    <svg viewBox="0 0 260 150" className="w-full h-36">
      {data.map((d, i) => {
        const x = i * 50 + 10
        const total = d.scope1 + d.scope2 + d.scope3
        const h = (total / max) * 100
        let y = 122 - h
        const segs = [
          { v: d.scope1, color: '#1E3A8A' },
          { v: d.scope2, color: '#2563EB' },
          { v: d.scope3, color: '#93C5FD' },
        ]
        return (
          <g key={d.year}>
            <text x={x + 15} y={y - 4} fontSize="9" textAnchor="middle" fill="#404040">{total.toFixed(1)}K</text>
            {segs.map((s, j) => {
              const segH = (s.v / max) * 100
              const rect = <rect key={j} x={x} y={y} width="30" height={segH} fill={s.color} />
              y += segH
              return rect
            })}
            <text x={x + 15} y="144" fontSize="9" textAnchor="middle" fill="#6B6B6B">{d.year}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ScoreTrendChart({ trend }) {
  const { years, series } = trend
  const max = 100
  const chartW = 260
  const chartH = 100
  const stepX = (chartW - 20) / (years.length - 1)

  function pointsFor(values) {
    return values.map((v, i) => `${10 + i * stepX},${chartH - (v / max) * chartH}`).join(' ')
  }

  return (
    <svg viewBox="0 0 260 120" className="w-full h-36">
      {series.map((s) => (
        <g key={s.label}>
          <polyline points={pointsFor(s.values)} fill="none" stroke={s.color} strokeWidth="2" />
          {s.values.map((v, i) => (
            <circle key={i} cx={10 + i * stepX} cy={chartH - (v / max) * chartH} r="2" fill={s.color} />
          ))}
        </g>
      ))}
      {years.map((y, i) => (
        <text key={y} x={10 + i * stepX} y="115" fontSize="9" textAnchor="middle" fill="#6B6B6B">{y}</text>
      ))}
    </svg>
  )
}

function DonutMini({ data }) {
  const total = data.reduce((s, d) => s + d.pct, 0)
  let cumulative = 0
  const radius = 45
  const stroke = 16
  const c = 2 * Math.PI * radius
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <g transform="translate(60,60) rotate(-90)">
        {data.map((d) => {
          const dash = (d.pct / total) * c
          const offset = -((cumulative / total) * c)
          cumulative += d.pct
          return (
            <circle key={d.label} r={radius} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={offset} />
          )
        })}
      </g>
    </svg>
  )
}

function GhgByRegion({ data }) {
  const max = Math.max(...data.map((d) => d.value))
  const min = Math.min(...data.map((d) => d.value))
  function colorFor(v) {
    const t = (v - min) / (max - min || 1)
    // light green (low) to dark green (high), matching a map choropleth legend
    const lightness = 85 - t * 55
    return `hsl(140, 35%, ${lightness}%)`
  }
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {data.map((d) => (
          <div key={d.region} className="rounded-md p-3 text-center" style={{ backgroundColor: colorFor(d.value) }}>
            <p className="text-[10px] text-ink-700">{d.region}</p>
            <p className="text-sm font-semibold text-ink-900 mt-1">{d.value.toFixed(1)}K</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 justify-end">
        <span className="text-[9px] text-ink-500">1K</span>
        <div className="w-32 h-2 rounded-full" style={{ background: 'linear-gradient(to right, hsl(140,35%,85%), hsl(140,35%,30%))' }} />
        <span className="text-[9px] text-ink-500">20K</span>
      </div>
    </div>
  )
}