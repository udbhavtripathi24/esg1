import { useRef, useState } from 'react'
import { Check, FileUp, Loader2, Paperclip, X } from 'lucide-react'
import { OTHER } from './logic.js'

const box = 'w-full px-3 py-2.5 rounded-md border border-surface-border bg-white text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green disabled:bg-surface-muted'

function OptionRow({ type, selected, label, onClick, disabled, children }) {
  const round = type === 'radio'
  return (
    <div>
      <button type="button" disabled={disabled} onClick={onClick}
        className={`w-full flex items-center gap-3 text-left px-3.5 py-2.5 rounded-md border text-sm transition-colors ${
          selected ? 'border-brand-green bg-brand-green/5 text-ink-900' : 'border-surface-border bg-white text-ink-700 hover:border-ink-300'
        } disabled:cursor-default`}
        role={round ? 'radio' : 'checkbox'} aria-checked={selected}>
        <span className={`w-4 h-4 shrink-0 flex items-center justify-center border ${round ? 'rounded-full' : 'rounded'} ${
          selected ? 'border-brand-green bg-brand-green text-white' : 'border-ink-300 bg-white'}`}>
          {selected && (round ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : <Check size={11} strokeWidth={3} />)}
        </span>
        <span className="flex-1">{label}</span>
      </button>
      {children}
    </div>
  )
}

function OtherText({ q, answers, onAnswer, disabled }) {
  return (
    <input className={`${box} mt-2`} placeholder="Please specify" maxLength={500} disabled={disabled}
      value={answers[`${q.id}.other`] || ''} onChange={(e) => onAnswer(`${q.id}.other`, e.target.value)} />
  )
}

function Choice({ q, value, answers, onAnswer, disabled }) {
  const opts = q.options || []
  return (
    <div className="space-y-2" role="radiogroup">
      {opts.map((o) => (
        <OptionRow key={o.id} type="radio" label={o.label || '—'} selected={value === o.id} disabled={disabled}
          onClick={() => onAnswer(q.id, value === o.id && !q.required ? null : o.id)} />
      ))}
      {q.allow_other && (
        <OptionRow type="radio" label="Other" selected={value === OTHER} disabled={disabled}
          onClick={() => onAnswer(q.id, OTHER)}>
          {value === OTHER && <OtherText q={q} answers={answers} onAnswer={onAnswer} disabled={disabled} />}
        </OptionRow>
      )}
    </div>
  )
}

function Multi({ q, value, answers, onAnswer, disabled }) {
  const picked = Array.isArray(value) ? value : []
  const exclusive = new Set((q.options || []).filter((o) => o.exclusive).map((o) => o.id))
  const toggle = (id) => {
    let next
    if (picked.includes(id)) next = picked.filter((x) => x !== id)
    else if (exclusive.has(id)) next = [id]
    else next = [...picked.filter((x) => !exclusive.has(x)), id]
    onAnswer(q.id, next.length ? next : null)
  }
  const limit = q.max_select ? `Choose up to ${q.max_select}` : q.min_select ? `Choose at least ${q.min_select}` : 'Choose all that apply'
  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-500">{limit}</p>
      {(q.options || []).map((o) => (
        <OptionRow key={o.id} type="check" label={o.label || '—'} selected={picked.includes(o.id)} disabled={disabled}
          onClick={() => toggle(o.id)} />
      ))}
      {q.allow_other && (
        <OptionRow type="check" label="Other" selected={picked.includes(OTHER)} disabled={disabled} onClick={() => toggle(OTHER)}>
          {picked.includes(OTHER) && <OtherText q={q} answers={answers} onAnswer={onAnswer} disabled={disabled} />}
        </OptionRow>
      )}
    </div>
  )
}

