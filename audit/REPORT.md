# App Store Compliance Report — CushyInvoice
*Generated: 2026-05-05 — read-only audit against current Apple App Store Review Guidelines (snapshot in `audit/guidelines-snapshot.md`)*

---

## 1. Executive summary

**Overall risk: HIGH (rejection likely on next submission unless blockers fixed).**

The app has already been through several rejection cycles. Recent fixes (Apple Sign-In external-browser fix, native crash guard for Hugging Face transformers, IAP-only on iOS, account deletion shortcut) addressed the previous-cycle rejections, but new structural issues remain.

**Top 3 issues (must fix before submission):**

1. **Missing `PrivacyInfo.xcprivacy` privacy manifest** — Apple has progressively moved this from a warning to a rejection. The app uses Required-Reason APIs via Capacitor and RevenueCat with no manifest declaring them.
2. **Stripe / Paystack management UI is reachable on iOS** for users with pre-existing web subscriptions (`Settings.tsx:743`). A reviewer with such a test account would see "Update Payment Method" buttons that route to Stripe — a hard 3.1.1 violation.
3. **`cleartext: true` in `capacitor.config.ts`** — disables ATS. No HTTP endpoints are actually used, so this serves no purpose and looks like a security regression to a reviewer.

Build version is still `1.0` build `1` after multiple rejection cycles — App Store Connect rejects re-uploads with the same build number; bump it before re-submitting.

---

## 2. Blocker issues (will cause rejection)

### B1. Missing privacy manifest — Guideline 5.1.1 / Apple May 2024 rule
**Severity: BLOCKER**
- File: needs to be created at `ios/App/App/PrivacyInfo.xcprivacy`.
- Must declare `NSPrivacyTracking=false`, an empty `NSPrivacyTrackingDomains`, the `NSPrivacyAccessedAPITypes` list (UserDefaults, FileTimestamp, SystemBootTime — based on Capacitor + RevenueCat), and `NSPrivacyCollectedDataTypes` matching `audit/privacy-deep-dive.md §2`.
- See: `https://developer.apple.com/documentation/bundleresources/privacy_manifest_files`.

### B2. Stripe/Paystack management UI accessible on iOS — Guideline 3.1.1
**Severity: BLOCKER (if test account has web subscription)**
- File: `src/pages/Settings.tsx:743`.
- Current condition: `subscription.subscribed && (subscription.provider === "stripe" || subscription.provider === "paystack")`.
- Fix: gate with `&& !isIOSNative`. On iOS show ONLY the Apple-subscription block (`Settings.tsx:702–735`) regardless of provider, with copy explaining that the existing web subscription must be managed on the original platform.

### B3. Cancel Subscription dialog can fall through to Stripe/Paystack on iOS — Guideline 3.1.1
**Severity: BLOCKER**
- File: `src/pages/Settings.tsx:1101–1124`.
- Current logic: on iOS, `openAppleSubscriptions()`. ✅ for iOS users with Apple subscription.
- But: if `provider === "paystack"` and `isIOSNative`, the `if (isIOSNative)` branch at line 1105 takes priority. This is fine. Still verify by code-reading the full dialog logic.

### B4. `cleartext: true` allows insecure HTTP — Guideline 5.1.6 (data security) and ATS
**Severity: BLOCKER (often flagged by automated scan)**
- File: `capacitor.config.ts:8`.
- Fix: remove the `cleartext: true` line. All endpoints listed in `app-inventory.md §7` are HTTPS, so removal has zero functional impact.

### B5. Build/version not incremented for resubmission
**Severity: BLOCKER (App Store Connect refuses upload)**
- File: `ios/App/App.xcodeproj/project.pbxproj` — `CURRENT_PROJECT_VERSION = 1`, `MARKETING_VERSION = 1.0`.
- Fix: bump `CURRENT_PROJECT_VERSION` (build) every upload. Bump `MARKETING_VERSION` if user-visible features changed.

---

## 3. Risk issues (possible rejection or clarification request)

