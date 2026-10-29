import { useMemo, useState } from 'react'
import { Database, Info, Loader2, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { Button, EmptyState } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useCreateTarget, useDeleteTarget, useTargets, useUpdateTarget } from '../../hooks/useAdmin.js'
import { getMetricValue } from '../../api/admin.js'
import { Modal } from '../surveys/parts.jsx'
import { inputCls } from '../surveys/util.js'
import { Chip } from './parts.jsx'

const STATUS = {
  on_track: { label: 'On track', badge: 'bg-brand-green/15 text-brand-greenDark', bar: '#64BC44' },
  achieved: { label: 'Achieved', badge: 'bg-brand-green/15 text-brand-greenDark', bar: '#4A9038' },
  at_risk: { label: 'At risk', badge: 'bg-amber-100 text-amber-800', bar: '#F59E0B' },
  missed: { label: 'Missed', badge: 'bg-red-100 text-red-700', bar: '#D03B3B' },
  partial: { label: 'Partial year', badge: 'bg-blue-50 text-blue-700', bar: '#C9C8C3' },
  no_data: { label: 'No data yet', badge: 'bg-ink-100 text-ink-500', bar: '#C9C8C3' },
}

function currentFY() {
  const d = new Date()
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return `${y}-${String(y + 1).slice(-2)}`
}
const fyLabel = (y) => `${y}-${String(y + 1).slice(-2)}`
const fyYear = (fy) => Number(String(fy).slice(0, 4))
function fyRange(from, to) {
  const out = []
  for (let y = from; y <= to; y += 1) out.push(fyLabel(y))
  return out
}

function fmtNum(v, unit) {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  const digits = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2
  const s = n.toLocaleString(undefined, { maximumFractionDigits: digits })
  return unit === '%' ? `${s}%` : unit ? `${s} ${unit}` : s
}

export default function TargetsTab({ companyId, canManage, toast }) {
  // No year chosen yet: the server opens on the latest complete year of approved data
  const [picked, setPicked] = useState(null)
  const [edit, setEdit] = useState(null)
  const q = useTargets(picked, companyId)
  const years = fyRange(fyYear(currentFY()) - 5, fyYear(currentFY()) + 1)

  if (q.isLoading) return <LoadingState label="Loading targets…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load targets.'} onRetry={() => q.refetch()} />
  const d = q.data
  const fy = d.fy
  const setFy = setPicked

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <p className="text-[11px] text-ink-500">Annual ESG targets — progress for</p>
        <select className={`${inputCls} !w-auto !py-1.5`} value={fy} onChange={(e) => setFy(e.target.value)} aria-label="Financial year">
          {years.map((y) => <option key={y} value={y}>FY {y}</option>)}
        </select>
        <div className="flex gap-2">
          {d.summary.on_track > 0 && <Chip label="on track" value={d.summary.on_track} tone="green" />}
          {d.summary.achieved > 0 && <Chip label="achieved" value={d.summary.achieved} tone="green" />}
          {d.summary.at_risk > 0 && <Chip label="at risk" value={d.summary.at_risk} tone="amber" />}
          {d.summary.missed > 0 && <Chip label="missed" value={d.summary.missed} tone="red" />}
          {d.summary.partial > 0 && <Chip label="partial year" value={d.summary.partial} tone="blue" />}
          {d.summary.no_data > 0 && <Chip label="no data" value={d.summary.no_data} />}
        </div>
        {canManage && <Button size="sm" className="ml-auto" onClick={() => setEdit({})}><Plus size={13} /> Add target</Button>}
      </div>

      {d.items.length === 0 ? (
        <EmptyState icon={Target} title="No targets yet"
          subtitle="Set goals such as cutting energy use or raising the renewable share. Progress is worked out from your approved data sheets."
          action={canManage ? <Button size="sm" onClick={() => setEdit({})}><Plus size={13} /> Add the first target</Button> : null} />
      ) : (
        <div className="space-y-3">{d.items.map((t) => <TargetCard key={t.id} t={t} onEdit={canManage ? () => setEdit(t) : null} />)}</div>
      )}
      <p className="flex items-start gap-1.5 text-[10px] text-ink-500 mt-4">
        <Info size={12} className="shrink-0 mt-px" />
        Status compares progress with a straight-line path from the baseline to the target year: on track means at most 5 points behind where you’d expect to be by this year.
      </p>

      {edit && <TargetModal t={edit.id ? edit : null} catalog={d.catalog} fy={fy} companyId={companyId}
        onClose={() => setEdit(null)} toast={toast} />}
    </div>
  )
}

