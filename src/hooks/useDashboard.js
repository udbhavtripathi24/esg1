/**
 * React Query hooks for Dashboard. Same pattern as every other module.
 *
 * Query keys include the period dimensions explicitly, so switching
 * periods never shows stale data from a previous period — matches the
 * project's established "no cross-tenant/cross-filter cache leakage"
 * discipline.
 */
import { useQuery } from '@tanstack/react-query'
import { getConsultantDashboard, getClientDashboard, getClientDashboardTasks } from '../api/dashboard.js'

export function useConsultantDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'consultant'],
    queryFn: getConsultantDashboard,
  })
}

export function useClientDashboard(periodStart, periodEnd) {
  return useQuery({
    queryKey: ['dashboard', 'client', periodStart, periodEnd],
    queryFn: () => getClientDashboard(periodStart, periodEnd),
    enabled: !!(periodStart && periodEnd),
  })
}

export function useClientDashboardTasks(periodStart, periodEnd) {
  return useQuery({
    queryKey: ['dashboard', 'client-tasks', periodStart, periodEnd],
    queryFn: () => getClientDashboardTasks(periodStart, periodEnd),
    enabled: !!(periodStart && periodEnd),
  })
}
