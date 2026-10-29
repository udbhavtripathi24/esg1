import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '../ui.jsx'
import LoadingState from '../LoadingState.jsx'
import ErrorState from '../ErrorState.jsx'
import { getAuditLogs } from '../../api/adminAudit.js'
import { useCompanies } from '../../hooks/useCompanies.js'
import { inputCls } from '../surveys/util.js'
import { Pager, TableShell } from './parts.jsx'
import { fmtWhen, td, th } from './util.js'

const PAGE = 20
const AREAS = [
  ['', 'All activity'], ['user.', 'Users & roles'], ['dataset*', 'Data uploads'], ['file.', 'Files'],
  ['brsr.', 'BRSR'], ['evidence.', 'Evidence'], ['report.', 'Reports'], ['assurance.', 'Assurance'],
  ['survey.', 'Surveys'], ['target.', 'Targets'], ['integration.', 'Integrations'],
]
const LABELS = {
  'user.created': 'Added a user', 'user.updated': 'Edited a user', 'user.removed': 'Removed a user',
  'user.role_changed': 'Changed a role', 'user.role_granted': 'Granted a role', 'user.role_removed': 'Removed a role',
  'user.activated': 'Reactivated a user', 'user.deactivated': 'Deactivated a user', 'user.bulk_imported': 'Imported users',
  'user.password_reset_by_admin': 'Reset a password', 'user.password_changed': 'Changed own password',
  'dataset.created': 'Created a dataset', 'dataset_version.created': 'Started a new version', 'dataset_version.submitted': 'Submitted data for review',
  'file.uploaded': 'Uploaded a file', 'file.downloaded': 'Downloaded a file',
  'brsr.response_set.created': 'Started a BRSR', 'brsr.answers.saved': 'Saved BRSR answers', 'brsr.section.submitted': 'Submitted a BRSR section',
  'brsr.section.approved': 'Approved a BRSR section', 'brsr.section.internally_approved': 'Approved a BRSR section internally',
  'brsr.section.changes_requested': 'Requested changes on a BRSR section', 'brsr.section.withdrawn': 'Withdrew a BRSR section',
  'target.created': 'Added a target', 'target.updated': 'Edited a target', 'target.removed': 'Removed a target',
  'integration.created': 'Recorded a system', 'integration.updated': 'Updated a system',
  'survey.created': 'Created a survey', 'survey.published': 'Published a survey', 'survey.response_submitted': 'A survey response was submitted',
  'survey.updated': 'Edited a survey', 'survey.invited': 'Invited people to a survey', 'survey.reminded': 'Sent survey reminders',
  'survey.close': 'Closed a survey', 'survey.reopen': 'Reopened a survey', 'survey.archive': 'Archived a survey',
  'survey.exported': 'Exported survey results', 'survey.duplicated': 'Duplicated a survey', 'survey.deleted': 'Deleted a survey',
  'survey.public_link': 'Changed a survey’s public link', 'survey.links_renewed': 'Renewed survey links',
  'survey.saved_as_template': 'Saved a survey template', 'survey.file_downloaded': 'Downloaded a survey file',
  'evidence.uploaded': 'Uploaded evidence', 'evidence.downloaded': 'Downloaded evidence', 'evidence.withdrawn': 'Withdrew evidence',
  'report.published': 'Published a report', 'assurance.signed': 'Signed the assurance opinion',
}

function label(action) {
  return LABELS[action] || action.replace(/_/g, ' ').replace(/\./g, ' › ').replace(/^./, (c) => c.toUpperCase())
}

/** Short, human detail from the entry's recorded changes. */
function detail(l) {
  const c = l.changes || {}
  const bits = []
  if (c.email) bits.push(c.email)
  if (c.role) bits.push(String(c.role).replace('Client ', ''))
  if (c.from && c.to) bits.push(`${[].concat(c.from).map((r) => String(r).replace('Client ', '')).join(', ') || 'no role'} → ${String(c.to).replace('Client ', '')}`)
  if (c.section) bits.push(`Section ${c.section}`)
  if (c.title) bits.push(c.title)
  if (c.filename) bits.push(c.filename)
  if (c.count !== undefined) bits.push(`${c.count} item${c.count === 1 ? '' : 's'}`)
  if (c.metric && !c.title) bits.push(String(c.metric).replace(/_/g, ' '))
  if (c.type) bits.push(c.type)
  if (c.anonymous) bits.push('anonymous — no name recorded')
  return bits.join(' · ')
}

export default function AuditTrail({ deloitte = false }) {
  const [area, setArea] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [page, setPage] = useState(1)
  const companies = useCompanies({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
  const params = {
    page, page_size: PAGE,
    ...(area ? { action: area } : {}),
    ...(from ? { date_from: new Date(`${from}T00:00:00`).toISOString() } : {}),
    ...(to ? { date_to: new Date(`${to}T23:59:59`).toISOString() } : {}),
    ...(companyId ? { company_id: companyId } : {}),
  }
  const q = useQuery({ queryKey: ['admin', 'audit-logs', params], queryFn: () => getAuditLogs(params), placeholderData: keepPreviousData })
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1) }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        {deloitte && (
          <select className={`${inputCls} !w-auto !py-2`} value={companyId} onChange={reset(setCompanyId)} aria-label="Company">
            <option value="">All my companies</option>
            {(companies.data?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <select className={`${inputCls} !w-auto !py-2`} value={area} onChange={reset(setArea)} aria-label="Area">
          {AREAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="text-[10px] text-ink-500">From <input type="date" className={`${inputCls} !w-auto !py-1.5 inline-block ml-1`} value={from} onChange={reset(setFrom)} /></label>
        <label className="text-[10px] text-ink-500">To <input type="date" className={`${inputCls} !w-auto !py-1.5 inline-block ml-1`} value={to} onChange={reset(setTo)} /></label>
        <span className="ml-auto text-[10px] text-ink-300">Read-only · every change is recorded automatically</span>
      </div>
      {q.isLoading ? <LoadingState label="Loading audit log…" />
        : q.isError ? <ErrorState message={q.error?.message || 'Could not load the audit log.'} onRetry={() => q.refetch()} />
          : q.data.items.length === 0 ? <EmptyState icon={ClipboardList} title="No activity" subtitle="Nothing recorded matches these filters." />
            : (
              <>
                <TableShell>
                  <table className="w-full">
                    <thead><tr className="bg-surface-muted/50">
                      <th className={`${th} pl-5`}>When</th><th className={th}>Who</th><th className={th}>What</th><th className={th}>Details</th>
                      {deloitte && <th className={`${th} pr-5`}>Company</th>}
                    </tr></thead>
                    <tbody>
                      {q.data.items.map((l) => (
                        <tr key={l.id} className="border-t border-surface-border align-top">
                          <td className={`${td} pl-5 text-ink-500 whitespace-nowrap`}>{fmtWhen(l.occurred_at)}</td>
                          <td className={`${td} text-ink-900`}>{l.actor_name || <span className="text-ink-300">System</span>}</td>
                          <td className={`${td} text-ink-900 font-medium`}>{label(l.action)}</td>
                          <td className={`${td} text-ink-500 max-w-md`}>{detail(l) || <span className="text-ink-300">—</span>}</td>
                          {deloitte && <td className={`${td} pr-5 text-ink-700`}>{l.company_name || '—'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableShell>
                <Pager page={page} pageSize={PAGE} total={q.data.total} onPage={setPage} />
              </>
            )}
    </div>
  )
}