function TargetCard({ t, onEdit }) {
  const s = STATUS[t.status]
  const label = t.status === 'partial' ? `Partial year · ${t.months} of 12 months` : s.label
  const pct = t.progress === null ? 0 : Math.max(0, Math.min(100, t.progress))
  return (
    <div className="bg-surface-muted/60 border border-surface-border rounded-lg px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-ink-900">{t.title}</p>
          <p className="text-[10px] text-ink-500 mt-0.5">
            {t.direction === 'reduce' ? 'Reduce' : 'Increase'} from {fmtNum(t.baseline_value, t.unit)} in FY {t.baseline_fy} to {fmtNum(t.target_value, t.unit)} by FY {t.target_fy}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.badge}`}>{label}</span>
          {onEdit && <button type="button" onClick={onEdit} className="p-1 text-ink-500 hover:text-ink-900" aria-label={`Edit ${t.title}`}><Pencil size={13} /></button>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <Stat label="Target" value={fmtNum(t.target_value, t.unit)} sub={`by FY ${t.target_fy}`} />
        <Stat label={`Current (FY ${t.fy})`} value={fmtNum(t.current, t.unit)}
          sub={t.current_source === 'manual' ? 'typed in' : t.current_source === 'data_sheets'
            ? (t.months && t.months < 12 ? `approved data sheets · ${t.months} of 12 months` : 'from approved data sheets') : 'no figure for this year'} />
        <Stat label="Progress" value={t.progress === null ? '—' : `${Math.round(t.progress)}%`}
          sub={t.status === 'partial' ? 'shown once the year is complete' : `expected ${Math.round(t.expected)}% by now`} />
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-white border border-surface-border" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
        aria-label={`${t.title}: ${t.progress ?? 0}% of the planned change`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.bar }} />
        <span className="absolute -top-1 w-0.5 h-4 bg-ink-700" style={{ left: `calc(${t.expected}% - 1px)` }} title={`Expected by FY ${t.fy}: ${Math.round(t.expected)}%`} />
      </div>
      {t.history.length > 1 && <History t={t} />}
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <p className="text-[9px] text-ink-500">{label}</p>
      <p className="text-[13px] font-semibold text-ink-900 tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-ink-300">{sub}</p>}
    </div>
  )
}

/** Yearly figures as a small line with the target level dashed. */
function History({ t }) {
  const all = t.history.filter((h) => h.value !== null)
  const pts = all.filter((h) => !h.partial)
  const part = all.filter((h) => h.partial)
  if (all.length < 2) return null
  const W = 260
  const H = 36
  const vals = [...all.map((p) => p.value), t.target_value]
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const y = (v) => (hi === lo ? H / 2 : H - 4 - ((v - lo) / (hi - lo)) * (H - 8))
  const x = (i) => 6 + (i * (W - 12)) / (t.history.length - 1)
  const idx = (fy) => t.history.findIndex((h) => h.fy === fy)
  const path = pts.length < 2 ? '' : pts.map((p, i) => `${i ? 'L' : 'M'}${x(idx(p.fy)).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  return (
    <div className="flex items-center gap-3 mt-2">
      <svg width={W} height={H} role="img" aria-label={`Yearly figures: ${pts.map((p) => `FY ${p.fy} ${fmtNum(p.value, t.unit)}`).join(', ')}`}>
        <line x1={0} x2={W} y1={y(t.target_value)} y2={y(t.target_value)} stroke="#A3A3A3" strokeDasharray="3 3" strokeWidth={1} />
        <path d={path} fill="none" stroke="#4A9038" strokeWidth={2} />
        {pts.map((p) => <circle key={p.fy} cx={x(idx(p.fy))} cy={y(p.value)} r={3} fill="#4A9038" stroke="#fff" strokeWidth={1.5}><title>{`FY ${p.fy}: ${fmtNum(p.value, t.unit)}${p.source === 'manual' ? ' (typed)' : ''}`}</title></circle>)}
        {part.map((p) => <circle key={p.fy} cx={x(idx(p.fy))} cy={y(p.value)} r={3} fill="#fff" stroke="#A3A3A3" strokeWidth={1.5}><title>{`FY ${p.fy}: ${fmtNum(p.value, t.unit)} — part of the year only`}</title></circle>)}
      </svg>
      <span className="text-[9px] text-ink-500">FY {t.history[0].fy} – {t.history[t.history.length - 1].fy} · dashed line = target{part.length ? ' · hollow = part of the year' : ''}</span>
    </div>
  )
}

function Lbl({ children }) {
  return <span className="block text-[10px] font-medium text-ink-700 mb-1">{children}</span>
}

function TargetModal({ t, catalog, fy, companyId, onClose, toast }) {
  const create = useCreateTarget(fy, companyId)
  const update = useUpdateTarget(fy, companyId)
  const del = useDeleteTarget(companyId)
  const cur = fyYear(currentFY())
  const [f, setF] = useState(() => t ? {
    metric: t.metric, title: t.title, unit: t.unit, direction: t.direction, baseline_fy: t.baseline_fy,
    baseline_value: String(t.baseline_value), target_fy: t.target_fy, target_value: String(t.target_value),
    manual_values: Object.fromEntries(Object.entries(t.manual_values || {}).map(([k, v]) => [k, String(v)])), notes: t.notes || '',
  } : { metric: 'energy_total', title: '', unit: '', direction: 'reduce', baseline_fy: fyLabel(cur - 1), baseline_value: '',
    target_fy: fyLabel(cur + 4), target_value: '', manual_values: {}, notes: '' })
  const [err, setErr] = useState(null)
  const [fetching, setFetching] = useState(false)
  const meta = catalog.find((c) => c.key === f.metric) || catalog[0]
  const manual = meta.source === 'manual'
  const groups = useMemo(() => [...new Set(catalog.map((c) => c.group))], [catalog])
  const unit = f.metric === 'custom' ? f.unit : meta.unit
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const years = fyRange(fyYear(f.baseline_fy) + 1, Math.min(fyYear(f.target_fy), cur + 1))

  const pickMetric = (key) => {
    const m = catalog.find((c) => c.key === key)
    setF((p) => ({ ...p, metric: key, direction: m.direction, title: '', unit: key === 'custom' ? p.unit : '' }))
  }
  const fill = async () => {
    setFetching(true); setErr(null)
    try {
      const r = await getMetricValue(f.metric, f.baseline_fy, companyId)
      if (r.value === null) setErr(`No approved data-sheet figure for FY ${f.baseline_fy} yet — type the baseline instead.`)
      else setF((p) => ({ ...p, baseline_value: String(Math.round(r.value * 100) / 100) }))
    } catch (e) { setErr(e.message) } finally { setFetching(false) }
  }
  const save = async () => {
    setErr(null)
    const body = { metric: f.metric, title: f.title || undefined, unit: f.metric === 'custom' ? f.unit : undefined,
      direction: f.direction, baseline_fy: f.baseline_fy, baseline_value: Number(f.baseline_value), target_fy: f.target_fy,
      target_value: Number(f.target_value), notes: f.notes,
      manual_values: Object.fromEntries(Object.entries(f.manual_values).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])) }
    try {
      if (t) await update.mutateAsync({ id: t.id, body })
      else await create.mutateAsync(body)
      toast(t ? 'Target saved' : 'Target added')
      onClose()
    } catch (e) { setErr(e.message || 'Could not save') }
  }
  const remove = async () => {
    if (!window.confirm(`Remove the target “${t.title}”?`)) return
    try { await del.mutateAsync(t.id); toast('Target removed'); onClose() } catch (e) { setErr(e.message) }
  }
  const busy = create.isPending || update.isPending

  return (
    <Modal title={t ? `Edit ${t.title}` : 'Add a target'} onClose={onClose} wide
      footer={<>
        {t && <Button size="sm" variant="ghost" className="mr-auto !text-status-pending" onClick={remove}><Trash2 size={12} /> Remove</Button>}
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={busy || f.baseline_value === '' || f.target_value === '' || (f.metric === 'custom' && (!f.title || !f.unit))}>
          {busy && <Loader2 size={13} className="animate-spin" />} {t ? 'Save' : 'Add target'}</Button></>}>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Lbl>Figure</Lbl>
          <select className={inputCls} value={f.metric} onChange={(e) => pickMetric(e.target.value)} disabled={!!t}>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {catalog.filter((c) => c.group === g).map((c) => <option key={c.key} value={c.key}>{c.label}{c.unit ? ` (${c.unit})` : ''}</option>)}
              </optgroup>
            ))}
          </select>
          <p className="text-[10px] text-ink-500 mt-1 flex items-start gap-1">
            {manual ? <><Info size={11} className="shrink-0 mt-px" />{meta.note || 'Typed in: enter each year’s figure below.'}</>
              : <><Database size={11} className="shrink-0 mt-px" />Worked out from your approved data sheets, the same way as the BRSR.</>}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Lbl>Name {f.metric !== 'custom' && <span className="font-normal text-ink-300">optional</span>}</Lbl>
            <input className={inputCls} value={f.title} onChange={set('title')} placeholder={meta.key === 'custom' ? 'e.g. Paper use' : meta.label} maxLength={120} /></div>
          <div><Lbl>Unit</Lbl>
            {f.metric === 'custom' ? <input className={inputCls} value={f.unit} onChange={set('unit')} placeholder="e.g. reams" maxLength={40} />
              : <input className={inputCls} value={unit} disabled />}</div>
        </div>
        <div>
          <Lbl>Goal</Lbl>
          <div className="flex gap-2">
            {['reduce', 'increase'].map((d) => (
              <button key={d} type="button" onClick={() => setF((p) => ({ ...p, direction: d }))}
                className={`px-3 py-1.5 rounded-md border text-[11px] ${f.direction === d ? 'border-brand-green bg-brand-green/10 text-brand-greenDark' : 'border-surface-border text-ink-700'}`}>
                {d === 'reduce' ? 'Reduce it' : 'Increase it'}</button>
            ))}
          </div>
        </div>
        <div />
        <div className="grid grid-cols-2 gap-3">
          <div><Lbl>Baseline year</Lbl>
            <select className={inputCls} value={f.baseline_fy} onChange={set('baseline_fy')}>
              {fyRange(cur - 8, cur).map((y) => <option key={y} value={y}>FY {y}</option>)}</select></div>
          <div><Lbl>Baseline value</Lbl>
            <input className={inputCls} type="number" step="any" value={f.baseline_value} onChange={set('baseline_value')} />
            {!manual && <button type="button" className="text-[10px] text-brand-greenDark hover:underline mt-1" onClick={fill} disabled={fetching}>
              {fetching ? 'Looking…' : 'Use the data-sheet figure'}</button>}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Lbl>Target year</Lbl>
            <select className={inputCls} value={f.target_fy} onChange={set('target_fy')}>
              {fyRange(fyYear(f.baseline_fy) + 1, cur + 15).map((y) => <option key={y} value={y}>FY {y}</option>)}</select></div>
          <div><Lbl>Target value</Lbl><input className={inputCls} type="number" step="any" value={f.target_value} onChange={set('target_value')} /></div>
        </div>
        <div className="md:col-span-2">
          <Lbl>{manual ? 'Yearly figures' : 'Corrections'} <span className="font-normal text-ink-300">{manual ? 'type each year’s value' : 'optional — a typed value replaces the data-sheet figure for that year'}</span></Lbl>
          {years.length === 0 ? <p className="text-[10px] text-ink-300">No years between the baseline and now.</p> : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {years.map((y) => (
                <label key={y} className="text-[10px] text-ink-500">FY {y}
                  <input className={`${inputCls} mt-0.5`} type="number" step="any" value={f.manual_values[y] ?? ''}
                    onChange={(e) => setF((p) => ({ ...p, manual_values: { ...p.manual_values, [y]: e.target.value } }))} />
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2"><Lbl>Notes <span className="font-normal text-ink-300">optional</span></Lbl>
          <textarea className={inputCls} rows={2} value={f.notes} onChange={set('notes')} maxLength={1000} placeholder="Approved by the board on…, scope, assumptions" /></div>
      </div>
      {err && <p className="text-[11px] text-status-pending mt-3" role="alert">{err}</p>}
    </Modal>
  )
}
