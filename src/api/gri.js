/**
 * GRI workspace and reports (backend: app/api/routes/gri.py; the workflow is shared with SASB,
 * see ./disclosures.js).
 *
 *   GET /gri/content-index.xlsx?fy   GET /gri/report.docx?fy
 */
import { disclosureApi, query } from './disclosures.js'

export const griApi = disclosureApi('gri')
export const { getWorkspace, saveAnswer, setOwner, submitAnswers, reviewAnswers, adoptBrsr } = griApi

export const downloadContentIndex = (fy, companyId) =>
  griApi.download(`content-index.xlsx${query(fy, companyId)}`, `GRI-Content-Index-FY${fy || ''}.xlsx`)
export const downloadGriReport = (fy, companyId) =>
  griApi.download(`report.docx${query(fy, companyId)}`, `GRI-Report-FY${fy || ''}.docx`)
