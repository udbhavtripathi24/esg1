/**
 * Dashboard API. Plain async functions using the existing apiClient.
 *
 * Backend contract (verified against app/api/routes/dashboard.py):
 *   GET /dashboard/consultant                                -> ConsultantDashboardRead
 *   GET /dashboard/client?period_start=&period_end=          -> ClientDashboardRead
 *   GET /dashboard/client/tasks?period_start=&period_end=    -> DomainSubmissionStatusRead[]
 *
 * company_id is NEVER sent by a client actor — the backend always derives
 * it from the authenticated actor and ignores/rejects any client-supplied
 * value. It's only meaningful for a Deloitte actor previewing a specific
 * client (not used by any current screen, but the backend supports it).
 */
import { apiClient } from './client.js'

export function getConsultantDashboard() {
  return apiClient.get('/dashboard/consultant')
}

export function getClientDashboard(periodStart, periodEnd) {
  return apiClient.get('/dashboard/client', { params: { period_start: periodStart, period_end: periodEnd } })
}

export function getClientDashboardTasks(periodStart, periodEnd) {
  return apiClient.get('/dashboard/client/tasks', { params: { period_start: periodStart, period_end: periodEnd } })
}
