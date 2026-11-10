import { useState } from 'react'
import { Download, Info, Loader2, Pencil, RotateCcw } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { Modal } from '../surveys/parts.jsx'
import { inputCls } from '../surveys/util.js'
import { useFactorDirectory, useSetFactor } from '../../hooks/useKpis.js'
import { downloadFormulaSheet } from '../../api/datasheets.js'
import { TableShell } from './parts.jsx'
import { fmtWhen, td, th } from './util.js'

/**
 * Factors Directory: every number the platform multiplies by.
 * Emission factors (Scope 1, 2, 3) can be set by the company's administrator, with the source of the new
 * value; energy conversion factors are the BRSR's and change only after the engagement signs them off.
 */
export default function FactorsTab({ canManage, toast }) {
  const q = useFactorDirectory()
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState(null)
  if (q.isLoading) return <LoadingState label="Loading factors…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load the factors.'} onRetry={() => q.refetch()} />
  const emission = q.data.items.filter((f) => f.group === 'emission')
  const energy = q.data.items.filter((f) => f.group === 'energy')
  const sheet = async () => {
    setBusy(true)
    try { await downloadFormulaSheet() } catch (e) { toast(e.message || 'Download failed') } finally { setBusy(false) }
  }
  const signoff = emission.filter((f) => f.signoff).length
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <p className="flex-1 min-w-[280px] flex items-start gap-1.5 text-[11px] text-ink-500"><Info size={13} className="shrink-0 mt-px" />
          Scope 1, 2 and 3 emissions are worked out from the travel, commute, DG-set, HVAC and energy data sheets with these factors. Set your own value where you have a better source; the default and every change are kept in the Audit Logs.</p>
        <Button size="sm" variant="ghost" onClick={sheet} disabled={busy}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Formula sheet (Excel)
        </Button>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[12px] font-semibold text-ink-900">Emission factors</h3>
          {signoff > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{signoff} default{signoff === 1 ? '' : 's'} awaiting sign-off</span>}
        </div>
        <TableShell>
          <table className="w-full">
            <thead><tr className="bg-surface-muted/50">
              <th className={`${th} pl-5`}>Factor</th><th className={`${th} text-right`}>Value</th><th className={th}>Unit</th>
              <th className={th}>Source</th><th className={th}>Status</th>{canManage && <th className={`${th} pr-5 text-right`}>Action</th>}
            </tr></thead>
            <tbody>
              {emission.map((f) => (
                <tr key={f.key} className="border-t border-surface-border align-top">
                  <td className={`${td} pl-5 font-medium text-ink-900`}>{f.label}</td>
                  <td className={`${td} text-right tabular-nums text-ink-900`}>
                    {f.value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
                    {f.overridden && <span className="block text-[9px] text-ink-300">default {f.default.toLocaleString(undefined, { maximumSignificantDigits: 6 })}</span>}
                  </td>
                  <td className={`${td} text-ink-700 whitespace-nowrap`}>{f.unit}</td>
                  <td className={`${td} text-ink-700 max-w-[280px]`}>
                    {f.overridden ? <>{f.note}<span className="block text-[9px] text-ink-300">{f.updated_by} · {fmtWhen(f.updated_at)}</span></> : f.source}
                  </td>
                  <td className={td}>{f.overridden
                    ? <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap">Company value</span>
                    : f.signoff ? <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded whitespace-nowrap">Needs sign-off</span>
                      : <span className="text-[10px] text-ink-500">Standard</span>}</td>
                  {canManage && (
                    <td className={`${td} pr-5 text-right whitespace-nowrap`}>
                      <button type="button" className="text-[10px] text-brand-greenDark hover:underline inline-flex items-center gap-1" onClick={() => setEdit(f)}><Pencil size={11} /> Set value</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </section>

      <section>
        <h3 className="text-[12px] font-semibold text-ink-900 mb-2">Energy conversion factors <span className="font-normal text-[10px] text-ink-500">— used by the BRSR, dashboard and KPIs alike</span></h3>
        <TableShell>
          <table className="w-full">
            <thead><tr className="bg-surface-muted/50">
              <th className={`${th} pl-5`}>Factor</th><th className={`${th} text-right`}>Value</th><th className={th}>Source</th><th className={`${th} pr-5`}>Sign-off</th>
            </tr></thead>
            <tbody>
              {energy.map((f) => (
                <tr key={f.key} className="border-t border-surface-border align-top">
                  <td className={`${td} pl-5 font-medium text-ink-900 max-w-xs`}>{f.label}</td>
                  <td className={`${td} text-right tabular-nums text-ink-900`}>{f.value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}</td>
                  <td className={`${td} text-ink-700 max-w-[260px]`}>{f.source}</td>
                  <td className={`${td} pr-5`}>{f.signoff
                    ? <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded whitespace-nowrap">Needs sign-off</span>
                    : <span className="text-[10px] text-ink-500">Exact</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </section>
      {edit && <FactorModal f={edit} onClose={() => setEdit(null)} toast={toast} />}
    </div>
  )
}

function FactorModal({ f, onClose, toast }) {
  const save = useSetFactor()
  const [value, setValue] = useState(String(f.value))
  const [note, setNote] = useState(f.overridden ? f.note || '' : '')
  const [err, setErr] = useState(null)
  const submit = async (reset = false) => {
    setErr(null)
    const v = Number(value)
    if (!reset && (value.trim() === '' || Number.isNaN(v) || v < 0)) { setErr('Enter a positive number.'); return }
    if (!reset && !note.trim()) { setErr('Say where the value comes from.'); return }
    try {
      await save.mutateAsync({ key: f.key, body: reset ? { value: null } : { value: v, note: note.trim() } })
      toast(reset ? `${f.label}: back to the default` : `${f.label}: saved`)
      onClose()
    } catch (e) { setErr(e.message || 'Could not save') }
  }
  return (
    <Modal title={f.label} subtitle={`${f.unit} · default ${f.default}`} onClose={onClose}
      footer={<>
        {f.overridden && <Button size="sm" variant="ghost" onClick={() => submit(true)} disabled={save.isPending}><RotateCcw size={13} /> Use the default</Button>}
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => submit(false)} disabled={save.isPending}>{save.isPending ? <Loader2 size={13} className="animate-spin" /> : null} Save</Button>
      </>}>
      <div className="space-y-3">
        <label className="block"><span className="text-[10px] font-medium text-ink-500">Value ({f.unit})</span>
          <input className={`${inputCls} mt-1`} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Value" /></label>
        <label className="block"><span className="text-[10px] font-medium text-ink-500">Source of this value</span>
          <input className={`${inputCls} mt-1`} value={note} maxLength={500} placeholder="e.g. CEA CO₂ baseline database v20, FY 2024-25" onChange={(e) => setNote(e.target.value)} aria-label="Source" /></label>
        <p className="text-[10px] text-ink-500">Default source: {f.source}</p>
        {err && <p className="text-[10px] text-status-pending">{err}</p>}
      </div>
    </Modal>
  )
}
