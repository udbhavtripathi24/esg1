import { useState, useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, Select } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  useClimateFilters, useClimateTrend, useClimateScenario,
} from '../../hooks/useDemoEsgDashboard.js'

/**
 * Climate Risk Assessment -- new top-level section in the ESG Demo
 * Dashboard, added per a business-provided reference mockup.
 *
 * IMPORTANT, confirmed by comparing two reference screenshots at
 * different points: Trend Analysis and Scenario Analysis have their
 * OWN, completely independent filters -- they are not synced. Each
 * manages its own State/City/Scenario selection.
 *
 * Real constraint from the reference: City options are always scoped
 * to the selected State (e.g. Chennai/Coimbatore only ever appear
 * under Tamil Nadu) -- selecting a State resets City to that state's
 * first real city, and a mismatched combination (defensively) shows
 * "No data" rather than incorrect data.
 */

const CHART_PALETTE = ['#EF4444', '#3B82F6', '#64BC44', '#8B5CF6']

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px]">
      <p className="font-medium text-ink-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  )
}

function TrendAnalysisPanel({ filters }) {
  const [state, setState] = useState('Tamil Nadu')
  const [city, setCity] = useState('Chennai')
  const [scenario, setScenario] = useState('SSP2-4.5')
  const [indicator, setIndicator] = useState('Five-day Max Rainfall')

  const cityOptions = filters?.state_cities?.[state] || []

  function handleStateChange(newState) {
    setState(newState)
    // Real constraint: City must always belong to the selected State.
    // Reset to that state's first real city rather than leaving a
    // stale, now-invalid city selected.
    const validCities = filters?.state_cities?.[newState] || []
    setCity(validCities[0] || '')
  }

  const trendQuery = useClimateTrend({ state, city, scenario, indicator })

  return (
    <Card padded={false}>
      <div className="bg-brand-green/10 text-center py-2.5 font-semibold text-brand-greenDark text-sm">
        Trend Analysis
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-ink-500 mb-1 block">State</label>
            <Select value={state} onChange={(e) => handleStateChange(e.target.value)}>
              {(filters?.states || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-ink-500 mb-1 block">City</label>
            <Select value={city} onChange={(e) => setCity(e.target.value)}>
              {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-ink-500 mb-1 block">Scenario</label>
            <Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {(filters?.scenarios || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-ink-500 mb-1 block">Indicator</label>
            <Select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
              {(filters?.indicators || []).map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
          </div>
        </div>

        {trendQuery.isLoading ? <LoadingState label="Loading…" /> :
         trendQuery.isError ? <ErrorState message="Could not load." onRetry={() => trendQuery.refetch()} /> :
         trendQuery.data.no_data ? (
          <div className="text-center py-10 text-xs text-ink-400">
            No data available for this City/State combination.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-brand-green text-white rounded-lg p-3 text-center">
                <p className="text-[10px] font-medium opacity-90 mb-1">Baseline to 2030</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-1"><TrendingUp size={16} /> {trendQuery.data.baseline_to_2030_pct}%</p>
                <p className="text-[10px] mt-0.5 opacity-90">{trendQuery.data.baseline_to_2030_label}</p>
              </div>
              <div className="bg-brand-green text-white rounded-lg p-3 text-center">
                <p className="text-[10px] font-medium opacity-90 mb-1">Baseline to 2050</p>
                <p className="text-2xl font-bold flex items-center justify-center gap-1"><TrendingUp size={16} /> {trendQuery.data.baseline_to_2050_pct}%</p>
                <p className="text-[10px] mt-0.5 opacity-90">{trendQuery.data.baseline_to_2050_label}</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-ink-900 mb-2 text-center">Y-o-Y Trend</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart margin={{ top: 10, right: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="year" type="number" domain={[2026, 2050]} tick={{ fontSize: 9, fill: '#999' }} allowDuplicatedCategory={false} />
                <YAxis tick={{ fontSize: 9, fill: '#999' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                {Object.entries(trendQuery.data.series_by_indicator).map(([ind, series], i) => (
                  <Line key={ind} data={series} dataKey="value" name={ind} stroke={CHART_PALETTE[i]} strokeWidth={2} dot={false} type="monotone" />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-ink-400 mt-1">{state} — {city}</p>
          </>
        )}
      </div>
    </Card>
  )
}

function ScenarioAnalysisPanel({ filters }) {
  const [state, setState] = useState('Tamil Nadu')
  const [scenario, setScenario] = useState('SSP2-4.5')
  const [selectedYears, setSelectedYears] = useState([2026, 2030, 2050])

  const scenarioQuery = useClimateScenario({ state, scenario, years: selectedYears })

  function toggleYear(year) {
    setSelectedYears((prev) => prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year].sort())
  }

  const chartData = useMemo(() => {
    if (!scenarioQuery.data) return []
    return scenarioQuery.data.groups.map((g) => ({ name: `${g.city} ${g.year}`, ...g.values }))
  }, [scenarioQuery.data])

  return (
    <Card padded={false}>
      <div className="bg-brand-green/10 text-center py-2.5 font-semibold text-brand-greenDark text-sm">
        Scenario Analysis
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] text-ink-500 mb-1 block">State</label>
            <Select value={state} onChange={(e) => setState(e.target.value)}>
              {(filters?.states || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-ink-500 mb-1 block">Scenario</label>
            <Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {(filters?.scenarios || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-[10px] text-ink-500 mb-1 block">Year</label>
          <div className="flex gap-2">
            {(filters?.years || []).map((y) => (
              <button
                key={y}
                onClick={() => toggleYear(y)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${
                  selectedYears.includes(y) ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-ink-500 border-surface-border'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {scenarioQuery.isLoading ? <LoadingState label="Loading…" /> :
         scenarioQuery.isError ? <ErrorState message="Could not load." onRetry={() => scenarioQuery.refetch()} /> :
         chartData.length === 0 ? (
          <div className="text-center py-10 text-xs text-ink-400">Select at least one year.</div>
        ) : (
          <>
            <p className="text-xs font-semibold text-ink-900 mb-2 text-center">Baseline Vs Scenario Years</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#999' }} interval={0} angle={-10} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: '#999' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
                {(filters?.indicators || []).map((ind, i) => (
                  <Bar key={ind} dataKey={ind} name={ind} fill={CHART_PALETTE[i]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </Card>
  )
}

export default function ClimateRiskSection() {
  const filtersQuery = useClimateFilters()

  if (filtersQuery.isLoading) return <LoadingState label="Loading…" />
  if (filtersQuery.isError) return <ErrorState message="Could not load." onRetry={() => filtersQuery.refetch()} />

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <TrendAnalysisPanel filters={filtersQuery.data} />
      <ScenarioAnalysisPanel filters={filtersQuery.data} />
    </div>
  )
}
