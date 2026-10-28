import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardList, Clock, EyeOff, Plus, Search } from 'lucide-react'
import PageHeader from '../PageHeader.jsx'
import { Button, Card, EmptyState, Field, Select } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCompanies } from '../../hooks/useCompanies.js'
import { useCreateSurvey, useMySurveys, useSurveyList } from '../../hooks/useSurveys.js'
import TemplatePicker from './TemplatePicker.jsx'
import { KindBadge, StatusBadge, Tabs } from './parts.jsx'
import { inputCls, useSurveysBase } from './util.js'
import { errText, fmtDate } from './logic.js'

export default function SurveysHome() {
  const { user, hasPermission } = useAuth()
  const isDeloitte = user?.portal_type === 'deloitte'
  const canManage = hasPermission('assessment:manage')
  const canAnswer = !isDeloitte
  const [params, setParams] = useSearchParams()
  const mine = useMySurveys({ enabled: canAnswer })
  const todo = (mine.data || []).filter((m) => m.status === 'open' && m.my_status !== 'submitted').length

  const tabs = [
    ...(canAnswer ? [{ key: 'answer', label: 'To answer', count: todo || null }] : []),
    ...(canManage ? [{ key: 'manage', label: 'Manage' }] : []),
  ]
  const fallback = canAnswer && (!canManage || todo > 0) ? 'answer' : 'manage'
  const tab = tabs.some((t) => t.key === params.get('view')) ? params.get('view') : fallback

  return (
    <div>
      <PageHeader title="Surveys & Assessments"
        subtitle="Build questionnaires and scored assessments, collect answers from colleagues, suppliers and stakeholders, and see the results." />
      {tabs.length > 1 && <Tabs tabs={tabs} value={tab} onChange={(k) => setParams({ view: k }, { replace: true })} />}
      {tab === 'answer' && <ToAnswer q={mine} />}
      {tab === 'manage' && canManage && <Manage isDeloitte={isDeloitte} />}
      {!tabs.length && <Card><EmptyState icon={ClipboardList} title="Nothing here for your role" /></Card>}
    </div>
  )
}

