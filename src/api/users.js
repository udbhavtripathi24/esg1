/**
 * Users API. Plain async functions using the existing apiClient — no new
 * HTTP logic, no Axios, no duplicated auth handling.
 *
 * Backend contract (verified against app/api/routes/users.py):
 *   GET    /users        -> Page<UserRead>, tenant-scoped server-side
 *   POST   /users         -> UserRead, requires user:manage, creates User +
 *                            matching UserRole when role_code is supplied
 *   PATCH  /users/{id}    -> UserRead, requires user:manage
 *   DELETE /users/{id}    -> soft-delete (is_active=false), requires
 *                            user:manage, backend blocks self-deactivation
 *
 * NEVER use /auth/register here — confirmed it does not create the
 * required RBAC UserRole assignment.
 */
import { apiClient } from './client.js'

/**
 * @param {object} [params]
 * @param {string} [params.search] - matches name/email/department (backend: ilike)
 * @param {string} [params.role] - exact match on the display-hint role string
 * @param {number} [params.company_id]
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @returns {Promise<{items: object[], total: number, page: number, page_size: number}>}
 */
export function getUsers(params = {}) {
  return apiClient.get('/users', { params })
}

/**
 * @param {object} body
 * @param {string} body.name
 * @param {string} body.email
 * @param {string} body.portal_type - 'deloitte' | 'client'
 * @param {string} body.role - display-hint string (e.g. "Administrator")
 * @param {string} [body.department]
 * @param {string} body.password
 * @param {string} [body.role_code] - the actual RBAC role to assign (e.g. "Administrator")
 * @returns {Promise<object>} the created UserRead
 * @throws {ApiError} 422 email_taken, 422 invalid_role, 403 if caller lacks user:manage
 */
export function createUser(body) {
  return apiClient.post('/users', body)
}

/**
 * @param {number} id
 * @param {object} body - any subset of {name, department, role, is_active}
 *   NOTE: this endpoint cannot change RBAC role assignment (UserRole) —
 *   that is Role Assignment's responsibility, out of scope here.
 * @returns {Promise<object>} the updated UserRead
 */
export function updateUser(id, body) {
  return apiClient.patch(`/users/${id}`, body)
}

/**
 * Soft-deletes (deactivates) a user via the backend's intended endpoint.
 * Backend blocks self-deactivation with a 422 — surfaced, not bypassed.
 * @param {number} id
 * @returns {Promise<{ok: boolean, id: number}>}
 */
export function deactivateUser(id) {
  return apiClient.delete(`/users/${id}`)
}

/**
 * Admin-triggered password reset -- generates and sends a brand new
 * password (the old one can never be recovered, only its hash is ever
 * stored). Different from the client's own self-service change-password
 * flow, which requires knowing the current password.
 * @param {number} id
 * @param {string} newPassword
 * @returns {Promise<void>} 204 on success
 */
export function resetUserPassword(id, newPassword) {
  return apiClient.post(`/users/${id}/reset-password`, { new_password: newPassword })
}