### R1. `LSRequiresIPhoneOS=true` plus `UIRequiredDeviceCapabilities=[armv7]` — Guideline 2.4.2
- File: `ios/App/App/Info.plist:31–34`.
- `armv7` is an obsolete capability tag (iOS 11+ is arm64-only). Apple will not reject for this, but it can suppress the app from showing as iPad-compatible in some search filters.
- Fix: remove the `UIRequiredDeviceCapabilities` array entirely or set to `arm64` if you want to keep it.

### R2. Sign in with Apple offered, but via web OAuth not native AuthenticationServices — Guideline 4.8
- File: `src/pages/Auth.tsx:304–350`.
- The app offers Google SSO and Apple SSO (web). Apple's **4.8** says when third-party SSO is offered, Sign in with Apple must be offered as an option that gives users equivalent privacy protections (private relay email, name hiding, no tracking).
- The current Apple flow uses Lovable's OAuth broker through SFSafariViewController. This *technically* uses Apple's OAuth, but reviewers have rejected non-native implementations because they don't surface Apple's privacy options the same way.
- **Safer path:** add `Sign In with Apple` capability + use the native `AuthenticationServices` framework with `ASAuthorizationAppleIDProvider` (would require a Capacitor plugin like `@capacitor-community/apple-sign-in`).
- **Pragmatic path:** keep the current web flow but be ready to demonstrate that Apple's private-relay email is honored and the user can sign in without revealing their real email. Have a reviewer note ready.

### R3. Display name "cushyinvoice" lowercase — Guideline 4.5 (metadata) / brand consistency
- File: `Info.plist:10` (`CFBundleDisplayName=cushyinvoice`).
- Reviewers may flag "cushyinvoice" vs. the App Store listing name "CushyInvoice". Set both consistently — typically `CushyInvoice` (capitalized).

### R4. RevenueCat offerings "pending Apple review" UX — Guideline 2.1
- File: `src/pages/Subscribe.tsx:335–374`.
- The `rc.ready && !rc.offering` branch shows a "Subscriptions pending review" card. If Apple's reviewer hits this state (because their TestFlight environment hasn't finished syncing the IAP products), they may flag the app as broken (2.1 — App Completeness).
- **Mitigation:** ensure all IAP products in App Store Connect are in "Ready to Submit" state before binary upload, and that you submit IAPs *with* the app version (not separately).

### R5. Privacy policy / Terms must explicitly cover OTP & email collection
- Files: `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` — not read in this audit (out of scope), but verify they list every processor in `audit/privacy-deep-dive.md §8`.

### R6. Logo upload pulls 21 MB transformers WASM into bundle — Guideline 2.5 (efficient resource use)
- File: `src/components/LogoUploadDialog.tsx:15` — eager top-level import of `@huggingface/transformers`.
- The runtime is now correctly skipped on iOS, but the WASM still ships in the iOS `dist/` (Vite includes it as an asset). This bloats the binary and slows cold start.
- Fix: convert to dynamic `import()` inside the `removeBackground()` function so iOS bundle never includes the 21 MB blob.

### R7. README is the default Lovable template
- File: `/README.md`.
- Doesn't ship in the iOS bundle, so does not affect review. But if the project's GitHub is referenced from App Store Connect (support URL), reviewers may follow the link and find no real documentation. Low risk; cosmetic.

---

## 4. Polish recommendations (non-blocking)

| # | Item | File |
|---|---|---|
| P1 | Display name capitalization | `Info.plist:10` |
| P2 | Lazy-import `@huggingface/transformers` | `LogoUploadDialog.tsx:15` |
| P3 | Remove `armv7` from `UIRequiredDeviceCapabilities` | `Info.plist:31–34` |
| P4 | Add `ITSAppUsesNonExemptEncryption=false` to Info.plist (avoids the export compliance question on every upload) | `Info.plist` |
| P5 | Add a clear copyright/legal line in About / Settings footer | `Settings.tsx` |
| P6 | Verify `ios/App/App/AppDelegate.swift` is not the duplicate `AppDelegate 2.swift` (a stray copy currently exists in `ios/App/App/`) | `ios/App/App/` |
| P7 | Add proper README pointing to docs/support URL | `README.md` |

