import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/admin.js'

export function useAdminRoles() {
  return useQuery({ queryKey: ['admin', 'roles'], queryFn: api.getRoles, staleTime: 10 * 60_000 })
}

export function useAdminUsers(params, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['admin', 'users', companyId || 'own', params],
    queryFn: () => api.getUsers(params, companyId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

function useUserMutation(fn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      qc.invalidateQueries({ queryKey: ['audit-logs'] })
      qc.invalidateQueries({ queryKey: ['admin', 'audit-logs'] })
    },
  })
}

export const useCreateUser = (companyId) => useUserMutation((body) => api.createUser(body, companyId))
export const useUpdateUser = (companyId) => useUserMutation(({ id, body }) => api.updateUser(id, body, companyId))
export const useSetUserRole = (companyId) => useUserMutation(({ id, role }) => api.setUserRole(id, role, companyId))
export const useSetUserStatus = (companyId) => useUserMutation(({ id, active }) => api.setUserStatus(id, active, companyId))
export const useResetPassword = (companyId) => useUserMutation((id) => api.resetUserPassword(id, companyId))
export const useImportUsers = (companyId) => useUserMutation(({ file, dryRun }) => api.importUsers(file, dryRun, companyId))

export function useTargets(fy, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['admin', 'targets', companyId || 'own', fy],
    queryFn: () => api.getTargets(fy, companyId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

function useTargetMutation(fn) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'targets'] }) })
}

export const useCreateTarget = (fy, companyId) => useTargetMutation((body) => api.createTarget(body, fy, companyId))
export const useUpdateTarget = (fy, companyId) => useTargetMutation(({ id, body }) => api.updateTarget(id, body, fy, companyId))
export const useDeleteTarget = (companyId) => useTargetMutation((id) => api.deleteTarget(id, companyId))

export function useApprovals(params, companyId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['admin', 'approvals', companyId || 'own', params],
    queryFn: () => api.getApprovals(params, companyId),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useFactors() {
  return useQuery({ queryKey: ['admin', 'factors'], queryFn: api.getFactors, staleTime: 30 * 60_000 })
}
