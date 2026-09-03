/**
 * React Query hooks for KPI values, definitions, and validation. Same
 * pattern as every other module in this project.
 */
import { useQuery } from '@tanstack/react-query'
import { getKpiValues, getKpiDefinitions, getKpiValidation } from '../api/kpiValues.js'

export function useKpiValues(params = {}, options = {}) {
  return useQuery({
    queryKey: ['kpi-values', params],
    queryFn: () => getKpiValues(params),
    enabled: options.enabled !== undefined ? options.enabled : true,
  })
}

/** Structural catalog — rarely changes, long staleTime, same as useUploadTypes. */
export function useKpiDefinitions(params = {}) {
  return useQuery({
    queryKey: ['kpi-definitions', params],
    queryFn: () => getKpiDefinitions(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useKpiValidation(datasetPublicId, versionPublicId, options = {}) {
  return useQuery({
    queryKey: ['kpi-validation', datasetPublicId, versionPublicId],
    queryFn: () => getKpiValidation(datasetPublicId, versionPublicId),
    enabled: options.enabled !== undefined ? options.enabled : !!(datasetPublicId && versionPublicId),
  })
}
