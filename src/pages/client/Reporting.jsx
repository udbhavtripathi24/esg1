import { useState } from 'react'
import { FileText, ClipboardCheck, Download, Plus, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import PageHeader from '../../components/PageHeader.jsx'
import { Card, Button, StatusPill, EmptyState } from '../../components/ui.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { API_ORIGIN } from '../../api/client.js'
import {
  useReadiness, useReportsList, useReport, useReportVersions, useReportVersion,
  useCreateReport, useRegenerateReport, useSubmitReportForReview, useDecideReport,
  usePublishReport, useDownloadReport,
} from '../../hooks/useReporting.js'

/**
 * Reporting V1 -- real Reporting Readiness and real Report Generation
 * only. No fake "Generate Report" button, no setTimeout simulation, no
 * fake report history, no fake framework readiness. See
 * app/services/report_generation_worker.py and
 * app/api/routes/reports.py for the full backend this page is wired to.
 *
 * Report generation produces a real DOCX built entirely from approved,
 * authoritative KPI data -- no ESG score, no CO2e, no Scope 1/2/3, no
 * framework compliance statement anywhere in the generated document.
 */

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

export default function Reporting() {
  const { periodStart, periodEnd, label } = currentQuarterRange()
  const [selectedReportId, setSelectedReportId] = useState(null)

  const readinessQuery = useReadiness(periodStart, periodEnd)
  const reportsQuery = useReportsList()
  const createMutation = useCreateReport()

  return (
    <div>
      <PageHeader title="Reporting" subtitle={`Data readiness and report generation for ${label}`} />

      <Card title="Reporting Readiness" subtitle={`Based on approved, authoritative KPI data for ${label}`} className="mb-5">
        {readinessQuery.isLoading ? <LoadingState label="Checking readiness…" /> :
         readinessQuery.isError ? <ErrorState message="Could not load readiness." onRetry={() => readinessQuery.refetch()} /> : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-semibold text-ink-900">
                {readinessQuery.data.completeness.approved_count}/{readinessQuery.data.completeness.total} domains ready
              </p>
              <Button
                onClick={() => createMutation.mutate({ periodStart, periodEnd })}
                disabled={createMutation.isPending}
              >
                <Plus size={15} /> Generate Report
              </Button>
            </div>
            {readinessQuery.data.outstanding.length > 0 && (
              <div className="text-[10px] text-status-review mb-2">
                Outstanding review actions: {readinessQuery.data.outstanding.map((o) => `${o.upload_type_code} (${o.status})`).join(', ')}
              </div>
            )}
            {createMutation.isError && (
              <p className="text-[10px] text-red-600 mt-2">{createMutation.error?.data?.error?.message || 'Could not create report.'}</p>
            )}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <Card title="Reports" padded={false}>
          {reportsQuery.isLoading ? <LoadingState label="Loading…" /> :
           reportsQuery.isError ? <ErrorState message="Could not load reports." onRetry={() => reportsQuery.refetch()} /> :
           reportsQuery.data.items.length === 0 ? <EmptyState icon={FileText} title="No reports yet" subtitle="Generate one above once your data is ready." /> : (
            <div className="divide-y divide-surface-border">
              {reportsQuery.data.items.map((r) => (
                <button
                  key={r.public_id}
                  onClick={() => setSelectedReportId(r.public_id)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-muted/50 ${selectedReportId === r.public_id ? 'bg-surface-muted/70' : ''}`}
                >
                  <p className="text-xs font-medium text-ink-900">{r.reporting_period_start} — {r.reporting_period_end}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">v{r.current_version?.version_number} · {r.current_version?.status}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {selectedReportId ? (
          <ReportDetail reportId={selectedReportId} />
        ) : (
          <Card><EmptyState icon={FileText} title="Select a report" subtitle="Choose a report on the left to see its history and status." /></Card>
        )}
      </div>
    </div>
  )
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
      <Card title={`${report.reporting_period_start} — ${report.reporting_period_end}`} subtitle="Version history">
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
          reportId={reportId} versionId={current.public_id}
          currentUserId={user?.id}
          onRegenerate={() => regenerateMutation.mutate({ reportId, versionId: current.public_id })}
          onPublish={() => publishMutation.mutate({ reportId, versionId: current.public_id })}
          onDownload={async () => {
            const res = await downloadMutation.mutateAsync({ reportId, versionId: current.public_id })
            window.open(res.url.startsWith('http') ? res.url : `${API_ORIGIN}${res.url}`, '_blank')
          }}
          regenerating={regenerateMutation.isPending}
        />
      )}
    </div>
  )
}

function VersionActions({ reportId, versionId, currentUserId, onRegenerate, onPublish, onDownload, regenerating }) {
  const versionQuery = useReportVersion(reportId, versionId)
  const submitMutation = useSubmitReportForReview()
  const decideMutation = useDecideReport()
  const [note, setNote] = useState('')

  if (versionQuery.isLoading) return <Card><LoadingState label="Checking status…" /></Card>
  const detail = versionQuery.data

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
          <p className="text-[10px] text-ink-400">{detail.kpi_value_count} approved KPI value(s) included.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onDownload}><Download size={14} /> Preview</Button>
            <Button onClick={() => submitMutation.mutate({ reportId, versionId, reviewerUserId: currentUserId })}>
              <ClipboardCheck size={14} /> Submit for Review
            </Button>
          </div>
        </div>
      )}

      {detail.status === 'under_review' && (
        <div className="space-y-3">
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Review note (required)"
            className="w-full text-xs border border-surface-border rounded-md p-2"
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={() => decideMutation.mutate({ reportId, versionId, decision: 'approved', note })} disabled={!note.trim()}>
              <CheckCircle2 size={14} /> Approve
            </Button>
            <Button variant="ghost" onClick={() => decideMutation.mutate({ reportId, versionId, decision: 'changes_requested', note })} disabled={!note.trim()}>
              <XCircle size={14} /> Request Changes
            </Button>
          </div>
        </div>
      )}

      {detail.status === 'changes_requested' && (
        <div>
          <p className="text-xs text-status-pending mb-3">Changes were requested on this version.</p>
          <Button onClick={onRegenerate} disabled={regenerating}>Generate New Version</Button>
        </div>
      )}

      {detail.status === 'approved' && (
        <Button onClick={onPublish}>Publish</Button>
      )}

      {detail.status === 'published' && (
        <div className="flex items-center gap-3">
          <StatusPill status="Published" />
          <Button variant="ghost" onClick={onDownload}><Download size={14} /> Download</Button>
        </div>
      )}
    </Card>
  )
}
