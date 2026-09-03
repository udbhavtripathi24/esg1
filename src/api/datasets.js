/**
 * Datasets/Versions/Files API. Plain async functions using the existing
 * apiClient — no new HTTP logic.
 *
 * Backend contract (verified against app/api/routes/datasets.py, Stage 4):
 *   GET   /datasets                                    -> Page<DatasetRead>
 *   POST  /datasets                                     -> DatasetRead (also creates v1)
 *   GET   /datasets/{id}                                 -> DatasetRead
 *   GET   /datasets/{id}/versions                        -> DatasetVersionRead[]
 *   POST  /datasets/{id}/versions                        -> DatasetVersionRead (only when latest is terminal)
 *   POST  /datasets/{id}/versions/{vid}/submit           -> DatasetVersionRead
 *   POST  /datasets/{id}/versions/{vid}/files (multipart) -> DatasetFileRead
 *   GET   /files/{id}/download                           -> file stream / signed URL
 *   GET   /upload-types                                  -> UploadTypeRead[]
 *   GET   /departments, /business-units, /sites          -> Page<...Read>
 *
 * POST /datasets already creates DatasetVersion v1 automatically — never
 * call createDatasetVersion() as part of the normal initial-upload flow.
 * It exists only for the "start a new version after a terminal one" case.
 */
import { apiClient } from './client.js'

export function getDatasets(params = {}) {
  return apiClient.get('/datasets', { params })
}

export function createDataset(body) {
  return apiClient.post('/datasets', body)
}

export function getDataset(publicId) {
  return apiClient.get(`/datasets/${publicId}`)
}

export function getDatasetVersions(publicId) {
  return apiClient.get(`/datasets/${publicId}/versions`)
}

/** Only for starting a new version after the latest one reached a terminal
 * state — NOT part of the normal create→upload→submit flow. */
export function createDatasetVersion(publicId) {
  return apiClient.post(`/datasets/${publicId}/versions`)
}

export function submitDatasetVersion(publicId, versionPublicId) {
  return apiClient.post(`/datasets/${publicId}/versions/${versionPublicId}/submit`)
}

/**
 * @param {string} publicId
 * @param {string} versionPublicId
 * @param {File} file
 * @param {'data'|'evidence'} role
 */
export function uploadDatasetFile(publicId, versionPublicId, file, role) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('role', role)
  return apiClient.post(`/datasets/${publicId}/versions/${versionPublicId}/files`, formData)
}

export function getUploadTypes() {
  return apiClient.get('/upload-types')
}

// NOTE: these three routes are registered under /master-data/ (confirmed
// by direct route inspection: /api/v1/master-data/departments etc.) — an
// earlier readiness-report assumption of a bare /departments path was
// wrong, caught here via a real 404 during live testing, not silently
// patched without verification.
export function getDepartments(params = {}) {
  return apiClient.get('/master-data/departments', { params })
}

export function getBusinessUnits(params = {}) {
  return apiClient.get('/master-data/business-units', { params })
}

export function getSites(params = {}) {
  return apiClient.get('/master-data/sites', { params })
}
