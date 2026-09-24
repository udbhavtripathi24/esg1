import { useQuery } from '@tanstack/react-query'
import {
  getBenchmarkFilters, getBenchmarkOverview, getKpiComparison,
  getPillarSummary, getBenchmarkTrend, getBenchmarkAiInsights,
  getPeers, getHeadToHead, getScatter, getSimulation,
  getAnalysisModes, getAnalysis,
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


export function usePeers(params) {
  return useQuery({ queryKey: ['benchmarking', 'peers', params], queryFn: () => getPeers(params) })
}

export function useHeadToHead(params) {
  return useQuery({
    queryKey: ['benchmarking', 'h2h', params],
    queryFn: () => getHeadToHead(params),
    enabled: !!params?.peer,
  })
}

export function useScatter(params) {
  return useQuery({
    queryKey: ['benchmarking', 'scatter', params],
    queryFn: () => getScatter(params),
    enabled: !!params?.x_kpi && !!params?.y_kpi,
  })
}

export function useSimulation(params) {
  return useQuery({
    queryKey: ['benchmarking', 'simulate', params],
    queryFn: () => getSimulation(params),
    enabled: !!params?.kpi_code,
  })
}

export function useAnalysisModes() {
  return useQuery({ queryKey: ['benchmarking', 'analysis-modes'], queryFn: getAnalysisModes })
}

export function useAnalysis(params) {
  return useQuery({ queryKey: ['benchmarking', 'analysis', params], queryFn: () => getAnalysis(params) })
}
