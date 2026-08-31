/**
 * React Query hooks for ConsultantAssignment staffing AND RBAC role
 * assignment. Same pattern as useCompanies.js / useUsers.js.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getConsultantAssignments, createConsultantAssignment, updateConsultantAssignment,
  getRoles, assignRole, removeRole,
} from '../api/assignments.js'

export function useConsultantAssignments(params = {}, options = {}) {
  return useQuery({
    queryKey: ['consultant-assignments', params],
    queryFn: () => getConsultantAssignments(params),
    enabled: options.enabled !== undefined ? options.enabled : true,
  })
}

export function useCreateConsultantAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createConsultantAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-assignments'] })
    },
  })
}

export function useUpdateConsultantAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    // {id, body} at call time — a company's team is a list of many
    // assignments, any of which might be updated, not one bound form.
    mutationFn: ({ id, body }) => updateConsultantAssignment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-assignments'] })
    },
  })
}

/** Read-only role metadata — long staleTime since roles rarely change. */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Creates a genuine UserRole. Invalidates ['users'] directly — there is no
 * GET /rbac/assignments list endpoint, so the UI's "current role" display
 * (derived from the /users response's role display-hint field) is what
 * actually needs to refresh after this mutation.
 */
export function useAssignRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/** Removes a UserRole (hard delete, no soft-removal — see api/assignments.js). */
export function useRemoveRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
