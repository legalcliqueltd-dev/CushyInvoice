

## Resend Email Integration + Welcome Onboarding Flow

### Overview
Three features in one update:
1. **Resend API** for sending real emails (invoice emails, reminders, welcome email)
2. **Welcome email** sent automatically to every new user on signup
3. **Quick tutorial/onboarding** shown on the dashboard for first-time users

---

### 1. Resend Email Integration

**Secret needed:** `RESEND_API_KEY` -- you'll get this from [resend.com](https://resend.com) after creating a free account and verifying your domain (`cushyinvoice.com`).

**New edge function: `supabase/functions/send-email/index.ts`**
A generic email-sending function using the Resend API that:
- Accepts `to`, `subject`, `html`, and optional `attachments` (base64 PDF)
- Sends via `https://api.resend.com/emails`
- Uses `from: "CushyInvoice <noreply@cushyinvoice.com>"` (requires domain verification in Resend)
- Returns success/failure

**Update `send-invoice-email/index.ts`:**
- Replace the current "log only" approach with an actual call to the new `send-email` function (or call Resend directly)
- Keep the AI-generated email body
- Attach the PDF base64 as a Resend attachment

**Update `process-payment-reminders/index.ts`:**
- No changes needed -- it already calls `send-invoice-email`, which will now actually send

---

### 2. Welcome Email for New Users

**New edge function: `supabase/functions/send-welcome-email/index.ts`**
- Triggered from the frontend after a new profile is created (during signup/OTP verification)
- Sends a branded HTML welcome email via Resend containing:
  - Welcome greeting with the user's name
  - Trial info (7-day free trial)
  - Quick-start steps (Add a client, Create your first invoice, Send it)
  - Link to the dashboard

**Frontend change: `src/pages/Auth.tsx`**
- After successful profile creation (in `handleVerifyOtp` and `ensureProfileExists` for new users), call `supabase.functions.invoke("send-welcome-email", { body: { userId } })`

---

### 3. First-Time User Tutorial on Dashboard

**New component: `src/components/WelcomeTutorial.tsx`**
- A dismissible card/dialog shown at the top of the dashboard for users who have 0 invoices and 0 clients
- Steps displayed as a checklist:
  1. Complete your company profile (link to Settings)
  2. Add your first client (link to Clients)
  3. Create your first invoice (link to Invoices/New)
  4. Send it to your client
- Progress tracked via `localStorage` key `cushy_tutorial_dismissed`
- Once dismissed, it won't show again

**Update `src/pages/Dashboard.tsx`:**
- Import and render `WelcomeTutorial` above the stats cards
- Only show when the user has 0 invoices (use existing `stats.totalInvoices`)

---

### Technical Details

**Files to create:**
- `supabase/functions/send-email/index.ts` -- generic Resend email sender
- `supabase/functions/send-welcome-email/index.ts` -- welcome email logic
- `src/components/WelcomeTutorial.tsx` -- onboarding checklist component

**Files to modify:**
- `supabase/functions/send-invoice-email/index.ts` -- use Resend via `send-email` or direct API call
- `supabase/config.toml` -- add new function entries
- `src/pages/Auth.tsx` -- trigger welcome email on new signup
- `src/pages/Dashboard.tsx` -- show tutorial for new users

**Secret to add:**
- `RESEND_API_KEY` -- you will be prompted to enter it from your Resend dashboard

**Resend setup you'll need to do:**
1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your domain `cushyinvoice.com` (add DNS records they provide)
3. Copy your API key -- you'll paste it when prompted

