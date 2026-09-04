/**
 * Admin Console — Integration Configuration API. Plain async functions
 * using the existing apiClient.
 *
 * Backend contract (verified against app/api/routes/misc_stage4.py's
 * integrations_router, already real, tested, and registered):
 *   GET /integrations?page=&page_size=
 *   POST /integrations {type, status?, config?}
 *   PATCH /integrations/{id} {status?, config?}
 *
 * IMPORTANT: this is a configuration/persistence boundary, NOT a live
 * connector. Real status values are exactly "configured" | "disabled" |
 * "error" — never "Connected"/"Healthy"/"Online". config deliberately
 * excludes secrets (see the backend model's own docstring) — this
 * client never sends or renders a plaintext API-key field.
 */
import { apiClient } from './client.js'

export function getIntegrations(params = {}) {
  return apiClient.get('/integrations', { params })
}

export function createIntegration(body) {
  return apiClient.post('/integrations', body)
}

export function updateIntegration(id, body) {
  return apiClient.patch(`/integrations/${id}`, body)
}
