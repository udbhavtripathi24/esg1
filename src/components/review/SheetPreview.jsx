import { useState } from 'react'
import { ArrowRightLeft, MapPin, Sparkles } from 'lucide-react'
import KpiChanges from './KpiChanges.jsx'
import { groupConversions } from '../analytics/units.js'

const fmt = (v) => {
  if (v === null || v === undefined) return '—'
  const a = Math.abs(v)
  return v.toLocaleString('en-IN', { maximumFractionDigits: a !== 0 && a < 1 ? 4 : a < 100 ? 2 : 0 })
}

/**
 * Review Center → a data-sheet upload: what approving it will change on the dashboard (same KPI engine,
 * nothing written), the file's totals per column, and its rows.
 */
export default function SheetPreview({ data }) {
  const s = data.sheet
  const im = data.impact
  const [all, setAll] = useState(false)
  const rows = all ? data.rows : data.rows.slice(0, 40)
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-ink-700">
        <span><strong className="text-ink-900">{s.title}</strong></span>
        <span>{s.period_start} to {s.period_end} · {s.months} month{s.months === 1 ? '' : 's'}</span>
        <span className="inline-flex items-center gap-1"><MapPin size={11} /> {s.locations.join(', ') || '—'}</span>
      </div>

      {s.conversions?.length > 0 && (
        <p className="flex items-start gap-1.5 text-[10px] text-blue-800 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
          <ArrowRightLeft size={12} className="shrink-0 mt-px" />
          <span>Converted on upload (Admin Console → Units): {groupConversions(s.conversions).map((g) => (
            <span key={`${g.from}-${g.to}`} title={g.columns.join('\n')}>{g.columns.length === 1 ? g.columns[0] : `${g.columns.length} columns`} given in {g.from}, ×{g.factor.toLocaleString('en-IN')} to {g.to}. </span>
          ))}Totals and figures below are in the template units.</span>
        </p>
      )}

      {im && (
        <div className="rounded-lg border border-brand-green/30 bg-gradient-to-r from-brand-green/10 to-white p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-900 mb-1">
            <Sparkles size={13} className="text-brand-greenDark" /> If you approve: FY {im.fy}
          </p>
          <p className="text-[10px] text-ink-500 mb-3">
            {im.rows} row{im.rows === 1 ? '' : 's'}
            {im.new_locations.length > 0 && <> · new location: <strong className="text-ink-900">{im.new_locations.join(', ')}</strong></>}
            {im.replaces > 0 && <> · replaces {im.replaces} approved row{im.replaces === 1 ? '' : 's'} for the same month and location</>}
            {' '}· {im.changed} KPI{im.changed === 1 ? '' : 's'} change{im.changed === 1 ? 's' : ''}
          </p>
          {im.items.length > 0 ? (
            <KpiChanges items={im.items} />
          ) : <p className="text-[11px] text-ink-700">These rows are already counted: approving changes no figure.</p>}
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-ink-900 mb-2">Totals in this file</p>
        <div className="grid sm:grid-cols-2 gap-x-6">
          {s.totals.slice(0, 12).map((t) => (
            <p key={t.column} className="flex justify-between gap-3 text-[11px] py-1 border-b border-surface-border">
              <span className="text-ink-700 truncate" title={t.column}>{t.column}</span>
              <span className="tabular-nums text-ink-900 whitespace-nowrap">{fmt(t.total)} <span className="text-ink-500">{t.unit}</span></span>
            </p>
          ))}
        </div>
        {s.totals.length > 12 && <p className="text-[10px] text-ink-500 mt-1">and {s.totals.length - 12} more columns with values</p>}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-ink-900 mb-2">Rows as uploaded <span className="font-normal text-ink-500">({data.rows.length} values, zeros left out)</span></p>
        <div className="overflow-x-auto max-h-96 border border-surface-border rounded-md">
          <table className="w-full text-[10px]">
            <thead className="bg-surface-muted sticky top-0">
              <tr className="text-left text-ink-500">
                <th className="font-medium py-1.5 px-2">Month</th><th className="font-medium py-1.5 px-2">Location</th>
                <th className="font-medium py-1.5 px-2">Column</th><th className="font-medium py-1.5 px-2 text-right">Value</th>
                <th className="font-medium py-1.5 px-2">Details</th><th className="font-medium py-1.5 px-2">Row</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {rows.map((r) => {
                const { period, ...dims } = r.attributes || {}
                return (
                  <tr key={`${r.row_number}-${r.kpi_code}`}>
                    <td className="py-1.5 px-2 whitespace-nowrap">{period}</td>
                    <td className="py-1.5 px-2 whitespace-nowrap">{r.site_name}</td>
                    <td className="py-1.5 px-2 text-ink-700">{r.kpi_display_name}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums font-medium text-ink-900">{fmt(r.value)} <span className="text-ink-500 font-normal">{r.unit}</span></td>
                    <td className="py-1.5 px-2 text-ink-500">{Object.entries(dims).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ') || '—'}</td>
                    <td className="py-1.5 px-2 text-ink-300">{r.row_number}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data.rows.length > 40 && (
          <button type="button" className="text-[10px] text-brand-green hover:underline mt-1" onClick={() => setAll(!all)}>
            {all ? 'Show fewer' : `Show all ${data.rows.length}`}
          </button>
        )}
      </div>
    </div>
  )
}
