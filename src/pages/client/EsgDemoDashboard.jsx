import { useState } from 'react'
import {
  AlertTriangle, Leaf, Users, ShieldCheck, CloudRain, Flame, Zap, Droplet, Trash2,
  GraduationCap, UserCheck, HeartPulse, ShieldAlert, MessageSquareWarning,
  Landmark, Truck,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList, RadialBarChart, RadialBar,
} from 'recharts'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Select } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import ClimateRiskSection from './ClimateRiskSection.jsx'
import {
  useDemoFilters, useDemoGhg, useDemoEnergy, useDemoWater, useDemoWaste,
  useDemoSocialTraining, useDemoSocialDiversity, useDemoSocialWellbeing,
  useDemoSocialHealthSafety, useDemoSocialComplaints,
  useDemoGovernanceLeadership, useDemoGovernanceSupplyChain,
} from '../../hooks/useDemoEsgDashboard.js'

/**
 * ESG Demo Dashboard -- ILLUSTRATIVE DATA ONLY.
 *
 * Built to demonstrate real, interactive, filterable, multi-domain ESG
 * analytics natively -- without Power BI -- ahead of director approval
 * on real methodology. Structure, chart types, and metric labels are
 * drawn directly from a reference document provided by the business
 * stakeholder; nothing here is an invented metric.
 *
 * Every number traces to app/services/demo_esg_data.py -- deterministic
 * demo values, NEVER real uploaded data, NEVER calculated from real
 * emission factors, NEVER touching the real KpiValue/Dataset tables.
 * Completely separate from the real Analytics/Dashboard pages.
 */

