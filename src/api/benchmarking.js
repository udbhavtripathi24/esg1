/**
 * Benchmarking API. Peer comparison against BRSR Core KPIs.
 *
 * All comparison figures are computed server-side by deterministic code
 * (see app/services/benchmarking_data.py). The AI layer narrates those
 * numbers -- it never produces them.
 */
import { apiClient } from './client.js'

export function getBenchmarkFilters() {
  return apiClient.get('/benchmarking/filters')
}

export function getBenchmarkOverview(params = {}) {
  return apiClient.get('/benchmarking/overview', { params })
}

export function getKpiComparison(params = {}) {
  return apiClient.get('/benchmarking/kpi-comparison', { params })
}

export function getPillarSummary(params = {}) {
  return apiClient.get('/benchmarking/pillars', { params })
}

export function getBenchmarkTrend(params = {}) {
  return apiClient.get('/benchmarking/trend', { params })
}

export function getBenchmarkAiInsights(params = {}) {
  return apiClient.get('/benchmarking/ai-insights', { params })
}
