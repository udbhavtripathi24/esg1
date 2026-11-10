import { useEffect, useRef, useState } from 'react'
import { Copy, Loader2, MapPin, MessageSquare, RefreshCw, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useAiAnalyze, useAiAsk, useAiStatus } from '../../hooks/useAi.js'
import { themeOf } from '../analytics/viz.js'
import AiAnswer, { AiCheck } from './AiAnswer.jsx'
import Markdown from './Markdown.jsx'

const FOCUS_LABEL = { energy: 'Energy', emissions: 'GHG emissions', water: 'Water', waste: 'Waste', people: 'Workforce', safety: 'Health & safety' }
const SUGGESTIONS = [
  'Which location has the highest emissions, and by how much?',
  'What improved most compared with last year?',
  'Where should we focus to cut Scope 2 emissions?',
  'Which data sheets are missing this year?',
]
const errText = (e) => e?.message || 'The AI request failed.'

/**
 * VISTA AI side panel (Analytics → Analyze with AI): an executive summary of the year, and questions about
 * the company's own data. Answers come only from VISTA's computed figures, and every figure is checked
 * (backend: app/ai). `context` = {fy, location, domain} from the Performance view.
 */
export default function AiDrawer({ open, onClose, context = {}, companyId = null }) {
  const status = useAiStatus()
  const [tab, setTab] = useState('summary')
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const s = status.data
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="VISTA AI">
      <div className="absolute inset-0 bg-ink-900/20 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl flex flex-col">
        <header className="relative overflow-hidden px-5 pt-5 pb-4 text-white" style={{ background: 'linear-gradient(120deg, #1f6f0b 0%, #26890D 45%, #0f9f8f 100%)' }}>
          <Sparkles size={120} strokeWidth={1} className="absolute -right-6 -top-6 opacity-15" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-[15px] font-semibold"><Sparkles size={17} aria-hidden="true" /> VISTA AI</p>
              <p className="text-[11px] text-white/85 mt-0.5">Answers from your approved ESG data, with every figure checked.</p>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/15" aria-label="Close"><X size={16} /></button>
          </div>
          <div className="relative flex flex-wrap gap-1.5 mt-3">
            {context.fy && <Chip>FY {context.fy}</Chip>}
            <Chip><MapPin size={10} className="inline -mt-px mr-0.5" />{context.location || 'All locations'}</Chip>
            {s?.enabled && <Chip>{s.local ? <><ShieldCheck size={10} className="inline -mt-px mr-0.5" />On this machine</> : s.label} · {s.model}</Chip>}
          </div>
        </header>

        {status.isLoading ? (
          <div className="p-6 text-[12px] text-ink-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Checking AI…</div>
        ) : !s?.enabled ? (
          <Disabled problem={s?.problem} />
        ) : (
          <>
            <div className="flex border-b border-surface-border px-5" role="tablist">
              {[['summary', 'Summary', Sparkles], ['ask', 'Ask VISTA', MessageSquare]].map(([k, label, Icon]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] border-b-2 -mb-px ${tab === k ? 'border-brand-green text-brand-greenDark font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
                  <Icon size={13} aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {tab === 'summary' ? <Summary context={context} companyId={companyId} /> : <Ask context={context} companyId={companyId} />}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function Chip({ children }) {
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/18 border border-white/25 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.16)' }}>{children}</span>
}

function Disabled({ problem }) {
  return (
    <div className="p-5 space-y-3 text-[12px] text-ink-700">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="font-semibold text-ink-900 mb-1">AI isn&apos;t switched on for this workspace</p>
        <p className="text-[11px]">{problem ? `${problem}.` : 'No AI provider is set.'} An administrator sets it in the backend&apos;s <code className="bg-white px-1 rounded">.env</code>:</p>
        <pre className="mt-2 text-[10px] bg-white border border-amber-200 rounded p-2 overflow-x-auto">AI_PROVIDER=groq{'\n'}AI_API_KEY=…</pre>
        <p className="text-[10px] text-ink-500 mt-2">Then restart the API. Options: groq, gemini, ollama (runs on the machine, no key), openrouter.</p>
      </div>
    </div>
  )
}

function Thinking({ label }) {
  return (
    <div className="space-y-2.5" aria-live="polite">
      <p className="flex items-center gap-2 text-[11px] text-ink-500"><Loader2 size={13} className="animate-spin text-brand-green" /> {label}</p>
      {[92, 80, 86, 60].map((w, i) => <div key={i} className="h-2.5 rounded bg-gradient-to-r from-surface-muted via-brand-green/10 to-surface-muted animate-pulse" style={{ width: `${w}%` }} />)}
    </div>
  )
}

function Summary({ context, companyId }) {
  const m = useAiAnalyze(companyId)
  const t = themeOf(context.domain)
  const [copied, setCopied] = useState(false)
  const run = () => m.mutate({ fy: context.fy, location: context.location || null, focus: context.domain || null })
  const answer = m.data
  const stale = answer && (answer.fy !== context.fy || (answer.location || '') !== (context.location || '') || answer.focus !== (context.domain || null))
  return (
    <div className="p-5 space-y-4">
      {!answer && !m.isPending && (
        <div className="rounded-xl border p-5 text-center" style={{ borderColor: `${t.accent}55`, background: `linear-gradient(160deg, ${t.soft} 0%, #ffffff 75%)` }}>
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow mb-3" style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.deep})` }}>
            <Sparkles size={22} className="text-white" aria-hidden="true" />
          </div>
          <p className="text-[13px] font-semibold text-ink-900">Executive summary</p>
          <p className="text-[11px] text-ink-500 mt-1 mb-4">Highlights, watch-outs and recommended actions for FY {context.fy}
            {context.location ? ` at ${context.location}` : ''}{context.domain ? `, focused on ${FOCUS_LABEL[context.domain]}` : ''}.</p>
          <button type="button" onClick={run} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[12px] font-medium shadow hover:opacity-95"
            style={{ background: 'linear-gradient(120deg, #26890D, #0f9f8f)' }}>
            <Sparkles size={14} /> Generate summary
          </button>
        </div>
      )}
      {m.isPending && <Thinking label="Reading your KPIs and writing the summary…" />}
      {m.isError && <p className="text-[11px] text-status-pending bg-red-50 border border-red-100 rounded p-3">{errText(m.error)}</p>}
      {answer && !m.isPending && (
        <>
          {stale && <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">The filters changed since this summary. Regenerate to match them.</p>}
          <AiAnswer answer={answer} accent={t.deep} />
          <div className="flex gap-2">
            <button type="button" onClick={run} className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md border border-surface-border hover:bg-surface-muted"><RefreshCw size={12} /> Regenerate</button>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(answer.text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md border border-surface-border hover:bg-surface-muted"><Copy size={12} /> {copied ? 'Copied' : 'Copy'}</button>
          </div>
        </>
      )}
    </div>
  )
}

function Ask({ context, companyId }) {
  const m = useAiAsk(companyId)
  const [messages, setMessages] = useState([])
  const [q, setQ] = useState('')
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, m.isPending])
  const send = async (text) => {
    const question = (text ?? q).trim()
    if (question.length < 2 || m.isPending) return
    setQ('')
    const history = messages.filter((x) => !x.error).map((x) => ({ role: x.role, content: x.text }))
    setMessages((xs) => [...xs, { role: 'user', text: question }])
    try {
      const a = await m.mutateAsync({ question, history, fy: context.fy, location: context.location || null })
      setMessages((xs) => [...xs, { role: 'assistant', text: a.text, answer: a }])
    } catch (e) {
      setMessages((xs) => [...xs, { role: 'assistant', text: errText(e), error: true }])
    }
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-5 space-y-3">
        {messages.length === 0 && (
          <div>
            <p className="text-[12px] text-ink-700 mb-2">Ask about FY {context.fy}{context.location ? ` at ${context.location}` : ''}. For example:</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}
                  className="text-left text-[11px] px-3 py-2 rounded-lg border border-brand-green/25 bg-brand-green/5 hover:bg-brand-green/10 text-ink-900">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((x, i) => (x.role === 'user' ? (
          <div key={i} className="flex justify-end"><p className="max-w-[85%] text-[12px] text-white rounded-2xl rounded-br-sm px-3 py-2" style={{ background: 'linear-gradient(120deg, #26890D, #0f9f8f)' }}>{x.text}</p></div>
        ) : (
          <div key={i} className={`max-w-[95%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 border ${x.error ? 'bg-red-50 border-red-100 text-status-pending text-[11px]' : 'bg-surface-muted/60 border-surface-border'}`}>
            {x.error ? x.text : <><Markdown text={x.text} /><div className="mt-2 pt-1.5 border-t border-surface-border"><AiCheck answer={x.answer} /></div></>}
          </div>
        )))}
        {m.isPending && <div className="max-w-[60%]"><Thinking label="Thinking…" /></div>}
        <div ref={end} />
      </div>
      <form className="sticky bottom-0 bg-white border-t border-surface-border p-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} placeholder="Ask about your ESG data…" aria-label="Question"
          className="flex-1 border border-surface-border rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-brand-green" />
        <button type="submit" disabled={m.isPending || q.trim().length < 2} aria-label="Send"
          className="px-3 rounded-lg text-white disabled:opacity-40" style={{ background: 'linear-gradient(120deg, #26890D, #0f9f8f)' }}>
          {m.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </div>
  )
}
