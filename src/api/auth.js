/**
 * Auth-specific API functions. Plain async functions — no React logic here.
 *
 * login() deliberately does NOT go through apiClient.post() because the
 * backend's /auth/login uses OAuth2 password flow, which requires
 * application/x-www-form-urlencoded with fields named `username`/`password`
 * (confirmed against the actual backend implementation) — not JSON like
 * every other endpoint. This is a genuine protocol difference, not a
 * style choice, so it's isolated here rather than bent into apiClient's
 * JSON-shaped request() helper.
 */
import { BASE_URL, parseResponse, apiClient } from './client.js'

/**
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>} resolves with no content on success (204)
 * @throws {ApiError} 403 if currentPassword is wrong, 422 if newPassword
 *   is too short, 401 if not authenticated
 */
export function changeOwnPassword(currentPassword, newPassword) {
  return apiClient.post('/auth/me/change-password', { current_password: currentPassword, new_password: newPassword })
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token: string, token_type: string, user: object}>}
 * @throws {ApiError} on invalid credentials (401), inactive account (403),
 *   or network failure.
 */
export async function login(email, password) {
  const formBody = new URLSearchParams({ username: email, password }).toString()
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  })
  return parseResponse(response)
}

/**
 * @returns {Promise<object>} the current user, including `permissions`.
 * @throws {ApiError} with status 401 if the token is missing/expired/invalid.
 */
export async function me() {
  return apiClient.get('/auth/me')
}