const CHART_PALETTE = ['#64BC44', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#78716C']
const DOMAIN_COLORS = { scope1: '#64BC44', scope2: '#3B82F6', scope3: '#F59E0B' }

function compactNumber(n) {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return typeof n === 'number' ? n.toLocaleString() : n
}

function StatTile({ icon: Icon, label, value, unit, tint }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 ${tint}`}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-semibold text-ink-900">
        {value}
        {unit && <span className="text-sm font-normal text-ink-500 ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px] max-w-xs">
      <p className="font-medium text-ink-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  )
}

/** The single most-reused chart shape in the reference doc: N
 * categories, each broken down by location, shown as a bar chart
 * (stacked by default). dataByCategory: {category: {location: value}}.
 * Reused for ~20 different charts across all three domains so the
 * whole dashboard stays visually and behaviorally consistent. */
function CategoryByLocationChart({ dataByCategory, height = 260, stacked = true, valueFormatter = compactNumber, layout = 'horizontal', chartType = 'bar' }) {
  const categories = Object.keys(dataByCategory)
  const locations = categories.length > 0 ? Object.keys(dataByCategory[categories[0]]) : []
  const chartData = locations.map((loc) => {
    const row = { name: loc }
    categories.forEach((cat) => { row[cat] = dataByCategory[cat][loc] })
    return row
  })

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 15, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={valueFormatter} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
          {categories.map((cat, i) => (
            <Line key={cat} type="monotone" dataKey={cat} stroke={CHART_PALETTE[i % CHART_PALETTE.length]} strokeWidth={2.25} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEE" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={valueFormatter} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
          {categories.map((cat, i) => (
            <Bar key={cat} dataKey={cat} stackId={stacked ? 'a' : undefined} fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                radius={stacked && i === categories.length - 1 ? [0, 4, 4, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 15, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEE" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={valueFormatter} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 9 }} />
        {categories.map((cat, i) => (
          <Bar key={cat} dataKey={cat} stackId={stacked ? 'a' : undefined} fill={CHART_PALETTE[i % CHART_PALETTE.length]}
              radius={stacked && i === categories.length - 1 ? [4, 4, 0, 0] : (!stacked ? [4, 4, 0, 0] : undefined)} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Single metric, one bar per location. */
function SimpleByLocationChart({ dataByLocation, name = 'Value', height = 220, color = CHART_PALETTE[0], valueFormatter = compactNumber, chartType = 'bar', layout = 'horizontal' }) {
  const chartData = Object.entries(dataByLocation).map(([loc, v]) => ({ name: loc, value: v }))

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 15, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={valueFormatter} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEE" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={valueFormatter} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name={name} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="value" position="right" formatter={valueFormatter} style={{ fontSize: 9, fill: '#6B6B6B' }} />
            {chartData.map((_, i) => <Cell key={i} fill={color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEE" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={valueFormatter} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name={name} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="value" position="top" formatter={valueFormatter} style={{ fontSize: 9, fill: '#6B6B6B' }} />
          {chartData.map((_, i) => <Cell key={i} fill={color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Fixes a real, repeated layout bug: recharts' built-in <Legend>
 * crammed inside the same fixed-height container as a small donut has
 * no dedicated room and ends up overlapping the chart. This renders
 * its own plain HTML legend, always fully separate from the chart's
 * SVG area, so overlap is structurally impossible -- reused everywhere
 * a small donut needs a legend, so the fix is consistent across the
 * whole page rather than fixed once and repeated elsewhere. */
function DonutWithLegend({ data, colors = CHART_PALETTE, size = 150, position = 'bottom' }) {
  const isSide = position === 'side'
  return (
    <div className={isSide ? 'flex items-center gap-6' : ''}>
      <ResponsiveContainer width={isSide ? size : '100%'} height={size}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={size * 0.28} outerRadius={size * 0.44} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className={isSide ? 'space-y-1.5 text-[11px]' : 'flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-[11px]'}>
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-ink-700">{d.name}: <span className="font-medium text-ink-900">{d.value.toLocaleString()}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionLoader({ query, children }) {
  if (query.isLoading) return <LoadingState label="Loading…" />
  if (query.isError) return <ErrorState message="Could not load." onRetry={() => query.refetch()} />
  return children(query.data)
}

// ============================== ENVIRONMENT ==============================

function GhgSection({ params }) {
  const query = useDemoGhg(params)
  return (
    <SectionLoader query={query}>
      {(d) => {
        const scopeDonutData = [
          { name: 'Scope 1', value: d.scope_totals.scope1 },
          { name: 'Scope 2', value: d.scope_totals.scope2 },
          { name: 'Scope 3', value: d.scope_totals.scope3 },
        ]
        const emissionsByLocation = {
          Scope1: Object.fromEntries(Object.entries(d.emissions_by_location).map(([l, v]) => [l, v.scope1])),
          Scope2: Object.fromEntries(Object.entries(d.emissions_by_location).map(([l, v]) => [l, v.scope2])),
          Scope3: Object.fromEntries(Object.entries(d.emissions_by_location).map(([l, v]) => [l, v.scope3])),
        }
        return (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <StatTile icon={Flame} label="Total GHG Emissions" value={compactNumber(d.total_ghg_emissions_tco2e)} unit="tCO2e" tint="bg-red-100 text-red-600" />
              <StatTile icon={Zap} label="Emission Intensity" value={d.emission_intensity_tco2e_per_rupee_turnover} unit="tCO2e/₹" tint="bg-amber-100 text-amber-600" />
              <StatTile icon={Leaf} label="Renewable Energy" value={d.renewable_energy_percentage} unit="%" tint="bg-brand-green/10 text-brand-greenDark" />
              <StatTile icon={Zap} label="Total Energy Consumption" value={compactNumber(d.total_energy_consumption_mj)} unit="MJ" tint="bg-blue-100 text-blue-600" />
            </div>
            <div className="grid lg:grid-cols-2 gap-4 mb-5">
              <Card title="Emissions Breakdown by Location" subtitle="tCO2e, by scope">
                <CategoryByLocationChart dataByCategory={emissionsByLocation} chartType="line" />
              </Card>
              <Card title="Total GHG Emissions" subtitle="Scope contribution">
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={scopeDonutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {scopeDonutData.map((_, i) => <Cell key={i} fill={[DOMAIN_COLORS.scope1, DOMAIN_COLORS.scope2, DOMAIN_COLORS.scope3][i]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-[11px]">
                    {scopeDonutData.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: [DOMAIN_COLORS.scope1, DOMAIN_COLORS.scope2, DOMAIN_COLORS.scope3][i] }} />
                        <span className="text-ink-700">{s.name}: <span className="font-medium text-ink-900">{s.value.toLocaleString()} tCO2e</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
            <div className="grid lg:grid-cols-2 gap-4 mb-5">
              <Card title="Scope 1 Emissions by Category" subtitle="Company cars, DG sets, HVAC">
                <CategoryByLocationChart dataByCategory={d.scope1_by_category} layout="vertical" stacked={true} />
              </Card>
              <Card title="Scope 3 Emissions by Category" subtitle="Leased HVAC, DG sets, cars">
                <CategoryByLocationChart dataByCategory={d.scope3_by_category} layout="vertical" stacked={true} />
              </Card>
            </div>
            <Card title="Scope 2 Emissions" subtitle="tCO2e, by location">
              <SimpleByLocationChart dataByLocation={emissionsByLocation.Scope2} name="Scope 2" color={DOMAIN_COLORS.scope2} valueFormatter={(v) => v} />
            </Card>
          </div>
        )
      }}
    </SectionLoader>
  )
}

function EnergySection({ params }) {
  const energyQuery = useDemoEnergy(params)
  // Total energy consumption, renewable %, and overall energy intensity
  // live in the GHG endpoint's response -- reused here via its own
  // cached query rather than duplicating that data in the backend.
  const ghgQuery = useDemoGhg(params)

  if (energyQuery.isLoading || ghgQuery.isLoading) return <LoadingState label="Loading…" />
  if (energyQuery.isError || ghgQuery.isError) return <ErrorState message="Could not load." onRetry={() => { energyQuery.refetch(); ghgQuery.refetch() }} />

  const d = energyQuery.data
  const g = ghgQuery.data
  const renewDonut = Object.entries(d.renewable_vs_non_renewable_mj).map(([name, value]) => ({ name, value }))
  const renewablePct = g.renewable_energy_percentage

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatTile icon={Zap} label="Total Energy Consumption" value={compactNumber(g.total_energy_consumption_mj)} unit="MJ" tint="bg-blue-100 text-blue-600" />
        <StatTile icon={Zap} label="Energy Intensity" value={g.energy_intensity_mj_per_rupee_turnover} unit="MJ/₹" tint="bg-amber-100 text-amber-600" />
        <StatTile icon={Leaf} label="Renewable Energy MJ" value={compactNumber(d.renewable_vs_non_renewable_mj.Renewable)} tint="bg-brand-green/10 text-brand-greenDark" />
        <StatTile icon={Zap} label="Non-Renewable Energy MJ" value={compactNumber(d.renewable_vs_non_renewable_mj['Non Renewable'])} tint="bg-stone-100 text-stone-600" />
      </div>

      {/* Renewable Energy % gets its own prominent gauge card, per the reference.
          The main gauge stays dominant; the line chart on the right uses the
          card's previously-empty space to add a real, secondary breakdown. */}
      <Card title="Renewable Energy Percentage" subtitle="Share of total energy consumption from renewable sources" className="mb-5">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <RadialBarChart width={160} height={160} innerRadius="65%" outerRadius="100%" data={[{ name: 'Renewable', value: renewablePct }]} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: '#F1F5F1' }} dataKey="value" cornerRadius={8} fill="#64BC44" />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-4xl font-semibold text-brand-greenDark">{renewablePct}%</p>
          </div>
          <div className="w-full lg:border-l lg:border-surface-border lg:pl-6 flex-1">
            <p className="text-[10px] text-ink-400 mb-1">Renewable Energy % by Location</p>
            <SimpleByLocationChart dataByLocation={d.renewable_energy_percentage_by_location} name="Renewable %" color={CHART_PALETTE[0]} valueFormatter={(v) => `${v}%`} chartType="line" height={140} />
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card title="Total Energy Consumption by Location" subtitle="MJ">
          <SimpleByLocationChart dataByLocation={g.energy_by_location_mj} name="Energy Consumption" color={CHART_PALETTE[1]} chartType="line" />
        </Card>
        <Card title="Renewable vs Non-Renewable Energy" subtitle="MJ">
          <DonutWithLegend data={renewDonut} size={150} />
        </Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card title="Energy Intensity" subtitle="MJ per rupee turnover, by location">
          <SimpleByLocationChart dataByLocation={d.energy_intensity_mj_per_rupee_turnover_by_location} name="Energy Intensity" color={CHART_PALETTE[2]} valueFormatter={(v) => v} chartType="line" />
        </Card>
        <Card title="Energy Intensity (PPP)" subtitle="MJ per rupee turnover PPP, by location">
          <SimpleByLocationChart dataByLocation={d.energy_intensity_mj_per_rupee_turnover_ppp_by_location} name="Energy Intensity PPP" color={CHART_PALETTE[3]} valueFormatter={(v) => v} chartType="line" />
        </Card>
      </div>
      <Card title="Energy from Other Renewable Sources" subtitle="Cooling / Heat / Steam, by location" className="mb-5">
        <CategoryByLocationChart dataByCategory={d.other_renewable_sources_mj_by_location} />
      </Card>
      <Card title="Renewable Energy by Source" subtitle="Wind, Solar, Small Hydro, Biomass, Biofuel, Steam, Heat, Cooling — by location" className="mb-5">
        <CategoryByLocationChart dataByCategory={d.renewable_energy_by_source_mj_by_location} height={280} />
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Electricity from Renewable Sources" subtitle="Solar / Wind / Small Hydro, by location">
          <CategoryByLocationChart dataByCategory={d.electricity_from_renewable_by_location} />
        </Card>
        <Card title="Energy from Renewable Fuels" subtitle="Biomass / Biofuel, by location">
          <CategoryByLocationChart dataByCategory={d.renewable_fuels_by_location} stacked={false} />
        </Card>
      </div>
    </div>
  )
}

function WaterSection({ params }) {
  const query = useDemoWater(params)
  return (
    <SectionLoader query={query}>
      {(d) => (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
            <StatTile icon={Droplet} label="Water Consumed" value={d.water_consumed_kl} unit="kL" tint="bg-blue-100 text-blue-600" />
            <StatTile icon={Zap} label="Water Intensity" value={d.water_intensity_kl_per_rupee_turnover} unit="kL/₹" tint="bg-amber-100 text-amber-600" />
            <StatTile icon={Droplet} label="Water Reused" value={d.water_reused_kl} unit="kL" tint="bg-cyan-100 text-cyan-600" />
            <StatTile icon={Droplet} label="Water Recycled" value={d.water_recycled_kl} unit="kL" tint="bg-brand-green/10 text-brand-greenDark" />
            <StatTile icon={Droplet} label="Water Withdrawal" value={d.water_withdrawal_kl} unit="kL" tint="bg-blue-100 text-blue-600" />
          </div>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <Card title="Water Withdrawal by Location" subtitle="kL">
              <SimpleByLocationChart dataByLocation={d.water_withdrawal_by_location} name="Withdrawal" color={CHART_PALETTE[1]} valueFormatter={(v) => v} chartType="line" />
            </Card>
            <Card title="Water Consumption by Location" subtitle="kL">
              <SimpleByLocationChart dataByLocation={d.water_consumption_by_location} name="Consumption" color={CHART_PALETTE[1]} valueFormatter={(v) => v} chartType="line" />
            </Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <Card title="Water Recycled & Reused" subtitle="kL, by location">
              <CategoryByLocationChart dataByCategory={d.water_recycled_reused_by_location} stacked={true} />
            </Card>
            <Card title="Water Intensity per Rupee Turnover" subtitle="By location">
              <SimpleByLocationChart dataByLocation={d.water_intensity_by_location} name="Intensity" color={CHART_PALETTE[4]} valueFormatter={(v) => v} layout="vertical" />
            </Card>
          </div>
          <Card title="Water Withdrawal Breakdown" subtitle="Category-wise (Surface / Ground / Third Party / Seawater / Other), by location">
            <CategoryByLocationChart dataByCategory={d.water_withdrawal_breakdown_by_location} height={280} valueFormatter={(v) => v} />
          </Card>
        </div>
      )}
    </SectionLoader>
  )
}

function WasteSection({ params }) {
  const query = useDemoWaste(params)
  return (
    <SectionLoader query={query}>
      {(d) => (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatTile icon={Trash2} label="Waste Generated" value={d.waste_generated_mt} unit="MT" tint="bg-stone-100 text-stone-600" />
            <StatTile icon={Trash2} label="Waste Disposed" value={d.waste_disposed_mt} unit="MT" tint="bg-red-100 text-red-600" />
            <StatTile icon={Trash2} label="Waste Recovered" value={d.waste_recovered_mt} unit="MT" tint="bg-brand-green/10 text-brand-greenDark" />
            <StatTile icon={Zap} label="Waste Intensity" value={d.waste_intensity_mt_per_rupee_turnover} unit="MT/₹" tint="bg-amber-100 text-amber-600" />
          </div>
          <Card title="Total Waste Generated" subtitle="Category-wise, by location" className="mb-5">
            <CategoryByLocationChart dataByCategory={d.waste_generated_by_category_by_location} height={300} valueFormatter={(v) => v} />
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Waste Recovery Breakdown" subtitle="Recycled / Reused / Recovery Options, by location">
              <CategoryByLocationChart dataByCategory={d.waste_recovery_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
            <Card title="Waste Disposal Breakdown" subtitle="Incinerated / Landfilled / Other, by location">
              <CategoryByLocationChart dataByCategory={d.waste_disposal_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
          </div>
        </div>
      )}
    </SectionLoader>
  )
}

// ================================ SOCIAL ================================

function TrainingSection({ params }) {
  const query = useDemoSocialTraining(params)
  return (
    <SectionLoader query={query}>
      {(d) => (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-5">
            <StatTile icon={GraduationCap} label="Total Training Hours" value={compactNumber(d.total_training_hours)} tint="bg-blue-100 text-blue-600" />
            <StatTile icon={GraduationCap} label="Training Hours Per Employee" value={d.training_hours_per_employee_avg} tint="bg-brand-green/10 text-brand-greenDark" />
          </div>
          <Card title="Total Training Hours by Location" subtitle="Hours" className="mb-5">
            <SimpleByLocationChart dataByLocation={d.training_hours_by_location} name="Hours" color={CHART_PALETTE[1]} />
          </Card>
          <Card title="Training Hours Per Employee by Location" subtitle="Trend across locations" className="mb-5">
            <SimpleByLocationChart dataByLocation={d.training_hours_per_employee_by_location} name="Hours Per Employee" color={CHART_PALETTE[0]} valueFormatter={(v) => v} chartType="line" />
          </Card>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <Card title="Human Rights Training" subtitle="Employee category-wise, by location">
              <CategoryByLocationChart dataByCategory={d.human_rights_training_by_location} stacked={false} />
            </Card>
            <Card title="Skill Upgradation Training" subtitle="By gender, by location">
              <CategoryByLocationChart dataByCategory={d.skill_upgradation_training_by_location} stacked={false} />
            </Card>
          </div>
          <Card title="Health & Safety Training Attendance" subtitle="By gender, by location">
            <CategoryByLocationChart dataByCategory={d.health_safety_training_attendance_by_location} stacked={false} />
          </Card>
        </div>
      )}
    </SectionLoader>
  )
}

function DiversitySection({ params }) {
  const query = useDemoSocialDiversity(params)
  return (
    <SectionLoader query={query}>
      {(d) => {
        const workforceDonut = Object.entries(d.workforce_by_gender).map(([name, value]) => ({ name, value }))
        // Derived, not fabricated: computed directly from the same real
        // permanent_work_type_by_location values already used for the
        // "Work Type Breakdown — Permanent" chart above -- simple,
        // honest arithmetic on existing data, not a new metric.
        const femaleRepresentationByLocation = Object.fromEntries(
          Object.keys(d.permanent_work_type_by_location['Permanent Female']).map((loc) => {
            const female = d.permanent_work_type_by_location['Permanent Female'][loc]
            const male = d.permanent_work_type_by_location['Permanent Male'][loc]
            const others = d.permanent_work_type_by_location['Permanent Others'][loc]
            const total = female + male + others
            return [loc, total > 0 ? Math.round((female / total) * 1000) / 10 : 0]
          })
        )
        return (
          <div>
            <Card title="Workforce by Gender" className="mb-5">
              <DonutWithLegend data={workforceDonut} size={150} />
            </Card>
            <div className="grid lg:grid-cols-2 gap-4 mb-5">
              <Card title="Work Type Breakdown — Permanent" subtitle="Including differently abled, by location">
                <CategoryByLocationChart dataByCategory={d.permanent_work_type_by_location} />
              </Card>
              <Card title="Work Type Breakdown — Other than Permanent" subtitle="By location">
                <CategoryByLocationChart dataByCategory={d.non_permanent_work_type_by_location} />
              </Card>
            </div>
            <Card title="Female Representation % by Location" subtitle="Permanent female employees as a share of permanent workforce, by location" className="mb-5">
              <SimpleByLocationChart dataByLocation={femaleRepresentationByLocation} name="Female Representation" color={CHART_PALETTE[6]} valueFormatter={(v) => `${v}%`} chartType="line" />
            </Card>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Differently Abled — Permanent" subtitle="By gender, by location">
                <CategoryByLocationChart dataByCategory={d.differently_abled_permanent_by_location} stacked={false} valueFormatter={(v) => v} />
              </Card>
              <Card title="Differently Abled — Other than Permanent" subtitle="By gender, by location">
                <CategoryByLocationChart dataByCategory={d.differently_abled_non_permanent_by_location} stacked={false} valueFormatter={(v) => v} />
              </Card>
            </div>
          </div>
        )
      }}
    </SectionLoader>
  )
}

function WellbeingSection({ params }) {
  const query = useDemoSocialWellbeing(params)
  return (
    <SectionLoader query={query}>
      {(d) => (
        <div>
          <Card title="Performance Review by Gender" subtitle="By location" className="mb-5">
            <CategoryByLocationChart dataByCategory={d.performance_review_by_gender_by_location} />
          </Card>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <Card title="Accident Insurance by Workforce Type" subtitle="By location">
              <CategoryByLocationChart dataByCategory={d.accident_insurance_by_workforce_type_by_location} />
            </Card>
            <Card title="Health Insurance by Workforce Type" subtitle="By location">
              <CategoryByLocationChart dataByCategory={d.health_insurance_by_workforce_type_by_location} />
            </Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <Card title="Day Care Facilities" subtitle="By workforce type, by location">
              <CategoryByLocationChart dataByCategory={d.day_care_facilities_by_workforce_type_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
            <Card title="Paternity / Maternity Benefits" subtitle="By location">
              <CategoryByLocationChart dataByCategory={d.paternity_maternity_benefits_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
          </div>
          <Card title="More Than Minimum Wage" subtitle="By category (BOD / KMPs / Other), by gender and location">
            <CategoryByLocationChart dataByCategory={d.min_wage_by_category_by_location} height={300} />
          </Card>
        </div>
      )}
    </SectionLoader>
  )
}

function HealthSafetySection({ params }) {
  const query = useDemoSocialHealthSafety(params)
  // Both additional metrics below are real, existing data already
  // fetched elsewhere on this page (Working Conditions Complaints in
  // the Complaints sub-tab, Min Wage By Category in the Wellbeing
  // sub-tab) -- reused here via their own cached queries, same
  // cross-section pattern used throughout this page. Neither original
  // location is modified or removed.
  const complaintsQuery = useDemoSocialComplaints(params)
  const wellbeingQuery = useDemoSocialWellbeing(params)
  const [wageCategory, setWageCategory] = useState('All')

  if (query.isLoading || complaintsQuery.isLoading || wellbeingQuery.isLoading) return <LoadingState label="Loading…" />
  if (query.isError || complaintsQuery.isError || wellbeingQuery.isError) {
    return <ErrorState message="Could not load." onRetry={() => { query.refetch(); complaintsQuery.refetch(); wellbeingQuery.refetch() }} />
  }

  const d = query.data
  const c = complaintsQuery.data
  const w = wellbeingQuery.data
  const wageCategories = Object.keys(w.min_wage_by_category_by_location)

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Card title="Working Conditions Complaints Status" subtitle="By location">
          <SimpleByLocationChart dataByLocation={c.working_conditions_complaints_by_location} name="Complaints" color={CHART_PALETTE[2]} valueFormatter={(v) => v} />
        </Card>
        <Card title="Health & Safety Complaints Status" subtitle="By location">
          <SimpleByLocationChart dataByLocation={d.health_safety_complaints_status_by_location} name="Complaints" color={CHART_PALETTE[3]} valueFormatter={(v) => v} />
        </Card>
      </div>
      <Card
        title="More Than Min Wage By Category"
        subtitle="By employee category and location"
        action={
          <div className="w-56">
            <Select value={wageCategory} onChange={(e) => setWageCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {wageCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </Select>
          </div>
        }
      >
        {wageCategory === 'All' ? (
          <CategoryByLocationChart dataByCategory={w.min_wage_by_category_by_location} height={300} stacked={false} />
        ) : (
          <SimpleByLocationChart dataByLocation={w.min_wage_by_category_by_location[wageCategory]} name={wageCategory} color={CHART_PALETTE[0]} height={300} />
        )}
      </Card>
    </div>
  )
}

function ComplaintsSection({ params }) {
  const query = useDemoSocialComplaints(params)
  return (
    <SectionLoader query={query}>
      {(d) => (
        <div>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <Card title="Working Conditions Complaints Status" subtitle="By location">
              <SimpleByLocationChart dataByLocation={d.working_conditions_complaints_by_location} name="Complaints" color={CHART_PALETTE[3]} valueFormatter={(v) => v} />
            </Card>
            <Card title="Health & Safety Complaints Status" subtitle="By location">
              <SimpleByLocationChart dataByLocation={d.health_safety_complaints_by_location} name="Complaints" color={CHART_PALETTE[3]} valueFormatter={(v) => v} />
            </Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4 mb-5">
            <Card title="HR Complaints Received" subtitle="By type, by location">
              <CategoryByLocationChart dataByCategory={d.hr_complaints_received_by_type_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
            <Card title="HR Complaints Pending" subtitle="By type, by location">
              <CategoryByLocationChart dataByCategory={d.hr_complaints_pending_by_type_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="NGRBC Complaints Received" subtitle="By stakeholder type, by location">
              <CategoryByLocationChart dataByCategory={d.ngrbc_complaints_received_by_stakeholder_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
            <Card title="NGRBC Complaints Pending" subtitle="By stakeholder type, by location">
              <CategoryByLocationChart dataByCategory={d.ngrbc_complaints_pending_by_stakeholder_by_location} stacked={false} valueFormatter={(v) => v} />
            </Card>
          </div>
        </div>
      )}
    </SectionLoader>
  )
}

// =============================== GOVERNANCE ===============================

function LeadershipSection({ params }) {
  const query = useDemoGovernanceLeadership(params)
  return (
    <SectionLoader query={query}>
      {(d) => {
        const bodDonut = [{ name: 'Female', value: d.total_board_of_directors.Female }, { name: 'Male', value: d.total_board_of_directors.Male }]
        const kmpDonut = [{ name: 'Female', value: d.total_key_managerial_personnel.Female }, { name: 'Male', value: d.total_key_managerial_personnel.Male }]
        const locations = Object.keys(d.complaints_by_category_table)
        const categories = locations.length > 0 ? Object.keys(d.complaints_by_category_table[locations[0]]) : []

        return (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <StatTile icon={Landmark} label="Total Board of Directors" value={d.total_board_of_directors.Total} tint="bg-blue-100 text-blue-600" />
              <StatTile icon={Landmark} label="Total Key Managerial Personnel" value={d.total_key_managerial_personnel.Total} tint="bg-purple-100 text-purple-600" />
              <StatTile icon={ShieldCheck} label="Independent Directors" value={d.independent_directors.Male + d.independent_directors.Female} tint="bg-brand-green/10 text-brand-greenDark" />
              <StatTile icon={Users} label="Total Employees" value={d.total_employees} tint="bg-amber-100 text-amber-600" />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mb-5">
              <Card title="Board of Directors" subtitle="Gender split">
                <DonutWithLegend data={bodDonut} size={130} />
              </Card>
              <Card title="Key Managerial Personnel" subtitle="Gender split">
                <DonutWithLegend data={kmpDonut} size={130} />
              </Card>
              <Card title="Independent Directors" subtitle="Gender split">
                <div className="flex flex-col justify-center h-full space-y-2 text-xs">
                  <p className="text-ink-700">Male: <span className="font-semibold text-ink-900">{d.independent_directors.Male} ({d.independent_directors["Male Percentage"]}%)</span></p>
                  <p className="text-ink-700">Female: <span className="font-semibold text-ink-900">{d.independent_directors.Female} ({d.independent_directors["Female Percentage"]}%)</span></p>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mb-5">
              <Card title="Complaints on Conflict of Interest" subtitle="By location (KMPs / Directors / Employees)">
                <CategoryByLocationChart dataByCategory={d.conflict_of_interest_complaints_by_location} stacked={false} valueFormatter={(v) => v} />
              </Card>
              <Card title="Disciplinary Action — Bribery / Corruption" subtitle="By location">
                <CategoryByLocationChart dataByCategory={d.bribery_corruption_disciplinary_action_by_location} stacked={false} valueFormatter={(v) => v} />
              </Card>
            </div>

            <Card title="Complaints by Category" subtitle="Real reference table -- location × complaint category" className="mb-5" padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-left text-ink-500 bg-surface-muted/50">
                      <th className="font-medium px-4 py-2.5">Location</th>
                      {categories.map((c) => <th key={c} className="font-medium px-3 py-2.5">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((loc) => (
                      <tr key={loc} className="border-t border-surface-border">
                        <td className="px-4 py-2.5 text-ink-900 font-medium">{loc}</td>
                        {categories.map((c) => <td key={c} className="px-3 py-2.5 text-ink-700">{d.complaints_by_category_table[loc][c]}</td>)}
                      </tr>
                    ))}
                    <tr className="border-t border-surface-border bg-surface-muted/30 font-medium">
                      <td className="px-4 py-2.5 text-ink-900">Total</td>
                      {categories.map((c) => (
                        <td key={c} className="px-3 py-2.5 text-ink-900">
                          {locations.reduce((sum, loc) => sum + d.complaints_by_category_table[loc][c], 0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Independent Directors %" subtitle="By location">
                <CategoryByLocationChart dataByCategory={d.independent_directors_percentage_by_location} stacked={false} valueFormatter={(v) => `${v}%`} />
              </Card>
              <Card title="BOD / KMPs / Other" subtitle="By location">
                <CategoryByLocationChart dataByCategory={d.bod_kmp_other_by_location} stacked={false} valueFormatter={(v) => v} />
              </Card>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Board of Directors Count by Location" subtitle="Trend across locations">
                <SimpleByLocationChart dataByLocation={d.bod_kmp_other_by_location.BOD} name="Board of Directors" color={CHART_PALETTE[5]} valueFormatter={(v) => v} chartType="line" />
              </Card>
              <Card title="Key Managerial Personnel Count by Location" subtitle="Trend across locations">
                <SimpleByLocationChart dataByLocation={d.bod_kmp_other_by_location.KMPs} name="KMPs" color={CHART_PALETTE[1]} valueFormatter={(v) => v} chartType="line" />
              </Card>
            </div>
          </div>
        )
      }}
    </SectionLoader>
  )
}

function SupplyChainSection({ params }) {
  const query = useDemoGovernanceSupplyChain(params)
  return (
    <SectionLoader query={query}>
      {(d) => (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <StatTile icon={Truck} label="Awareness Programs for Value Chain Partners" value={d.awareness_programs_for_value_chain_partners} tint="bg-blue-100 text-blue-600" />
            <StatTile icon={ShieldCheck} label="Chain Partners Covered" value={d.chain_partners_covered_under_awareness_program_percentage} unit="%" tint="bg-brand-green/10 text-brand-greenDark" />
          </div>
          <Card title="Input Material Sourced" subtitle="Within India / MSMEs, by location" className="mb-5">
            <CategoryByLocationChart dataByCategory={d.input_material_sourced_by_location} stacked={false} valueFormatter={(v) => `${v}%`} />
          </Card>
          <Card title="Value Chain Assessed on HR & Workplace Parameters" subtitle="By location" className="mb-5">
            <CategoryByLocationChart dataByCategory={d.value_chain_hr_assessment_by_location} stacked={false} valueFormatter={(v) => v} />
          </Card>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Overall Suppliers Assessment" subtitle="By location">
              <SimpleByLocationChart dataByLocation={d.overall_suppliers_assessment_by_location} name="Suppliers Assessed" color={CHART_PALETTE[1]} valueFormatter={(v) => v} chartType="line" />
            </Card>
            <Card title="New Suppliers Assessment" subtitle="By location">
              <SimpleByLocationChart dataByLocation={d.new_suppliers_assessment_by_location} name="New Suppliers Assessed" color={CHART_PALETTE[2]} valueFormatter={(v) => v} chartType="line" />
            </Card>
          </div>
        </div>
      )}
    </SectionLoader>
  )
}

// ================================= MAIN =================================

const DOMAIN_TABS = {
  Environment: { icon: Leaf, subTabs: [
    { key: 'GHG Emission', icon: Flame, Component: GhgSection },
    { key: 'Energy', icon: Zap, Component: EnergySection },
    { key: 'Water', icon: Droplet, Component: WaterSection },
    { key: 'Waste', icon: Trash2, Component: WasteSection },
    { key: 'Climate Risk Assessment', icon: CloudRain, Component: ClimateRiskSection },
  ]},
  Social: { icon: Users, subTabs: [
    { key: 'Employee Training', icon: GraduationCap, Component: TrainingSection },
    { key: 'Diversity and Inclusion', icon: UserCheck, Component: DiversitySection },
    { key: 'Employee Wellbeing', icon: HeartPulse, Component: WellbeingSection },
    { key: 'Health and Safety', icon: ShieldAlert, Component: HealthSafetySection },
    { key: 'Complaints', icon: MessageSquareWarning, Component: ComplaintsSection },
  ]},
  Governance: { icon: ShieldCheck, subTabs: [
    { key: 'Leadership Diversity', icon: Landmark, Component: LeadershipSection },
    { key: 'Supply Chain Management', icon: Truck, Component: SupplyChainSection },
  ]},
}

export default function EsgDemoDashboard() {
  const [location, setLocation] = useState('All')
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState('All')
  const [domain, setDomain] = useState('Environment')
  const [subTab, setSubTab] = useState(DOMAIN_TABS.Environment.subTabs[0].key)

  const filtersQuery = useDemoFilters()
  const params = {
    ...(location !== 'All' ? { location } : {}),
    ...(year ? { year } : {}),
    ...(month !== 'All' ? { month } : {}),
  }

  function selectDomain(d) {
    setDomain(d)
    setSubTab(DOMAIN_TABS[d].subTabs[0].key)
  }

  const activeSubTab = DOMAIN_TABS[domain].subTabs.find((t) => t.key === subTab) || DOMAIN_TABS[domain].subTabs[0]
  const ActiveComponent = activeSubTab.Component

  return (
    <div>
      <PageHeader title="ESG Dashboard" subtitle="Environment · Social · Governance" />

      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-800">Demo — Illustrative Data Only</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            The figures on this page are deterministic demo values, not real uploaded or approved data. They are
            not derived from any approved emission-factor methodology, Scope 1/2/3 classification rules, or real
            financial data — none of which exist in this platform yet. This page exists to demonstrate real,
            interactive analytics capability ahead of methodology approval.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div className="w-40">
          <label className="text-[10px] text-ink-500 mb-1 block">Location</label>
          <Select value={location} onChange={(e) => setLocation(e.target.value)}>
            {(filtersQuery.data?.locations || ['All']).map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
        </div>
        <div className="w-32">
          <label className="text-[10px] text-ink-500 mb-1 block">Year</label>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {(filtersQuery.data?.years || [2026]).map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
        <div className="w-36">
          <label className="text-[10px] text-ink-500 mb-1 block">Month</label>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {(filtersQuery.data?.months || ['All']).map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
      </div>

      {/* Top-level domain tabs */}
      <div className="flex items-center gap-6 border-b border-surface-border mb-4">
        {Object.entries(DOMAIN_TABS).map(([key, { icon: Icon }]) => (
          <button
            key={key}
            onClick={() => selectDomain(key)}
            className={`flex items-center gap-1.5 pb-3 text-sm -mb-px border-b-2 transition-colors ${
              domain === key ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            <Icon size={14} /> {key}
          </button>
        ))}
      </div>

      {/* Sub-tabs for the active domain -- pill style, visually distinct from the top-level tabs */}
      {DOMAIN_TABS[domain].subTabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {DOMAIN_TABS[domain].subTabs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                subTab === key ? 'bg-brand-green text-white' : 'bg-surface-muted text-ink-600 hover:bg-surface-muted/70'
              }`}
            >
              <Icon size={12} /> {key}
            </button>
          ))}
        </div>
      )}

      <ActiveComponent params={params} />
    </div>
  )
}
