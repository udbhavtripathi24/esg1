import { ArrowRight } from 'lucide-react'
import { convertUnit } from '../analytics/units.js'
import { useReportingUnits } from '../../hooks/useUnits.js'

const fmt = (v) => {
  if (v === null || v === undefined) return '—'
  const a = Math.abs(v)
  return v.toLocaleString('en-IN', { maximumFractionDigits: a !== 0 && a < 1 ? 4 : a < 100 ? 2 : 0 })
}

/**
 * KPI before → after (from app/datasheets/impact.py's compare): approving an upload, or reverting one.
 * Energy, water, emissions and waste are shown in the company's reporting units (Admin Console → Units).
 */
export default function KpiChanges({ items, divide = 'divide-brand-green/10' }) {
  const prefs = useReportingUnits()
  return (
    <table className="w-full text-[11px]">
      <tbody className={`divide-y ${divide}`}>
        {items.map((it) => {
          const c = convertUnit(it.unit, 1, prefs)
          const k = (v) => (v === null || v === undefined ? v : v * c.scale)
          return (
            <tr key={it.code}>
              <td className="py-1.5 pr-3 text-ink-700">{it.name}</td>
              <td className="py-1.5 text-right tabular-nums text-ink-500 whitespace-nowrap">{fmt(k(it.before))}</td>
              <td className="py-1.5 px-2 text-ink-300"><ArrowRight size={12} /></td>
              <td className="py-1.5 text-right tabular-nums font-semibold text-ink-900 whitespace-nowrap">{fmt(k(it.after))}</td>
              <td className="py-1.5 pl-2 text-[10px] text-ink-500 whitespace-nowrap">{c.unit}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
