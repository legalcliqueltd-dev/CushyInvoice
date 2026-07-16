/**
 * Where to send people who want the mobile app.
 *
 * The Play package comes from `android/app/build.gradle` (applicationId).
 * The App Store needs Apple's numeric id, which isn't derivable from the
 * bundle id — paste it below to switch the iOS button on everywhere.
 */

const PLAY_PACKAGE = "app.lovable.e23699a8f80e4b9dbb96d8d50a1c74ed";

/**
 * Apple's App Store id, e.g. "id6502123456" (find it in App Store Connect, or
 * in your listing URL: apps.apple.com/app/cushyinvoice/id6502123456).
 *
 * While this is empty the iOS button stays hidden, so we never ship a dead
 * link. Fill it in and the button appears on the landing page and dashboard.
 */
export const APP_STORE_APP_ID = "";

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`;

export const APP_STORE_URL = APP_STORE_APP_ID
  ? `https://apps.apple.com/app/${APP_STORE_APP_ID}`
  : "";

export const hasAppStoreLink = APP_STORE_APP_ID.length > 0;

/** True when the page is running inside the Capacitor native shell. */
export const isNativeApp = (): boolean =>
  typeof window !== "undefined" && !!(window as { Capacitor?: unknown }).Capacitor;

export type MobilePlatform = "ios" | "android" | "other";

/** The visitor's device, so we can lead with the store they can actually use. */
export function getMobilePlatform(): MobilePlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  // iPadOS 13+ identifies as a Mac, but has a touch screen.
  if (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "other";
}
