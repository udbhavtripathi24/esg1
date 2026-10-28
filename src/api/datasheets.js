/**
 * Data sheets API (backend: app/api/routes/datasheets.py).
 *
 *   GET  /datasheets                          catalogue of the 27 sheets
 *   GET  /datasheets/{code}                   columns of one sheet
 *   GET  /datasheets/{code}/template          Excel template (file)
 *   POST /datasheets/{code}/check  (multipart) validate a file, store nothing
 *   GET  /datasheets/coverage?company_id=&fy= months of approved data per sheet
 *   GET  /datasheets/formula-sheet            how each BRSR figure is calculated (Excel)
 *
 * Uploading uses the normal dataset endpoints with upload_type_code
 * "sheet_<code>"; the server applies the same strict validation there and
 * answers 422 with every row error in error.details.
 */
import { apiClient } from './client.js'
import { downloadAuthed } from './assurance.js'

export const listDataSheets = () => apiClient.get('/datasheets')

export const getDataSheet = (code) => apiClient.get(`/datasheets/${code}`)

export const downloadTemplate = (code, title) => downloadAuthed(`/datasheets/${code}/template`, `${title || code}-template.xlsx`)

export function checkDataSheet(code, file) {
  const form = new FormData()
  form.append('file', file)
  return apiClient.post(`/datasheets/${code}/check`, form)
}

export const getCoverage = (fy, companyId) =>
  apiClient.get('/datasheets/coverage', { params: { fy, ...(companyId ? { company_id: companyId } : {}) } })

export const downloadFormulaSheet = () => downloadAuthed('/datasheets/formula-sheet', 'BRSR-formula-sheet.xlsx')
