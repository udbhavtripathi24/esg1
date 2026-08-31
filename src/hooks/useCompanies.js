/**
 * React Query hooks for companies. Query key contains the full params
 * object so any filter/pagination change produces a distinct cache entry —
 * no custom cache machinery.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCompanies, createCompany, updateCompany } from '../api/companies.js'

export function useCompanies(params = {}) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => getCompanies(params),
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      // Broad invalidation is fine here: at the stated scale (a handful of
      // companies), refetching the whole companies list is cheap, and it
      // guarantees the new company appears regardless of which filtered/
      // paginated view is currently active.
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useUpdateCompany(companyId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => updateCompany(companyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
