/**
 * Reporting API. Plain async functions using the existing apiClient.
 *
 * Backend contract (verified against app/api/routes/reporting.py and
 * app/api/routes/reports.py, both real, tested, tenant-safe):
 *   GET  /reporting/readiness?period_start=&period_end=
 *   GET  /reports?page=&page_size=
 *   POST /reports {reporting_period_start, reporting_period_end}
 *   GET  /reports/{id}
 *   GET  /reports/{id}/versions
 *   GET  /reports/{id}/versions/{v}
 *   POST /reports/{id}/versions/{v}/regenerate
 *   POST /reports/{id}/versions/{v}/submit-review {reviewer_user_id}
 *   POST /reports/{id}/versions/{v}/decide {decision, note}
 *   POST /reports/{id}/versions/{v}/publish
 *   GET  /reports/{id}/versions/{v}/download
 *
 * company_id is NEVER sent by a client actor -- the backend always
 * derives it from the authenticated actor.
 */
import { apiClient } from './client.js'

export function getReadiness(periodStart, periodEnd) {
  return apiClient.get('/reporting/readiness', { params: { period_start: periodStart, period_end: periodEnd } })
}

export function listReports(params = {}) {
  return apiClient.get('/reports', { params })
}

export function createReport(periodStart, periodEnd) {
  return apiClient.post('/reports', { reporting_period_start: periodStart, reporting_period_end: periodEnd })
}

export function getReport(reportId) {
  return apiClient.get(`/reports/${reportId}`)
}

export function listReportVersions(reportId) {
  return apiClient.get(`/reports/${reportId}/versions`)
}

export function getReportVersion(reportId, versionId) {
  return apiClient.get(`/reports/${reportId}/versions/${versionId}`)
}

export function regenerateReport(reportId, versionId) {
  return apiClient.post(`/reports/${reportId}/versions/${versionId}/regenerate`)
}

export function submitReportForReview(reportId, versionId, reviewerUserId) {
  return apiClient.post(`/reports/${reportId}/versions/${versionId}/submit-review`, { reviewer_user_id: reviewerUserId })
}

export function decideReport(reportId, versionId, decision, note) {
  return apiClient.post(`/reports/${reportId}/versions/${versionId}/decide`, { decision, note })
}

export function publishReport(reportId, versionId) {
  return apiClient.post(`/reports/${reportId}/versions/${versionId}/publish`)
}

export function getDownloadUrl(reportId, versionId) {
  return apiClient.get(`/reports/${reportId}/versions/${versionId}/download`)
}
