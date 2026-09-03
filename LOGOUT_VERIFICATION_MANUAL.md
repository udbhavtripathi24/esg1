# Logout Authentication Fix - Manual Verification Guide

## Critical Bug Fixed
- Topbar logout button now properly clears authentication session
- React Query cache now cleared on logout to prevent cross-user data contamination
- ClientLayout now uses real authenticated user instead of mock data

## Manual Verification Steps

### CLIENT PORTAL TEST

1. **Login**
   - Navigate to: `http://localhost:5173/login`
   - Select: "Client User" tab
   - Email: `client.admin@testco.local`
   - Password: `ClientLocal@2026`
   - Click "Sign in"

2. **Verify Dashboard Access**
   - Should land on: `/client/dashboard`
   - Dashboard should display with real user data
   - Check Topbar shows authenticated user name

3. **Click Logout**
   - Click user avatar in top-right
   - Click "Log out" button
   - Should navigate to: `/login`

4. **Verify Session Cleared**
   - Open DevTools → Application → Local Storage → `http://localhost:5173`
   - Verify `vista_auth_token` is **GONE** ✅
   - Should be `null` or not present

5. **Test Protected Route Access (Soft Navigation)**
   - In address bar, type: `http://localhost:5173/client/dashboard`
   - Press Enter
   - **Expected**: Brief blank screen (~10-50ms), then redirect to `/login`
   - **Should NOT see**: Dashboard content

6. **Test Protected Route Access (Hard Refresh)**
   - Ensure you're logged out
   - Navigate to: `http://localhost:5173/client/dashboard`
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows) for hard refresh
   - **Expected**: Redirect to `/login`
   - **Should NOT see**: Dashboard content

7. **Re-login Verification**
   - Login again as `client.admin@testco.local`
   - Dashboard should load with **fresh data**
   - No stale cached data from previous session

### CONSULTANT PORTAL TEST

1. **Login**
   - Navigate to: `http://localhost:5173/login`
   - Select: "Deloitte Consultant" tab
   - Email: `dev.admin@deloitte.local`
   - Password: `DevLocal@2026`
   - Click "Sign in"

2. **Verify Dashboard Access**
   - Should land on: `/consultant/dashboard`
   - Dashboard should display

3. **Click Logout**
   - Click user avatar
   - Click "Log out"
   - Should navigate to: `/login`

4. **Verify Session Cleared**
   - DevTools → Local Storage
   - Verify `vista_auth_token` is **GONE**

5. **Test Protected Route (Soft)**
   - Type in address bar: `http://localhost:5173/consultant/dashboard`
   - **Expected**: Redirect to `/login`

6. **Test Protected Route (Hard Refresh)**
   - Navigate to: `http://localhost:5173/consultant/dashboard`
   - Hard refresh
   - **Expected**: Redirect to `/login`

### CROSS-USER CACHE CONTAMINATION TEST

1. **Login as User A**
   - Login as: `client.admin@testco.local` / `ClientLocal@2026`
   - Navigate to: `/client/upload-center` or any data-heavy page
   - Let data load completely
   - Note any visible company/user-specific data

2. **Logout**
   - Click logout
   - Verify at `/login`

3. **Login as Different User**
   - Login as: `dev.admin@deloitte.local` / `DevLocal@2026`
   - Navigate to dashboard

4. **Verify No Data Leak**
   - **Should NOT see**: Any data from previous client user
   - **Should see**: Fresh data for consultant user
   - Check notifications - should not show client's notifications
   - Check any loaded lists - should be fresh, not cached from User A

### NETWORK VERIFICATION

Open DevTools → Network tab during logout test:

1. **After Logout Button Click**
   - No `GET /api/v1/companies` should succeed
   - No `GET /api/v1/datasets` should succeed
   - No `GET /api/v1/notifications` should succeed
   - All protected API calls should return **401 Unauthorized**

2. **After Re-login**
   - Protected API calls should return **200 OK**
   - Authorization headers should contain new JWT token

### SUCCESS CRITERIA

✅ **localStorage cleared** after logout
✅ **Protected routes inaccessible** after logout (both soft nav and hard refresh)
✅ **No cross-user data contamination** between login sessions
✅ **API calls fail with 401** when unauthenticated
✅ **Clean re-login** with fresh data

### FAILURE INDICATORS

❌ Dashboard visible after logout
❌ `vista_auth_token` still in localStorage after logout
❌ Protected API calls return 200 after logout
❌ Previous user's data visible to new user
❌ Cached notifications/datasets from previous session

## Automated Tests

Run tests with:
```bash
npm test src/__tests__/auth-logout.test.jsx
```

Tests verify:
- A. Logout clears localStorage token
- B. Logout clears AuthContext state
- C. Logout clears API client token
- D. Logout clears React Query cache
- I. ClientLayout uses real user (not mock)
- J. Topbar calls real logout function

## Build Verification

```bash
npm run build  # Should pass
npm run lint   # Should pass (1 pre-existing warning OK)
```
