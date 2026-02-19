

# Simplify Login: Remove 2-Step OTP for Sign-In

## What Changes

**Sign-in**: Goes back to standard email + password. After entering correct credentials, users go straight to the dashboard -- no OTP step.

**Sign-up**: Keeps the OTP email verification (the dedicated OTP page you just built stays for new account creation).

**Unverified email on login**: If a user tries to sign in but hasn't verified their email yet, they still get redirected to the OTP page to complete verification.

## Technical Changes (all in `src/pages/Auth.tsx`)

1. **Remove the 2-step OTP logic from the login flow (lines 166-175)**
   - Delete the `signOut()` + `signInWithOtp()` calls after successful password check
   - After successful `signInWithPassword`, let the normal auth flow redirect to dashboard (the `onAuthStateChange` listener handles this)

2. **Remove `isLoginOtp` state variable (line 27)**
   - No longer needed since login never enters the OTP flow
   - Remove all references to `isLoginOtp` throughout the file

3. **Simplify `handleVerifyOtp` (lines 226-230)**
   - Always use `type: 'signup'` since OTP is only for new signups now
   - Remove the `isLoginOtp` conditional branch (lines 235-237)

4. **Simplify `handleResendOtp` (lines 270-276)**
   - Always use `supabase.auth.resend({ type: 'signup' })` since only signup uses OTP
   - Remove the `isLoginOtp` conditional

5. **Simplify `onAuthStateChange` guard (line 50)**
   - Keep the `showOtpVerification` guard (still needed for signup OTP)
   - No changes needed here

6. **Update OTP "Back" button text (line 440)**
   - Always show "Back to Sign Up" since OTP is only for signup now

The dedicated OTP page UI you just built stays exactly as-is -- it just only appears during signup now.

