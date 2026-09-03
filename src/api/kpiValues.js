/**
 * KPI values, definitions, and validation API. Plain async functions
 * using the existing apiClient — no new HTTP logic.
 *
 * Backend contract (verified against app/api/routes/kpi_values.py and
 * app/api/routes/reviews.py, Layer 1 + Review Center Preview/Validation):
 *   GET /kpi-values               -> Page<KpiValueRead>, tenant-scoped
 *   GET /kpi-definitions           -> KpiDefinitionRead[], structural catalog
 *   GET /datasets/{ds}/versions/{v}/kpi-validation -> ValidationResult
 *
 * kpi-validation is PROVISIONAL v1 structural/data-quality validation
 * only — no ESG methodology, no scoring, no emission factors. See the
 * backend endpoint's own docstring for the exact rule set.
 */
import { apiClient } from './client.js'

export function getKpiValues(params = {}) {
  return apiClient.get('/kpi-values', { params })
}

export function getKpiDefinitions(params = {}) {
  return apiClient.get('/kpi-definitions', { params })
}

export function getKpiValidation(datasetPublicId, versionPublicId) {
  return apiClient.get(`/datasets/${datasetPublicId}/versions/${versionPublicId}/kpi-validation`)
}
