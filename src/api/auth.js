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
 * Change your own password. Every other session is signed out; the response
 * carries a fresh token for this one (AuthContext.replaceToken).
 * @returns {Promise<{access_token: string}>}
 * @throws {ApiError} 403 wrong current password, 422 weak_password / same_password
 */
export function changeOwnPassword(currentPassword, newPassword) {
  return apiClient.post('/auth/me/change-password', { current_password: currentPassword, new_password: newPassword })
}

/** Public: whether e-mail (and so "Forgot password") is available, and the password rules. */
export const getAuthConfig = () => apiClient.get('/auth/config')

/** Always resolves the same way for known and unknown addresses. 429 when asked too often. */
export const forgotPassword = (email) => apiClient.post('/auth/forgot-password', { email })

/** @returns {Promise<{valid: boolean, purpose?: 'reset'|'invite', email?: string, name?: string}>} */
export const checkResetLink = (token) => apiClient.get('/auth/reset-password/check', { params: { token } })

/** Sets the password from a one-time link and signs in: same shape as login(). */
export const resetPassword = (token, newPassword) =>
  apiClient.post('/auth/reset-password', { token, new_password: newPassword })

export const updatePreferences = (body) => apiClient.patch('/auth/me/preferences', body)

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
