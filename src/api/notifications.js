/**
 * Notifications API. Plain async functions using the existing apiClient.
 *
 * Backend contract (verified against app/api/routes/reviews.py's
 * notifications_router, Stage 5):
 *   GET  /notifications              -> Page<NotificationRead>, tenant-scoped
 *                                        via actor's own JWT-derived id — never
 *                                        trusts a client-supplied user id
 *   POST /notifications/{id}/mark-read     -> NotificationRead
 *   POST /notifications/mark-all-read      -> {marked: number}
 *
 * Real event_type values, confirmed exhaustively via grep across the
 * backend (not guessed): new_assignment, data_approved, data_rejected,
 * changes_requested — all four originate from Review Center's decision flow.
 */
import { apiClient } from './client.js'

export function getNotifications(params = {}) {
  return apiClient.get('/notifications', { params })
}

export function markNotificationRead(id) {
  return apiClient.post(`/notifications/${id}/mark-read`)
}

export function markAllNotificationsRead() {
  return apiClient.post('/notifications/mark-all-read')
}
