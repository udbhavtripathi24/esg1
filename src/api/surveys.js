/**
 * Surveys & assessments API (backend: app/api/routes/surveys.py).
 *
 * Managing (assessment:manage)
 *   GET    /surveys?company_id=                list
 *   GET    /surveys/templates?company_id=      built-in + company templates
 *   GET    /surveys/templates/{id}             template with its questions
 *   POST   /surveys {company_id?, template_id?, title?, kind?}
 *   GET    /surveys/{id}                        PUT /surveys/{id} {revision, …}   DELETE /surveys/{id}
 *   POST   /surveys/{id}/publish | close | reopen | archive | restore | duplicate | save-as-template
 *   PUT    /surveys/{id}/public-link {enabled, regenerate}
 *   GET    /surveys/{id}/audience               users, departments, invitations, counts
 *   POST   /surveys/{id}/invites {user_ids, departments, emails:[{email,name,group}]}  → new personal links
 *   DELETE /surveys/{id}/invites/{invite_id}
 *   POST   /surveys/{id}/links {invite_ids?}    new personal links (old ones stop working)
 *   POST   /surveys/{id}/remind
 *   GET    /surveys/{id}/results?group=         GET /surveys/{id}/responses[/{response_id}]
 *   GET    /surveys/{id}/export                 Excel
 *   GET    /surveys/{id}/files/{file_id}/download
 *
 * Responding, signed in:   /my-surveys, /my-surveys/{id}[/response|/submit|/files]
 * Responding by link:      /public/surveys/{token}[/response|/submit|/files]  (X-Resume-Key header)
 */
import { apiClient, BASE_URL, getAuthToken, parseResponse, ApiError } from './client.js'

const companyParams = (companyId) => (companyId ? { company_id: companyId } : {})

export const listSurveys = (companyId) => apiClient.get('/surveys', { params: companyParams(companyId) })
export const listTemplates = (companyId) => apiClient.get('/surveys/templates', { params: companyParams(companyId) })
export const getTemplate = (id, companyId) => apiClient.get(`/surveys/templates/${id}`, { params: companyParams(companyId) })
export const createSurvey = (body) => apiClient.post('/surveys', body)
export const getSurvey = (id) => apiClient.get(`/surveys/${id}`)
export const updateSurvey = (id, body) => apiClient.put(`/surveys/${id}`, body)
export const deleteSurvey = (id) => apiClient.delete(`/surveys/${id}`)
export const surveyAction = (id, action, body) => apiClient.post(`/surveys/${id}/${action}`, body)
export const setPublicLink = (id, enabled, regenerate = false) =>
  apiClient.put(`/surveys/${id}/public-link`, { enabled, regenerate })
export const getAudience = (id) => apiClient.get(`/surveys/${id}/audience`)
export const addInvites = (id, body) => apiClient.post(`/surveys/${id}/invites`, body)
export const removeInvite = (id, inviteId) => apiClient.delete(`/surveys/${id}/invites/${inviteId}`)
export const renewLinks = (id, inviteIds) => apiClient.post(`/surveys/${id}/links`, { invite_ids: inviteIds ?? null })
export const remind = (id) => apiClient.post(`/surveys/${id}/remind`)
export const getResults = (id, group) => apiClient.get(`/surveys/${id}/results`, { params: group ? { group } : {} })
export const listResponses = (id) => apiClient.get(`/surveys/${id}/responses`)
export const getResponse = (id, responseId) => apiClient.get(`/surveys/${id}/responses/${responseId}`)
export const fileDownload = (id, fileId) => apiClient.get(`/surveys/${id}/files/${fileId}/download`)

export async function exportResults(id, title) {
  const res = await fetch(`${BASE_URL}/surveys/${id}/export`, {
    headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
  })
  if (!res.ok) await parseResponse(res)
  // Content-Disposition isn't readable cross-origin, so name the file here
  const safe = String(title || 'Survey').replace(/[^\w -]+/g, '_').slice(0, 60).trim() || 'Survey'
  const name = `${safe} - results.xlsx`
  return { blob: await res.blob(), filename: name }
}

// ---- Signed-in respondents -------------------------------------------------

export const mySurveys = () => apiClient.get('/my-surveys')

/** The same five calls for both kinds of respondent, so one form component serves both. */
export function inAppTransport(surveyId) {
  const base = `/my-surveys/${surveyId}`
  return {
    load: () => apiClient.get(base),
    save: (answers, revision) => apiClient.put(`${base}/response`, { answers, revision }),
    submit: (answers) => apiClient.post(`${base}/submit`, { answers }),
    upload: (questionId, file) => {
      const fd = new FormData()
      fd.append('question_id', questionId)
      fd.append('file', file)
      return apiClient.post(`${base}/files`, fd)
    },
    removeFile: (fileId) => apiClient.delete(`${base}/files/${fileId}`),
  }
}

// ---- By link (no account) ---------------------------------------------------

const RESUME_PREFIX = 'survey-resume:'

function readResumeKey(token) {
  try { return window.localStorage.getItem(RESUME_PREFIX + token) } catch { return null }
}

function writeResumeKey(token, key) {
  try {
    if (key) window.localStorage.setItem(RESUME_PREFIX + token, key)
    else window.localStorage.removeItem(RESUME_PREFIX + token)
  } catch { /* storage unavailable: the draft just won't resume after a reload */ }
}

async function publicRequest(token, path, { method = 'GET', body } = {}) {
  const headers = {}
  const key = readResumeKey(token)
  if (key) headers['X-Resume-Key'] = key
  let payload
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  let res
  try {
    res = await fetch(`${BASE_URL}/public/surveys/${encodeURIComponent(token)}${path}`, { method, headers, body: payload })
  } catch {
    throw new ApiError('Network error — could not reach the server', { status: null, isNetworkError: true })
  }
  const data = await parseResponse(res)
  // Remember a public-link draft so a reload carries on where it left off
  const state = data?.response ?? data
  if (state && Object.prototype.hasOwnProperty.call(state, 'resume_key') && state.resume_key) {
    writeResumeKey(token, state.resume_key)
  }
  if (data?.submitted) writeResumeKey(token, null)
  return data
}

export function publicTransport(token) {
  return {
    load: () => publicRequest(token, ''),
    save: (answers, revision) => publicRequest(token, '/response', { method: 'PUT', body: { answers, revision } }),
    submit: (answers, identity = {}) => publicRequest(token, '/submit', { method: 'POST', body: { answers, ...identity } }),
    upload: (questionId, file) => {
      const fd = new FormData()
      fd.append('question_id', questionId)
      fd.append('file', file)
      return publicRequest(token, '/files', { method: 'POST', body: fd })
    },
    removeFile: (fileId) => publicRequest(token, `/files/${fileId}`, { method: 'DELETE' }),
  }
}

/** The address people open to answer, for a personal or public link token. */
export const surveyLink = (token) => `${window.location.origin}/s/${token}`
