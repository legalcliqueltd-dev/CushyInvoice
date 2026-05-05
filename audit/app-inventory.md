# App Inventory — CushyInvoice
*Generated: 2026-05-05 (read-only audit)*

## 1. Project structure

| Item | Value | Source |
|---|---|---|
| Bundle ID | `com.cushyinvoice.app` | `ios/App/App/capacitor.config.json:2` |
| Display name | `cushyinvoice` (lowercase) | `ios/App/App/Info.plist:10` |
| Marketing version | `1.0` | `project.pbxproj` |
| Build number | `1` | `project.pbxproj` |
| iOS deployment target | **15.0** | `project.pbxproj` and `Package.swift:7` |
| Required SDK (current Apple rule) | iOS 26 SDK from April 2026 | Per Apple developer news |
| Platforms | iOS / iPadOS only (`LSRequiresIPhoneOS=true`) | `Info.plist:25–26` |
| Orientation | Portrait + landscape (iPhone), all (iPad) | `Info.plist:35–47` |
| `UIRequiredDeviceCapabilities` | `armv7` ⚠️ outdated value (modern iOS is arm64) | `Info.plist:31–34` |
| Tech stack | Capacitor 8 + React 18 + Vite + TypeScript + Tailwind | `package.json` |
| iOS shell | Capacitor SPM (no CocoaPods) | `Package.swift` |

## 2. App purpose
CushyInvoice is a freelancer/small-business invoicing app: create, track, send, and download invoices with client management, recurring invoices, tax/currency defaults, and basic reports. Premium tier (subscription) unlocks unlimited invoices, branding, advanced reporting, etc.

## 3. Third-party SDKs / dependencies

### iOS (Swift Package Manager — `Package.swift`)
| Package | Purpose | Privacy manifest required? |
|---|---|---|
| `@capacitor/core` (8.0.2) | Webview bridge | Yes (Apple required-reason API) |
| `@capacitor/app` | App lifecycle | Yes |
| `@capacitor/browser` | SFSafariViewController | Yes |
| `@capacitor/filesystem` | File I/O | **Yes** — uses required-reason file timestamp APIs |
| `@capacitor/splash-screen` | Splash | Likely yes |
| `@revenuecat/purchases-capacitor` (13.0.x) | IAP | **Yes** — RevenueCat ships its own manifest, but app must still declare |

