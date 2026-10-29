import { useState } from 'react'
import { History, Search } from 'lucide-react'
import { EmptyState } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { useApprovals } from '../../hooks/useAdmin.js'
import { inputCls } from '../surveys/util.js'
import { Pager, TableShell } from './parts.jsx'
import { fmtWhen, td, th } from './util.js'

const PAGE = 15
const STATUS_CLS = {
  approved: 'text-status-approved', internally_approved: 'text-status-approved', published: 'text-status-approved',
  signed: 'text-status-approved', rejected: 'text-status-pending', changes_requested: 'text-status-pending',
  under_review: 'text-amber-700', submitted: 'text-blue-700', withdrawn: 'text-ink-500',
}
const KIND_CLS = {
  dataset: 'border-brand-green/50 text-brand-greenDark', brsr: 'border-blue-300 text-blue-700',
  report: 'border-purple-300 text-purple-700', assurance: 'border-amber-300 text-amber-800',
}

export default function ApprovalHistoryTab({ companyId }) {
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useApprovals({ kind: kind || undefined, status: status || undefined, search: search || undefined, page, page_size: PAGE }, companyId)
  if (q.isLoading) return <LoadingState label="Loading approval history…" />
  if (q.isError) return <ErrorState message={q.error?.message || 'Could not load the approval history.'} onRetry={() => q.refetch()} />
  const d = q.data
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1) }

  return (
    <div>
      <p className="text-[11px] text-ink-500 mb-3">Every review decision on your data uploads, BRSR sections, reports and assurance — who decided, when and why.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input className={`${inputCls} !pl-7 !w-60 !py-2`} placeholder="Search item, person or comment" value={search} onChange={reset(setSearch)} />
        </div>
        <select className={`${inputCls} !w-auto !py-2`} value={kind} onChange={reset(setKind)} aria-label="Type">
          <option value="">All types</option>
          {d.kinds.map((k) => <option key={k.code} value={k.code}>{k.label} ({d.counts.by_kind[k.code] || 0})</option>)}
        </select>
        <select className={`${inputCls} !w-auto !py-2`} value={status} onChange={reset(setStatus)} aria-label="Status">
          <option value="">Any status</option>
          {d.statuses.filter((s) => d.counts.by_status[s.code]).map((s) => <option key={s.code} value={s.code}>{s.label} ({d.counts.by_status[s.code]})</option>)}
        </select>
      </div>
      {d.items.length === 0 ? (
        <EmptyState icon={History} title={d.counts.total ? 'Nothing matches these filters' : 'No review decisions yet'}
          subtitle={d.counts.total ? undefined : 'Decisions appear here once uploads or BRSR sections are reviewed.'} />
      ) : (
        <TableShell>
          <table className="w-full">
            <thead><tr className="bg-surface-muted/50">
              <th className={`${th} pl-5`}>Item</th><th className={th}>Decided by</th><th className={th}>Date</th>
              <th className={th}>Type</th><th className={th}>Status</th><th className={`${th} pr-5`}>Comments</th>
            </tr></thead>
            <tbody>
              {d.items.map((i) => (
                <tr key={i.id} className="border-t border-surface-border align-top">
                  <td className={`${td} pl-5`}>
                    <span className="block font-medium text-ink-900">{i.title}</span>
                    {i.detail && <span className="block text-[10px] text-ink-500">{i.detail}</span>}
                    {i.submitted_by && <span className="block text-[10px] text-ink-300">uploaded by {i.submitted_by}</span>}
                  </td>
                  <td className={`${td} text-ink-700`}>{i.by || <span className="text-ink-300">—</span>}</td>
                  <td className={`${td} text-ink-500 whitespace-nowrap`}>{fmtWhen(i.date, false)}</td>
                  <td className={td}><span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap ${KIND_CLS[i.kind]}`}>{i.kind_label}</span></td>
                  <td className={`${td} font-medium whitespace-nowrap ${STATUS_CLS[i.status] || 'text-ink-700'}`}>{i.status_label}</td>
                  <td className={`${td} pr-5 text-ink-700 max-w-xs`}>{i.comment || <span className="text-ink-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
      <Pager page={d.page} pageSize={d.page_size} total={d.total} onPage={setPage} />
    </div>
  )
}
