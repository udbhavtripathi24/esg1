import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  FileText, ClipboardCheck, Download, Plus, RefreshCw, CheckCircle2, XCircle, Loader2, ClipboardList, Lock,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, StatusPill, EmptyState, Field, Select, ProgressBar } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { API_ORIGIN } from '../../api/client.js'
import {
  useReadiness, useReportsList, useReport, useReportVersions, useReportVersion,
  useCreateReport, useRegenerateReport, useSubmitReportForReview, useDecideReport,
  usePublishReport, useDownloadReport,
} from '../../hooks/useReporting.js'
import { useResponseSets, useResponseSet } from '../../hooks/useBrsr.js'
import { downloadPreview } from '../../api/brsr.js'
import StatusBadge from '../../components/brsr/StatusBadge.jsx'
import { fyPeriod } from '../../components/brsr/format.js'

/**
 * Reporting. Two report types, both real:
 * - BRSR (SEBI format), generated from a fully approved BRSR response set
 *   (Upload Center → BRSR). The report is built from a frozen snapshot of
 *   the approved answers, so later edits never change an existing version.
 * - ESG Management Report, generated from approved KPI datasets.
 * No setTimeout simulations, no fake history: every state on this page
 * is what the backend reports.
 */

function errMessage(err, fallback) {
  return err?.data?.error?.message || err?.message || fallback
}

function currentQuarterRange() {
  const now = new Date()
  const year = now.getFullYear()
  const q = Math.floor(now.getMonth() / 3)
  const start = new Date(year, q * 3, 1)
  const end = new Date(year, q * 3 + 3, 0)
  const iso = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { periodStart: iso(start), periodEnd: iso(end), label: `Q${q + 1} ${year}` }
}

const STATUS_COLORS = {
  draft: 'bg-ink-100 text-ink-500', generating: 'bg-status-review/10 text-status-review',
  generated: 'bg-status-pending/10 text-status-pending', under_review: 'bg-status-review/10 text-status-review',
  changes_requested: 'bg-status-pending/10 text-status-pending', approved: 'bg-status-approved/10 text-status-approved',
  published: 'bg-brand-green/10 text-brand-green', failed: 'bg-red-100 text-red-600',
}

const TABS = ['BRSR', 'ESG Management Report']

