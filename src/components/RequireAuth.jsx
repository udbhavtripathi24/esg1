import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Protects a route GROUP (wraps <ConsultantLayout>/<ClientLayout> in App.jsx),
 * not individual pages — per the plan, no per-page guards.
 *
 * `portal` restricts to a specific backend `user.portal_type` ('deloitte' | 'client').
 * Omit it to require only "is authenticated, any portal."
 *
 * Behavior:
 * - not authenticated            -> redirect to /login (preserving intended
 *                                    destination in location.state, for a
 *                                    future "redirect back after login")
 * - authenticated, wrong portal  -> redirect to the OTHER portal's dashboard
 *                                    (a client user hitting /consultant/* is
 *                                    far more likely to want /client/dashboard
 *                                    than an error page)
 * - authenticated, right portal  -> render children
 *
 * Permission-level checks (hasPermission) are deliberately NOT wired into
 * this component yet — that happens per-screen during business integration,
 * per the plan for this step.
 */
export default function RequireAuth({ portal, children }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Avoid a flash of the login page while we're still checking a persisted
  // token on initial app load.
  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (portal && user?.portal_type !== portal) {
    const otherPortalHome = user?.portal_type === 'client' ? '/client/dashboard' : '/consultant/dashboard'
    return <Navigate to={otherPortalHome} replace />
  }

  return children
}
