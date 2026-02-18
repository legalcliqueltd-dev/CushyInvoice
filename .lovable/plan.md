
# Fix Email Sharing: Custom Recipient + Clean Email Body

## Problems
1. Email always sends to the client's email on file -- no way to specify a different recipient
2. AI-generated email body contains raw markdown artifacts (e.g. triple backticks `html`) that appear in the email

## Changes

### 1. Add Email Input to Share Dialog
**File: `src/components/ShareInvoiceDialog.tsx`**
- Add a text input field above the "Send via Email" button where users can type a custom email address
- Pre-fill it with `invoice.clients.email` as default
- Pass the custom email (`recipientEmail`) to the edge function call
- Update the success toast to show the actual recipient email

### 2. Accept Custom Recipient in Edge Function
**File: `supabase/functions/send-invoice-email/index.ts`**
- Accept an optional `recipientEmail` field from the request body
- Use `recipientEmail` (if provided) instead of `client.email` as the Resend `to` address
- Keep `client.email` as fallback when no custom email is provided

### 3. Fix AI Email Body Artifacts
**File: `supabase/functions/send-invoice-email/index.ts`**
- Strip markdown code fences from the AI response (remove lines like triple-backtick-html and trailing triple-backticks)
- Update the system prompt to explicitly say: "Do NOT wrap output in code fences or markdown. Output raw HTML only."
- Replace the AI-generated email with a simple static HTML template instead, to avoid unpredictable AI formatting issues:
  - "Dear [Client], Please find attached Invoice [number] for [amount], due [date]. Kindly review and arrange payment at your convenience. Thank you, [Company]"
  - This is more reliable and always clean

### Technical Details

**ShareInvoiceDialog.tsx changes:**
- Add `const [recipientEmail, setRecipientEmail] = useState(invoice.clients.email)` state
- Add an Input field with label "Send to:" before the Email button
- Pass `recipientEmail` in the edge function body

**send-invoice-email/index.ts changes:**
- Destructure `recipientEmail` from request body
- Use `recipientEmail || client.email` for the `to` field
- Replace AI email generation with a clean static template to avoid markdown artifacts
- Remove the AI gateway call entirely (simpler, faster, more reliable)
