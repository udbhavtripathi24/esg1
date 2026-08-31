/**
 * ConsultantAssignment API. Plain async functions using the existing
 * apiClient — no new HTTP logic.
 *
 * Backend contract (verified against app/api/routes/consultant_assignments.py
 * and app/models/consultant_assignment.py):
 *   GET   /consultant-assignments   -> Page<ConsultantAssignmentRead>
 *   POST  /consultant-assignments   -> ConsultantAssignmentRead, requires user:manage
 *   PATCH /consultant-assignments/{id} -> ConsultantAssignmentRead, requires user:manage
 *
 * NO DELETE endpoint exists for /consultant-assignments — removal is
 * PATCH {is_active: false} (soft), confirmed in the model's own docstring:
 * "Removal semantics: soft removal via is_active=False... not hard delete."
 *
 * RBAC (assignRole/removeRole below): the previously-identified tenancy gap
 * in POST /rbac/assign (missing organization-ownership check on company_id)
 * has been fixed server-side (app/api/routes/rbac.py) and covered by
 * regression tests (tests/test_rbac_api.py). These functions are now safe
 * to call. Note DELETE /rbac/assign performs a genuine HARD delete of the
 * UserRole row — no audit trail, unlike ConsultantAssignment's soft-removal
 * pattern above. These are intentionally different backend semantics; do
 * not conflate them.
 */
import { apiClient } from './client.js'

/**
 * @param {object} [params]
 * @param {number} [params.company_id]
 * @param {boolean} [params.active_only] - backend defaults true
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @returns {Promise<{items: object[], total: number, page: number, page_size: number}>}
 */
export function getConsultantAssignments(params = {}) {
  return apiClient.get('/consultant-assignments', { params })
}

/**
 * @param {object} body
 * @param {number} body.company_id
 * @param {number} body.consultant_user_id
 * @param {string} [body.role_on_account] - free text (e.g. "Lead"), NOT an
 *   RBAC role code — confirmed no enum/values tied to UserRole anywhere in
 *   the schema. Deliberately kept free-text here, not defaulted to
 *   Administrator/Consultant/Reviewer/Support, to avoid conflating this
 *   with the separate RBAC concept.
 * @returns {Promise<object>} the created (or reactivated) ConsultantAssignmentRead
 * @throws {ApiError} 422 duplicate_assignment, 422 invalid_consultant, 404 company not found
 */
export function createConsultantAssignment(body) {
  return apiClient.post('/consultant-assignments', body)
}

/**
 * @param {number} id
 * @param {object} body - {is_active?: boolean, role_on_account?: string}
 * @returns {Promise<object>} the updated ConsultantAssignmentRead
 */
export function updateConsultantAssignment(id, body) {
  return apiClient.patch(`/consultant-assignments/${id}`, body)
}

/**
 * Read-only. Lists RBAC role metadata (GET /rbac/roles) — used to populate
 * the real Deloitte role picker (filtered client-side to scope==='deloitte').
 * @returns {Promise<Array<{id: number, code: string, scope: string}>>}
 */
export function getRoles() {
  return apiClient.get('/rbac/roles')
}

/**
 * Creates a genuine UserRole — the actual RBAC authorization mechanism.
 * Deliberately separate from ConsultantAssignment (company staffing) above;
 * these are two distinct backend concepts that must not be conflated.
 *
 * @param {object} body
 * @param {number} body.user_id
 * @param {string} body.role_code
 * @param {number} [body.company_id] - omit/null for a global (non-company-
 *   scoped) role. The organization-ownership check for a supplied
 *   company_id is enforced server-side (app/api/routes/rbac.py).
 * @returns {Promise<{ok: boolean}>}
 * @throws {ApiError} 422 duplicate_role, 422 invalid_role, 404 user/company not found, 403
 */
export function assignRole(body) {
  return apiClient.post('/rbac/assign', body)
}

/**
 * Removes a UserRole — a genuine hard delete (no soft-delete semantics for
 * RBAC, confirmed in app/api/routes/rbac.py's remove_role()). There is NO
 * PATCH endpoint; changing a role means removeRole() then assignRole()
 * as two separate, non-atomic calls — callers must handle partial failure.
 *
 * @param {object} body - same shape as assignRole's body
 * @returns {Promise<{ok: boolean}>}
 * @throws {ApiError} 404 if the assignment doesn't exist, 403
 */
export function removeRole(body) {
  return apiClient.delete('/rbac/assign', { body })
}
