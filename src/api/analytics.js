/**
 * Analytics API. Plain async functions using the existing apiClient.
 *
 * Backend contract (verified against app/api/routes/analytics.py):
 *   GET /analytics/summary?kpi_code=&period_start=&period_end=
 *   GET /analytics/domains?period_start=&period_end=
 *   GET /analytics/trend?kpi_code=
 *   GET /analytics/period-comparison?kpi_code=&period_start=&period_end=
 *   GET /analytics/completeness?period_start=&period_end=
 *   GET /analytics/energy-breakdown?period_start=&period_end=
 *
 * company_id is NEVER sent by a client actor — the backend always derives
 * it from the authenticated actor and ignores any client-supplied value.
 */
import { apiClient } from './client.js'

export function getKpiSummary(kpiCode, periodStart, periodEnd) {
  return apiClient.get('/analytics/summary', { params: { kpi_code: kpiCode, period_start: periodStart, period_end: periodEnd } })
}

export function getDomainSummary(periodStart, periodEnd) {
  return apiClient.get('/analytics/domains', { params: { period_start: periodStart, period_end: periodEnd } })
}

export function getHistoricalTrend(kpiCode) {
  return apiClient.get('/analytics/trend', { params: { kpi_code: kpiCode } })
}

export function getPeriodComparison(kpiCode, periodStart, periodEnd) {
  return apiClient.get('/analytics/period-comparison', { params: { kpi_code: kpiCode, period_start: periodStart, period_end: periodEnd } })
}

export function getCompleteness(periodStart, periodEnd) {
  return apiClient.get('/analytics/completeness', { params: { period_start: periodStart, period_end: periodEnd } })
}

export function getEnergyBreakdown(periodStart, periodEnd) {
  return apiClient.get('/analytics/energy-breakdown', { params: { period_start: periodStart, period_end: periodEnd } })
}
