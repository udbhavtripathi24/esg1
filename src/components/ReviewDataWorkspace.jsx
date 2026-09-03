import { useMemo, useState } from 'react'
import {
  ChevronLeft, FileText, ShieldCheck, Info, History,
  CheckCircle2, AlertTriangle, XCircle, Circle, CheckCircle, AlertOctagon,
} from 'lucide-react'
import { Button } from './ui.jsx'
import LoadingState from './LoadingState.jsx'
import ErrorState from './ErrorState.jsx'
import { useDatasetVersions, useSites } from '../hooks/useDatasets.js'
import { useReviews, useAssignReview, useDecideReview, useComments, useCreateComment } from '../hooks/useReviews.js'
import { useKpiValues, useKpiDefinitions, useKpiValidation } from '../hooks/useKpiValues.js'

const TABS = [
  { key: 'Data Preview', icon: FileText },
  { key: 'Validation', icon: ShieldCheck },
  { key: 'Required Changes', icon: Info },
  { key: 'Version History', icon: History },
]

const DECISIONS = [
  { key: 'approved', label: 'Approve Dataset', desc: 'Data is accurate and complete', icon: CheckCircle2, bg: 'bg-status-approved/10', border: 'border-status-approved', text: 'text-status-approved' },
  { key: 'changes_requested', label: 'Request Changes', icon: AlertTriangle, bg: 'bg-status-review/10', border: 'border-status-review', text: 'text-status-review' },
  { key: 'rejected', label: 'Reject Dataset', desc: 'Dataset cannot be approved', icon: XCircle, bg: 'bg-status-pending/10', border: 'border-status-pending', text: 'text-status-pending' },
]

/**
 * Review Center: dataset/version data, reviewer assignment, comments
 * (including 'field'-kind as the real equivalent of "Required Changes"),
 * approve/reject/request-changes — all real, from prior work.
 *
 * Data Preview and Validation are now ALSO real, backed by Layer 1's
 * extracted KpiValue data (see app/api/routes/reviews.py's
 * get_kpi_validation and app/api/routes/kpi_values.py). Both correctly
 * show an honest "Not available yet" state until a version has actually
 * been approved and its data extracted — this is not a placeholder
 * anymore, it's the real, current, backend-reported availability.
 *
 * Validation is PROVISIONAL v1 structural/data-quality checking only —
 * no ESG methodology, no scoring, no emission factors, no benchmarking.
 * See the backend endpoint's own docstring for the exact rule set.
 *
 * Honestly still NOT real, by explicit decision (not fabricated):
 * Supporting Documents listing — no backend endpoint exists to list a
 * version's files (only single-file download by known public_id).
 */
