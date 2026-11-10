/**
 * KPI catalogue, frameworks, domain assignments and factors directory
 * (backend: app/api/routes/kpis.py).
 *
 *   GET  /kpis/catalogue?fy&location&category    every KPI with this and last year's value
 *   GET  /kpis/catalogue.xlsx?fy                  the same as a workbook
 *   GET  /kpis/series?codes&fy&by=month|location  KPIs over the months / across locations
 *   GET  /kpis/values?codes&fy&location           a few KPIs with this and last year's value (tiles)
 *   PUT  /kpis/selection {codes, enabled}
 *   GET  /kpis/frameworks       PUT /kpis/frameworks {frameworks}
 *   GET  /kpis/domains          PUT /kpis/domains/{key}/{kpi_type} {uploader_ids, reviewer_ids}
 *   GET  /kpis/factors          PUT /kpis/factors/{key} {value | null, note}
 *
 * company_id is sent only by Deloitte users; client users always act on their own company.
 */
import { apiClient } from './client.js'
import { downloadAuthed } from './assurance.js'

const withCompany = (params, companyId) => (companyId ? { ...params, company_id: companyId } : params)

export const getCatalogue = (params, companyId) => apiClient.get('/kpis/catalogue', { params: withCompany(params, companyId) })
export const downloadCatalogue = (fy, companyId) => {
  const q = new URLSearchParams(withCompany(fy ? { fy } : {}, companyId)).toString()
  return downloadAuthed(`/kpis/catalogue.xlsx${q ? `?${q}` : ''}`, `VISTA-KPI-catalogue-FY${fy || ''}.xlsx`)
}
export const getSeries = (params, companyId) => apiClient.get('/kpis/series', { params: withCompany(params, companyId) })
export const setSelection = (codes, enabled, companyId) =>
  apiClient.put('/kpis/selection', withCompany({ codes, enabled }, companyId))
export const getFrameworks = (companyId) => apiClient.get('/kpis/frameworks', { params: withCompany({}, companyId) })
export const setFrameworks = (frameworks, companyId) => apiClient.put('/kpis/frameworks', withCompany({ frameworks }, companyId))
export const getDomains = (companyId) => apiClient.get('/kpis/domains', { params: withCompany({}, companyId) })
export const setDomain = (key, kpiType, body, companyId) =>
  apiClient.put(`/kpis/domains/${encodeURIComponent(key)}/${kpiType}`, withCompany(body, companyId))
export const getFactorDirectory = (companyId) => apiClient.get('/kpis/factors', { params: withCompany({}, companyId) })
export const setFactor = (key, body, companyId) => apiClient.put(`/kpis/factors/${key}`, withCompany(body, companyId))
export const getValues = (params, companyId) => apiClient.get('/kpis/values', { params: withCompany(params, companyId) })
