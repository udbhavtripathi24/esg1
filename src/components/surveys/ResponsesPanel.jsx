import { useMemo, useState } from 'react'
import { Paperclip, Search } from 'lucide-react'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useResponse, useResponses } from '../../hooks/useSurveys.js'
import { fileDownload } from '../../api/surveys.js'
import { Drawer } from './parts.jsx'
import { inputCls } from './util.js'
import { errText, fmtDate } from './logic.js'

const VIA = { user: 'Platform', email: 'Personal link', public: 'Public link' }

export default function ResponsesPanel({ survey }) {
  const list = useResponses(survey.id)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (list.data || []).filter((r) => !s || [r.respondent, r.email, r.group].some((x) => (x || '').toLowerCase().includes(s)))
  }, [list.data, q])
  const assessment = survey.kind === 'assessment'

  if (list.isLoading) return <LoadingState label="Loading responses…" />
  if (list.isError) return <ErrorState message={errText(list.error, 'Could not load responses.')} onRetry={() => list.refetch()} />

  return (
    <div className="bg-white border border-surface-border rounded-lg">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
        <p className="text-xs font-semibold text-ink-900">{list.data.length} response{list.data.length === 1 ? '' : 's'}</p>
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-300" />
          <input className={`${inputCls} !pl-6 !w-56`} placeholder="Search name, e-mail or group" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-[11px] text-ink-300 text-center py-10">{list.data.length ? 'No responses match.' : 'No responses yet.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[10px] text-ink-500 border-b border-surface-border">
                <th className="px-4 py-2 font-medium">Respondent</th><th className="px-2 py-2 font-medium">Group</th>
                <th className="px-2 py-2 font-medium">Via</th><th className="px-2 py-2 font-medium">Submitted</th>
                {assessment && <th className="px-2 py-2 font-medium text-right">Score</th>}
                {assessment && <th className="px-4 py-2 font-medium">Band</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/60 cursor-pointer" onClick={() => setOpen(r.id)}>
                  <td className="px-4 py-2">
                    <button type="button" className="text-left text-ink-900 hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(r.id) }}>
                      {r.respondent || <span className="text-ink-300">Not given</span>}
                    </button>
                    {r.email && <span className="block text-[10px] text-ink-500">{r.email}</span>}
                  </td>
                  <td className="px-2 py-2 text-ink-700">{r.group || '—'}</td>
                  <td className="px-2 py-2 text-ink-500">{VIA[r.channel] || r.channel}</td>
                  <td className="px-2 py-2 text-ink-500">{fmtDate(r.submitted_at, true)}</td>
                  {assessment && <td className="px-2 py-2 text-right tabular-nums font-medium text-ink-900">{r.score !== null ? `${r.score}%` : '—'}</td>}
                  {assessment && <td className="px-4 py-2 text-ink-700">{r.band || '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && <ResponseDrawer survey={survey} id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ResponseDrawer({ survey, id, onClose }) {
  const r = useResponse(survey.id, id)
  const [err, setErr] = useState(null)
  const openFile = async (fid) => {
    setErr(null)
    try { const x = await fileDownload(survey.id, fid); window.open(x.url, '_blank', 'noopener') } catch (e) { setErr(errText(e, 'Could not open the file')) }
  }
  return (
    <Drawer title={r.data?.respondent || 'Response'} onClose={onClose}>
      {r.isLoading ? <LoadingState label="Loading…" /> : r.isError ? <ErrorState message={errText(r.error, 'Could not load the response.')} /> : (
        <div>
          <p className="text-[10px] text-ink-500 mb-4">
            {r.data.group ? `${r.data.group} · ` : ''}{VIA[r.data.channel]} · submitted {fmtDate(r.data.submitted_at, true)}
          </p>
          {r.data.score && (
            <div className="flex items-baseline gap-3 bg-surface-muted rounded-md px-4 py-3 mb-5">
              <span className="text-2xl font-semibold text-ink-900">{r.data.score.percent ?? '—'}%</span>
              {r.data.score.band && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-green/15 text-brand-greenDark">{r.data.score.band}</span>}
              <span className="text-[10px] text-ink-500 ml-auto">{r.data.score.points} of {r.data.score.max} points</span>
            </div>
          )}
          {err && <p className="text-[10px] text-status-pending mb-2">{err}</p>}
          <div className="space-y-6">
            {r.data.sections.filter((s) => s.questions.length).map((s) => (
              <section key={s.id}>
                <div className="flex justify-between items-baseline border-b border-surface-border pb-1 mb-3">
                  <h4 className="text-[11px] font-semibold text-ink-900">{s.title}</h4>
                  {s.score && <span className="text-[10px] text-ink-500">{s.score.percent}%</span>}
                </div>
                <dl className="space-y-3">
                  {s.questions.map((qq) => (
                    <div key={qq.id}>
                      <dt className="text-[10px] text-ink-500">{qq.title}</dt>
                      <dd className="text-[12px] text-ink-900 mt-0.5 whitespace-pre-line">
                        {qq.rows ? (
                          <ul className="space-y-0.5">{qq.rows.map((row) => <li key={row.label} className="flex justify-between gap-3"><span className="text-ink-700">{row.label}</span><span>{row.value || '—'}</span></li>)}</ul>
                        ) : qq.files ? (
                          qq.files.length ? qq.files.map((f) => (
                            <button key={f.id} type="button" className="flex items-center gap-1 text-brand-greenDark hover:underline" onClick={() => openFile(f.id)}><Paperclip size={11} />{f.filename}</button>
                          )) : <span className="text-ink-300">No file</span>
                        ) : qq.value === null || qq.value === undefined ? <span className="text-ink-300">Not answered</span> : withUnit(survey, qq)}
                        {qq.score && !qq.score.na && <span className="ml-2 text-[9px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">{qq.score.points}/{qq.score.max} pts</span>}
                        {qq.score?.na && <span className="ml-2 text-[9px] text-ink-500 bg-surface-muted px-1.5 py-0.5 rounded">not scored</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  )
}

function withUnit(survey, qq) {
  if (qq.type === 'percent') return `${qq.value}%`
  if (qq.type === 'number') {
    const unit = survey.definition.sections.flatMap((s) => s.questions).find((x) => x.id === qq.id)?.unit
    return `${Number(qq.value).toLocaleString()}${unit ? ` ${unit}` : ''}`
  }
  return String(qq.value)
}
