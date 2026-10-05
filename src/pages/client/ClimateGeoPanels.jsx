import { useState, useMemo } from 'react'
import { MapPin, Layers, Info } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, Select, ProgressBar } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import IndiaMap, { RiskLegend } from '../../components/IndiaMap.jsx'
import {
  useDistrictFilters, useDistrictScores,
  useAssetFilters, useAssetScores, useAssetProfile,
} from '../../hooks/useDemoEsgDashboard.js'

/**
 * Two geographic climate-risk dashboards, built to the dimensions of the
 * datasets the business intends to supply.
 *
 *  District-level (World Bank) -- sector x state x agroclimatic zone x
 *      hazard, with a component sub-filter.
 *  Asset-level -- the organisation's own sites plotted by coordinate,
 *      scored per hazard across two scenarios and three time horizons.
 *
 * All figures are generated demo data. The filter shape and the API
 * contract are built to match the real extracts so they can be swapped in
 * without touching this file.
 */

function FilterField({ label, children, hint }) {
  return (
    <div>
      <label className="text-[10px] text-ink-500 mb-1 block">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-ink-300 mt-0.5">{hint}</p>}
    </div>
  )
}

function ScoreList({ title, rows, emptyLabel = 'No districts match these filters.' }) {
  if (!rows?.length) return <p className="text-[11px] text-ink-400 py-3">{emptyLabel}</p>
  return (
    <div>
      <p className="text-[10px] font-medium text-ink-600 mb-2">{title}</p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={`${r.state}-${r.district}`} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: r.color }} />
            <span className="text-[11px] text-ink-900 flex-1 truncate">{r.district}</span>
            <span className="text-[9px] text-ink-400 truncate max-w-[90px]">{r.state}</span>
            <span className="text-[11px] font-medium text-ink-700 w-9 text-right">{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- District-level ---------------- */

export function DistrictRiskPanel() {
  const filtersQuery = useDistrictFilters()
  const f = filtersQuery.data

  const [sector, setSector] = useState('Agriculture')
  const [state, setState] = useState('')
  const [zone, setZone] = useState('')
  const [hazard, setHazard] = useState('Flood')
  const [component, setComponent] = useState('Future Climate Risk')

  const query = useDistrictScores({
    sector, hazard, component,
    state: state || undefined,
    zone: zone || undefined,
  })

  if (filtersQuery.isLoading || !f) return <LoadingState label="Loading…" />
  if (filtersQuery.isError) return <ErrorState message="Could not load filters." onRetry={() => filtersQuery.refetch()} />

  const hasData = f.sectors_with_data.includes(sector)

  return (
    <div>
      <Card title="District-level climate risk" subtitle="World Bank dataset structure — 724 districts across 36 states and union territories" icon={Layers} className="mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <FilterField label="Sector">
            <Select value={sector} onChange={(e) => setSector(e.target.value)}>
              {f.sectors.map((s) => (
                <option key={s} value={s}>
                  {s}{f.sectors_with_data.includes(s) ? '' : ' (no data yet)'}
                </option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="State" hint="Map zooms to selection">
            <Select value={state} onChange={(e) => { setState(e.target.value); setZone('') }}>
              <option value="">All India</option>
              {f.states.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FilterField>
          <FilterField label="Agroclimatic zone">
            <Select value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">All zones</option>
              {(state ? (f.state_zones[state] || []) : f.agroclimatic_zones).map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Hazard">
            <Select value={hazard} onChange={(e) => setHazard(e.target.value)}>
              {f.hazards.map((h) => <option key={h} value={h}>{h}</option>)}
            </Select>
          </FilterField>
          <FilterField label="Component">
            <Select value={component} onChange={(e) => setComponent(e.target.value)}>
              {f.components.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FilterField>
        </div>

        {!hasData && (
          <div className="flex items-start gap-2 mt-3 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <Info size={12} className="mt-0.5 shrink-0" />
            <p>
              The shared dataset currently covers Agriculture only. Figures shown for {sector} are
              illustrative placeholders so the filter behaviour can be reviewed.
            </p>
          </div>
        )}
      </Card>

      {query.isLoading || !query.data ? <LoadingState label="Loading map…" /> :
       query.isError ? <ErrorState message="Could not load scores." onRetry={() => query.refetch()} /> : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <Card
            title={state || 'All India'}
            subtitle={`${hazard} · ${component} · ${sector}`}
          >
            <IndiaMap
              scores={query.data.scores}
              focusState={state || null}
              height={540}
              onDistrictClick={(p) => {
                // null comes from the map's reset control.
                if (!p) { setState(''); setZone(''); return }
                if (p.state !== state) { setState(p.state); setZone('') }
              }}
            />
            <RiskLegend bands={query.data.band_counts} />
          </Card>

          <div className="space-y-4">
            <Card title="Summary">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-ink-400">Districts in view</p>
                  <p className="text-xl font-semibold text-ink-900">{query.data.district_count}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink-400">Average risk score</p>
                  <p className="text-xl font-semibold text-ink-900">{query.data.average_score}</p>
                  <ProgressBar pct={query.data.average_score} />
                </div>
              </div>
            </Card>
            <Card title="Highest risk">
              <ScoreList title="" rows={query.data.highest} />
            </Card>
            {query.data.lowest?.length > 0 && (
              <Card title="Lowest risk">
                <ScoreList title="" rows={query.data.lowest} />
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Asset-level ---------------- */

export function AssetRiskPanel() {
  const filtersQuery = useAssetFilters()
  const f = filtersQuery.data

  const [hazard, setHazard] = useState('Cyclone')
  const [scenario, setScenario] = useState('SSP2-4.5')
  const [horizon, setHorizon] = useState('MT')
  const [assetType, setAssetType] = useState('')
  const [selected, setSelected] = useState(null)

  const query = useAssetScores({
    hazard, scenario, horizon,
    asset_type: assetType || undefined,
  })
  const profileQuery = useAssetProfile({ asset_id: selected, hazard, scenario })

  const ranked = useMemo(
    () => (query.data?.assets ? [...query.data.assets].sort((a, b) => b.score - a.score) : []),
    [query.data]
  )

  if (filtersQuery.isLoading || !f) return <LoadingState label="Loading…" />
  if (filtersQuery.isError) return <ErrorState message="Could not load filters." onRetry={() => filtersQuery.refetch()} />

  return (
    <div>
      <Card title="Asset-level climate risk" subtitle="Your sites plotted by coordinate and scored per hazard" icon={MapPin} className="mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <FilterField label="Hazard">
            <Select value={hazard} onChange={(e) => setHazard(e.target.value)}>
              {f.hazards.map((h) => <option key={h} value={h}>{h}</option>)}
            </Select>
          </FilterField>
          <FilterField label="Scenario">
            <Select value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {f.scenarios.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FilterField>
          <FilterField
            label="Time horizon"
            hint={f.time_horizons.find((t) => t.code === horizon)?.window}
          >
            <Select value={horizon} onChange={(e) => setHorizon(e.target.value)}>
              {f.time_horizons.map((t) => (
                <option key={t.code} value={t.code}>{t.code} — {t.label}</option>
              ))}
            </Select>
          </FilterField>
          <FilterField label="Asset type">
            <Select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
              <option value="">All types</option>
              {f.asset_types.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FilterField>
        </div>
      </Card>

      {query.isLoading || !query.data ? <LoadingState label="Loading map…" /> :
       query.isError ? <ErrorState message="Could not load scores." onRetry={() => query.refetch()} /> : (
        <>
          <div className="grid lg:grid-cols-[1fr_320px] gap-4 mb-4">
            <Card
              title="Asset locations"
              subtitle={`${hazard} · ${scenario} · ${horizon} (${f.time_horizons.find((t) => t.code === horizon)?.window})`}
            >
              <IndiaMap
                assets={query.data.assets}
                onAssetClick={(a) => setSelected(a.id)}
                height={540}
              />
              <RiskLegend bands={query.data.band_counts} />
              <p className="text-[10px] text-ink-400 text-center mt-1">
                Select a site to see how its exposure changes across the three time horizons.
              </p>
            </Card>

            <div className="space-y-4">
              <Card title="Summary">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-ink-400">Assets in view</p>
                    <p className="text-xl font-semibold text-ink-900">{query.data.asset_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-400">Average risk score</p>
                    <p className="text-xl font-semibold text-ink-900">{query.data.average_score}</p>
                    <ProgressBar pct={query.data.average_score} />
                  </div>
                </div>
              </Card>

              <Card title="Most exposed sites">
                <div className="space-y-1.5">
                  {query.data.highest.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a.id)}
                      className="w-full flex items-center gap-2 text-left hover:bg-surface-muted/50 rounded px-1 py-0.5"
                    >
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: a.color }} />
                      <span className="text-[11px] text-ink-900 flex-1 truncate">{a.name}</span>
                      <span className="text-[11px] font-medium text-ink-700">{a.score}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {selected && (
            <Card
              title={profileQuery.data?.asset?.name || 'Asset detail'}
              subtitle={`${hazard} · ${scenario} — exposure across time horizons`}
              className="mb-4"
              action={
                <button onClick={() => setSelected(null)} className="text-[10px] text-ink-400 hover:text-ink-900">
                  Clear
                </button>
              }
            >
              {profileQuery.isLoading || !profileQuery.data ? <LoadingState label="Loading…" /> :
               profileQuery.data.not_found ? <p className="text-xs text-ink-400">Asset not found.</p> : (
                <div className="grid lg:grid-cols-[1fr_280px] gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={profileQuery.data.points} margin={{ top: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const p = payload[0].payload
                          return (
                            <div className="bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px]">
                              <p className="font-medium text-ink-900">{p.label}</p>
                              <p className="text-ink-400">{p.window}</p>
                              <p className="text-ink-700 mt-0.5">Risk score: {p.score}</p>
                            </div>
                          )
                        }}
                      />
                      <Line type="monotone" dataKey="score" name="Risk score" stroke="#C62828" strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-[11px]">
                    <div><p className="text-ink-400 text-[10px]">Location</p><p className="text-ink-900">{profileQuery.data.asset.district}, {profileQuery.data.asset.state}</p></div>
                    <div><p className="text-ink-400 text-[10px]">Type</p><p className="text-ink-900">{profileQuery.data.asset.type}</p></div>
                    <div><p className="text-ink-400 text-[10px]">Coordinates</p><p className="text-ink-900">{profileQuery.data.asset.lat}, {profileQuery.data.asset.lon}</p></div>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card title="All assets" subtitle="Ranked by risk score under the selected filters" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-surface-border">
                    <th className="font-medium px-5 py-2.5">Asset</th>
                    <th className="font-medium px-2 py-2.5">Type</th>
                    <th className="font-medium px-2 py-2.5">Location</th>
                    <th className="font-medium px-2 py-2.5">Coordinates</th>
                    <th className="font-medium px-2 py-2.5 min-w-[120px]">Risk score</th>
                    <th className="font-medium px-5 py-2.5">Band</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(a.id)}
                      className={`border-b border-surface-border last:border-0 cursor-pointer hover:bg-surface-muted/40 ${selected === a.id ? 'bg-brand-green/5' : ''}`}
                    >
                      <td className="px-5 py-2.5 text-ink-900 font-medium">{a.name}</td>
                      <td className="px-2 py-2.5 text-ink-600">{a.type}</td>
                      <td className="px-2 py-2.5 text-ink-600">{a.district}, {a.state}</td>
                      <td className="px-2 py-2.5 text-ink-300">{a.lat}, {a.lon}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[50px]"><ProgressBar pct={a.score} color={a.color} /></div>
                          <span className="text-ink-700 font-medium w-8 text-right">{a.score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${a.color}22`, color: a.color }}>
                          {a.band}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
