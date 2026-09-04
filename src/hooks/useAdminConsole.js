/**
 * React Query hooks for Admin Console's real features (Audit Logs,
 * Integration Configuration). Same pattern as useDashboard.js/useAnalytics.js.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuditLogs } from '../api/adminAudit.js'
import { getIntegrations, createIntegration, updateIntegration } from '../api/integrations.js'

export function useAuditLogs(params = {}) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => getAuditLogs(params),
  })
}

export function useIntegrations(params = {}) {
  return useQuery({
    queryKey: ['admin', 'integrations', params],
    queryFn: () => getIntegrations(params),
  })
}

export function useCreateIntegration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => createIntegration(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] }),
  })
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => updateIntegration(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'integrations'] }),
  })
}
