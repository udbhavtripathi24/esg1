/**
 * VISTA AI (backend: app/api/routes/ai.py). The provider key stays on the server.
 *
 *   GET  /ai/status
 *   POST /ai/analyze {fy?, location?, focus?}
 *   POST /ai/ask {question, history?, fy?, location?}
 *   POST /ai/review/{dataset}/{version}
 *   POST /ai/write {text, mode, question?, max_words?}
 */
import { apiClient } from './client.js'
import { withCompany } from './disclosures.js'

export const getAiStatus = () => apiClient.get('/ai/status')
export const aiAnalyze = (body, companyId) => apiClient.post('/ai/analyze', withCompany(body, companyId))
export const aiAsk = (body, companyId) => apiClient.post('/ai/ask', withCompany(body, companyId))
export const aiReview = (ds, v) => apiClient.post(`/ai/review/${ds}/${v}`, {})
export const aiWrite = (body) => apiClient.post('/ai/write', body)