export default function ReviewDataWorkspace({ dataset, companyName, uploaderName, currentUser, onBack, pushToast }) {
  const [tab, setTab] = useState('Data Preview')
  const [visitedTabs, setVisitedTabs] = useState(new Set(['Data Preview']))
  const [selectedDecision, setSelectedDecision] = useState(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [decisionError, setDecisionError] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [newChange, setNewChange] = useState('')
  const [commentError, setCommentError] = useState(null)

  const versionsQuery = useDatasetVersions(dataset.public_id)
  const versions = useMemo(() => versionsQuery.data || [], [versionsQuery.data])
  // The highest version_number is always the current/active one — version
  // numbers only increase (confirmed in create_new_version's backend logic).
  // Note: DatasetRead exposes no internal `id`, only `public_id`, and
  // DatasetVersionRead exposes no `id` either — so matching against
  // dataset.current_version_id isn't possible from the frontend at all;
  // this version_number-based approach is the only viable one.
  const currentVersion = useMemo(() => {
    if (!versions.length) return null
    return versions.slice().sort((a, b) => b.version_number - a.version_number)[0]
  }, [versions])

  const reviewsQuery = useReviews(dataset.public_id, currentVersion?.public_id, { enabled: !!currentVersion })
  const reviews = reviewsQuery.data || []
  const pendingReview = reviews.find((r) => r.status === 'pending')
  const isMyPendingReview = pendingReview && currentUser && pendingReview.reviewer_user_id === currentUser.id

  const commentsQuery = useComments(dataset.public_id, currentVersion?.public_id, { enabled: !!currentVersion })
  const comments = commentsQuery.data || []
  const generalComments = comments.filter((c) => c.kind !== 'field')
  const requiredChangeComments = comments.filter((c) => c.kind === 'field')

  // Data Preview + Validation, backed by Layer 1. Both are correctly
  // empty/unavailable until the version has actually been approved and
  // extracted — kpi_values only ever get created on approval (see
  // app/services/kpi_extraction_service.py), so no extra frontend
  // gating is needed beyond what the backend already enforces.
  const kpiValuesQuery = useKpiValues(
    { dataset_version_public_id: currentVersion?.public_id, page_size: 200 },
    { enabled: !!currentVersion }
  )
  const kpiValues = kpiValuesQuery.data?.items || []

  const kpiDefinitionsQuery = useKpiDefinitions()
  const kpiDefNameByCode = useMemo(() => {
    const map = new Map()
    for (const d of kpiDefinitionsQuery.data || []) map.set(d.code, d.display_name)
    return map
  }, [kpiDefinitionsQuery.data])

  // Site names resolved via the existing real sites endpoint, scoped to
  // this dataset's own company — same Map-resolution pattern used
  // throughout this project (no N+1, one query for the whole page).
  const sitesQuery = useSites({ company_id: dataset.company_id, page_size: 100 })
  const siteNameByPublicId = useMemo(() => {
    const map = new Map()
    for (const s of sitesQuery.data?.items || []) map.set(s.public_id, s.name)
    return map
  }, [sitesQuery.data])

  const validationQuery = useKpiValidation(dataset.public_id, currentVersion?.public_id, { enabled: !!currentVersion })

  const assignReview = useAssignReview()
  const decideReview = useDecideReview()
  const createComment = useCreateComment()

  function selectTab(t) {
    setTab(t)
    setVisitedTabs((prev) => new Set(prev).add(t))
  }

  async function handleStartReview() {
    if (!currentVersion || !currentUser) return
    setDecisionError(null)
    try {
      await assignReview.mutateAsync({
        datasetPublicId: dataset.public_id,
        versionPublicId: currentVersion.public_id,
        reviewerUserId: currentUser.id,
      })
      pushToast('Review started.')
    } catch (err) {
      setDecisionError(err.message || 'Could not start the review.')
    }
  }

  async function submitDecision() {
    if (!selectedDecision || !pendingReview || !currentVersion) return
    if (!decisionNote.trim()) {
      setDecisionError('A decision note is required.')
      return
    }
    setDecisionError(null)
    try {
      await decideReview.mutateAsync({
        datasetPublicId: dataset.public_id,
        versionPublicId: currentVersion.public_id,
        reviewPublicId: pendingReview.public_id,
        decision: selectedDecision,
        note: decisionNote.trim(),
      })
      const label = DECISIONS.find((d) => d.key === selectedDecision)?.label
      pushToast(`Review submitted — ${label}.`)
      setSelectedDecision(null)
      setDecisionNote('')
    } catch (err) {
      if (err.status === 409 && err.code === 'already_decided') {
        setDecisionError('This review has already been decided.')
      } else if (err.status === 403 && err.code === 'segregation_of_duties') {
        setDecisionError('The uploader of this version cannot also approve it.')
      } else if (err.status === 403 && err.code === 'not_assigned_reviewer') {
        setDecisionError('You are not the assigned reviewer for this review.')
      } else {
        setDecisionError(err.message || 'Could not submit the decision.')
      }
    }
  }

  async function handleAddComment(kind, text, setter) {
    if (!text.trim() || !currentVersion) return
    setCommentError(null)
    try {
      await createComment.mutateAsync({
        datasetPublicId: dataset.public_id,
        versionPublicId: currentVersion.public_id,
        body: { body: text.trim(), kind },
      })
      setter('')
    } catch (err) {
      setCommentError(err.message || 'Could not add the comment.')
    }
  }

  const title = `${dataset.reporting_period_start} to ${dataset.reporting_period_end} — Upload Type #${dataset.upload_type_id}`

  const checklist = [
    { label: 'Dataset opened', done: true },
    { label: 'Data preview inspected', done: visitedTabs.has('Data Preview') },
    { label: 'Validation results reviewed', done: visitedTabs.has('Validation') },
    { label: 'Comments added', done: generalComments.length > 0 },
    { label: 'Required changes reviewed', done: visitedTabs.has('Required Changes') },
    { label: 'Decision made', done: !!currentVersion && ['approved', 'rejected', 'changes_requested'].includes(currentVersion.status) },
  ]

  if (versionsQuery.isLoading) {
    return <LoadingState label="Loading dataset…" />
  }
  if (versionsQuery.isError) {
    return <ErrorState message={versionsQuery.error?.message || 'Could not load this dataset.'} onRetry={() => versionsQuery.refetch()} />
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900 mb-1">Review Data</h1>
      <p className="text-xs text-ink-500 mb-3">Dataset review workspace</p>
      <button onClick={onBack} className="flex items-center gap-1 text-[10px] text-ink-500 hover:text-ink-900 mb-6">
        <ChevronLeft size={13} /> Back to Datasets
      </button>

      <h2 className="text-lg font-semibold text-ink-900 mb-1">{title}</h2>
      <p className="text-[10px] text-ink-500 mb-4">
        {companyName} · Submitted by {uploaderName} on {new Date(dataset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div>
          <div className="bg-white border border-surface-border rounded-lg p-5 mb-4">
            <p className="text-xs font-semibold text-ink-900 mb-4">Dataset Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px]">
              <div><div className="text-[8px] text-ink-300">Company</div><div className="text-ink-900 font-medium">{companyName}</div></div>
              <div><div className="text-[8px] text-ink-300">Upload Type</div><div className="text-ink-900 font-medium">#{dataset.upload_type_id}</div></div>
              <div><div className="text-[8px] text-ink-300">Reporting Period</div><div className="text-ink-900 font-medium">{dataset.reporting_period_start} – {dataset.reporting_period_end}</div></div>
              <div><div className="text-[8px] text-ink-300">Status</div><div className="text-ink-900 font-medium">{dataset.status}</div></div>
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
            <div className="flex border-b border-surface-border overflow-x-auto">
              {TABS.map((t) => {
                const TIcon = t.icon
                return (
                  <button
                    key={t.key}
                    onClick={() => selectTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-medium whitespace-nowrap border-b-2 ${
                      tab === t.key ? 'border-brand-green text-brand-greenDark' : 'border-transparent text-ink-500'
                    }`}
                  >
                    <TIcon size={13} /> {t.key}
                  </button>
                )
              })}
            </div>

            <div className="p-5">
              {tab === 'Data Preview' && (
                kpiValuesQuery.isLoading || kpiDefinitionsQuery.isLoading || sitesQuery.isLoading ? (
                  <LoadingState label="Loading data preview…" />
                ) : kpiValuesQuery.isError ? (
                  <ErrorState
                    message={kpiValuesQuery.error?.message || 'Could not load the data preview.'}
                    onRetry={() => kpiValuesQuery.refetch()}
                  />
                ) : kpiValues.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText size={28} className="text-ink-200 mx-auto mb-3" />
                    <p className="text-xs font-medium text-ink-700 mb-1">Not available yet</p>
                    <p className="text-[10px] text-ink-300 max-w-sm mx-auto leading-relaxed">
                      Structured data preview appears once this version has been approved and its
                      data extracted. You can download the original file to inspect its contents directly.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[9px] text-ink-300 mb-3">
                      {kpiValues.length} extracted value{kpiValues.length === 1 ? '' : 's'} — raw, as-reported figures, traced back to their exact source row.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[9px]">
                        <thead>
                          <tr className="text-left text-ink-500 border-b border-surface-border">
                            <th className="font-medium py-2 pr-3">Site</th>
                            <th className="font-medium py-2 pr-3">KPI</th>
                            <th className="font-medium py-2 pr-3">Value</th>
                            <th className="font-medium py-2 pr-3">Unit</th>
                            <th className="font-medium py-2 pr-3">Details</th>
                            <th className="font-medium py-2">Source Row</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kpiValues.map((kv) => (
                            <tr key={kv.public_id} className="border-b border-surface-border last:border-0">
                              <td className="py-2.5 pr-3 text-ink-900 font-medium">
                                {kv.site_public_id ? (siteNameByPublicId.get(kv.site_public_id) || 'Unknown site') : '—'}
                              </td>
                              <td className="py-2.5 pr-3 text-ink-700">{kpiDefNameByCode.get(kv.kpi_code) || kv.kpi_code}</td>
                              <td className="py-2.5 pr-3 text-ink-900 font-medium">{kv.value}</td>
                              <td className="py-2.5 pr-3 text-ink-500">{kv.unit}</td>
                              <td className="py-2.5 pr-3 text-ink-500">
                                {Object.entries(kv.attributes || {}).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ') || '—'}
                              </td>
                              <td className="py-2.5 text-ink-300">Row {kv.source_row_number}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {tab === 'Validation' && (
                validationQuery.isLoading ? (
                  <LoadingState label="Running validation…" />
                ) : validationQuery.isError ? (
                  <ErrorState
                    message={validationQuery.error?.message || 'Could not load validation results.'}
                    onRetry={() => validationQuery.refetch()}
                  />
                ) : !validationQuery.data?.is_available ? (
                  <div className="text-center py-10">
                    <ShieldCheck size={28} className="text-ink-200 mx-auto mb-3" />
                    <p className="text-xs font-medium text-ink-700 mb-1">Not available yet</p>
                    <p className="text-[10px] text-ink-300 max-w-sm mx-auto leading-relaxed">
                      Validation results appear once this version has been approved and its data extracted.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[9px] text-ink-300 mb-4 leading-relaxed">
                      Structural data-quality checks only — not a compliance, scoring, or benchmarking review.
                    </p>
                    {validationQuery.data.errors.length === 0 && validationQuery.data.warnings.length === 0 ? (
                      <div className="flex items-center gap-2 text-status-approved text-xs font-medium py-4">
                        <CheckCircle2 size={16} /> No issues found.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {validationQuery.data.errors.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-status-pending mb-2 flex items-center gap-1.5">
                              <AlertOctagon size={13} /> Blocking Issues ({validationQuery.data.errors.length})
                            </p>
                            <div className="space-y-1.5">
                              {validationQuery.data.errors.map((e, i) => (
                                <div key={i} className="text-[10px] text-ink-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                                  {e.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {validationQuery.data.warnings.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-status-review mb-2 flex items-center gap-1.5">
                              <AlertTriangle size={13} /> Warnings ({validationQuery.data.warnings.length})
                            </p>
                            <div className="space-y-1.5">
                              {validationQuery.data.warnings.map((w, i) => (
                                <div key={i} className="text-[10px] text-ink-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                                  {w.message}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}

              {tab === 'Required Changes' && (
                <div>
                  <p className="text-xs font-semibold text-ink-900 mb-1">Required Changes</p>
                  <p className="text-[9px] text-ink-300 mb-4">Field-specific corrections requested on this dataset.</p>
                  {commentError && <p className="text-[9px] text-status-pending mb-3">{commentError}</p>}
                  <div className="space-y-2 mb-4">
                    {requiredChangeComments.length === 0 ? (
                      <p className="text-[10px] text-ink-300">No required changes recorded yet.</p>
                    ) : requiredChangeComments.map((rc, i) => (
                      <div key={rc.public_id} className="flex items-start gap-3 border border-surface-border rounded-md px-3 py-2.5">
                        <span className="w-4 h-4 rounded-full bg-ink-100 text-ink-700 text-[8px] font-medium flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-[10px] text-ink-700">{rc.body}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newChange}
                      onChange={(e) => setNewChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment('field', newChange, setNewChange)}
                      placeholder="Describe a required correction clearly......."
                      className="flex-1 px-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                    />
                    <Button size="sm" onClick={() => handleAddComment('field', newChange, setNewChange)}>Send</Button>
                  </div>
                </div>
              )}

              {tab === 'Version History' && (
                <div>
                  <p className="text-xs font-semibold text-ink-900 mb-4">Version History</p>
                  <table className="w-full text-[8px]">
                    <thead>
                      <tr className="text-left text-ink-500 border-b border-surface-border">
                        <th className="font-medium py-2 pr-2">Version</th>
                        <th className="font-medium py-2 pr-2">Status</th>
                        <th className="font-medium py-2 pr-2">Submitted At</th>
                        <th className="font-medium py-2">Decision Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versions.slice().sort((a, b) => a.version_number - b.version_number).map((v) => (
                        <tr key={v.public_id} className="border-b border-surface-border last:border-0">
                          <td className="py-2.5 pr-2 text-ink-900 font-medium">v{v.version_number}</td>
                          <td className="py-2.5 pr-2 text-status-review font-medium">{v.status}</td>
                          <td className="py-2.5 pr-2 text-ink-500">{v.submitted_at ? new Date(v.submitted_at).toLocaleString() : '—'}</td>
                          <td className="py-2.5 text-ink-500">{v.review_decision_summary ? `${v.review_decision_summary.status} by ${v.review_decision_summary.reviewer_public_id}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[8px] text-ink-300 mt-3 leading-relaxed">
                    All versions are retained for audit purposes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-surface-border rounded-lg p-5">
            <p className="text-xs font-semibold text-ink-900 mb-3">Review Decision</p>

            {decisionError && (
              <p className="text-[9px] text-status-pending bg-red-50 border border-red-100 rounded-md px-2.5 py-2 mb-3">{decisionError}</p>
            )}

            {!currentVersion ? (
              <p className="text-[10px] text-ink-300">No version found for this dataset.</p>
            ) : currentVersion.status === 'draft' ? (
              <p className="text-[10px] text-ink-300">This dataset has not been submitted for review yet.</p>
            ) : currentVersion.status === 'submitted' ? (
              <Button className="w-full" onClick={handleStartReview} disabled={assignReview.isPending}>
                {assignReview.isPending ? 'Starting…' : 'Start Review'}
              </Button>
            ) : currentVersion.status === 'under_review' && isMyPendingReview ? (
              <>
                <div className="space-y-2 mb-3">
                  {DECISIONS.map((d) => {
                    const DIcon = d.icon
                    const selected = selectedDecision === d.key
                    return (
                      <button
                        key={d.key}
                        onClick={() => setSelectedDecision(d.key)}
                        className={`w-full text-left px-3 py-2.5 rounded-md border-2 transition-all ${d.bg} ${selected ? d.border : 'border-transparent'}`}
                      >
                        <p className="text-[10px] font-semibold flex items-center gap-1.5 text-ink-900">
                          <DIcon size={13} className={d.text} /> {d.label}
                        </p>
                        <p className={`text-[8px] mt-0.5 ${d.text}`}>{d.desc}</p>
                      </button>
                    )
                  })}
                </div>
                <textarea
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Decision note (required)....."
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20 mb-3"
                />
                <Button className="w-full" onClick={submitDecision} disabled={!selectedDecision || decideReview.isPending}>
                  {decideReview.isPending ? 'Submitting…' : 'Submit Review'}
                </Button>
              </>
            ) : currentVersion.status === 'under_review' ? (
              <p className="text-[10px] text-ink-300">
                Currently under review{pendingReview ? ` by user #${pendingReview.reviewer_user_id}` : ''}.
              </p>
            ) : (
              <div>
                <p className="text-[10px] font-medium text-ink-900 mb-1 capitalize">{currentVersion.status.replace('_', ' ')}</p>
                {currentVersion.review_decision_summary && (
                  <p className="text-[9px] text-ink-500">
                    Decided by {currentVersion.review_decision_summary.reviewer_public_id} on{' '}
                    {new Date(currentVersion.review_decision_summary.decided_at).toLocaleDateString()}.
                    {currentVersion.review_decision_summary.note_excerpt && ` "${currentVersion.review_decision_summary.note_excerpt}"`}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-surface-border">
              <p className="text-[9px] font-medium text-ink-700 mb-2">Comments</p>
              {commentsQuery.isLoading ? (
                <p className="text-[9px] text-ink-300">Loading…</p>
              ) : generalComments.length === 0 ? (
                <p className="text-[9px] text-ink-300 mb-2">No comments yet.</p>
              ) : (
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {generalComments.map((c) => (
                    <div key={c.public_id} className="border border-surface-border rounded-md px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-medium text-ink-900">User #{c.author_user_id}</span>
                        <span className="text-[8px] text-ink-300">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[9px] text-ink-700 mt-0.5">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment....."
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-surface-border text-[10px] placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-green/20 mb-2"
              />
              <Button size="sm" className="w-full" onClick={() => handleAddComment('general', newComment, setNewComment)} disabled={createComment.isPending}>
                {createComment.isPending ? 'Adding…' : 'Add Comment'}
              </Button>
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-lg p-5">
            <p className="text-xs font-semibold text-ink-900 mb-3">Supporting Documents</p>
            <p className="text-[9px] text-ink-300">
              Not available yet — listing individual files attached to this version is coming in a
              later phase. Files were uploaded and are stored securely.
            </p>
          </div>

          <div className="bg-white border border-surface-border rounded-lg p-5">
            <p className="text-xs font-semibold text-ink-900 mb-3">Review Checklist</p>
            <div className="space-y-2.5">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-[10px]">
                  {c.done ? <CheckCircle size={14} className="text-status-approved shrink-0" /> : <Circle size={14} className="text-ink-200 shrink-0" />}
                  <span className={c.done ? 'text-ink-700' : 'text-ink-300'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