function ToAnswer({ q }) {
  const base = useSurveysBase()
  if (q.isLoading) return <Card><LoadingState label="Loading…" /></Card>
  if (q.isError) return <Card><ErrorState message={errText(q.error, 'Could not load your surveys.')} onRetry={() => q.refetch()} /></Card>
  const items = q.data
  if (!items.length) return <Card><EmptyState icon={CheckCircle2} title="Nothing to answer" subtitle="Surveys and assessments you’re asked to complete appear here." /></Card>
  const open = items.filter((i) => i.status === 'open' && i.my_status !== 'submitted')
  const done = items.filter((i) => !(i.status === 'open' && i.my_status !== 'submitted'))
  return (
    <div className="space-y-6">
      {open.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {open.map((s) => (
            <Link key={s.id} to={`${base}/respond/${s.id}`} className="block bg-white border border-surface-border rounded-lg p-4 hover:border-brand-green hover:shadow-sm">
              <div className="flex items-center gap-2 mb-1.5"><KindBadge kind={s.kind} />{s.anonymous && <span className="flex items-center gap-1 text-[10px] text-ink-500"><EyeOff size={10} /> Anonymous</span>}</div>
              <p className="text-[13px] font-medium text-ink-900">{s.title}</p>
              {s.description && <p className="text-[11px] text-ink-500 mt-1 line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-3 text-[10px] text-ink-500 mt-3">
                <span className="flex items-center gap-1"><Clock size={11} /> ~{s.minutes} min</span>
                {s.closes_at && <span>Due {fmtDate(s.closes_at)}</span>}
              </div>
              {s.my_status === 'in_progress' && (
                <div className="mt-2.5">
                  <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden"><div className="h-full bg-brand-green rounded-full" style={{ width: `${s.progress || 0}%` }} /></div>
                  <p className="text-[10px] text-ink-500 mt-1">{s.progress || 0}% answered</p>
                </div>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-greenDark mt-3">
                {s.my_status === 'in_progress' ? 'Continue' : 'Start'} <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-ink-500 mb-2">Completed and closed</p>
          <div className="bg-white border border-surface-border rounded-lg divide-y divide-surface-border">
            {done.map((s) => (
              <Link key={s.id} to={`${base}/respond/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[11px] hover:bg-surface-muted">
                <span className="flex-1 text-ink-900">{s.title}</span>
                <span className="text-ink-500">{s.my_status === 'submitted' ? `Submitted${s.submitted_at ? ` ${fmtDate(s.submitted_at)}` : ''}` : 'Closed'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Manage({ isDeloitte }) {
  const navigate = useNavigate()
  const base = useSurveysBase()
  const [companyId, setCompanyId] = useState('')
  const companies = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  const ready = !isDeloitte || !!companyId
  const list = useSurveyList(isDeloitte ? companyId : null, { enabled: ready })
  const create = useCreateSurvey()
  const [picker, setPicker] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [kind, setKind] = useState('')

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (list.data || []).filter((x) =>
      (status === 'all' || (status === 'active' ? x.status !== 'archived' : x.status === status)) &&
      (!kind || x.kind === kind) &&
      (!s || `${x.title} ${x.category}`.toLowerCase().includes(s)))
  }, [list.data, search, status, kind])

  const stats = useMemo(() => {
    const all = (list.data || []).filter((x) => x.status !== 'archived')
    const rated = all.filter((x) => x.response_rate !== null)
    return {
      total: all.length, open: all.filter((x) => x.status === 'open').length,
      responses: all.reduce((n, x) => n + x.responses, 0),
      rate: rated.length ? Math.round(rated.reduce((n, x) => n + x.response_rate, 0) / rated.length) : null,
    }
  }, [list.data])

  const onCreate = async (body) => {
    setCreateError(null)
    try {
      const sv = await create.mutateAsync({ ...body, ...(isDeloitte ? { company_id: Number(companyId) } : {}) })
      navigate(`${base}/${sv.id}?tab=build`)
    } catch (e) { setCreateError(errText(e, 'Could not create the survey')) }
  }

  return (
    <div>
      {isDeloitte && (
        <Card className="mb-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Client company" required>
              <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">Select a company…</option>
                {(companies.data?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
        </Card>
      )}
      {!ready ? (
        <Card><EmptyState icon={ClipboardList} title="Choose a company" subtitle="Select the client whose surveys you want to manage." /></Card>
      ) : list.isLoading ? <Card><LoadingState label="Loading surveys…" /></Card> : list.isError ? (
        <Card><ErrorState message={errText(list.error, 'Could not load surveys.')} onRetry={() => list.refetch()} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Stat label="Surveys & assessments" value={stats.total} />
            <Stat label="Open now" value={stats.open} />
            <Stat label="Responses" value={stats.responses} />
            <Stat label="Average response rate" value={stats.rate !== null ? `${stats.rate}%` : '—'} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-300" />
              <input className={`${inputCls} !pl-6 !w-60`} placeholder="Search title or category" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className={`${inputCls} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              <option value="active">All but archived</option><option value="draft">Drafts</option><option value="scheduled">Scheduled</option>
              <option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option><option value="all">Everything</option>
            </select>
            <select className={`${inputCls} !w-auto`} value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
              <option value="">Surveys and assessments</option><option value="survey">Surveys</option><option value="assessment">Assessments</option>
            </select>
            <Button size="sm" className="ml-auto" onClick={() => setPicker(true)}><Plus size={14} /> New</Button>
          </div>
          {(list.data || []).length === 0 ? (
            <Card>
              <EmptyState icon={ClipboardList} title="No surveys yet"
                subtitle="Start from an ESG template — maturity self-assessment, supplier due diligence, materiality — or build your own."
                action={<Button size="sm" onClick={() => setPicker(true)}><Plus size={14} /> Create the first one</Button>} />
            </Card>
          ) : rows.length === 0 ? (
            <Card><p className="text-[11px] text-ink-300 text-center py-6">Nothing matches these filters.</p></Card>
          ) : (
            <div className="bg-white border border-surface-border rounded-lg overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-[10px] text-ink-500 border-b border-surface-border">
                    <th className="px-4 py-2.5 font-medium">Title</th><th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Responses</th><th className="px-2 py-2.5 font-medium text-right">Avg score</th>
                    <th className="px-2 py-2.5 font-medium">Closes</th><th className="px-4 py-2.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x) => (
                    <tr key={x.id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/60 cursor-pointer" onClick={() => navigate(`${base}/${x.id}`)}>
                      <td className="px-4 py-2.5">
                        <Link to={`${base}/${x.id}`} className="text-[12px] font-medium text-ink-900 hover:underline" onClick={(e) => e.stopPropagation()}>{x.title}</Link>
                        <span className="flex items-center gap-2 mt-0.5"><KindBadge kind={x.kind} /><span className="text-[10px] text-ink-500">{x.category} · {x.questions} questions{x.anonymous ? ' · anonymous' : ''}</span></span>
                      </td>
                      <td className="px-2 py-2.5"><StatusBadge status={x.status} /></td>
                      <td className="px-2 py-2.5 min-w-[150px]">
                        <span className="tabular-nums text-ink-900">{x.responses}</span>
                        {x.eligible > 0 && <span className="text-ink-500"> of {x.eligible}</span>}
                        {x.response_rate !== null && (
                          <div className="h-1 rounded-full bg-ink-100 mt-1 w-28 overflow-hidden"><div className="h-full rounded-full bg-brand-green" style={{ width: `${x.response_rate}%` }} /></div>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-ink-900">{x.average_score !== null ? `${x.average_score}%` : '—'}</td>
                      <td className="px-2 py-2.5 text-ink-500">{x.closes_at ? fmtDate(x.closes_at) : '—'}</td>
                      <td className="px-4 py-2.5 text-ink-500">{fmtDate(x.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {picker && <TemplatePicker companyId={isDeloitte ? companyId : null} onClose={() => setPicker(false)} onCreate={onCreate}
        creating={create.isPending} error={createError} />}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg px-4 py-3">
      <p className="text-[10px] text-ink-500">{label}</p>
      <p className="text-xl font-semibold text-ink-900 tabular-nums">{value}</p>
    </div>
  )
}
