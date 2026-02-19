

# Fix: Block Dashboard Access Until Email is Verified

## Problem
When a new user signs up, the backend creates a session immediately -- even before the email is confirmed. This means:
- The auth state listener fires and redirects to the dashboard
- Clicking "Back" on the OTP page goes to `/auth`, which finds the unconfirmed session and redirects to the dashboard
- The ProtectedRoute only checks for a session, not whether the email has been verified

## Solution
Check the user's `email_confirmed_at` field (provided by the authentication system) at every gate to ensure unverified users cannot access the app.

## Changes

### 1. `src/pages/Auth.tsx`
- In `getSession` check (line 35-40): Only redirect to dashboard if `session.user.email_confirmed_at` is set
- In `onAuthStateChange` listener (line 42-51): Only redirect to dashboard if `session.user.email_confirmed_at` is set
- If a session exists but email is unconfirmed, sign the user out to clear the dangling session

### 2. `src/components/ProtectedRoute.tsx`
- After getting the session, also check `session.user.email_confirmed_at`
- If the session exists but email is not confirmed, sign the user out and redirect to `/auth`
- This is the final safety net -- even if someone manually navigates to `/dashboard`, they get bounced back

### 3. `src/pages/VerifyOtp.tsx`
- Change the "Back" button to sign the user out before navigating to `/auth`
- This clears the unconfirmed session so the user starts fresh on the auth page

## How It Works After the Fix

```text
Signup Flow:
  User signs up
    --> Backend creates unconfirmed session
    --> Auth.tsx sees session but email_confirmed_at is null
    --> Does NOT redirect to dashboard
    --> Navigates to /auth/verify

OTP Page "Back" button:
  User clicks Back
    --> Signs out (clears unconfirmed session)
    --> Navigates to /auth
    --> No session found, stays on auth page

Direct URL to /dashboard:
  User types /dashboard in browser
    --> ProtectedRoute checks session
    --> email_confirmed_at is null
    --> Signs out and redirects to /auth

After OTP verification:
  User enters correct code
    --> verifyOtp confirms the email
    --> email_confirmed_at is now set
    --> Profile created, navigates to /dashboard
    --> ProtectedRoute sees confirmed email, allows access
```

