import { useQuery } from '@tanstack/react-query'
import {
  getDemoFilters, getDemoGhg, getDemoEnergy, getDemoWater, getDemoWaste,
  getDemoSocialTraining, getDemoSocialDiversity, getDemoSocialWellbeing,
  getDemoSocialHealthSafety, getDemoSocialComplaints,
  getDemoGovernanceLeadership, getDemoGovernanceSupplyChain,
  getClimateFilters, getClimateTrend, getClimateScenario,
} from '../api/demoEsgDashboard.js'

export function useDemoFilters() {
  return useQuery({ queryKey: ['demo-esg', 'filters'], queryFn: getDemoFilters })
}

export function useDemoGhg(params) {
  return useQuery({ queryKey: ['demo-esg', 'ghg', params], queryFn: () => getDemoGhg(params) })
}
export function useDemoEnergy(params) {
  return useQuery({ queryKey: ['demo-esg', 'energy', params], queryFn: () => getDemoEnergy(params) })
}
export function useDemoWater(params) {
  return useQuery({ queryKey: ['demo-esg', 'water', params], queryFn: () => getDemoWater(params) })
}
export function useDemoWaste(params) {
  return useQuery({ queryKey: ['demo-esg', 'waste', params], queryFn: () => getDemoWaste(params) })
}

export function useDemoSocialTraining(params) {
  return useQuery({ queryKey: ['demo-esg', 'social-training', params], queryFn: () => getDemoSocialTraining(params) })
}
export function useDemoSocialDiversity(params) {
  return useQuery({ queryKey: ['demo-esg', 'social-diversity', params], queryFn: () => getDemoSocialDiversity(params) })
}
export function useDemoSocialWellbeing(params) {
  return useQuery({ queryKey: ['demo-esg', 'social-wellbeing', params], queryFn: () => getDemoSocialWellbeing(params) })
}
export function useDemoSocialHealthSafety(params) {
  return useQuery({ queryKey: ['demo-esg', 'social-health-safety', params], queryFn: () => getDemoSocialHealthSafety(params) })
}
export function useDemoSocialComplaints(params) {
  return useQuery({ queryKey: ['demo-esg', 'social-complaints', params], queryFn: () => getDemoSocialComplaints(params) })
}

export function useDemoGovernanceLeadership(params) {
  return useQuery({ queryKey: ['demo-esg', 'gov-leadership', params], queryFn: () => getDemoGovernanceLeadership(params) })
}
export function useDemoGovernanceSupplyChain(params) {
  return useQuery({ queryKey: ['demo-esg', 'gov-supply-chain', params], queryFn: () => getDemoGovernanceSupplyChain(params) })
}

export function useClimateFilters() {
  return useQuery({ queryKey: ['demo-esg', 'climate-filters'], queryFn: getClimateFilters })
}
export function useClimateTrend(params) {
  return useQuery({ queryKey: ['demo-esg', 'climate-trend', params], queryFn: () => getClimateTrend(params) })
}
export function useClimateScenario(params) {
  return useQuery({ queryKey: ['demo-esg', 'climate-scenario', params], queryFn: () => getClimateScenario(params) })
}
