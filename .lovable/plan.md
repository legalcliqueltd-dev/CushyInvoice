

# Configure Custom SMTP for Email Delivery

## What This Does
Updates the authentication email sender from the default Lovable address to `noreply@cushyinvoice.com`, and switches the signup confirmation email to send a 6-digit OTP code instead of a link.

## Prerequisites
You already have a Resend API key configured. You also need to have your domain `cushyinvoice.com` verified in Resend (if not already done, go to https://resend.com/domains and add it).

## Step-by-Step Instructions

### Step 1: Get Your Resend SMTP Credentials
1. Go to https://resend.com/settings/smtp
2. Note these values:
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend`
   - **Password**: Your Resend API key (the same one stored as `RESEND_API_KEY`)

### Step 2: Configure SMTP in Backend Settings
1. Open the Cloud view in Lovable (click the cloud icon above the preview)
2. Go to **Users** tab, then click the **gear icon** (Auth Settings)
3. Find the **SMTP Settings** section
4. Enable custom SMTP and enter:
   - **Sender email**: `noreply@cushyinvoice.com`
   - **Sender name**: `CushyInvoice`
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend`
   - **Password**: *(paste your Resend API key)*
5. Save the settings

### Step 3: Update the Email Template to Send OTP Code
1. Still in Auth Settings, find **Email Templates**
2. Select the **Confirm Signup** template
3. Replace the email body with something like:

```
<h2>Verify your email</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; letter-spacing: 8px; text-align: center;">{{ .Token }}</h1>
<p>Enter this code in the app to complete your signup.</p>
```

4. Save the template

After these changes, new signups will receive a 6-digit code from `noreply@cushyinvoice.com` instead of a confirmation link from the default sender.

