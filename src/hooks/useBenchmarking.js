import { useQuery } from '@tanstack/react-query'
import {
  getBenchmarkFilters, getBenchmarkOverview, getKpiComparison,
  getPillarSummary, getBenchmarkTrend, getBenchmarkAiInsights,
} from '../api/benchmarking.js'

export function useBenchmarkFilters() {
  return useQuery({ queryKey: ['benchmarking', 'filters'], queryFn: getBenchmarkFilters })
}

export function useBenchmarkOverview(params) {
  return useQuery({ queryKey: ['benchmarking', 'overview', params], queryFn: () => getBenchmarkOverview(params) })
}

export function useKpiComparison(params) {
  return useQuery({
    queryKey: ['benchmarking', 'kpi-comparison', params],
    queryFn: () => getKpiComparison(params),
    enabled: !!params?.kpi_code,
  })
}

export function usePillarSummary(params) {
  return useQuery({ queryKey: ['benchmarking', 'pillars', params], queryFn: () => getPillarSummary(params) })
}

export function useBenchmarkTrend(params) {
  return useQuery({
    queryKey: ['benchmarking', 'trend', params],
    queryFn: () => getBenchmarkTrend(params),
    enabled: !!params?.kpi_code,
  })
}

export function useBenchmarkAiInsights(params) {
  return useQuery({ queryKey: ['benchmarking', 'ai-insights', params], queryFn: () => getBenchmarkAiInsights(params) })
}