function YesNo({ q, value, onAnswer, disabled }) {
  return (
    <div className="flex gap-3" role="radiogroup">
      {(q.options || []).map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} disabled={disabled}
          onClick={() => onAnswer(q.id, o.id)}
          className={`min-w-28 px-5 py-2.5 rounded-md border text-sm font-medium transition-colors ${
            value === o.id ? 'border-brand-green bg-brand-green text-white' : 'border-surface-border bg-white text-ink-700 hover:border-ink-300'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Scale({ q, value, onAnswer, disabled, nps }) {
  const lo = nps ? 0 : q.min ?? 1
  const hi = nps ? 10 : q.max ?? 5
  const values = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap" role="radiogroup">
        {values.map((v) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} disabled={disabled}
            onClick={() => onAnswer(q.id, value === v ? null : v)}
            className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${
              value === v ? 'border-brand-green bg-brand-green text-white' : 'border-surface-border bg-white text-ink-700 hover:border-ink-300'}`}>
            {v}
          </button>
        ))}
      </div>
      {(q.min_label || q.max_label) && (
        <div className="flex justify-between text-xs text-ink-500 mt-2" style={{ maxWidth: `${values.length * 46}px` }}>
          <span>{q.min_label}</span><span>{q.max_label}</span>
        </div>
      )}
    </div>
  )
}

function NumberInput({ q, value, onAnswer, disabled }) {
  const [draft, setDraft] = useState(value ?? '')
  const unit = q.type === 'percent' ? '%' : q.unit
  const commit = (raw) => {
    setDraft(raw)
    if (raw === '' || raw === '-') return onAnswer(q.id, null)
    const n = Number(raw)
    onAnswer(q.id, Number.isFinite(n) ? n : raw)
  }
  const hint = [q.min !== null && q.min !== undefined ? `min ${q.min}` : null, q.max !== null && q.max !== undefined ? `max ${q.max}` : null]
    .filter(Boolean).join(', ')
  return (
    <div className="flex items-center gap-2 max-w-xs">
      <input type="number" inputMode="decimal" className={box} value={draft} disabled={disabled}
        step={q.integer ? 1 : 'any'} min={q.min ?? undefined} max={q.max ?? undefined}
        onChange={(e) => commit(e.target.value)} placeholder={hint || undefined} />
      {unit && <span className="text-sm text-ink-500 shrink-0">{unit}</span>}
    </div>
  )
}

