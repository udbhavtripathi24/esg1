import { useRef, useState } from 'react'
import { errMessage, fmtDate, fmtBytes, EVIDENCE_ACCEPT } from './format.js'
import { FileText, FileSpreadsheet, Image as ImageIcon, Download, Trash2, Paperclip, Loader2, Lock } from 'lucide-react'

const CHIP = {
  // engagement
  planning: ['Planning', 'bg-ink-100 text-ink-700'],
  fieldwork: ['Fieldwork', 'bg-status-review/10 text-status-review'],
  signed: ['Signed', 'bg-status-approved/10 text-status-approved'],
  withdrawn: ['Withdrawn', 'bg-ink-100 text-ink-500'],
  superseded: ['Superseded', 'bg-ink-100 text-ink-500'],
  // requests
  open: ['Open', 'bg-status-pending/10 text-status-pending'],
  responded: ['Awaiting assurer', 'bg-status-review/10 text-status-review'],
  accepted: ['Accepted', 'bg-status-approved/10 text-status-approved'],
  // findings
  corrected: ['Corrected', 'bg-status-approved/10 text-status-approved'],
  uncorrected: ['Not corrected', 'bg-amber-100 text-amber-700'],
  // workpapers
  prepared: ['Awaiting review', 'bg-status-review/10 text-status-review'],
  reviewed: ['Reviewed', 'bg-status-approved/10 text-status-approved'],
  outdated: ['Test again', 'bg-amber-100 text-amber-700'],
}

