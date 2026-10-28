/**
 * BRSR questionnaire API (backend: app/api/routes/brsr.py).
 *
 *   GET  /brsr/question-bank
 *   GET  /brsr/response-sets?company_id=
 *   POST /brsr/response-sets {financial_year, company_id?}
 *   GET  /brsr/response-sets/{id}
 *   GET  /brsr/response-sets/{id}/sections/{code}
 *   PUT  /brsr/response-sets/{id}/answers {answers: {qid: {value, revision}}}
 *   POST /brsr/response-sets/{id}/sections/{code}/submit | withdraw
 *   POST /brsr/response-sets/{id}/sections/{code}/decide {decision, note, question_comments}
 *   POST /brsr/response-sets/{id}/sections/{code}/reopen {reason}
 *   GET  /brsr/response-sets/{id}/answers/{qid}/history
 *   GET  /brsr/review-queue
 *   POST /brsr/response-sets/{id}/questions/submit {question_ids}
 *   POST /brsr/response-sets/{id}/questions/review {question_ids, decision: approved|returned, note}
 *   GET  /brsr/question-queue                       answers waiting for my approval
 *   GET  /brsr/roster?company_id=   PUT /brsr/roster {company_id?, entries}
 *   GET  /brsr/response-sets/{id}/preview?fmt=docx|pdf   (file download)
 *
 * company_id is only ever sent by Deloitte users; for client users the
 * backend always derives it from the signed-in account.
 */
import { apiClient, getAuthToken, BASE_URL, parseResponse } from './client.js'

export const getQuestionBank = () => apiClient.get('/brsr/question-bank')

export const listResponseSets = (companyId) =>
  apiClient.get('/brsr/response-sets', { params: companyId ? { company_id: companyId } : {} })

export const createResponseSet = (financialYear, companyId) =>
  apiClient.post('/brsr/response-sets', { financial_year: financialYear, ...(companyId ? { company_id: Number(companyId) } : {}) })

export const getResponseSet = (setId) => apiClient.get(`/brsr/response-sets/${setId}`)

export const getSection = (setId, code) => apiClient.get(`/brsr/response-sets/${setId}/sections/${code}`)

export const saveAnswers = (setId, answers) => apiClient.put(`/brsr/response-sets/${setId}/answers`, { answers })

export const submitSection = (setId, code) => apiClient.post(`/brsr/response-sets/${setId}/sections/${code}/submit`)

export const withdrawSection = (setId, code) => apiClient.post(`/brsr/response-sets/${setId}/sections/${code}/withdraw`)

export const decideSection = (setId, code, decision, note, questionComments = []) =>
  apiClient.post(`/brsr/response-sets/${setId}/sections/${code}/decide`, {
    decision, note, question_comments: questionComments,
  })

export const reopenSection = (setId, code, reason) =>
  apiClient.post(`/brsr/response-sets/${setId}/sections/${code}/reopen`, { reason })

export const getAnswerHistory = (setId, qid) => apiClient.get(`/brsr/response-sets/${setId}/answers/${qid}/history`)

export const getReviewQueue = () => apiClient.get('/brsr/review-queue')

export const submitQuestions = (setId, questionIds) =>
  apiClient.post(`/brsr/response-sets/${setId}/questions/submit`, { question_ids: questionIds })

export const reviewQuestions = (setId, questionIds, decision, note) =>
  apiClient.post(`/brsr/response-sets/${setId}/questions/review`, { question_ids: questionIds, decision, note })

export const getQuestionQueue = () => apiClient.get('/brsr/question-queue')

export const getRoster = (companyId) => apiClient.get('/brsr/roster', { params: companyId ? { company_id: companyId } : {} })

export const putRoster = (entries, companyId) =>
  apiClient.put('/brsr/roster', { entries, ...(companyId ? { company_id: Number(companyId) } : {}) })

/** Downloads the watermarked draft. Uses fetch directly because the
 * response is a file, not JSON; errors are still parsed the normal way. */
export async function downloadPreview(setId, fmt = 'docx') {
  const res = await fetch(`${BASE_URL}/brsr/response-sets/${setId}/preview?fmt=${fmt}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  })
  if (!res.ok) {
    await parseResponse(res) // throws ApiError with the backend's message
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition') || ''
  const name = (cd.match(/filename="([^"]+)"/) || [])[1] || `BRSR_DRAFT.${fmt}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
