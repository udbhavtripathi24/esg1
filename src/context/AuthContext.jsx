import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth.js'
import { setAuthToken } from '../api/client.js'

const AuthContext = createContext(null)

const TOKEN_STORAGE_KEY = 'vista_auth_token'

/**
 * Auth model:
 * - token is the runtime source of truth for "am I authenticated"
 * - persisted to localStorage ONLY so a page refresh doesn't force re-login.
 *   TRADEOFF (documented per Step 3B instructions): storing the JWT in
 *   localStorage means any XSS vulnerability in this app becomes a full
 *   session-takeover vector, since localStorage is readable by any script
 *   running on the page (unlike an httpOnly cookie, which JS can't read at
 *   all). This is an accepted tradeoff for this beta — there is no
 *   dangerouslySetInnerHTML or similar XSS-prone pattern in the current
 *   codebase, and building httpOnly-cookie auth (which requires backend
 *   changes: Set-Cookie, CSRF token handling, SameSite config) is out of
 *   scope for a beta. This should be revisited before a production launch
 *   handling real client financial/ESG data.
 * - the persisted TOKEN is trusted enough to attempt restoration, but the
 *   persisted USER data is never trusted as authoritative — on every app
 *   start, if a token exists, GET /auth/me is called and THAT response
 *   becomes the real user/permissions. A 401 from /auth/me clears
 *   everything and treats the session as logged out.
 * - No refresh-token mechanism exists on the backend (60min expiry,
 *   confirmed in app/core/config.py: ACCESS_TOKEN_EXPIRE_MINUTES=60). None
 *   is invented here. Expiry means the next authenticated API call gets a
 *   401; reacting to that (e.g. auto-logout on a stale token) belongs in
 *   the API-consuming layer once business screens exist — out of scope for
 *   this auth-foundation step.
 * - The password is NEVER stored, in this context or in localStorage —
 *   only the token and (transiently, in React state) the user object.
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [token, setToken] = useState(null)
  // isLoading covers ONLY the initial restoration-from-storage attempt on
  // app boot, so route guards can avoid a flash of the login page before
  // we've had a chance to check for a persisted session.
  const [isLoading, setIsLoading] = useState(true)

  const applySession = useCallback((sessionUser, sessionToken) => {
    setUser(sessionUser)
    setPermissions(sessionUser?.permissions || [])
    setToken(sessionToken)
    setAuthToken(sessionToken) // keep api/client.js's module-level token in sync
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setPermissions([])
    setToken(null)
    setAuthToken(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    // Clear all React Query cache to prevent cross-user data contamination.
    // Investigation confirmed no public/unauthenticated queries exist that
    // need to survive logout. All cached queries (companies, users, datasets,
    // notifications, etc.) contain user/company/org-sensitive data.
    queryClient.clear()
  }, [queryClient])

  // Restore on app boot: read a persisted token, verify it via /auth/me
  // (never trust a persisted user object as authoritative).
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    setAuthToken(storedToken) // so the /auth/me call below carries the header
    authApi
      .me()
      .then((meResponse) => {
        applySession(meResponse, storedToken)
      })
      .catch(() => {
        // A 401 (expired/invalid token) means "treat as logged out" — this
        // is the expected, documented case. Any OTHER failure (network
        // error, 500) is also treated as logged-out for now, since there is
        // no safe partial-auth state to fall back to, but it is not
        // silently swallowed — it surfaces via isAuthenticated staying
        // false, and the underlying error is available to anyone reading
        // this code, not hidden.
        clearSession()
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (email, password) => {
      // Throws ApiError on failure (401 invalid creds, 403 inactive account,
      // network error) — Login.jsx handles the error and displays it.
      const data = await authApi.login(email, password)
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token)
      applySession(data.user, data.access_token)
      return data.user // so Login.jsx can redirect based on portal_type
    },
    [applySession]
  )

  const logout = useCallback(() => {
    // No backend logout endpoint exists — this is purely local session
    // clearing, as specified. The now-invalid token simply expires
    // server-side on its own after 60 minutes if somehow reused.
    clearSession()
  }, [clearSession])

  const hasPermission = useCallback(
    (permission) => permissions.includes(permission),
    [permissions]
  )

  const hasAnyPermission = useCallback(
    (...perms) => perms.some((p) => permissions.includes(p)),
    [permissions]
  )

  const hasAllPermissions = useCallback(
    (...perms) => perms.every((p) => permissions.includes(p)),
    [permissions]
  )

  const value = {
    user,
    permissions,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
