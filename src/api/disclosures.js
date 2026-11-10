/**
 * The disclosure workflow shared by GRI and SASB (backend: app/api/routes/disclosures.py).
 *
 *   GET  /{fw}/workspace?fy           every requirement / metric: figures, BRSR link, answer, state
 *   PUT  /{fw}/answers/{key}          {fy, text, use_brsr, omission_reason, omission_explanation, revision}
 *   PUT  /{fw}/owners/{key}           {fy, department}  (administrators; SASB takes a domain key or dept:<name>)
 *   POST /{fw}/submit                 {fy, keys}
 *   POST /{fw}/review                 {fy, keys, decision: approve|return, note}
 *   POST /{fw}/adopt-brsr             {fy, keys?}
 *
 * company_id is sent only by Deloitte users; client users always act on their own company.
 */
import { apiClient } from './client.js'
import { downloadAuthed } from './assurance.js'

export const withCompany = (body, companyId) => (companyId ? { ...body, company_id: companyId } : body)
const E = encodeURIComponent

export function query(fy, companyId) {
  const s = new URLSearchParams(withCompany(fy ? { fy } : {}, companyId)).toString()
  return s ? `?${s}` : ''
}

export function disclosureApi(fw) {
  return {
    getWorkspace: (fy, companyId) => apiClient.get(`/${fw}/workspace`, { params: withCompany(fy ? { fy } : {}, companyId) }),
    saveAnswer: (key, body, companyId) => apiClient.put(`/${fw}/answers/${E(key)}`, withCompany(body, companyId)),
    setOwner: (key, body, companyId) => apiClient.put(`/${fw}/owners/${E(key)}`, withCompany(body, companyId)),
    submitAnswers: (fy, keys, companyId) => apiClient.post(`/${fw}/submit`, withCompany({ fy, keys }, companyId)),
    reviewAnswers: (fy, keys, decision, note, companyId) =>
      apiClient.post(`/${fw}/review`, withCompany({ fy, keys, decision, note }, companyId)),
    adoptBrsr: (fy, keys, companyId) => apiClient.post(`/${fw}/adopt-brsr`, withCompany(keys ? { fy, keys } : { fy }, companyId)),
    download: (path, name) => downloadAuthed(`/${fw}/${path}`, name),
  }
}
