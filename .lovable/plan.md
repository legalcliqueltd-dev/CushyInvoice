
# Add 2-Step OTP Verification for Email Sign-In

## Overview
After a user signs in with their email and password, they will receive a 6-digit verification code via email before being granted access. This adds an extra layer of security to every login.

## How It Will Work

1. User enters email + password and clicks "Sign In"
2. Password is verified against the database -- if wrong, show error as usual
3. If password is correct, the user is immediately signed out and a 6-digit OTP is sent to their email
4. The OTP verification screen appears (reusing the existing OTP UI)
5. User enters the code -- once verified, they are fully signed in and redirected to the dashboard

## Technical Details

### Changes in `src/pages/Auth.tsx`

**New state variable:**
- `isLoginOtp` (boolean) -- tracks whether the current OTP screen is for a login verification (vs. signup verification)

**Updated sign-in flow (`handleSubmit`):**
- After successful `signInWithPassword`, immediately call `supabase.auth.signOut()` to prevent auto-redirect
- Then call `supabase.auth.signInWithOtp({ email })` to send a verification code
- Set `pendingEmail`, `isLoginOtp = true`, `showOtpVerification = true`, and start the resend cooldown
- Show toast: "Verification code sent to your email"

**Updated OTP verification (`handleVerifyOtp`):**
- Check `isLoginOtp` flag to determine the OTP type
- For login: call `supabase.auth.verifyOtp({ email, token, type: 'email' })` (type `email` instead of `signup`)
- Skip profile creation (profile already exists for returning users)
- Show toast: "Welcome back! You've successfully signed in."

**Updated OTP resend (`handleResendOtp`):**
- When `isLoginOtp` is true, use `supabase.auth.signInWithOtp({ email })` to resend (instead of `supabase.auth.resend({ type: 'signup' })`)

**Updated `onAuthStateChange` listener:**
- Add a guard so that when `showOtpVerification` is true, the `SIGNED_IN` event from the initial password check does not auto-redirect to the dashboard before sign-out completes

**OTP screen "Back" button:**
- When `isLoginOtp` is true, the back button label says "Back to Sign In" and resets `isLoginOtp`

### No other files need to change
The existing OTP UI components (InputOTP slots, resend button, cooldown timer) are fully reused.
