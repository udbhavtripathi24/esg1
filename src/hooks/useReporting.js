/**
 * React Query hooks for Reporting. Same pattern as useDashboard.js/
 * useAnalytics.js/useAdminConsole.js. Query keys include every
 * dimension that affects the result. Mutations invalidate the relevant
 * queries so the UI always reflects real backend state, never an
 * assumed "success" the moment a request is accepted.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReadiness, listReports, createReport, getReport, listReportVersions,
  getReportVersion, regenerateReport, submitReportForReview, decideReport,
  publishReport, getDownloadUrl,
} from '../api/reports.js'

export function useReadiness(periodStart, periodEnd) {
  return useQuery({
    queryKey: ['reporting', 'readiness', periodStart, periodEnd],
    queryFn: () => getReadiness(periodStart, periodEnd),
    enabled: !!periodStart && !!periodEnd,
  })
}

export function useReportsList(params = {}) {
  return useQuery({ queryKey: ['reports', 'list', params], queryFn: () => listReports(params) })
}

export function useReport(reportId) {
  return useQuery({ queryKey: ['reports', 'detail', reportId], queryFn: () => getReport(reportId), enabled: !!reportId })
}

export function useReportVersions(reportId) {
  return useQuery({ queryKey: ['reports', 'versions', reportId], queryFn: () => listReportVersions(reportId), enabled: !!reportId })
}

// Polls while generation is in flight -- stops once the version leaves
// a transient state, since there is no separate push/websocket channel.
export function useReportVersion(reportId, versionId) {
  return useQuery({
    queryKey: ['reports', 'version-detail', reportId, versionId],
    queryFn: () => getReportVersion(reportId, versionId),
    enabled: !!reportId && !!versionId,
    refetchInterval: (query) => (query.state.data?.status === 'generating' ? 2000 : false),
  })
}

export function useCreateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodStart, periodEnd }) => createReport(periodStart, periodEnd),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports', 'list'] }),
  })
}

export function useRegenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, versionId }) => regenerateReport(reportId, versionId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reports', 'versions', vars.reportId] })
      qc.invalidateQueries({ queryKey: ['reports', 'detail', vars.reportId] })
    },
  })
}

export function useSubmitReportForReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, versionId, reviewerUserId }) => submitReportForReview(reportId, versionId, reviewerUserId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reports', 'version-detail', vars.reportId, vars.versionId] })
      qc.invalidateQueries({ queryKey: ['reports', 'list'] })
      qc.invalidateQueries({ queryKey: ['reports', 'detail', vars.reportId] })
    },
  })
}

export function useDecideReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, versionId, decision, note }) => decideReport(reportId, versionId, decision, note),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reports', 'version-detail', vars.reportId, vars.versionId] })
      qc.invalidateQueries({ queryKey: ['reports', 'list'] })
      qc.invalidateQueries({ queryKey: ['reports', 'detail', vars.reportId] })
    },
  })
}

export function usePublishReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, versionId }) => publishReport(reportId, versionId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['reports', 'version-detail', vars.reportId, vars.versionId] })
      qc.invalidateQueries({ queryKey: ['reports', 'list'] })
      qc.invalidateQueries({ queryKey: ['reports', 'detail', vars.reportId] })
    },
  })
}

export function useDownloadReport() {
  return useMutation({ mutationFn: ({ reportId, versionId }) => getDownloadUrl(reportId, versionId) })
}
