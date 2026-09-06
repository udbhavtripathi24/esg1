/**
 * KPI values, definitions, and validation API. Plain async functions
 * using the existing apiClient — no new HTTP logic.
 *
 * Backend contract (verified against app/api/routes/kpi_values.py and
 * app/api/routes/reviews.py, Layer 1 + Review Center Preview/Validation):
 *   GET /kpi-values               -> Page<KpiValueRead>, tenant-scoped
 *   GET /kpi-definitions           -> KpiDefinitionRead[], structural catalog
 *   GET /datasets/{ds}/versions/{v}/kpi-validation -> ValidationResult
 *   GET /datasets/{ds}/versions/{v}/data-preview -> DataPreviewResult
 *
 * kpi-validation is PROVISIONAL v1 structural/data-quality validation
 * only — no ESG methodology, no scoring, no emission factors. See the
 * backend endpoint's own docstring for the exact rule set.
 *
 * data-preview is DIFFERENT from kpi-validation in an important way:
 * it reads the real uploaded file directly and works at ANY point in
 * a dataset version's lifecycle (draft, submitted, under_review,
 * approved, etc.) — unlike kpi-validation, which correctly requires
 * extraction (and therefore approval) to have already happened. This
 * is what lets a reviewer see real data BEFORE deciding, not only after.
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

export function getDataPreview(datasetPublicId, versionPublicId) {
  return apiClient.get(`/datasets/${datasetPublicId}/versions/${versionPublicId}/data-preview`)
}
