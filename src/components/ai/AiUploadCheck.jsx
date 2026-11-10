import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useAiReview, useAiStatus } from '../../hooks/useAi.js'
import AiAnswer from './AiAnswer.jsx'

/**
 * Review Center → a data sheet upload → "Check with AI": the model reads the upload's summary and its
 * "If you approve" figures and flags anything unusual (10× / 1000× jumps, missing months, zeros…). Advice for
 * the reviewer only; it never approves or changes anything (backend: POST /ai/review).
 */
export default function AiUploadCheck({ ds, v }) {
  const status = useAiStatus()
  const m = useAiReview()
  if (!status.data?.enabled) return null
  const a = m.data
  const warn = a && /ask the uploader/i.test(a.text)
  const tone = !a ? { border: '#26890D40', bg: 'linear-gradient(110deg, #ecfdf5 0%, #ffffff 70%)' }
    : warn ? { border: '#f59e0b80', bg: 'linear-gradient(110deg, #fffbeb 0%, #ffffff 70%)' }
      : { border: '#26890D66', bg: 'linear-gradient(110deg, #ecfdf5 0%, #ffffff 70%)' }
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: tone.border, background: tone.bg }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-900">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #26890D, #0f9f8f)' }}>
              <Sparkles size={13} className="text-white" aria-hidden="true" />
            </span>
            AI check
          </p>
          <p className="text-[10px] text-ink-500 mt-1">VISTA AI looks for unusual jumps, unit mistakes, missing months and zeros. You still decide.</p>
        </div>
        {!m.isPending && (
          <button type="button" onClick={() => m.mutate({ ds, v })}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-[11px] font-medium shadow-sm"
            style={{ background: 'linear-gradient(120deg, #26890D, #0f9f8f)' }}>
            {a ? <><RefreshCw size={12} /> Check again</> : <><Sparkles size={12} /> Check this upload</>}
          </button>
        )}
      </div>
      {m.isPending && <p className="mt-3 flex items-center gap-2 text-[11px] text-ink-500"><Loader2 size={13} className="animate-spin text-brand-green" /> Reading the upload…</p>}
      {m.isError && <p className="mt-3 text-[11px] text-status-pending">{m.error?.message || 'The AI check failed.'}</p>}
      {a && !m.isPending && <div className="mt-3"><AiAnswer answer={a} source="this upload's figures" accent={warn ? '#b45309' : '#26890D'} /></div>}
    </div>
  )
}