---

## 5. Section-by-section verdicts

### 1. Safety
| § | Topic | Verdict | Evidence |
|---|---|---|---|
| 1.1 | Objectionable content | ➖ N/A | Invoicing app; no UGC display surfaces |
| 1.2 | UGC | ✅ Compliant | Content is private (RLS); no public feed/chat |
| 1.3 | Kids | ➖ N/A | Not in Kids category |
| 1.4 | Physical harm | ➖ N/A | No relevant features |
| 1.5 | Developer information | ⚠️ At risk | Verify support URL + email visible in App Store Connect listing |
| 1.6 | Data security | ❌ Non-compliant | `cleartext: true` (`capacitor.config.ts:8`) |
| 1.7 | Reporting criminal activity | ➖ N/A | — |

### 2. Performance
| § | Topic | Verdict | Evidence |
|---|---|---|---|
| 2.1 | App completeness | ⚠️ At risk | "Subscriptions pending" card visible if RC offerings not loaded (`Subscribe.tsx:335–374`) |
| 2.2 | Beta testing | ✅ N/A | TestFlight only |
| 2.3 | Accurate metadata | ⚠️ At risk | `CFBundleDisplayName=cushyinvoice` lowercase mismatches usual brand |
| 2.4 | Hardware compatibility | ⚠️ At risk | `armv7` in `UIRequiredDeviceCapabilities` is wrong for arm64 era (`Info.plist:31–34`) |
| 2.5 | Software requirements | ⚠️ At risk | iOS 26 SDK requirement (April 2026); current target is iOS 15 deployment, build SDK depends on Xcode version. **Verify Xcode 16+/iOS 18+ SDK** |
| 2.5.x | Required-Reason APIs | ❌ Non-compliant | No `PrivacyInfo.xcprivacy` |

### 3. Business
| § | Topic | Verdict | Evidence |
|---|---|---|---|
| 3.1.1 | IAP for digital goods | ⚠️ At risk | Stripe/Paystack management UI reachable on iOS (`Settings.tsx:743`) |
| 3.1.1(a) / 3.1.3(a) | US storefront external link rules | ➖ N/A | App does not link to external purchase from iOS UI |
| 3.1.2 | Subscriptions | ✅ Compliant | All disclosures in `Subscribe.tsx:482–516`; restore button present |
| 3.1.3 | Other purchase methods | ✅ Compliant | Web/Android paths separated |
| 3.1.4 | Hardware-specific content | ➖ N/A | — |
| 3.2 | Other business | ✅ Compliant | — |

### 4. Design
| § | Topic | Verdict | Evidence |
|---|---|---|---|
| 4.1 | Copycats | ✅ Compliant | Original branding |
| 4.2 | Minimum functionality | ✅ Compliant | Substantial app, not a webview wrapper of nothing |
| 4.3 | Spam | ✅ Compliant | — |
| 4.4 | Extensions | ➖ N/A | No extensions shipped |
| 4.5 | Apple sites & metadata | ✅ Compliant | — |
| 4.6 | Alternate icons | ➖ N/A | — |
| 4.7 | Mini apps / HTML5 | ⚠️ At risk | App is a Capacitor WebView. As long as functionality is native-feeling and not just a website shell, it's allowed. The current app meets that bar. |
| 4.8 | Login services (Sign in with Apple) | ⚠️ At risk | Web-OAuth Apple Sign-In; reviewers may require native `ASAuthorizationAppleIDProvider`. See R2. |
| 4.9 | Streaming games | ➖ N/A | — |

