import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Global deep-link handler mounted at the App level.
 * Captures OAuth callbacks from custom URL schemes (cushyinvoice://)
 * on both cold-start and warm-start, regardless of which route is active.
 */
export default function DeepLinkHandler() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    if (!isCapacitor) return;

    const cleanups: (() => void)[] = [];

    const handleOAuthUrl = async (url: string) => {
      const isCallback =
        url.includes("cushyinvoice://auth") ||
        url.includes("access_token") ||
        url.includes("code=");

      if (!isCallback || handledRef.current === url) return;
      handledRef.current = url;

      console.log("[DeepLink] Processing URL:", url);

      try {
        // Close any in-app browser overlay
        try {
          const { Browser } = await import("@capacitor/browser");
          await Browser.close();
        } catch {}

        // Sanitize iOS edge-case: trailing # or %23
        const sanitized = url.replace(/%23$/, "").replace(/#$/, "");
        const parsed = new URL(sanitized);

        // Collect params from both query string and hash
        const queryParams = new URLSearchParams(parsed.search);
        const hashParams = new URLSearchParams(parsed.hash?.replace(/^#/, "") || "");

        // Merge: query takes precedence, then hash
        const code = queryParams.get("code") || hashParams.get("code");
        const accessToken = queryParams.get("access_token") || hashParams.get("access_token");
        const refreshToken = queryParams.get("refresh_token") || hashParams.get("refresh_token");

        let sessionOk = false;

        if (code) {
          console.log("[DeepLink] Exchanging code for session");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          sessionOk = true;
        } else if (accessToken && refreshToken) {
          console.log("[DeepLink] Setting session from tokens");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          sessionOk = true;
        } else {
          console.log("[DeepLink] No usable auth params found in URL");
        }

        if (sessionOk) {
          console.log("[DeepLink] Session established, navigating to dashboard");
          navigate("/dashboard", { replace: true });
        }
      } catch (error: any) {
        console.error("[DeepLink] OAuth error:", error);
        toast({
          title: "Sign-in failed",
          description: error?.message || "Could not complete sign-in. Please try again.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    // --- 1. App plugin: appUrlOpen (warm start) + getLaunchUrl (cold start) ---
    const initAppPlugin = async () => {
      try {
        // Try static access first, then dynamic import
        let AppPlugin = (window as any).Capacitor?.Plugins?.App;
        if (!AppPlugin?.addListener) {
          const mod = await import("@capacitor/app");
          AppPlugin = mod.App;
        }

        if (!AppPlugin?.addListener) {
          console.warn("[DeepLink] App plugin not available");
          return;
        }

        const listener = await AppPlugin.addListener("appUrlOpen", (event: any) => {
          console.log("[DeepLink] appUrlOpen:", event.url);
          handleOAuthUrl(event.url);
        });
        cleanups.push(() => listener.remove());

        // Cold-start: check if app was launched via a URL
        if (AppPlugin.getLaunchUrl) {
          const launchUrl = await AppPlugin.getLaunchUrl();
          if (launchUrl?.url) {
            console.log("[DeepLink] Cold-start launch URL:", launchUrl.url);
            handleOAuthUrl(launchUrl.url);
          }
        }

        console.log("[DeepLink] App plugin listeners registered");
      } catch (err) {
        console.error("[DeepLink] Failed to init App plugin:", err);
      }
    };

    // --- 2. Browser plugin: browserFinished (safety net for iOS) ---
    const initBrowserListener = async () => {
      try {
        const { Browser } = await import("@capacitor/browser");
        const listener = await Browser.addListener("browserFinished", async () => {
          console.log("[DeepLink] browserFinished event — checking for session");
          // Small delay to let any pending auth state settle
          await new Promise((r) => setTimeout(r, 500));
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log("[DeepLink] Session found after browser closed, navigating to dashboard");
            navigate("/dashboard", { replace: true });
          } else {
            console.log("[DeepLink] No session after browser closed");
          }
        });
        cleanups.push(() => listener.remove());
        console.log("[DeepLink] Browser browserFinished listener registered");
      } catch (err) {
        console.warn("[DeepLink] Browser plugin not available for browserFinished:", err);
      }
    };

    // --- 3. Startup URL fallback: check window.location.href ---
    const checkStartupUrl = () => {
      const url = window.location.href;
      if (url.includes("code=") || url.includes("access_token=")) {
        console.log("[DeepLink] Startup URL contains auth params:", url);
        handleOAuthUrl(url);
      }
    };

    // Initialize all listeners in parallel
    initAppPlugin();
    initBrowserListener();
    checkStartupUrl();

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [navigate, toast]);

  return null;
}
