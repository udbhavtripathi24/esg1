import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/units.js'

const own = (companyId) => companyId || 'own'

export function useUnits(companyId, { enabled = true } = {}) {
  return useQuery({ queryKey: ['units', own(companyId)], queryFn: () => api.getUnits(companyId), enabled, staleTime: 60_000 })
}

/** The company's reporting units ({energy: 'GJ', …}), or null while loading — display code converts with it. */
export function useReportingUnits(companyId) {
  return useUnits(companyId).data?.reporting || null
}

export function useSaveUnits(companyId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.saveUnits(body, companyId),
    onSuccess: (data) => {
      qc.setQueryData(['units', own(companyId)], data)
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] })
    },
  })
}
