/**
 * Data sheets API (backend: app/api/routes/datasheets.py).
 *
 *   GET  /datasheets                          catalogue of the 27 sheets
 *   GET  /datasheets/{code}                   columns of one sheet
 *   GET  /datasheets/{code}/template          Excel template (file)
 *   POST /datasheets/{code}/check  (multipart) validate a file, store nothing
 *   GET  /datasheets/coverage?company_id=&fy= months of approved data per sheet
 *   GET  /datasheets/formula-sheet            how each BRSR figure is calculated (Excel)
 *   GET  /datasheets/uploads?fy=&company_id=  uploads touching the year, with withdraw / revert rights
 *   GET  /datasheets/uploads/{id}/revert-preview   what reverting an approved upload changes
 *   POST /datasheets/uploads/{id}/withdraw {note?}  take back an upload that is not approved
 *   POST /datasheets/uploads/{id}/revert {note}     stop counting an approved upload
 *
 * Uploading uses the normal dataset endpoints with upload_type_code
 * "sheet_<code>"; the server applies the same strict validation there and
 * answers 422 with every row error in error.details.
 */
import { apiClient } from './client.js'
import { downloadAuthed } from './assurance.js'

export const listDataSheets = () => apiClient.get('/datasheets')

export const getDataSheet = (code) => apiClient.get(`/datasheets/${code}`)

// The template's headers are in the units the company's sites report in (Admin Console → Units).
export const downloadTemplate = (code, title, companyId) =>
  downloadAuthed(`/datasheets/${code}/template${companyId ? `?company_id=${companyId}` : ''}`, `${title || code}-template.xlsx`)

export function checkDataSheet(code, file) {
  const form = new FormData()
  form.append('file', file)
  return apiClient.post(`/datasheets/${code}/check`, form)
}

export const getCoverage = (fy, companyId) =>
  apiClient.get('/datasheets/coverage', { params: { fy, ...(companyId ? { company_id: companyId } : {}) } })

export const downloadFormulaSheet = () => downloadAuthed('/datasheets/formula-sheet', 'BRSR-formula-sheet.xlsx')

const withCo = (params, companyId) => (companyId ? { ...params, company_id: companyId } : params)
export const listUploads = (fy, companyId) => apiClient.get('/datasheets/uploads', { params: withCo({ fy }, companyId) })
export const getRevertPreview = (publicId) => apiClient.get(`/datasheets/uploads/${publicId}/revert-preview`)
export const withdrawUpload = (publicId, note) => apiClient.post(`/datasheets/uploads/${publicId}/withdraw`, { note: note || null })
export const revertUpload = (publicId, note) => apiClient.post(`/datasheets/uploads/${publicId}/revert`, { note })
