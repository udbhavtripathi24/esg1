import { useQuery, useMutation } from '@tanstack/react-query'
import { listDataSheets, getCoverage, checkDataSheet } from '../api/datasheets.js'

export function useDataSheets() {
  return useQuery({ queryKey: ['datasheets'], queryFn: listDataSheets, staleTime: Infinity })
}

export function useCoverage(fy, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['datasheets', 'coverage', fy, companyId || 'own'],
    queryFn: () => getCoverage(fy, companyId),
    enabled: enabled && !!fy,
  })
}

export function useCheckDataSheet() {
  return useMutation({ mutationFn: ({ code, file }) => checkDataSheet(code, file) })
}
