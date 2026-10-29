/**
 * Admin Console API (backend: app/api/routes/admin.py, plus /integrations and /audit-logs).
 *
 *   GET    /admin/roles                                 client roles with what each can do
 *   GET    /admin/users?search&status&role&department&page&page_size
 *   POST   /admin/users {name, email, department, role_code}      → {user, temporary_password}
 *   PATCH  /admin/users/{id} {name?, department?}
 *   PUT    /admin/users/{id}/role {role_code}
 *   POST   /admin/users/{id}/status {active}
 *   POST   /admin/users/{id}/reset-password                       → {temporary_password}
 *   POST   /admin/users/import  (multipart: file, dry_run)        → {rows, ok, with_errors, created}
 *   GET    /admin/targets?fy      POST/PUT/DELETE /admin/targets[/{id}]
 *   GET    /admin/targets/metric-value?metric&fy
 *   GET    /admin/approvals?kind&status&search&page
 *   GET    /admin/factors
 *   GET    /audit-logs?action&actor_user_id&date_from&date_to&entity_type&page
 *
 * company_id is sent only by Deloitte users; client users always act on their own company.
 */
import { apiClient } from './client.js'

const withCompany = (params, companyId) => (companyId ? { ...params, company_id: companyId } : params)

export const getRoles = () => apiClient.get('/admin/roles')
export const getUsers = (params, companyId) => apiClient.get('/admin/users', { params: withCompany(params, companyId) })
export const createUser = (body, companyId) => apiClient.post('/admin/users', withCompany(body, companyId))
export const updateUser = (id, body, companyId) =>
  apiClient.patch(`/admin/users/${id}`, body, { params: withCompany({}, companyId) })
export const setUserRole = (id, roleCode, companyId) =>
  apiClient.put(`/admin/users/${id}/role`, { role_code: roleCode }, { params: withCompany({}, companyId) })
export const setUserStatus = (id, active, companyId) =>
  apiClient.post(`/admin/users/${id}/status`, { active }, { params: withCompany({}, companyId) })
export const resetUserPassword = (id, companyId) =>
  apiClient.post(`/admin/users/${id}/reset-password`, undefined, { params: withCompany({}, companyId) })
export function importUsers(file, dryRun, companyId) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('dry_run', dryRun ? 'true' : 'false')
  if (companyId) fd.append('company_id', String(companyId))
  return apiClient.post('/admin/users/import', fd)
}

export const getTargets = (fy, companyId) => apiClient.get('/admin/targets', { params: withCompany(fy ? { fy } : {}, companyId) })
export const getMetricValue = (metric, fy, companyId) =>
  apiClient.get('/admin/targets/metric-value', { params: withCompany({ metric, fy }, companyId) })
export const createTarget = (body, fy, companyId) =>
  apiClient.post('/admin/targets', withCompany(body, companyId), { params: fy ? { fy } : {} })
export const updateTarget = (id, body, fy, companyId) =>
  apiClient.put(`/admin/targets/${id}`, withCompany(body, companyId), { params: fy ? { fy } : {} })
export const deleteTarget = (id, companyId) => apiClient.delete(`/admin/targets/${id}`, { params: withCompany({}, companyId) })

export const getApprovals = (params, companyId) => apiClient.get('/admin/approvals', { params: withCompany(params, companyId) })
export const getFactors = () => apiClient.get('/admin/factors')
