import { useId, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Legend, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { AXIS, BRAND, BRAND_LIGHT, GRID, PREVIOUS, SERIES, compact, fmtValue, monthLabel } from './viz.js'

/** Tooltip in text tokens; the coloured swatch carries the series identity. */
export function ChartTooltip({ active, payload, label, unit, labelFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-surface-border rounded-md shadow-md px-3 py-2 text-[10px] min-w-[9rem]">
      <p className="font-medium text-ink-900 mb-1">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.filter((p) => p.value !== null && p.value !== undefined).map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-ink-700">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color || p.fill || p.stroke }} />
          <span className="flex-1">{p.name}</span>
          <span className="tabular-nums font-medium text-ink-900">{fmtValue(p.value)}</span>
          {unit && <span className="text-ink-500">{unit}</span>}
        </p>
      ))}
    </div>
  )
}

const legendStyle = { fontSize: 10, paddingTop: 4 }
/** Legend labels in ink, not in the series colour. */
const legendText = (v) => <span style={{ color: '#4B4B4B' }}>{v}</span>

/** Tiny trend line for a stat tile (no axes). */
export function Sparkline({ values, height = 34 }) {
  const id = useId().replace(/:/g, '')
  const data = (values || []).map((v, i) => ({ i, v }))
  if (data.filter((d) => d.v !== null && d.v !== undefined).length < 2) return <div style={{ height }} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND_LIGHT} stopOpacity={0.35} />
            <stop offset="100%" stopColor={BRAND_LIGHT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[(min) => min - (Math.abs(min) * 0.08 || 1), (max) => max + (Math.abs(max) * 0.04 || 1)]} />
        <Area type="monotone" dataKey="v" stroke={BRAND} strokeWidth={1.75} fill={`url(#sp${id})`} connectNulls baseValue="dataMin"
          dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** This financial year against the previous one, month by month (one unit, one axis). */
export function TrendChart({ months, current, previous, fy, previousFy, unit, height = 260, color = BRAND }) {
  const data = months.map((m, i) => ({ m, cy: current?.[i] ?? null, py: previous?.[i] ?? null }))
  const hasPy = data.some((d) => d.py !== null)
  const fill = `trend-fill-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="m" tick={AXIS} tickFormatter={(m) => monthLabel(m).split(' ')[0]} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} tickFormatter={compact} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<ChartTooltip unit={unit} labelFormatter={(m) => monthLabel(m).split(' ')[0]} />}
          cursor={{ stroke: '#C9C8C3', strokeDasharray: '3 3' }} />
        <Legend wrapperStyle={legendStyle} iconType="plainline" formatter={legendText} />
        {hasPy && (
          <Line dataKey="py" name={`FY ${previousFy}`} stroke={PREVIOUS} strokeWidth={2} strokeDasharray="5 4"
            dot={false} activeDot={{ r: 4 }} connectNulls isAnimationActive={false} />
        )}
        <Area dataKey="cy" stroke="none" fill={`url(#${fill})`} connectNulls isAnimationActive={false} legendType="none" tooltipType="none" />
        <Line dataKey="cy" name={`FY ${fy}`} stroke={color} strokeWidth={2.25} dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/** Composition month by month: stacked bars, colours by fixed part position, 2px white gaps. */
export function StackedMonthly({ months, parts, series, unit, scale = 1, height = 260, colors }) {
  const shown = parts.filter(([code]) => (series[code] || []).some((v) => v))
  const data = months.map((m, i) => {
    const row = { m }
    for (const [code] of shown) row[code] = series[code]?.[i] === null || series[code]?.[i] === undefined ? null : series[code][i] * scale
    return row
  })
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 4 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="m" tick={AXIS} tickFormatter={(m) => monthLabel(m).split(' ')[0]} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} tickFormatter={compact} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<ChartTooltip unit={unit} labelFormatter={monthLabel} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Legend wrapperStyle={legendStyle} iconType="square" iconSize={8} formatter={legendText} />
        {shown.map(([code, label], i) => (
          <Bar key={code} dataKey={code} name={label} stackId="a" stroke="#fff" strokeWidth={1}
            fill={(colors || SERIES)[parts.findIndex((p) => p[0] === code) % SERIES.length]}
            radius={i === shown.length - 1 ? [3, 3, 0, 0] : 0} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Locations ranked by the year's value, one hue, value + share labelled on each bar. */
export function LocationBars({ labels, values, unit, scale = 1, color = BRAND, colorLight = BRAND_LIGHT }) {
  const total = (values || []).reduce((a, v) => a + (v || 0), 0)
  const data = labels.map((l, i) => ({ l, v: values?.[i] === null || values?.[i] === undefined ? null : values[i] * scale }))
    .filter((d) => d.v !== null).sort((a, b) => b.v - a.v)
  if (!data.length) return <p className="text-[11px] text-ink-500 py-6 text-center">No location data for this year.</p>
  const height = Math.max(90, data.length * 44 + 20)
  const share = (v) => (total ? ` · ${Math.round((v / (total * scale)) * 100)}%` : '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 96, bottom: 4, left: 4 }} barCategoryGap="28%">
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="l" tick={{ ...AXIS, fill: '#1A1A1A' }} width={130} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="v" name="This year" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((d, i) => <Cell key={d.l} fill={i === 0 ? color : colorLight} />)}
          <LabelList dataKey="v" position="right" formatter={(v) => `${compact(v)}${share(v)}`}
            style={{ fontSize: 10, fill: '#1A1A1A' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** A chart with a "Table" switch, so every figure can be read without the colours. */
export function ChartFrame({ title, subtitle, table, children, action }) {
  const [view, setView] = useState('chart')
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-[12px] font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="text-[10px] text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {table && (
            <div className="flex rounded-md border border-surface-border overflow-hidden text-[10px]" role="group" aria-label="View">
              {['chart', 'table'].map((v) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  className={`px-2 py-1 capitalize ${view === v ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-surface-muted'}`}>{v}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {view === 'table' && table ? table : children}
    </div>
  )
}

/** Plain table for ChartFrame: rows = months/locations, columns = series. */
export function SeriesTable({ rowLabels, columns, unit, formatRow = (x) => x }) {
  return (
    <div className="overflow-x-auto max-h-72">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-white">
          <tr className="text-left text-[10px] text-ink-500 border-b border-surface-border">
            <th className="py-1.5 pr-3 font-medium" />
            {columns.map((c) => <th key={c.label} className="py-1.5 px-2 font-medium text-right">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {rowLabels.map((r, i) => (
            <tr key={r}>
              <td className="py-1.5 pr-3 text-ink-700 whitespace-nowrap">{formatRow(r)}</td>
              {columns.map((c) => <td key={c.label} className="py-1.5 px-2 text-right tabular-nums text-ink-900">{fmtValue(c.values[i])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {unit && <p className="text-[9px] text-ink-300 mt-1">All figures in {unit}.</p>}
    </div>
  )
}
