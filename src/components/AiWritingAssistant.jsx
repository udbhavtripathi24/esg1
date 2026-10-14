import { useState } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * "Improve with AI" — approved design prototype. No model is connected:
 * choosing an option only says that it will apply once AI is enabled. It
 * never generates or changes text, so nothing fabricated can end up in a
 * disclosure.
 */
const AI_WRITING_OPTIONS = [
  { key: 'improve', label: 'Improve Writing', description: 'Fix grammar, spelling and sentence structure' },
  { key: 'rephrase', label: 'Rephrase', description: 'Clearer, structured and more professional' },
  { key: 'expand', label: 'Expand', description: 'Turn notes into a complete response' },
  { key: 'shorten', label: 'Shorten', description: 'Make the response more concise' },
]

export default function AiWritingAssistant({ pushToast }) {
  const [open, setOpen] = useState(false)

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
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    pushToast?.(`"${opt.label}" will apply once AI is enabled for this workspace.`)
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-surface-muted/60 transition-colors"
                >
                  <p className="text-xs font-semibold text-ink-900">{opt.label}</p>
                  <p className="text-[10px] text-ink-500 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-brand-green/40 text-brand-green text-[11px] font-medium hover:bg-brand-green/5 transition-colors"
      >
        <Sparkles size={12} /> Improve with AI
      </button>
    </div>
  )
}
