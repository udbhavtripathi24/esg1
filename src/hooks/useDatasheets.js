import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listDataSheets, getCoverage, checkDataSheet, listUploads, getRevertPreview, withdrawUpload, revertUpload,
} from '../api/datasheets.js'

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

export function useUploads(fy, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['datasheets', 'uploads', fy, companyId || 'own'],
    queryFn: () => listUploads(fy, companyId),
    enabled: enabled && !!fy,
  })
}

export function useRevertPreview(publicId) {
  return useQuery({ queryKey: ['datasheets', 'revert-preview', publicId], queryFn: () => getRevertPreview(publicId), enabled: !!publicId })
}

/** After a withdraw or revert, every figure built from approved sheets may have changed. */
function useRefreshAfterEnd() {
  const qc = useQueryClient()
  return () => {
    for (const key of [['datasheets'], ['datasets'], ['kpis'], ['dashboard'], ['brsr'], ['gri'], ['sasb'], ['notifications']]) {
      qc.invalidateQueries({ queryKey: key })
    }
  }
}

export function useWithdrawUpload() {
  const refresh = useRefreshAfterEnd()
  return useMutation({ mutationFn: ({ publicId, note }) => withdrawUpload(publicId, note), onSuccess: refresh })
}

export function useRevertUpload() {
  const refresh = useRefreshAfterEnd()
  return useMutation({ mutationFn: ({ publicId, note }) => revertUpload(publicId, note), onSuccess: refresh })
}
