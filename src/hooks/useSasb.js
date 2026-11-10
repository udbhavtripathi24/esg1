import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/sasb.js'

const own = (companyId) => companyId || 'own'

export function useSasbIndustries(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: ['sasb', 'industries', own(companyId)], queryFn: () => api.getIndustries(companyId), enabled })
}

export function useSasbMetrics(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: ['sasb', 'metrics', own(companyId)], queryFn: () => api.getMetrics(companyId), enabled })
}

export function useSetSasbIndustries(companyId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (industries) => api.setIndustries(industries, companyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sasb'] }),
  })
}
