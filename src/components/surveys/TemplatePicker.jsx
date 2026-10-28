import { useState } from 'react'
import { ArrowLeft, ClipboardList, Clock, EyeOff, FilePlus2, Gauge, Loader2, Trash2 } from 'lucide-react'
import { Button } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useDeleteSurvey, useTemplate, useTemplates } from '../../hooks/useSurveys.js'
import { KindBadge, Modal } from './parts.jsx'
import { TYPE_BY_KEY, errText } from './logic.js'

/** Start a survey: blank (survey or assessment) or from a template, with a look inside first. */
export default function TemplatePicker({ companyId, onClose, onCreate, creating, error }) {
  const t = useTemplates(companyId)
  const [peek, setPeek] = useState(null)
  const del = useDeleteSurvey()
  const builtIn = (t.data || []).filter((x) => x.built_in)
  const mine = (t.data || []).filter((x) => !x.built_in)

  if (peek) {
    return <TemplatePreview id={peek} companyId={companyId} onBack={() => setPeek(null)} onClose={onClose}
      onUse={() => onCreate({ template_id: peek })} creating={creating} error={error} />
  }
  return (
    <Modal title="New survey or assessment" subtitle="Start from scratch or from a ready-made questionnaire you can edit." onClose={onClose} wide>
      {error && <p className="text-[11px] text-status-pending mb-3">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <BlankCard icon={FilePlus2} title="Blank survey" text="Ask anything; results show how people answered."
          onClick={() => onCreate({ kind: 'survey', title: 'Untitled survey' })} disabled={creating} />
        <BlankCard icon={Gauge} title="Blank assessment" text="Answers earn points; every response gets a score and maturity band."
          onClick={() => onCreate({ kind: 'assessment', title: 'Untitled assessment' })} disabled={creating} />
      </div>
      {t.isLoading ? <LoadingState label="Loading templates…" /> : t.isError ? <ErrorState message={errText(t.error, 'Could not load templates.')} /> : (
        <>
          <p className="text-[11px] font-semibold text-ink-900 mb-2">ESG templates</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {builtIn.map((x) => <TemplateCard key={x.id} t={x} onClick={() => setPeek(x.id)} />)}
          </div>
          {mine.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-ink-900 mt-5 mb-2">Your company’s templates</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mine.map((x) => (
                  <TemplateCard key={x.id} t={x} onClick={() => setPeek(x.id)} onDelete={async () => {
                    if (window.confirm(`Delete the template “${x.title}”? Surveys made from it are not affected.`)) {
                      try { await del.mutateAsync(x.id) } catch { /* the list refreshes either way */ }
                    }
                  }} />
                ))}
              </div>
            </>
          )}
        </>
      )}
      {creating && <p className="flex items-center gap-1.5 text-[11px] text-ink-500 mt-4"><Loader2 size={12} className="animate-spin" /> Creating…</p>}
    </Modal>
  )
}

function BlankCard({ icon: Icon, title, text, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-start gap-3 text-left p-4 rounded-lg border border-dashed border-ink-300 hover:border-brand-green hover:bg-brand-green/5 disabled:opacity-50">
      <Icon size={18} className="text-brand-greenDark shrink-0 mt-0.5" />
      <span><span className="block text-[12px] font-medium text-ink-900">{title}</span><span className="block text-[10px] text-ink-500 mt-0.5">{text}</span></span>
    </button>
  )
}

function TemplateCard({ t, onClick, onDelete }) {
  return (
    <div className="relative group">
      <button type="button" onClick={onClick} className="w-full h-full text-left p-4 rounded-lg border border-surface-border hover:border-brand-green hover:shadow-sm bg-white">
        <div className="flex items-center gap-2 mb-1.5"><KindBadge kind={t.kind} /><span className="text-[10px] text-ink-500">{t.category}</span></div>
        <p className="text-[12px] font-medium text-ink-900">{t.title}</p>
        <p className="text-[10px] text-ink-500 mt-1 line-clamp-3">{t.description}</p>
        <p className="flex items-center gap-3 text-[10px] text-ink-300 mt-2">
          <span>{t.questions} questions</span>
          <span className="flex items-center gap-1"><Clock size={10} />~{t.minutes} min</span>
          {t.anonymous && <span className="flex items-center gap-1"><EyeOff size={10} />anonymous</span>}
        </p>
      </button>
      {onDelete && (
        <button type="button" onClick={onDelete} aria-label={`Delete template ${t.title}`}
          className="absolute top-2 right-2 p-1 rounded text-ink-300 hover:text-status-pending opacity-0 group-hover:opacity-100 focus:opacity-100">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function TemplatePreview({ id, companyId, onBack, onClose, onUse, creating, error }) {
  const t = useTemplate(id, companyId)
  return (
    <Modal title={t.data?.title || 'Template'} subtitle={t.data?.description} onClose={onClose} wide
      footer={<>
        <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft size={13} /> All templates</Button>
        <Button size="sm" onClick={onUse} disabled={creating || !t.data}>{creating ? <Loader2 size={13} className="animate-spin" /> : <ClipboardList size={13} />} Use this template</Button>
      </>}>
      {error && <p className="text-[11px] text-status-pending mb-3">{error}</p>}
      {t.isLoading ? <LoadingState label="Loading…" /> : t.isError ? <ErrorState message={errText(t.error, 'Could not load the template.')} /> : (
        <div>
          <p className="text-[10px] text-ink-500 mb-3">{t.data.questions} questions · about {t.data.minutes} minutes. Everything can be edited after you create it.</p>
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {t.data.definition.sections.map((s, i) => (
              <div key={s.id}>
                <p className="text-[11px] font-semibold text-ink-900">{i + 1}. {s.title}{s.description ? <span className="font-normal text-ink-500"> — {s.description}</span> : null}</p>
                <ul className="mt-1.5 space-y-1">
                  {s.questions.map((q) => {
                    const T = TYPE_BY_KEY[q.type]
                    return (
                      <li key={q.id} className="flex items-start gap-2 text-[11px] text-ink-700">
                        {T && <T.icon size={12} className="text-ink-300 shrink-0 mt-0.5" />}
                        <span className="flex-1">{q.title}{q.show_if && <span className="text-[9px] text-blue-700 ml-1">(conditional)</span>}</span>
                        <span className="text-[9px] text-ink-300 shrink-0">{T?.label}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            {t.data.definition.bands?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-ink-900">Maturity bands</p>
                <ul className="mt-1 space-y-0.5">
                  {t.data.definition.bands.map((b) => <li key={b.label} className="text-[11px] text-ink-700"><strong className="font-medium">{b.min}%+ {b.label}</strong> — {b.description}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
