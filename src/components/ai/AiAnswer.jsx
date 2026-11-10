import { AlertTriangle, BadgeCheck, Cpu } from 'lucide-react'
import Markdown from './Markdown.jsx'

/** The footer every AI answer carries: which model wrote it, and whether its figures are VISTA's. */
export function AiCheck({ answer, source = 'VISTA data' }) {
  const c = answer.check || { checked: 0, unmatched: [] }
  return (
    <div className="space-y-1.5">
      {c.unmatched.length === 0 ? (
        <p className="flex items-center gap-1.5 text-[10px] text-brand-greenDark">
          <BadgeCheck size={13} aria-hidden="true" />
          {c.checked > 0 ? `All ${c.checked} figure${c.checked === 1 ? '' : 's'} match ${source}` : `No figures to check`}
        </p>
      ) : (
        <p className="flex items-start gap-1.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          <AlertTriangle size={12} className="shrink-0 mt-px" aria-hidden="true" />
          <span>{c.unmatched.length} figure{c.unmatched.length === 1 ? ' is' : 's are'} not in {source} (the AI may have calculated or
            made {c.unmatched.length === 1 ? 'it' : 'them'} up): <strong>{c.unmatched.join(', ')}</strong>. Check before using.</span>
        </p>
      )}
      <p className="flex items-center gap-1 text-[9px] text-ink-300">
        <Cpu size={10} aria-hidden="true" /> {answer.label || answer.provider} · {answer.model} · AI-generated, review before use
      </p>
    </div>
  )
}

export default function AiAnswer({ answer, accent, source }) {
  return (
    <div className="space-y-3">
      <Markdown text={answer.text} accent={accent} />
      <div className="pt-2 border-t border-surface-border"><AiCheck answer={answer} source={source} /></div>
    </div>
  )
}
