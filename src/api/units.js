/**
 * Units (backend: app/api/routes/units.py) — Admin Console → Units.
 *
 *   GET /units                       quantities, sheet column groups, unit kinds, the company's choices
 *   PUT /units {reporting, uploads}  administrators
 */
import { apiClient } from './client.js'
import { withCompany } from './disclosures.js'

export const getUnits = (companyId) => apiClient.get('/units', { params: withCompany({}, companyId) })
export const saveUnits = (body, companyId) => apiClient.put('/units', withCompany(body, companyId))
