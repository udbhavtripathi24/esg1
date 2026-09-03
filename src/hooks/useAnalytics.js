/**
 * React Query hooks for Analytics. Same pattern as useDashboard.js.
 *
 * Query keys include every dimension that affects the result (kpi code,
 * period) so there is no cross-KPI or cross-period cache collision.
 * Company/tenant identity is never a query-key dimension the USER
 * controls — it's implicit in which authenticated session is active,
 * and logout's existing queryClient.clear() (AuthContext.jsx) already
 * wipes all of these on session change, same as Dashboard's.
 */
import { useQuery } from '@tanstack/react-query'
import {
  getKpiSummary, getDomainSummary, getHistoricalTrend,
  getPeriodComparison, getCompleteness, getEnergyBreakdown,
} from '../api/analytics.js'

export function useKpiSummary(kpiCode, periodStart, periodEnd) {
  return useQuery({
    queryKey: ['analytics', 'summary', kpiCode, periodStart, periodEnd],
    queryFn: () => getKpiSummary(kpiCode, periodStart, periodEnd),
    enabled: !!kpiCode,
  })
}

export function useDomainSummary(periodStart, periodEnd) {
  return useQuery({
    queryKey: ['analytics', 'domains', periodStart, periodEnd],
    queryFn: () => getDomainSummary(periodStart, periodEnd),
  })
}

export function useHistoricalTrend(kpiCode) {
  return useQuery({
    queryKey: ['analytics', 'trend', kpiCode],
    queryFn: () => getHistoricalTrend(kpiCode),
    enabled: !!kpiCode,
  })
}

export function usePeriodComparison(kpiCode, periodStart, periodEnd) {
  return useQuery({
    queryKey: ['analytics', 'period-comparison', kpiCode, periodStart, periodEnd],
    queryFn: () => getPeriodComparison(kpiCode, periodStart, periodEnd),
    enabled: !!kpiCode,
  })
}

export function useCompleteness(periodStart, periodEnd) {
  return useQuery({
    queryKey: ['analytics', 'completeness', periodStart, periodEnd],
    queryFn: () => getCompleteness(periodStart, periodEnd),
  })
}

export function useEnergyBreakdown(periodStart, periodEnd) {
  return useQuery({
    queryKey: ['analytics', 'energy-breakdown', periodStart, periodEnd],
    queryFn: () => getEnergyBreakdown(periodStart, periodEnd),
  })
}
