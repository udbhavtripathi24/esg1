/**
 * Thin native-fetch API client.
 *
 * Deliberately does NOT import React or any hook — this file must be usable
 * from anywhere without circular-dependency risk with AuthContext.
 * AuthContext calls setAuthToken() whenever the token changes (login,
 * restore, logout); this file never imports AuthContext.
 *
 * No Axios: the backend returns a uniform JSON error envelope
 * ({ error: { code, message, field } }) and consistent status codes, so
 * an HTTP-client library would add nothing meaningful here.
 *
 * Auth-specific requests (login's form-encoded body) live in api/auth.js,
 * not here — this file is the generic REST wrapper only.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '')

// ---- Token access -----------------------------------------------------
// A plain module-level variable, NOT React state, so this file stays
// framework-independent.
let _authToken = null

export function setAuthToken(token) {
  _authToken = token
}

export function getAuthToken() {
  return _authToken
}

// ---- Error shape --------------------------------------------------------

/**
 * Normalized error thrown for any non-2xx response or network failure.
 * UI code branches on `status` to distinguish 401/403/404/409/422/500/network.
 */
export class ApiError extends Error {
  constructor(message, { status, code = null, field = null, isNetworkError = false } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.field = field
    this.isNetworkError = isNetworkError
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Parses a fetch Response into either the decoded JSON body (on success) or
 * throws a normalized ApiError (on failure). Shared by request() and any
 * caller (e.g. api/auth.js) that needs to hit fetch() directly for a
 * non-standard request shape (form-encoded login) but still wants the same
 * error normalization.
 */
export async function parseResponse(response) {
  const text = await response.text()
  const data = text ? safeJsonParse(text) : null

  if (!response.ok) {
    const errInfo = data?.error
    throw new ApiError(errInfo?.message || `Request failed with status ${response.status}`, {
      status: response.status,
      code: errInfo?.code || null,
      field: errInfo?.field || null,
    })
  }
  return data
}

// ---- Core request function ----------------------------------------------

/**
 * @param {string} path - path relative to BASE_URL, e.g. '/companies'
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {object|FormData} [options.body] - plain object is JSON-encoded;
 *   FormData is sent as-is (Content-Type intentionally left unset so the
 *   browser sets the correct multipart boundary — relevant for future file
 *   uploads, not used by anything in this step).
 * @param {object} [options.params] - query string params
 * @param {AbortSignal} [options.signal] - for cancellation
 */
async function request(path, { method = 'GET', body, params, signal } = {}) {
  let url = `${BASE_URL}${path}`
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers = {}
  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`
  }

  let fetchBody
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (isFormData) {
    fetchBody = body
    // Do NOT set Content-Type for FormData — browser sets the boundary.
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    fetchBody = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, { method, headers, body: fetchBody, signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err // let callers handle cancellation
    throw new ApiError('Network error — could not reach the server', {
      status: null,
      isNetworkError: true,
    })
  }

  return parseResponse(response)
}

// ---- Public verb helpers --------------------------------------------------

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}

export { BASE_URL }
