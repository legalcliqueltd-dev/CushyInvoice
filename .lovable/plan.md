

# Redesigned OTP Verification Page

## Overview
Replace the current inline OTP verification (embedded inside AuthLayout) with a dedicated, full-screen OTP page optimized for both desktop and mobile/native apps.

## Design (Based on Reference Screenshot)

The new OTP screen will be a standalone full-page view with:
- Centered layout with the CushyInvoice logo at top
- A mail icon in a colored circle
- "Verify your email" heading
- Subtitle showing the email address the code was sent to
- Large, touch-friendly OTP input slots (bigger on mobile for easy tapping)
- "Verify" button
- "Resend code" link with cooldown timer
- "Back to Sign In / Sign Up" link
- Mobile-optimized: larger tap targets, proper safe-area padding, full-width on small screens

## Technical Details

### File: `src/pages/Auth.tsx`

Replace the current OTP `if (showOtpVerification)` block (lines 363-421) with a new dedicated full-screen layout instead of wrapping in `AuthLayout`.

**New OTP UI structure:**
```
Full screen centered container
  |-- CushyInvoice logo + name
  |-- Mail icon (in rounded primary bg circle)
  |-- "Verify your email" heading
  |-- "Enter the 6-digit code sent to {email}" subtitle
  |-- Card with:
  |     |-- OTP input (6 slots, larger on mobile)
  |     |-- Paste-friendly: users can paste the full code
  |     |-- "Verify" button (full width, prominent)
  |-- "Didn't receive?" + Resend link with cooldown
  |-- "Back to Sign In/Up" link
```

**Key changes:**
- Remove `AuthLayout` wrapper for the OTP view -- use a custom centered layout instead
- OTP slots styled larger for mobile (`h-12 w-12` on mobile, `h-14 w-14` on desktop)
- Add `autoFocus` to the OTP input so users can immediately start typing/pasting
- Safe area padding (`safe-top safe-bottom`) for native mobile apps
- All existing logic (verify, resend, back) stays the same -- only the UI template changes

### No new files needed
All changes are contained within `src/pages/Auth.tsx` by replacing the OTP rendering block.
