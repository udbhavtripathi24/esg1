import { useMemo, useState } from 'react'
import { Search, Eye, MessageCircle, CheckCircle2 } from 'lucide-react'
import PageHeader from './PageHeader.jsx'
import { Card, StatusPill, EmptyState } from './ui.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import ReviewDataWorkspace from './ReviewDataWorkspace.jsx'
import { DATASET_STATUS, WAITING } from './datasetStatus.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useDatasets } from '../hooks/useDatasets.js'
import { useCompanies } from '../hooks/useCompanies.js'
import { useUsers } from '../hooks/useUsers.js'
import BrsrReview from './brsr/BrsrReview.jsx'
import AnswerQueue from './brsr/AnswerQueue.jsx'
import { useQuestionQueue } from '../hooks/useBrsr.js'


export default function ReviewCenterView() {
  const { user, hasPermission } = useAuth()
  const canReviewBrsr = hasPermission('dataset:review')
  // Department reviewers named in the BRSR roster may not have review rights
  // on datasets; their tab appears whenever answers are waiting for them.
  const answerQueue = useQuestionQueue()
  const answersWaiting = answerQueue.data?.length || 0
  const tabs = [
    'Datasets',
    ...(canReviewBrsr || answersWaiting ? ['BRSR answers'] : []),
    ...(canReviewBrsr ? ['BRSR sections'] : []),
  ]
  const [tab, setTab] = useState('Datasets')
  const [show, setShow] = useState('waiting')
  const [search, setSearch] = useState('')
  const [openPublicId, setOpenPublicId] = useState(null)
  const [toast, setToast] = useState(null)

  function pushToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const datasetsQuery = useDatasets({ page: 1, page_size: 100 })
  const datasets = useMemo(() => datasetsQuery.data?.items || [], [datasetsQuery.data])

  // Resolve company_id -> name and created_by -> name via already-fetched
  // real data — no N+1 requests, same pattern used throughout this project.
  const companiesQuery = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  const companyNameById = useMemo(() => {
    const map = new Map()
    for (const c of companiesQuery.data?.items || []) map.set(c.id, c.name)
    return map
  }, [companiesQuery.data])

  // Reviewers may not list users (user:read): the dataset carries its uploader's name.
  const usersQuery = useUsers({ page: 1, page_size: 100 }, { enabled: hasPermission('user:read') })
  const userNameById = useMemo(() => {
    const map = new Map()
    for (const u of usersQuery.data?.items || []) map.set(u.id, u.name)
    return map
  }, [usersQuery.data])

  const waitingCount = datasets.filter((d) => WAITING.includes(d.status)).length
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return datasets
      .filter((d) => show === 'all' || WAITING.includes(d.status))
      .filter((d) => !q || [companyNameById.get(d.company_id), d.upload_type_name, d.created_by_name, DATASET_STATUS[d.status]]
        .some((x) => (x || '').toLowerCase().includes(q)))
      .sort((a, b) => (WAITING.includes(b.status) - WAITING.includes(a.status)) || (b.created_at > a.created_at ? 1 : -1))
  }, [datasets, search, show, companyNameById])
  const openDataset = datasets.find((d) => d.public_id === openPublicId)

  if (openDataset) {
    return (
      <ReviewDataWorkspace
        dataset={openDataset}
        companyName={companyNameById.get(openDataset.company_id) || `Company #${openDataset.company_id}`}
        uploaderName={openDataset.created_by_name || userNameById.get(openDataset.created_by) || `User #${openDataset.created_by}`}
        currentUser={user}
        onBack={() => setOpenPublicId(null)}
        pushToast={pushToast}
      />
    )
  }

  return (
    <div>
      <PageHeader title="Review Data" subtitle="Review uploaded datasets, respond to Deloitte feedback and resubmit corrections" />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-brand-green/10 text-brand-greenDark text-xs mb-4">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {tabs.length > 1 && (
        <div className="flex items-center gap-6 border-b border-surface-border mb-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-xs -mb-px border-b-2 transition-colors ${
                tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'
              }`}
            >
              {t}{t === 'BRSR answers' && answersWaiting > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-status-review/15 text-status-review text-[9px]">{answersWaiting}</span>}
            </button>
          ))}
        </div>
      )}

      {tab === 'BRSR sections' ? (
        <BrsrReview pushToast={pushToast} />
      ) : tab === 'BRSR answers' ? (
        <AnswerQueue pushToast={pushToast} />
      ) : (
      <>
      <Card title="Datasets" action={
        <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-surface-border overflow-hidden text-[10px]" role="group" aria-label="Show">
          {[['waiting', `Waiting for review · ${waitingCount}`], ['all', `All · ${datasets.length}`]].map(([k, label]) => (
            <button key={k} type="button" onClick={() => setShow(k)}
              className={`px-2.5 py-1.5 ${show === k ? 'bg-brand-green/10 text-brand-greenDark font-medium' : 'text-ink-700 hover:bg-surface-muted'}`}>{label}</button>
          ))}
        </div>
        <div className="relative w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            placeholder="Search datasets......"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
          />
        </div>
        </div>
      } padded={false}>
        {datasetsQuery.isLoading ? (
          <LoadingState label="Loading datasets…" />
        ) : datasetsQuery.isError ? (
          <ErrorState message={datasetsQuery.error?.message || 'Could not load datasets.'} onRetry={() => datasetsQuery.refetch()} />
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState title={show === 'waiting' ? 'Nothing waiting for review' : 'No datasets yet'} subtitle={show === 'waiting' ? 'Submitted uploads appear here. Switch to All to see approved ones.' : 'Datasets submitted for review will appear here.'} /></div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[10px] text-ink-500 border-t border-surface-border">
                <th className="font-medium px-5 py-2.5">Company</th>
                <th className="font-medium px-2 py-2.5">Data sheet</th>
                <th className="font-medium px-2 py-2.5">Period</th>
                <th className="font-medium px-2 py-2.5">Date</th>
                <th className="font-medium px-2 py-2.5">Uploaded By</th>
                <th className="font-medium px-2 py-2.5">Status</th>
                <th className="font-medium px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.public_id}
                  onClick={() => setOpenPublicId(d.public_id)}
                  className="border-t border-surface-border cursor-pointer hover:bg-surface-muted/40"
                >
                  <td className="px-5 py-3 text-ink-900 font-medium">{companyNameById.get(d.company_id) || `Company #${d.company_id}`}</td>
                  <td className="px-2 py-3 text-ink-900 font-medium">{d.upload_type_name || `Upload type #${d.upload_type_id}`}</td>
                  <td className="px-2 py-3 text-ink-500">{d.reporting_period_start} – {d.reporting_period_end}</td>
                  <td className="px-2 py-3 text-ink-500">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-2 py-3 text-ink-700">{d.created_by_name || userNameById.get(d.created_by) || `User #${d.created_by}`}</td>
                  <td className="px-2 py-3"><StatusPill status={DATASET_STATUS[d.status] || d.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-ink-300">
                      <button onClick={(e) => { e.stopPropagation(); setOpenPublicId(d.public_id) }} className="hover:text-ink-700"><Eye size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setOpenPublicId(d.public_id) }} className="hover:text-ink-700"><MessageCircle size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
      </>
      )}
    </div>
  )
}
