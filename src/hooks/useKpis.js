import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/kpis.js'

const own = (companyId) => companyId || 'own'

export function useKpiCatalogue(params, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['kpis', 'catalogue', own(companyId), params],
    queryFn: () => api.getCatalogue(params, companyId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useKpiSeries(params, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['kpis', 'series', own(companyId), params],
    queryFn: () => api.getSeries(params, companyId),
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(params?.codes),
  })
}

export function useKpiValues(params, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['kpis', 'values', own(companyId), params],
    queryFn: () => api.getValues(params, companyId),
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(params?.codes),
  })
}

export function useFrameworks(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: ['kpis', 'frameworks', own(companyId)], queryFn: () => api.getFrameworks(companyId), enabled })
}

export function useDomains(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: ['kpis', 'domains', own(companyId)], queryFn: () => api.getDomains(companyId), enabled })
}

export function useFactorDirectory(companyId) {
  return useQuery({ queryKey: ['kpis', 'factors', own(companyId)], queryFn: () => api.getFactorDirectory(companyId) })
}

function useKpiMutation(fn, keys) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: ['kpis', k] }))
      qc.invalidateQueries({ queryKey: ['audit-logs'] })
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] })
    },
  })
}

export const useSetSelection = (companyId) =>
  useKpiMutation(({ codes, enabled }) => api.setSelection(codes, enabled, companyId), ['catalogue'])
export const useSetFrameworks = (companyId) =>
  useKpiMutation((frameworks) => api.setFrameworks(frameworks, companyId), ['frameworks', 'catalogue'])
export const useSetDomain = (companyId) =>
  useKpiMutation(({ key, kpiType, body }) => api.setDomain(key, kpiType, body, companyId), ['domains'])
export const useSetFactor = (companyId) =>
  useKpiMutation(({ key, body }) => api.setFactor(key, body, companyId), ['factors', 'catalogue', 'series'])
