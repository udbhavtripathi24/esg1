import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { Button } from '../ui.jsx'
import { useUpdateSurvey } from '../../hooks/useSurveys.js'
import { Label, Toggle } from './parts.jsx'
import { inputCls } from './util.js'
import { errText } from './logic.js'

const CATEGORIES = ['Custom', 'ESG maturity', 'Supplier due diligence', 'Climate risk', 'Materiality', 'Employee', 'Customer', 'Community', 'Governance']

/** Server datetimes are naive UTC; <input type="datetime-local"> wants local time. */
function toLocalInput(v) {
  if (!v) return ''
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(v) ? v : `${v}Z`)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)

function fromSurvey(s) {
  return {
    title: s.title || '', description: s.description || '', welcome: s.welcome || '', thank_you: s.thank_you || '',
    category: s.category || 'Custom', kind: s.kind, anonymous: s.anonymous, open_to_company: s.open_to_company,
    show_score_to_respondent: s.show_score_to_respondent,
    opens_at: toLocalInput(s.opens_at), closes_at: toLocalInput(s.closes_at),
  }
}

export default function SettingsPanel({ survey, onSaved }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(() => fromSurvey(survey))
  const [error, setError] = useState(null)
  const update = useUpdateSurvey(survey.id)
  const base = fromSurvey(survey)
  const dirty = JSON.stringify(form) !== JSON.stringify(base)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }))
  const readOnly = survey.status === 'archived'

  const save = async () => {
    setError(null)
    const cur = qc.getQueryData(['surveys', 'one', survey.id]) || survey
    const body = { revision: cur.revision }
    for (const k of Object.keys(form)) {
      if (form[k] === base[k]) continue
      body[k] = k === 'opens_at' || k === 'closes_at' ? fromLocalInput(form[k]) : form[k]
    }
    try {
      const r = await update.mutateAsync(body)
      setForm(fromSurvey(r))
      onSaved?.()
    } catch (e) {
      setError(errText(e, 'Could not save'))
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
      <div className="bg-white border border-surface-border rounded-lg p-5 space-y-4">
        <div>
          <Label>Title</Label>
          <input className={inputCls} value={form.title} onChange={set('title')} maxLength={200} disabled={readOnly} />
        </div>
        <div>
          <Label hint="shown in lists and at the top of the survey">Description</Label>
          <textarea className={inputCls} rows={2} value={form.description} onChange={set('description')} maxLength={2000} disabled={readOnly} />
        </div>
        <div>
          <Label hint="the first thing respondents read — why you’re asking, how long it takes, how answers are used">Welcome message</Label>
          <textarea className={inputCls} rows={4} value={form.welcome} onChange={set('welcome')} maxLength={4000} disabled={readOnly} />
        </div>
        <div>
          <Label hint="shown after submitting">Thank-you message</Label>
          <textarea className={inputCls} rows={2} value={form.thank_you} onChange={set('thank_you')} maxLength={2000} disabled={readOnly} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <select className={inputCls} value={form.category} onChange={set('category')} disabled={readOnly}>
              {[...new Set([form.category, ...CATEGORIES])].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {!survey.is_template && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label hint="optional — leave blank to open on publishing">Opens</Label>
              <input type="datetime-local" className={inputCls} value={form.opens_at} onChange={set('opens_at')} disabled={readOnly} />
            </div>
            <div>
              <Label hint="optional — closes automatically">Closes</Label>
              <input type="datetime-local" className={inputCls} value={form.closes_at} onChange={set('closes_at')} disabled={readOnly} />
            </div>
          </div>
        )}
        {error && <p className="text-[11px] text-status-pending" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
          <Button size="sm" variant="ghost" disabled={!dirty || update.isPending} onClick={() => setForm(base)}>Discard</Button>
          <Button size="sm" disabled={!dirty || update.isPending || readOnly || !form.title.trim()} onClick={save}>Save settings</Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-surface-border rounded-lg p-5">
          <p className="text-xs font-semibold text-ink-900 mb-3">Type</p>
          <div className="space-y-2">
            {[
              { k: 'survey', t: 'Survey', d: 'Collect views and facts. Results show how people answered.' },
              { k: 'assessment', t: 'Assessment', d: 'Answers earn points. Each response gets a score, by section and overall, and a maturity band.' },
            ].map((o) => (
              <label key={o.k} className={`flex gap-2.5 p-2.5 rounded-md border cursor-pointer ${form.kind === o.k ? 'border-brand-green bg-brand-green/5' : 'border-surface-border'}`}>
                <input type="radio" name="kind" className="mt-0.5 accent-brand-green" checked={form.kind === o.k} disabled={readOnly}
                  onChange={() => setForm((f) => ({ ...f, kind: o.k }))} />
                <span><span className="block text-[11px] font-medium text-ink-900">{o.t}</span><span className="block text-[10px] text-ink-500">{o.d}</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="bg-white border border-surface-border rounded-lg p-5 space-y-4">
          <p className="text-xs font-semibold text-ink-900">Responses</p>
          <Toggle checked={form.anonymous} onChange={set('anonymous')} disabled={readOnly || survey.has_responses}
            label="Anonymous"
            hint={survey.has_responses
              ? 'Can’t change once people have started answering — they answered under the original promise.'
              : 'Names are never stored with answers. You see who has answered, not what they said; results appear once 5 people have answered.'} />
          {form.kind === 'assessment' && (
            <Toggle checked={form.show_score_to_respondent} onChange={set('show_score_to_respondent')} disabled={readOnly}
              label="Show the score to the respondent" hint="After submitting they see their score, band and section scores." />
          )}
          {survey.has_responses && <p className="flex items-center gap-1 text-[10px] text-ink-500"><Lock size={10} /> Has responses: changing the type or scoring re-scores them.</p>}
        </div>
      </div>
    </div>
  )
}
