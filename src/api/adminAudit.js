/**
 * Admin Console — Audit Log API. Plain async functions using the
 * existing apiClient.
 *
 * Backend contract (verified against app/api/routes/misc_stage4.py's
 * audit_router, already real, tested, and registered — no backend
 * changes were made to this endpoint):
 *   GET /audit-logs?page=&page_size=&entity_type=&entity_id=&company_id=
 *
 * Returns real application audit events only — this project's actual
 * state-changing operations (dataset/version creation, file upload/
 * download, site/department/business-unit/upload-type changes,
 * integration configuration changes). No fabricated events, no
 * frontend-only filters beyond what the backend genuinely supports.
 */
import { apiClient } from './client.js'

export function getAuditLogs(params = {}) {
  return apiClient.get('/audit-logs', { params })
}
