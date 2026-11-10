/**
 * SASB setup, workspace and reports (backend: app/api/routes/sasb.py; the workflow is shared with GRI,
 * see ./disclosures.js).
 *
 *   GET  /sasb/industries               SICS sectors and industries, and the company's choice
 *   PUT  /sasb/industries {industries}  administrators
 *   GET  /sasb/metrics                  chosen industries' metrics with KPI type, domain, uploader, reviewer
 *   GET  /sasb/index.xlsx?fy   GET /sasb/report.docx?fy
 */
import { apiClient } from './client.js'
import { disclosureApi, query, withCompany } from './disclosures.js'

export const sasbApi = disclosureApi('sasb')

export const getIndustries = (companyId) => apiClient.get('/sasb/industries', { params: withCompany({}, companyId) })
export const setIndustries = (industries, companyId) => apiClient.put('/sasb/industries', withCompany({ industries }, companyId))
export const getMetrics = (companyId) => apiClient.get('/sasb/metrics', { params: withCompany({}, companyId) })

export const downloadSasbIndex = (fy, companyId) =>
  sasbApi.download(`index.xlsx${query(fy, companyId)}`, `SASB-Index-FY${fy || ''}.xlsx`)
export const downloadSasbReport = (fy, companyId) =>
  sasbApi.download(`report.docx${query(fy, companyId)}`, `SASB-Report-FY${fy || ''}.docx`)