function Matrix({ q, value, onAnswer, disabled }) {
  const v = value && typeof value === 'object' ? value : {}
  const set = (rowId, colId) => {
    const next = { ...v, [rowId]: colId }
    onAnswer(q.id, next)
  }
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm border-separate border-spacing-y-1">
        <thead>
          <tr>
            <th className="text-left font-normal text-xs text-ink-500 px-1" />
            {q.columns.map((c) => (
              <th key={c.id} className="font-normal text-xs text-ink-500 px-1 pb-1 text-center align-bottom min-w-16">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.rows.map((r) => (
            <tr key={r.id} className="bg-surface-muted/60">
              <td className="px-3 py-2 text-ink-900 rounded-l-md">{r.label}</td>
              {q.columns.map((c, i) => {
                const on = v[r.id] === c.id
                return (
                  <td key={c.id} className={`text-center py-2 ${i === q.columns.length - 1 ? 'rounded-r-md' : ''}`}>
                    <button type="button" disabled={disabled} onClick={() => set(r.id, c.id)} aria-label={`${r.label}: ${c.label}`}
                      aria-pressed={on}
                      className={`w-5 h-5 rounded-full border inline-flex items-center justify-center ${on ? 'border-brand-green bg-brand-green' : 'border-ink-300 bg-white hover:border-ink-500'}`}>
                      {on && <span className="w-2 h-2 rounded-full bg-white" />}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Files({ q, value, files, onUpload, onRemoveFile, disabled }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const ids = Array.isArray(value) ? value : []
  const mine = ids.map((id) => files.find((f) => f.id === id) || { id, filename: 'Uploaded file' })
  const full = ids.length >= (q.max_files || 3)
  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setErr(null)
    setBusy(true)
    try { await onUpload(q.id, f) } catch (ex) { setErr(ex.message || 'Upload failed') } finally { setBusy(false) }
  }
  return (
    <div>
      <div className="space-y-1.5 mb-2">
        {mine.map((f) => (
          <div key={f.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-surface-border bg-white">
            <Paperclip size={14} className="text-ink-500 shrink-0" />
            <span className="flex-1 truncate">{f.filename}</span>
            {f.size_bytes ? <span className="text-xs text-ink-300">{Math.max(1, Math.round(f.size_bytes / 1024))} KB</span> : null}
            {!disabled && onRemoveFile && (
              <button type="button" onClick={() => onRemoveFile(f.id)} className="text-ink-300 hover:text-status-pending" aria-label={`Remove ${f.filename}`}>
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!disabled && !full && (
        <>
          <input ref={input} type="file" className="hidden" onChange={pick}
            accept=".pdf,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg" />
          <button type="button" onClick={() => input.current?.click()} disabled={busy || !onUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-dashed border-ink-300 text-sm text-ink-700 hover:border-brand-green hover:text-brand-greenDark disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
            {busy ? 'Uploading…' : 'Choose a file'}
          </button>
          <p className="text-xs text-ink-300 mt-1.5">PDF, Word, Excel, CSV or image · up to 25 MB · {q.max_files || 3} file{(q.max_files || 3) > 1 ? 's' : ''} at most</p>
        </>
      )}
      {!onUpload && !disabled && <p className="text-xs text-ink-300 mt-1">Files can't be uploaded in preview.</p>}
      {err && <p className="text-xs text-status-pending mt-1">{err}</p>}
    </div>
  )
}

export default function QuestionInput({ q, value, answers, onAnswer, files = [], onUpload, onRemoveFile, disabled }) {
  switch (q.type) {
    case 'single_choice': return <Choice q={q} value={value} answers={answers} onAnswer={onAnswer} disabled={disabled} />
    case 'multi_choice': return <Multi q={q} value={value} answers={answers} onAnswer={onAnswer} disabled={disabled} />
    case 'dropdown':
      return (
        <select className={`${box} max-w-md`} value={value || ''} disabled={disabled}
          onChange={(e) => onAnswer(q.id, e.target.value || null)}>
          <option value="">Choose…</option>
          {(q.options || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      )
    case 'yes_no': return <YesNo q={q} value={value} onAnswer={onAnswer} disabled={disabled} />
    case 'scale': return <Scale q={q} value={value} onAnswer={onAnswer} disabled={disabled} />
    case 'nps': return <Scale q={q} value={value} onAnswer={onAnswer} disabled={disabled} nps />
    case 'number':
    case 'percent': return <NumberInput q={q} value={value} onAnswer={onAnswer} disabled={disabled} />
    case 'date':
      return <input type="date" className={`${box} max-w-xs`} value={value || ''} disabled={disabled}
        onChange={(e) => onAnswer(q.id, e.target.value || null)} />
    case 'short_text':
      return <input className={box} value={value || ''} maxLength={q.max_length || 500} placeholder={q.placeholder || ''}
        disabled={disabled} onChange={(e) => onAnswer(q.id, e.target.value)} />
    case 'long_text':
      return (
        <div>
          <textarea className={`${box} min-h-28`} value={value || ''} maxLength={q.max_length || 10000}
            placeholder={q.placeholder || ''} disabled={disabled} onChange={(e) => onAnswer(q.id, e.target.value)} />
          {(value || '').length > (q.max_length || 10000) * 0.8 && (
            <p className="text-xs text-ink-300 text-right">{(value || '').length} / {q.max_length || 10000}</p>
          )}
        </div>
      )
    case 'matrix': return <Matrix q={q} value={value} onAnswer={onAnswer} disabled={disabled} />
    case 'file': return <Files q={q} value={value} files={files} onUpload={onUpload} onRemoveFile={onRemoveFile} disabled={disabled} />
    default: return null
  }
}
