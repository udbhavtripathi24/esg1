/**
 * Assurance + evidence API (backend: app/api/routes/assurance.py and the
 * evidence routes in app/api/routes/brsr.py).
 *
 *   GET  /assurance/engagements                       list visible to me
 *   POST /assurance/engagements                       {response_set_id, provider_name, level, scope}
 *   GET  /assurance/engagements/{id}                  detail (shape depends on my access)
 *   POST /assurance/engagements/{id}/withdraw         {reason}
 *   GET  /assurance/engagements/{id}/candidates       team picker with independence check
 *   POST /assurance/engagements/{id}/members          {user_id, role}
 *   DEL  /assurance/engagements/{id}/members/{uid}
 *   POST /assurance/engagements/{id}/independence
 *   POST /assurance/engagements/{id}/start
 *   GET  /assurance/engagements/{id}/sections/{code}  read-only BRSR section (team)
 *   POST /assurance/engagements/{id}/items/{code}/prepare|review
 *   POST /assurance/engagements/{id}/requests (+ /{rid}/evidence|respond|close)
 *   POST /assurance/engagements/{id}/findings (+ /{fid}/respond|resolve)
 *   POST /assurance/engagements/{id}/eqr-clear | sign
 *   GET  /assurance/engagements/{id}/documents/statement|register   signed URL
 *   GET  /assurance/engagements/{id}/register-draft | pack           file
 */
import { apiClient, getAuthToken, BASE_URL, API_ORIGIN, parseResponse } from './client.js'

const E = (id) => `/assurance/engagements/${id}`

export const listEngagements = () => apiClient.get('/assurance/engagements')
export const getEngagement = (id) => apiClient.get(E(id))
export const createEngagement = (body) => apiClient.post('/assurance/engagements', body)
export const listAssurableSets = () => apiClient.get('/assurance/assurable-sets')
export const withdrawEngagement = (id, reason) => apiClient.post(`${E(id)}/withdraw`, { reason })
export const getCandidates = (id) => apiClient.get(`${E(id)}/candidates`)
export const addMember = (id, userId, role) => apiClient.post(`${E(id)}/members`, { user_id: userId, role })
export const removeMember = (id, userId) => apiClient.delete(`${E(id)}/members/${userId}`)
export const declareIndependence = (id) => apiClient.post(`${E(id)}/independence`)
export const startFieldwork = (id) => apiClient.post(`${E(id)}/start`)
export const getAssurerSection = (id, code) => apiClient.get(`${E(id)}/sections/${code}`)
export const prepareItem = (id, code, procedures, conclusion) =>
  apiClient.post(`${E(id)}/items/${code}/prepare`, { procedures, conclusion })
export const reviewItem = (id, code, decision, note) => apiClient.post(`${E(id)}/items/${code}/review`, { decision, note })
export const raiseRequest = (id, body) => apiClient.post(`${E(id)}/requests`, body)
export const respondRequest = (id, rid, response) => apiClient.post(`${E(id)}/requests/${rid}/respond`, { response })
export const closeRequest = (id, rid, decision, note) => apiClient.post(`${E(id)}/requests/${rid}/close`, { decision, note })
export const raiseFinding = (id, body) => apiClient.post(`${E(id)}/findings`, body)
export const respondFinding = (id, fid, response) => apiClient.post(`${E(id)}/findings/${fid}/respond`, { response })
export const resolveFinding = (id, fid, outcome, note) =>
  apiClient.post(`${E(id)}/findings/${fid}/resolve`, { outcome, note })
export const clearEqr = (id, note) => apiClient.post(`${E(id)}/eqr-clear`, { note })
export const signEngagement = (id, body) => apiClient.post(`${E(id)}/sign`, body)

export function uploadRequestEvidence(id, rid, file, description) {
  const fd = new FormData()
  fd.append('file', file)
  if (description) fd.append('description', description)
  return apiClient.post(`${E(id)}/requests/${rid}/evidence`, fd)
}

// ---- BRSR evidence ---------------------------------------------------------

export function uploadSectionEvidence(setId, code, file, { questionId, description } = {}) {
  const fd = new FormData()
  fd.append('file', file)
  if (questionId) fd.append('question_id', questionId)
  if (description) fd.append('description', description)
  return apiClient.post(`/brsr/response-sets/${setId}/sections/${code}/evidence`, fd)
}

export const withdrawEvidence = (setId, evId) => apiClient.delete(`/brsr/response-sets/${setId}/evidence/${evId}`)

// ---- Downloads -------------------------------------------------------------

/** Opens a signed URL from the backend (local adapter: a path on our API;
 * cloud storage: an absolute URL). No auth header needed: it is signed. */
export function openSignedUrl(url, filename) {
  const href = /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`
  const a = document.createElement('a')
  a.href = href
  if (filename) a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadEvidence(evidence, { setId, engagementId } = {}) {
  const path = engagementId
    ? `${E(engagementId)}/evidence/${evidence.public_id}/download`
    : `/brsr/response-sets/${setId}/evidence/${evidence.public_id}/download`
  const res = await apiClient.get(path)
  openSignedUrl(res.url, res.filename)
}

export async function downloadSignedDocument(id, kind) {
  const res = await apiClient.get(`${E(id)}/documents/${kind}`)
  openSignedUrl(res.url, res.filename)
  return res
}

function filenameFrom(cd, fallback) {
  const star = cd.match(/filename\*=UTF-8''([^;]+)/i)
  if (star) {
    try { return decodeURIComponent(star[1]) } catch { /* fall through */ }
  }
  return (cd.match(/filename="([^"]+)"/) || [])[1] || fallback
}

/** Authenticated file download (streamed by the API, not signed). */
export async function downloadAuthed(path, fallbackName) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } })
  if (!res.ok) await parseResponse(res) // throws the backend's message
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameFrom(res.headers.get('Content-Disposition') || '', fallbackName)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const downloadPack = (id) => downloadAuthed(`${E(id)}/pack`, 'assurance_pack.zip')
export const downloadDraftRegister = (id) => downloadAuthed(`${E(id)}/register-draft`, 'signoff_register_DRAFT.xlsx')
