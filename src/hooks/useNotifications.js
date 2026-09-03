/**
 * React Query hooks for notifications. Same pattern as every other module.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications.js'

/**
 * Short staleTime — notifications are exactly the kind of data users expect
 * to feel current, but this is a poll-on-interaction pattern (refetch on
 * window focus, which the app's default QueryClient config already enables
 * globally), not a websocket — consistent with the project's approved
 * "poll every 30-60s + refetch-on-focus" notification design.
 */
export function useNotifications(params = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => getNotifications(params),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