### Web (`package.json`)
- `@supabase/supabase-js` — backend / auth / DB / storage / edge functions
- `@huggingface/transformers` — on-device AI for logo background-removal (web only; **disabled on native** per `LogoUploadDialog.tsx:21`)
- `@deldev/capacitor-google-auth` — native Google Sign-In
- `@lovable.dev/cloud-auth-js` — Lovable OAuth broker (used as fallback)
- `jspdf`, `jspdf-autotable`, `html2canvas` — PDF export
- `react-image-crop` — logo crop
- `input-otp` — OTP input UI (sign-up email verification)
- `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, Radix UI primitives, Tailwind, etc.

## 4. `NSUsageDescription` strings in `Info.plist`
**NONE.** Zero `NS*UsageDescription` keys are present. (`Info.plist:1–72`)

This is consistent with the app: the WebView uses `<input type="file">` for logo upload (no `NSPhotoLibraryUsageDescription` needed) and there are no native camera/mic/contacts/location/health permissions requested. ✅ for permissions, but the absence MUST be intentional and matched against any future native plugin additions.

## 5. Entitlements
**NO `.entitlements` file exists** in `ios/App/App/`. (Verified by `ls App/*.entitlements` → no match.)

Implications:
- ❌ No Sign in with Apple capability — but the app uses Apple Sign-In via web OAuth (Lovable broker → SFSafariViewController), NOT the native `AuthenticationServices` framework, so the entitlement is technically not required. **However, Guideline 4.8 may still require the native button/flow** when the app offers Google SSO (it does).
- ✅ No Push Notifications, no Associated Domains, no App Groups, no Keychain Sharing, no In-App Purchase entitlement — wait, **In-App Purchase requires the StoreKit capability** which is automatic, but the lack of an entitlements file means nothing was explicitly added. RevenueCat → StoreKit needs this to work. May need verification in Xcode capabilities pane.

## 6. Capabilities & frameworks used
| Capability | Used? | Source |
|---|---|---|
| StoreKit / IAP | Yes (via RevenueCat) | `Package.swift:19`, `Subscribe.tsx` |
| Sign in with Apple (native) | **No** — web OAuth instead | `Auth.tsx:304–350` |
| Push Notifications | No | none |
| Background Modes | No | `Info.plist` no `UIBackgroundModes` |
| App Tracking Transparency (ATT) | No (no tracking SDKs) | confirmed |
| HealthKit, HomeKit, CallKit, CloudKit | No | none |
| WebKit / WKWebView | Yes (Capacitor) | implicit |
| Universal Links / Associated Domains | No (custom URL scheme `cushyinvoice://` only) | `Info.plist:52–69` |

## 7. Network endpoints
| Service | Use |
|---|---|
| `*.supabase.co` | Auth, DB, storage, edge functions | 
| `cushyinvoice.com`, `*.cushyinvoice.com` | Web app, OAuth callback page |
| `cushyinvoice.lovable.app` | Lovable OAuth broker for Apple Sign-In | 
| `accounts.google.com`, `*.google.com` | Google OAuth |
| `api.resend.com` | Email delivery (server-side, not visible to client) |
| `apps.apple.com/account/subscriptions` | iOS Apple subscription management deep-link |

`capacitor.config.ts` has `cleartext: true` ⚠️ — allows insecure HTTP. All endpoints above are HTTPS, so this flag should be **removed** to satisfy ATS.

## 8. User-generated content (UGC)
- Invoice line items, client records, products, expenses, templates — typed by the user, stored privately per-user (RLS).
- Company logo upload (image to Supabase Storage).
- Outbound email/PDF to clients (initiated by user).
- **No public posts, no comments, no chat, no profile feed** — UGC is private to the account.
- Guideline 1.2 risk is **low** because content is not user-to-user / public. No moderation/report-block requirements triggered.

## 9. AI / ML features
- `@huggingface/transformers` runs the SegFormer model on-device for logo background removal.
- Now hard-guarded off on native iOS via `IS_NATIVE` flag (`LogoUploadDialog.tsx:21,134,346`) — the button is hidden and the function early-returns. The 21 MB WASM file is still bundled but not invoked on iOS.
- No chatbot, no LLM API, no image-generation features.
- **Recommendation:** lazy-import the transformers package so iOS bundle/runtime never touches it. Currently it's imported eagerly at top of file (`LogoUploadDialog.tsx:15`), which costs startup memory.

## 10. Monetization
- **iOS native:** RevenueCat → Apple StoreKit IAP (`$rc_monthly` / `$rc_annual` packages). `Subscribe.tsx` hides the Stripe/Paystack toggle on iOS via synchronous `isIOSNative` check.
- **Web / Android:** Stripe (international) + Paystack (Africa).
- **Restore Purchases** button on iOS: present (`Subscribe.tsx:466–479`). ✅
- **Subscription disclosures** (auto-renew, price, period, cancel-via-Settings): present (`Subscribe.tsx:482–516`). ✅
- **Terms (EULA) + Privacy** links: present in iOS disclosure block (`Subscribe.tsx:506–514`). ✅
- **iOS subscription management** routes to `apps.apple.com/account/subscriptions` (`Settings.tsx:96–104`). ✅
- ⚠️ **Risk:** `Settings.tsx:743` — the `(subscription.provider === "stripe" || "paystack")` branch is reachable on iOS if a user has a pre-existing web subscription. This shows "Update Payment Method" / "Cancel Subscription" buttons that go to Stripe/Paystack portals — **3.1.1 violation surface** if a reviewer encounters it. Should be gated `&& !isIOSNative`.

---
*End of inventory*