export default function Reporting() {
  const [tab, setTab] = useState('BRSR')
  return (
    <div>
      <PageHeader title="Reporting" subtitle="Generate, review and publish your reports" />
      <div className="flex items-center gap-6 border-b border-surface-border mb-5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-xs -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-brand-green text-brand-green font-medium' : 'border-transparent text-ink-500 hover:text-ink-900'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'BRSR' ? <BrsrReporting /> : <EsgReporting />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BRSR
// ---------------------------------------------------------------------------

function BrsrReporting() {
  const { hasPermission } = useAuth()
  const setsQuery = useResponseSets(null)
  const [setId, setSetId] = useState(null)
  const sets = setsQuery.data || []
  const activeId = sets.some((s) => s.public_id === setId) ? setId : sets[0]?.public_id || null
  const ovQuery = useResponseSet(activeId)
  const reportsQuery = useReportsList({ page: 1, page_size: 100 })
  const createMutation = useCreateReport()
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [previewing, setPreviewing] = useState(null)
  const [previewError, setPreviewError] = useState(null)

  if (setsQuery.isLoading) return <Card><LoadingState label="Loading BRSR…" /></Card>
  if (setsQuery.isError) return <Card><ErrorState message={errMessage(setsQuery.error, 'Could not load BRSR.')} onRetry={() => setsQuery.refetch()} /></Card>
  if (!activeId) {
    return (
      <Card>
        <EmptyState icon={ClipboardList} title="No BRSR started yet"
          subtitle="Start the BRSR in Upload Center → BRSR. Once every section is approved, the report is generated here." />
      </Card>
    )
  }

  const ov = ovQuery.data
  const fy = sets.find((s) => s.public_id === activeId)?.financial_year
  const { start, end } = fy ? fyPeriod(fy) : {}
  const brsrReports = (reportsQuery.data?.items || []).filter((r) => r.report_type === 'brsr')
  const approved = ov ? ov.sections.filter((s) => s.status === 'approved').length : 0
  const existing = brsrReports.find((r) => r.reporting_period_start === start)
  const canGenerate = ov?.all_approved && hasPermission('report:generate') && !existing

  async function preview(fmt) {
    setPreviewing(fmt)
    setPreviewError(null)
    try { await downloadPreview(activeId, fmt) } catch (e) { setPreviewError(errMessage(e, 'Could not build the preview.')) } finally { setPreviewing(null) }
  }

  return (
    <div>
      <Card title="BRSR readiness" icon={ClipboardCheck} className="mb-5"
        subtitle="The report is generated from approved answers only. Every section must be approved first.">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div className="flex items-end gap-4">
            <div className="w-40">
              <Field label="Financial year">
                <Select value={activeId} onChange={(e) => { setSetId(e.target.value); setSelectedReportId(null) }}>
                  {sets.map((s) => <option key={s.public_id} value={s.public_id}>FY {s.financial_year}</option>)}
                </Select>
              </Field>
            </div>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">{approved}/11 <span className="text-sm font-normal text-ink-500">sections approved</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => preview('docx')} disabled={!!previewing}>
              {previewing === 'docx' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Draft preview (Word)
            </Button>
            <Button variant="ghost" size="sm" onClick={() => preview('pdf')} disabled={!!previewing}>
              {previewing === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Draft PDF
            </Button>
            <Button size="sm" disabled={!canGenerate || createMutation.isPending}
              title={existing ? 'A BRSR report for this year already exists — use "Generate new version" on it' : ov?.all_approved ? '' : 'All 11 sections must be approved'}
              onClick={() => createMutation.mutate({ periodStart: start, periodEnd: end, reportType: 'brsr' }, {
                onSuccess: (r) => setSelectedReportId(r.public_id),
              })}>
              {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : ov?.all_approved ? <Plus size={13} /> : <Lock size={13} />} Generate BRSR report
            </Button>
          </div>
        </div>
        <ProgressBar pct={(approved / 11) * 100} />
        {ov && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 mt-4">
            {ov.sections.map((s) => (
              <div key={s.code} className="border border-surface-border rounded-md px-2 py-2">
                <p className="text-[10px] font-semibold text-ink-900">{s.code.startsWith('P') ? `P${s.code.slice(1)}` : `Sec ${s.code}`}</p>
                <div className="mt-1"><StatusBadge status={s.status} /></div>
              </div>
            ))}
          </div>
        )}
        {previewError && <p className="text-[10px] text-status-pending mt-3">{previewError}</p>}
        {createMutation.isError && <p className="text-[10px] text-status-pending mt-3">{errMessage(createMutation.error, 'Could not generate the report.')}</p>}
        <p className="text-[9px] text-ink-500 mt-3">Draft previews are watermarked “DRAFT — not for filing” and are never stored.</p>
      </Card>

      <ReportsLayout reports={brsrReports} loading={reportsQuery.isLoading} error={reportsQuery.isError}
        onRetry={() => reportsQuery.refetch()} selectedReportId={selectedReportId} onSelect={setSelectedReportId}
        emptySubtitle="Generate the BRSR above once every section is approved." />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ESG management report (unchanged behaviour)
// ---------------------------------------------------------------------------

function EsgReporting() {
  const { periodStart, periodEnd, label } = currentQuarterRange()
  const [selectedReportId, setSelectedReportId] = useState(null)
  const readinessQuery = useReadiness(periodStart, periodEnd)
  const reportsQuery = useReportsList({ page: 1, page_size: 100 })
  const createMutation = useCreateReport()
  const reports = (reportsQuery.data?.items || []).filter((r) => r.report_type !== 'brsr')

  return (
    <div>
      <Card title="Reporting Readiness" subtitle={`Based on approved, authoritative KPI data for ${label}`} className="mb-5">
        {readinessQuery.isLoading ? <LoadingState label="Checking readiness…" /> :
         readinessQuery.isError ? <ErrorState message="Could not load readiness." onRetry={() => readinessQuery.refetch()} /> : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-semibold text-ink-900">
                {readinessQuery.data.completeness.approved_count}/{readinessQuery.data.completeness.total} domains ready
              </p>
              <Button onClick={() => createMutation.mutate({ periodStart, periodEnd })} disabled={createMutation.isPending}>
                <Plus size={15} /> Generate Report
              </Button>
            </div>
            {readinessQuery.data.outstanding.length > 0 && (
              <div className="text-[10px] text-status-review mb-2">
                Outstanding review actions: {readinessQuery.data.outstanding.map((o) => `${o.upload_type_code} (${o.status})`).join(', ')}
              </div>
            )}
            {createMutation.isError && (
              <p className="text-[10px] text-red-600 mt-2">{errMessage(createMutation.error, 'Could not create report.')}</p>
            )}
          </div>
        )}
      </Card>
      <ReportsLayout reports={reports} loading={reportsQuery.isLoading} error={reportsQuery.isError}
        onRetry={() => reportsQuery.refetch()} selectedReportId={selectedReportId} onSelect={setSelectedReportId}
        emptySubtitle="Generate one above once your data is ready." />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared report list + lifecycle
// ---------------------------------------------------------------------------

function ReportsLayout({ reports, loading, error, onRetry, selectedReportId, onSelect, emptySubtitle }) {
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <Card title="Reports" padded={false}>
        {loading ? <LoadingState label="Loading…" /> :
         error ? <ErrorState message="Could not load reports." onRetry={onRetry} /> :
         reports.length === 0 ? <EmptyState icon={FileText} title="No reports yet" subtitle={emptySubtitle} /> : (
          <div className="divide-y divide-surface-border">
            {reports.map((r) => (
              <button key={r.public_id} onClick={() => onSelect(r.public_id)}
                className={`w-full text-left px-4 py-3 hover:bg-surface-muted/50 ${selectedReportId === r.public_id ? 'bg-surface-muted/70' : ''}`}>
                <p className="text-xs font-medium text-ink-900">{reportTitle(r)}</p>
                <p className="text-[10px] text-ink-400 mt-0.5">v{r.current_version?.version_number} · {r.current_version?.status?.replace('_', ' ')}</p>
              </button>
            ))}
          </div>
        )}
      </Card>
      {selectedReportId ? <ReportDetail reportId={selectedReportId} /> : (
        <Card><EmptyState icon={FileText} title="Select a report" subtitle="Choose a report on the left to see its history and status." /></Card>
      )}
    </div>
  )
}

function reportTitle(r) {
  if (r.report_type === 'brsr') {
    const y = Number(r.reporting_period_start.slice(0, 4))
    return `BRSR FY ${y}-${String(y + 1).slice(-2)}`
  }
  return `${r.reporting_period_start} — ${r.reporting_period_end}`
}

function ReportDetail({ reportId }) {
  const { user } = useAuth()
  const reportQuery = useReport(reportId)
  const versionsQuery = useReportVersions(reportId)
  const regenerateMutation = useRegenerateReport()
  const publishMutation = usePublishReport()
  const downloadMutation = useDownloadReport()

  if (reportQuery.isLoading || versionsQuery.isLoading) return <Card><LoadingState label="Loading report…" /></Card>
  if (reportQuery.isError) return <Card><ErrorState message="Could not load report." onRetry={() => reportQuery.refetch()} /></Card>

  const report = reportQuery.data
  const versions = versionsQuery.data || []
  const current = versions[versions.length - 1]

  return (
    <div className="space-y-4">
      <Card title={reportTitle(report)} subtitle="Version history">
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.public_id} className="flex items-center justify-between border-b border-surface-border pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-xs font-medium text-ink-900">Version {v.version_number}</p>
                <p className="text-[10px] text-ink-400">Created {new Date(v.created_at).toLocaleString()}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${STATUS_COLORS[v.status] || 'bg-ink-100 text-ink-500'}`}>
                {v.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {current && (
        <VersionActions
          reportId={reportId} versionId={current.public_id} reportType={report.report_type}
          currentUserId={user?.id}
          onRegenerate={() => regenerateMutation.mutate({ reportId, versionId: current.public_id })}
          regenerateError={regenerateMutation.isError ? errMessage(regenerateMutation.error, 'Could not create a new version.') : null}
          onPublish={() => publishMutation.mutate({ reportId, versionId: current.public_id })}
          onDownload={async (format = 'docx') => {
            const res = await downloadMutation.mutateAsync({ reportId, versionId: current.public_id, format })
            window.open(res.url.startsWith('http') ? res.url : `${API_ORIGIN}${res.url}`, '_blank')
          }}
          regenerating={regenerateMutation.isPending}
        />
      )}
    </div>
  )
}

function DownloadButtons({ formats, onDownload, primaryLabel = 'Download' }) {
  return (
    <>
      <Button variant="ghost" onClick={() => onDownload('docx')}><Download size={14} /> {primaryLabel} Word</Button>
      {formats?.includes('pdf') && <Button variant="ghost" onClick={() => onDownload('pdf')}><Download size={14} /> PDF</Button>}
    </>
  )
}

function VersionActions({ reportId, versionId, reportType, currentUserId, onRegenerate, regenerateError, onPublish, onDownload, regenerating }) {
  const versionQuery = useReportVersion(reportId, versionId)
  const submitMutation = useSubmitReportForReview()
  const decideMutation = useDecideReport()
  const [note, setNote] = useState('')
  const qc = useQueryClient()
  const status = versionQuery.data?.status

  // Only this panel polls while generating. When the status settles, refresh
  // the version history and report list too, so they never show a stale
  // "generating" next to a finished version.
  useEffect(() => {
    if (!status || status === 'generating') return
    qc.invalidateQueries({ queryKey: ['reports', 'versions', reportId] })
    qc.invalidateQueries({ queryKey: ['reports', 'list'] })
    qc.invalidateQueries({ queryKey: ['reports', 'detail', reportId] })
  }, [status, reportId, qc])

  if (versionQuery.isLoading) return <Card><LoadingState label="Checking status…" /></Card>
  const detail = versionQuery.data
  const isBrsr = reportType === 'brsr'

  return (
    <Card title="Current Version" subtitle={`Status: ${detail.status.replace('_', ' ')}`}>
      {detail.status === 'generating' && (
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <RefreshCw size={14} className="animate-spin" /> Generating your report…
        </div>
      )}

      {detail.status === 'failed' && (
        <div>
          <p className="text-xs text-red-600 mb-3">Generation failed: {detail.failure_reason || 'Unknown error'}</p>
          <Button onClick={onRegenerate} disabled={regenerating}>Retry</Button>
        </div>
      )}

      {detail.status === 'generated' && (
        <div className="space-y-3">
          <p className="text-[10px] text-ink-400">
            {isBrsr
              ? `Built from the approved BRSR answers frozen at generation (fingerprint ${detail.content_hash?.slice(0, 12)}).`
              : `${detail.kpi_value_count} approved KPI value(s) included.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <DownloadButtons formats={detail.formats} onDownload={onDownload} primaryLabel="Preview" />
            <Button onClick={() => submitMutation.mutate({ reportId, versionId, reviewerUserId: currentUserId })}>
              <ClipboardCheck size={14} /> Submit for Review
            </Button>
          </div>
        </div>
      )}

      {detail.status === 'under_review' && (
        <div className="space-y-3">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Review note (required)"
            className="w-full text-xs border border-surface-border rounded-md p-2" rows={2} />
          <div className="flex flex-wrap gap-2">
            <DownloadButtons formats={detail.formats} onDownload={onDownload} primaryLabel="Preview" />
            <Button onClick={() => decideMutation.mutate({ reportId, versionId, decision: 'approved', note })} disabled={!note.trim()}>
              <CheckCircle2 size={14} /> Approve
            </Button>
            <Button variant="ghost" onClick={() => decideMutation.mutate({ reportId, versionId, decision: 'changes_requested', note })} disabled={!note.trim()}>
              <XCircle size={14} /> Request Changes
            </Button>
          </div>
          {decideMutation.isError && <p className="text-[10px] text-status-pending">{errMessage(decideMutation.error, 'Could not record the decision.')}</p>}
        </div>
      )}

      {detail.status === 'changes_requested' && (
        <div>
          <p className="text-xs text-status-pending mb-3">
            Changes were requested on this version.{isBrsr ? ' Reopen and fix the relevant BRSR sections, get them approved again, then generate a new version.' : ''}
          </p>
          <Button onClick={onRegenerate} disabled={regenerating}>Generate New Version</Button>
          {regenerateError && <p className="text-[10px] text-status-pending mt-2">{regenerateError}</p>}
        </div>
      )}

      {detail.status === 'approved' && <Button onClick={onPublish}>Publish</Button>}

      {detail.status === 'published' && (
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status="Published" />
          <DownloadButtons formats={detail.formats} onDownload={onDownload} />
        </div>
      )}
    </Card>
  )
}
