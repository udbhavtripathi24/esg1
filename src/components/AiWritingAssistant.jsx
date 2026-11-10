import { useState } from 'react'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { useAiStatus, useAiWrite } from '../hooks/useAi.js'
import { AiCheck } from './ai/AiAnswer.jsx'

/**
 * "Improve with AI" on a written disclosure answer (backend: POST /ai/write). The model returns a
 * suggestion; the person compares it with their text and chooses "Use this" or "Discard" — nothing is
 * changed without them. It is told never to add facts or figures, and any figure that was not in the
 * original text is flagged.
 */
const AI_WRITING_OPTIONS = [
  { key: 'improve', label: 'Improve Writing', description: 'Fix grammar, spelling and sentence structure' },
  { key: 'rephrase', label: 'Rephrase', description: 'Clearer, structured and more professional' },
  { key: 'expand', label: 'Expand', description: 'Turn notes into a complete response' },
  { key: 'shorten', label: 'Shorten', description: 'Make the response more concise' },
]

export default function AiWritingAssistant({ pushToast, text = '', onApply, question, maxWords }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(null)
  const status = useAiStatus()
  const m = useAiWrite()
  const enabled = !!status.data?.enabled && !!onApply

  const choose = (opt) => {
    setOpen(false)
    if (!enabled) {
      pushToast?.(status.data?.enabled === false ? 'AI isn’t switched on for this workspace yet.' : `"${opt.label}" needs AI to be switched on.`)
      return
    }
    if (text.trim().length < 3) {
      pushToast?.('Write a few words first, then let AI improve them.')
      return
    }
    setMode(opt)
    m.reset()
    m.mutate({ text, mode: opt.key, question: question || undefined, max_words: maxWords || undefined })
  }
  const close = () => { setMode(null); m.reset() }

  return (
    <div className="relative inline-block">
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-brand-green/30 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-surface-border">
              <Sparkles size={13} className="text-brand-green" />
              <span className="text-xs font-semibold text-ink-900">AI Writing Assistant</span>
            </div>
            <div className="py-1.5">
              {AI_WRITING_OPTIONS.map((opt) => (
                <button key={opt.key} type="button" onClick={() => choose(opt)}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-muted/60 transition-colors">
                  <p className="text-xs font-semibold text-ink-900">{opt.label}</p>
                  <p className="text-[10px] text-ink-500 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-green/40 text-brand-green text-[11px] font-medium hover:bg-brand-green/5 transition-colors">
        <Sparkles size={12} /> Improve with AI
      </button>

      {mode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="AI suggestion">
          <div className="absolute inset-0 bg-ink-900/25" onClick={close} />
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 text-white" style={{ background: 'linear-gradient(120deg, #1f6f0b 0%, #26890D 45%, #0f9f8f 100%)' }}>
              <p className="flex items-center gap-2 text-[13px] font-semibold"><Sparkles size={15} /> {mode.label}</p>
              <button type="button" onClick={close} className="p-1 rounded hover:bg-white/15" aria-label="Close"><X size={15} /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 p-5 max-h-[65vh] overflow-y-auto">
              <div>
                <p className="text-[10px] font-medium text-ink-500 mb-1">Your text</p>
                <p className="text-[12px] text-ink-700 whitespace-pre-wrap bg-surface-muted/60 border border-surface-border rounded-lg p-3">{text}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-brand-greenDark mb-1">AI suggestion</p>
                {m.isPending ? (
                  <p className="flex items-center gap-2 text-[11px] text-ink-500 p-3"><Loader2 size={13} className="animate-spin text-brand-green" /> Writing…</p>
                ) : m.isError ? (
                  <p className="text-[11px] text-status-pending p-3">{m.error?.message || 'The AI request failed.'}</p>
                ) : m.data ? (
                  <div className="space-y-2">
                    <p className="text-[12px] text-ink-900 whitespace-pre-wrap bg-brand-green/5 border border-brand-green/25 rounded-lg p-3">{m.data.text}</p>
                    <AiCheck answer={m.data} source="your original text" />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-surface-border">
              <button type="button" onClick={close} className="text-[12px] px-3 py-1.5 rounded-md border border-surface-border hover:bg-surface-muted">Discard</button>
              <button type="button" disabled={!m.data || m.isPending}
                onClick={() => { onApply(m.data.text); pushToast?.('AI suggestion applied. Review it, then save.'); close() }}
                className="inline-flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-md text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(120deg, #26890D, #0f9f8f)' }}>
                <Check size={13} /> Use this
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
