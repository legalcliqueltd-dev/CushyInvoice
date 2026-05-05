# Privacy Deep-Dive — CushyInvoice
*Generated: 2026-05-05 (read-only audit)*

## 1. `NSUsageDescription` audit
**Result: zero permission strings present** (`Info.plist:1–72`).

The app does not natively access camera, microphone, photo library, contacts, location, calendar, reminders, motion, Bluetooth, FaceID, or HealthKit. Logo upload uses the WebView's `<input type="file">` which iOS handles without an `NSPhotoLibraryUsageDescription` (Apple uses the system-managed photo picker). ✅

**Watchpoint:** if any future Capacitor plugin (e.g. `@capacitor/camera`, `@capacitor/geolocation`) is added, the corresponding `NS…UsageDescription` MUST be added with a specific, honest reason string before submission.

## 2. App Privacy "Nutrition Label" — required declarations

Map of data the app actually collects, drawn from code:

| Category | Specific data | Where in code | Purpose | Linked to user? | Used to track? |
|---|---|---|---|---|---|
| **Contact Info** | Email | `Auth.tsx:131–164` (signup), `profiles.email` | Account, communication | Yes | No |
| **Contact Info** | Name | `Auth.tsx:144–151`, `Settings.tsx` | Account personalization | Yes | No |
| **Contact Info** | Phone (optional) | `Settings.tsx:402–411` | Invoice header info | Yes | No |
| **Contact Info** | Physical address (optional) | `Settings.tsx:415–424` | Invoice header info | Yes | No |
| **Financial Info** | Bank account number, routing code, bank name | `Settings.tsx:902–935` | Displayed on invoices for client payment | Yes | No |
| **Financial Info** | Subscription / purchase records | RevenueCat / Stripe / Paystack | Billing | Yes | No |
| **User Content** | Invoice content, client lists, products, expenses, templates | All `Invoice*.tsx`, `Clients.tsx`, etc. | App functionality | Yes | No |
| **User Content** | Company logo (image upload) | `LogoUploadDialog.tsx` → Supabase Storage | App functionality | Yes | No |
| **User Content** | Client emails (entered by user about third parties) | `Clients.tsx`, invoice send flow | Sending invoices | Yes | No |
| **Identifiers** | User ID (Supabase auth UUID) | everywhere via `supabase.auth.getUser()` | Account | Yes | No |
| **Identifiers** | Device-level vendor ID (RevenueCat anonymous app user ID) | RevenueCat default | Linking purchases | Yes | No |
| **Purchases** | Purchase history (subscription type, status, plan) | `useSubscription` hook | Feature gating | Yes | No |
| **Diagnostics** | Crash logs (likely none — no Crashlytics / Sentry detected) | none | — | — | — |

> **The app does NOT appear to collect:** Health, Fitness, Sensitive Info, Search History, Browsing History, Precise Location, Coarse Location, Photos/Videos (beyond logo), Audio, Gameplay Content. Verify against the App Store Connect questionnaire.

> **Tracking (cross-app/website tracking):** None identified. No ad SDK, no analytics SDK that fingerprints, no SKAdNetwork, no AppsFlyer/Adjust/Branch/Facebook SDK. → ATT prompt is **NOT required**.

## 3. Privacy manifest (`PrivacyInfo.xcprivacy`)
**File does not exist** in `ios/App/`. (Verified by `find` returning empty.)

Apple requires a privacy manifest for apps using "Required Reason APIs" since May 2024. CushyInvoice almost certainly hits these via Capacitor:

| Required-reason API category | Triggered by |
|---|---|
| `NSPrivacyAccessedAPICategoryUserDefaults` | Capacitor core / RevenueCat |
| `NSPrivacyAccessedAPICategoryFileTimestamp` | `@capacitor/filesystem` (logo, PDF cache) |
| `NSPrivacyAccessedAPICategorySystemBootTime` | RevenueCat (commonly used) |
| `NSPrivacyAccessedAPICategoryDiskSpace` | Possibly from filesystem plugin |

**Action required (BLOCKING):** Add `ios/App/App/PrivacyInfo.xcprivacy` declaring:
- `NSPrivacyTracking` = `false`
- `NSPrivacyTrackingDomains` = `[]`
- `NSPrivacyAccessedAPITypes` for each Required Reason API used by Capacitor + RevenueCat (Apple-published reason codes)
- `NSPrivacyCollectedDataTypes` matching the table in §2

Note: most major SDKs ship their own bundled privacy manifest, but the **app target** still needs its own. Without it, App Store Connect produces a warning that recently has progressed to outright rejection in some cases.

## 4. App Tracking Transparency (ATT)
- No tracking SDKs in dependency list (no Facebook/AppLovin/AdMob/Adjust/Branch/Amplitude/Mixpanel/Segment/Firebase Analytics).
- `NSUserTrackingUsageDescription` is correctly **absent**.
- ATT prompt **not required**. ✅

## 5. COPPA / Kids Category
- App is for freelancers/businesses; not directed at children.
- Age gating: none. Sign-up form does not collect age.
- Not in Kids Category. ✅
- Acceptable per 5.1.4 — but recommend adding "13+" or "17+" age rating in App Store Connect questionnaire.

## 6. Privacy policy & terms
- Privacy policy route exists in app at `/privacy` (`App.tsx:96`, `Privacy.tsx`).
- Terms route exists at `/terms` (`App.tsx:97`, `Terms.tsx`).
- Both are linked from iOS subscription disclosure block (`Subscribe.tsx:506–514`). ✅
- **Verify before submission:** the privacy policy text must list every data category in §2 and every third-party processor (Supabase, RevenueCat, Stripe, Paystack, Resend, Google OAuth, Lovable Cloud, Hugging Face if web-only — disclose anyway).

## 7. Data retention & deletion
- **Account deletion** is wired via `delete-account` edge function (`Settings.tsx:1145`). ✅
- Deletion is reachable from Profile tab (recent fix) and Security tab.
- Apple Guideline 5.1.1(v) — account deletion requirement — satisfied.
- Privacy policy should explicitly state retention period and that deletion purges all rows + storage objects (verify with `delete-account` function logic before submission).

## 8. Third-party data flow summary

| Vendor | What we send | When |
|---|---|---|
| Supabase (DB+Auth+Storage) | Email, name, phone, address, bank info, all invoice/client/product data, logo image | All app operations |
| RevenueCat | Anonymous app user ID, purchase events | iOS purchase only |
| Apple StoreKit | Apple ID purchase token | iOS purchase only |
| Stripe (web/Android) | Email, customer name | Web/Android purchase only |
| Paystack (web/Android) | Email, name, payment | Web/Android purchase only |
| Resend (server-side via edge fn) | Recipient email + invoice PDF | Send-invoice, OTP, welcome email |
| Google (OAuth) | OAuth scopes: profile, email | Google sign-in only |
| Lovable Cloud / Apple OAuth broker | OAuth state, redirect | Apple sign-in only |

All third-party processors must be listed in the privacy policy.

---
*End of privacy deep-dive*