export function Chip({ status, label }) {
  const [text, cls] = CHIP[status] || [status, 'bg-ink-100 text-ink-700']
  return <span className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${cls}`}>{label || text}</span>
}

function KindIcon({ mime }) {
  if (mime?.startsWith('image/')) return <ImageIcon size={13} className="text-ink-500 shrink-0" />
  if (mime?.includes('sheet') || mime?.includes('excel') || mime === 'text/csv') {
    return <FileSpreadsheet size={13} className="text-status-approved shrink-0" />
  }
  return <FileText size={13} className="text-ink-500 shrink-0" />
}

/** Evidence files with who/when, checksum and download. */
export function EvidenceList({ files, onDownload, onWithdraw, canWithdraw, showQuestion = true, empty = 'No evidence attached.' }) {
  const [busy, setBusy] = useState(null)
  if (!files?.length) return <p className="text-[10px] text-ink-300">{empty}</p>
  return (
    <ul className="divide-y divide-surface-border border border-surface-border rounded-md">
      {files.map((f) => (
        <li key={f.public_id} className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] min-w-0">
          <KindIcon mime={f.mime_type} />
          <div className="min-w-0 flex-1">
            <p className="text-ink-900 truncate" title={f.filename}>
              {f.filename}
              {showQuestion && f.question_id && <span className="ml-1.5 text-[9px] text-brand-greenDark bg-brand-green/10 rounded px-1">{f.question_id}</span>}
              {f.for_assurance_request && <span className="ml-1.5 text-[9px] text-status-review">for assurance</span>}
            </p>
            <p className="text-[9px] text-ink-500 truncate">
              {f.uploaded_by} · {fmtDate(f.uploaded_at, true)} · {fmtBytes(f.size_bytes)}
              <span className="text-ink-300" title={`SHA-256 ${f.sha256}`}> · {f.sha256?.slice(0, 10)}…</span>
            </p>
          </div>
          <button type="button" title="Download" aria-label={`Download ${f.filename}`}
            className="text-ink-500 hover:text-ink-900 p-1" disabled={busy === f.public_id}
            onClick={async () => { setBusy(f.public_id); try { await onDownload(f) } finally { setBusy(null) } }}>
            {busy === f.public_id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          </button>
          {onWithdraw && canWithdraw?.(f) && (
            <button type="button" title="Withdraw this file" aria-label={`Withdraw ${f.filename}`}
              className="text-ink-300 hover:text-status-pending p-1" onClick={() => onWithdraw(f)}>
              <Trash2 size={12} />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Picks a file (and optionally the question it supports) and uploads it. */
export function EvidenceUploader({ onUpload, questions, disabled, label = 'Attach evidence', compact = false }) {
  const inputRef = useRef(null)
  const [questionId, setQuestionId] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    if (file.size > 25 * 1024 * 1024) { setError('Files are limited to 25 MB.'); return }
    setBusy(true)
    try {
      await onUpload({ file, questionId: questionId || undefined })
    } catch (err) {
      setError(errMessage(err, 'Upload failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={compact ? '' : 'space-y-1'}>
      <div className="flex flex-wrap items-center gap-2">
        {questions?.length > 0 && (
          <select value={questionId} onChange={(e) => setQuestionId(e.target.value)} disabled={disabled || busy}
            aria-label="Question this evidence supports"
            className="px-2 py-1 rounded border border-surface-border bg-white text-[10px] text-ink-900 max-w-[260px]">
            <option value="">Whole section</option>
            {questions.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
          </select>
        )}
        <button type="button" disabled={disabled || busy} onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-green hover:text-brand-greenDark disabled:text-ink-300">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />} {busy ? 'Uploading…' : label}
        </button>
        <input ref={inputRef} type="file" accept={EVIDENCE_ACCEPT} className="hidden" onChange={pick} />
        {!compact && <span className="text-[9px] text-ink-300">PDF, Word, Excel, CSV, PNG or JPEG · up to 25 MB</span>}
      </div>
      {error && <p className="text-[10px] text-status-pending">{error}</p>}
    </div>
  )
}

function Who({ name, at }) {
  if (!name) return <span className="text-ink-300">–</span>
  return (
    <span>
      <span className="text-ink-900">{name}</span>
      <span className="block text-[9px] text-ink-500">{fmtDate(at)}</span>
    </span>
  )
}

/** Who prepared, submitted, reviewed, approved and assured each section. */
export function SignoffRegister({ rows }) {
  if (!rows?.length) return null
  return (
    <div className="overflow-x-auto border border-surface-border rounded-md">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="bg-surface-muted text-left text-ink-700">
            {['Section', 'Prepared by', 'Evidence', 'Submitted', 'Internal review', 'Approved (Deloitte)', 'Tested (assurance)', 'Workpaper review', 'Conclusion'].map((h) => (
              <th key={h} className="px-2 py-1.5 font-semibold border-b border-surface-border whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.section} className="border-b border-surface-border last:border-b-0 align-top">
              <td className="px-2 py-1.5"><span className="font-semibold text-ink-900">{r.section}</span><span className="block text-[9px] text-ink-500 max-w-[160px] truncate" title={r.title}>{r.title}</span></td>
              <td className="px-2 py-1.5 text-ink-900 max-w-[200px]">
                {r.prepared_by?.length ? r.prepared_by.join(', ') : !r.system_sources?.length && <span className="text-ink-300">–</span>}
                {r.system_sources?.map((x) => <span key={x} className="block text-[9px] text-ink-500">Platform: {x}</span>)}
              </td>
              <td className="px-2 py-1.5 tabular-nums text-ink-700">{r.evidence_files || 0}</td>
              <td className="px-2 py-1.5"><Who name={r.submitted_by} at={r.submitted_at} /></td>
              <td className="px-2 py-1.5"><Who name={r.internal_reviewed_by} at={r.internal_reviewed_at} /></td>
              <td className="px-2 py-1.5"><Who name={r.approved_by} at={r.approved_at} /></td>
              <td className="px-2 py-1.5"><Who name={r.tested_by} at={r.tested_at} /></td>
              <td className="px-2 py-1.5"><Who name={r.workpaper_reviewed_by} at={r.workpaper_reviewed_at} /></td>
              <td className="px-2 py-1.5">
                {r.conclusion === 'no_exceptions' ? <span className="text-status-approved">No exceptions</span>
                  : r.conclusion === 'exceptions' ? <span className="text-amber-700">Exceptions noted</span>
                    : <span className="text-ink-300">–</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LockedNote({ children }) {
  return <p className="flex items-center gap-1 text-[9px] text-ink-500"><Lock size={10} />{children}</p>
}

/** Page-level toast, fixed so it is visible on long pages (see useToast). */
export function Toast({ msg }) {
  if (!msg) return null
  return <div role="status" className="fixed bottom-5 right-5 z-50 bg-ink-900 text-white text-[11px] rounded-md px-4 py-2.5 shadow-lg max-w-sm">{msg}</div>
}
