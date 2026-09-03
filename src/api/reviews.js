/**
 * Reviews/Comments API. Plain async functions using the existing apiClient.
 *
 * Backend contract (verified against app/api/routes/reviews.py, Stage 5):
 *   POST /datasets/{ds}/versions/{v}/reviews          -> ReviewRead, requires dataset:review
 *   GET  /datasets/{ds}/versions/{v}/reviews           -> ReviewRead[]
 *   POST /datasets/{ds}/versions/{v}/reviews/{rv}/decide -> ReviewRead, requires dataset:review
 *   POST /datasets/{ds}/versions/{v}/comments          -> CommentRead, requires comment:create
 *   GET  /datasets/{ds}/versions/{v}/comments          -> CommentRead[]
 *
 * IMPORTANT: submitted -> under_review only happens via assign_review. There
 * is no "just decide" shortcut — a reviewer must be assigned first, even if
 * that reviewer is the current user assigning themselves.
 *
 * KNOWN GAP, disclosed (not silently worked around): there is no endpoint to
 * list which DatasetFile rows belong to a given version (confirmed — only
 * single-file download by known public_id exists). Review Center's
 * Supporting Documents section reflects this honestly rather than fetching
 * files it has no way to discover.
 */
import { apiClient } from './client.js'

export function assignReview(datasetPublicId, versionPublicId, reviewerUserId, tier = 1) {
  return apiClient.post(`/datasets/${datasetPublicId}/versions/${versionPublicId}/reviews`, {
    reviewer_user_id: reviewerUserId, tier,
  })
}

export function getReviews(datasetPublicId, versionPublicId) {
  return apiClient.get(`/datasets/${datasetPublicId}/versions/${versionPublicId}/reviews`)
}

/**
 * @param {string} decision - 'approved' | 'changes_requested' | 'rejected'
 * @param {string} note - required, non-empty (enforced server-side)
 */
export function decideReview(datasetPublicId, versionPublicId, reviewPublicId, decision, note) {
  return apiClient.post(
    `/datasets/${datasetPublicId}/versions/${versionPublicId}/reviews/${reviewPublicId}/decide`,
    { decision, note }
  )
}

/**
 * @param {object} body
 * @param {string} body.body - comment text
 * @param {'general'|'field'|'decision'} [body.kind]
 * @param {string} [body.field_reference]
 * @param {number} [body.parent_comment_id] - for threaded replies, max depth 3
 */
export function createComment(datasetPublicId, versionPublicId, body) {
  return apiClient.post(`/datasets/${datasetPublicId}/versions/${versionPublicId}/comments`, body)
}

export function getComments(datasetPublicId, versionPublicId) {
  return apiClient.get(`/datasets/${datasetPublicId}/versions/${versionPublicId}/comments`)
}