### 5. Legal
| § | Topic | Verdict | Evidence |
|---|---|---|---|
| 5.1.1 | Data collection & privacy policy | ❌ Non-compliant | Privacy manifest missing (B1) |
| 5.1.1(v) | Account deletion | ✅ Compliant | `delete-account` edge fn + UI shortcuts (`Settings.tsx:1145`) |
| 5.1.2 | Data use & sharing | ⚠️ At risk | Verify Privacy.tsx text covers all processors |
| 5.1.3 | Health & health research | ➖ N/A | — |
| 5.1.4 | Kids | ➖ N/A | — |
| 5.1.5 | Location | ➖ N/A | — |
| 5.2 | IP | ✅ Compliant | — |
| 5.3 | Gambling/lotteries | ➖ N/A | — |
| 5.4 | VPN | ➖ N/A | — |
| 5.5 | MDM | ➖ N/A | — |
| 5.6 | Code of conduct | ✅ Compliant | — |

---

## 6. Pre-submission checklist
- [ ] **B5** Build number incremented from `1` (`project.pbxproj`)
- [ ] **B1** `PrivacyInfo.xcprivacy` created
- [ ] **B2** Stripe/Paystack management UI hidden on iOS (`Settings.tsx:743`)
- [ ] **B4** `cleartext: true` removed (`capacitor.config.ts`)
- [ ] **R3** Display name fixed to "CushyInvoice" (`Info.plist`)
- [ ] **R1** `armv7` capability removed (`Info.plist`)
- [ ] **P4** `ITSAppUsesNonExemptEncryption=false` set (`Info.plist`)
- [ ] No lorem ipsum / TODO in user-facing strings (recommend grep before each submission)
- [ ] Demo account credentials prepared for App Store Connect → Test Information
- [ ] Privacy policy URL reachable, lists every processor in `privacy-deep-dive.md §8`
- [ ] Terms of use accessible in-app (✅ already at `/terms`)
- [ ] Restore Purchases button present (✅ `Subscribe.tsx:469–479`)
- [ ] Subscription disclosures (price, period, renewal) (✅ `Subscribe.tsx:482–516`)
- [ ] No "Android" / "Google Play" mentions in iOS-visible strings (recommend grep)
- [ ] App icon, screenshots, description accurate
- [ ] Age rating questionnaire updated for the 2026 system

---

## 7. Action plan (ordered)

| # | Action | Effort | Files |
|---|---|---|---|
| 1 | Create `PrivacyInfo.xcprivacy` with tracking=false, required-reason APIs, collected-data types | M | `ios/App/App/PrivacyInfo.xcprivacy` (new) |
| 2 | Gate Stripe/Paystack management UI behind `!isIOSNative` | S | `src/pages/Settings.tsx:743` |
| 3 | Remove `cleartext: true` | S | `capacitor.config.ts:8` |
| 4 | Bump build number (and version if any user-visible change) | S | `ios/App/App.xcodeproj/project.pbxproj` |
| 5 | Fix `CFBundleDisplayName` capitalization | S | `ios/App/App/Info.plist:10` |
| 6 | Remove obsolete `armv7` capability | S | `ios/App/App/Info.plist:31–34` |
| 7 | Add `ITSAppUsesNonExemptEncryption=false` | S | `ios/App/App/Info.plist` |
| 8 | Lazy-import `@huggingface/transformers` (defer until call site) | S | `src/components/LogoUploadDialog.tsx:15,134` |
| 9 | Remove the stray `AppDelegate 2.swift`, `Info 2.plist`, `config 2/3/4/15.xml` files in `ios/App/App/` | S | `ios/App/App/` |
| 10 | (Optional / R2) Replace web-OAuth Apple Sign-In with native `AuthenticationServices` flow via a community Capacitor plugin | L | `src/pages/Auth.tsx`, new entitlements file, Xcode capability |
| 11 | Update Privacy.tsx to enumerate all third-party processors | S | `src/pages/Privacy.tsx` |
| 12 | Update README with real project info / support links | S | `README.md` |

**Suggested submission order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 (everything else is secondary). With actions 1–7 done, the realistic risk drops from HIGH to **LOW–MEDIUM**.

---
*End of report — see also `app-inventory.md`, `privacy-deep-dive.md`, `guidelines-snapshot.md`*
