/**
 * Companies API. Plain async functions using the existing apiClient from
 * Phase 1 — no new HTTP logic, no Axios, no duplicated auth handling.
 *
 * Backend contract (verified against app/api/routes/companies.py):
 *   GET   /companies            -> Page<CompanyRead>, tenant-scoped server-side
 *   POST  /companies            -> CompanyRead, requires company:manage
 *   PATCH /companies/{id}       -> CompanyRead, requires company:manage
 *
 * There is no DELETE /companies/{id} — none is implemented here since no UI
 * action requires it (confirmed in the Phase 2 readiness report).
 */
import { apiClient } from './client.js'

/**
 * @param {object} [params]
 * @param {string} [params.search] - matches name or country (backend: ilike)
 * @param {string} [params.status] - "Pending" | "Approved" | "Rejected"
 * @param {string} [params.industry]
 * @param {string} [params.sort] - "name" | "status" | "created_at" | "registration_date"
 * @param {string} [params.order] - "asc" | "desc"
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @returns {Promise<{items: object[], total: number, page: number, page_size: number}>}
 */
export function getCompanies(params = {}) {
  return apiClient.get('/companies', { params })
}

/**
 * @param {object} body
 * @param {string} body.name
 * @param {string} [body.industry]
 * @param {string} [body.country]
 * @param {string} [body.sector]
 * @param {string} [body.structure] - "Listed" | "Unlisted"
 * @param {string} [body.plan] - "Basic" | "Professional" | "Enterprise"
 * @param {string} [body.status] - "Pending" | "Approved" | "Rejected"
 * @returns {Promise<object>} the created CompanyRead
 * @throws {ApiError} 422 on validation error, 403 if caller lacks company:manage
 */
export function createCompany(body) {
  return apiClient.post('/companies', body)
}

/**
 * @param {number} id
 * @param {object} body - any subset of the CompanyCreate fields
 * @returns {Promise<object>} the updated CompanyRead
 * @throws {ApiError} 404 if not found/cross-tenant, 403 if caller lacks company:manage
 */
export function updateCompany(id, body) {
  return apiClient.patch(`/companies/${id}`, body)
}
