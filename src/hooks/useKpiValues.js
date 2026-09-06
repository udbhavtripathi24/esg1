/**
 * React Query hooks for KPI values, definitions, and validation. Same
 * pattern as every other module in this project.
 */
import { useQuery } from '@tanstack/react-query'
import { getKpiValues, getKpiDefinitions, getKpiValidation, getDataPreview } from '../api/kpiValues.js'

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

/** Real preview of the actual uploaded file -- available at ANY point
 * in the dataset version's lifecycle, unlike useKpiValidation above
 * which correctly requires extraction (and therefore approval) first.
 * This is what lets a reviewer see real data before deciding. */
export function useDataPreview(datasetPublicId, versionPublicId, options = {}) {
  return useQuery({
    queryKey: ['data-preview', datasetPublicId, versionPublicId],
    queryFn: () => getDataPreview(datasetPublicId, versionPublicId),
    enabled: options.enabled !== undefined ? options.enabled : !!(datasetPublicId && versionPublicId),
  })
}
