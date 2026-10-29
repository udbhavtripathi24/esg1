import { useState } from 'react'
import { Download, Info, Loader2 } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useFactors } from '../../hooks/useAdmin.js'
import { downloadFormulaSheet } from '../../api/datasheets.js'
import { TableShell } from './parts.jsx'
import { td, th } from './util.js'

export default function FactorsTab({ toast }) {
  const q = useFactors()
  const [busy, setBusy] = useState(false)
  if (q.isLoading) return <LoadingState label="Loading factors…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load the factors.'} onRetry={() => q.refetch()} />
  const sheet = async () => {
    setBusy(true)
    try { await downloadFormulaSheet() } catch (e) { toast(e.message || 'Download failed') } finally { setBusy(false) }
  }
  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <p className="flex-1 min-w-[280px] flex items-start gap-1.5 text-[11px] text-ink-500"><Info size={13} className="shrink-0 mt-px" />{q.data.note}</p>
        <Button size="sm" variant="ghost" onClick={sheet} disabled={busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Formula sheet (Excel)
        </Button>
      </div>
      <TableShell>
        <table className="w-full">
          <thead><tr className="bg-surface-muted/50">
            <th className={`${th} pl-5`}>Factor</th><th className={`${th} text-right`}>Value</th><th className={th}>Source</th>
            <th className={th}>Used for</th><th className={`${th} pr-5`}>Sign-off</th>
          </tr></thead>
          <tbody>
            {q.data.items.map((f) => (
              <tr key={f.key} className="border-t border-surface-border align-top">
                <td className={`${td} pl-5 font-medium text-ink-900 max-w-xs`}>{f.label}</td>
                <td className={`${td} text-right tabular-nums text-ink-900`}>{f.value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}</td>
                <td className={`${td} text-ink-700 max-w-[220px]`}>{f.basis}</td>
                <td className={td}>
                  {f.used_for.length ? (
                    <span className="flex flex-wrap gap-1">{f.used_for.slice(0, 4).map((u) => (
                      <span key={u} className="text-[9px] bg-surface-muted text-ink-700 px-1.5 py-0.5 rounded">{u.replace(/_/g, ' ')}</span>))}
                      {f.used_for.length > 4 && <span className="text-[9px] text-ink-500" title={f.used_for.join('\n')}>+{f.used_for.length - 4} more</span>}</span>
                  ) : <span className="text-ink-300">—</span>}
                </td>
                <td className={`${td} pr-5`}>{f.needs_signoff
                  ? <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded whitespace-nowrap">Needs sign-off</span>
                  : <span className="text-[10px] text-ink-500">Exact</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  )
}
