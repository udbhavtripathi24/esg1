/**
 * Demo ESG Dashboard API. Deliberately separate from the real
 * /analytics API -- this serves illustrative demo data only. See the
 * backend's app/services/demo_esg_data.py for the full explanation.
 *
 * Structure mirrors the reference document exactly: Environment (GHG/
 * Energy/Water/Waste), Social (Training/Diversity/Wellbeing/Health &
 * Safety/Complaints), Governance (Leadership Diversity/Supply Chain).
 */
import { apiClient } from './client.js'

export function getDemoFilters() {
  return apiClient.get('/demo-esg-dashboard/filters')
}

export function getDemoGhg(params = {}) {
  return apiClient.get('/demo-esg-dashboard/environment/ghg', { params })
}
export function getDemoEnergy(params = {}) {
  return apiClient.get('/demo-esg-dashboard/environment/energy', { params })
}
export function getDemoWater(params = {}) {
  return apiClient.get('/demo-esg-dashboard/environment/water', { params })
}
export function getDemoWaste(params = {}) {
  return apiClient.get('/demo-esg-dashboard/environment/waste', { params })
}

export function getDemoSocialTraining(params = {}) {
  return apiClient.get('/demo-esg-dashboard/social/training', { params })
}
export function getDemoSocialDiversity(params = {}) {
  return apiClient.get('/demo-esg-dashboard/social/diversity', { params })
}
export function getDemoSocialWellbeing(params = {}) {
  return apiClient.get('/demo-esg-dashboard/social/wellbeing', { params })
}
export function getDemoSocialHealthSafety(params = {}) {
  return apiClient.get('/demo-esg-dashboard/social/health-safety', { params })
}
export function getDemoSocialComplaints(params = {}) {
  return apiClient.get('/demo-esg-dashboard/social/complaints', { params })
}

export function getDemoGovernanceLeadership(params = {}) {
  return apiClient.get('/demo-esg-dashboard/governance/leadership', { params })
}
export function getDemoGovernanceSupplyChain(params = {}) {
  return apiClient.get('/demo-esg-dashboard/governance/supply-chain', { params })
}

export function getClimateFilters() {
  return apiClient.get('/demo-esg-dashboard/climate/filters')
}
export function getClimateTrend(params = {}) {
  return apiClient.get('/demo-esg-dashboard/climate/trend', { params })
}
export function getClimateScenario(params = {}) {
  // Convert years array to comma-separated string for backend compatibility
  const processedParams = { ...params }
  if (processedParams.years && Array.isArray(processedParams.years)) {
    processedParams.years = processedParams.years.join(',')
  }
  return apiClient.get('/demo-esg-dashboard/climate/scenario', { params: processedParams })
}
