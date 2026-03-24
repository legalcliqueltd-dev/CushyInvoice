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
    const isCapacitor = !!(window as any).Capacitor;
    if (!isCapacitor) return;

    let cleanup: (() => void) | null = null;

    const handleOAuthUrl = async (url: string) => {
      const isCallback =
        url.includes("cushyinvoice://auth") ||
        url.includes("access_token") ||
        url.includes("code=");

      if (!isCallback || handledRef.current === url) return;
      handledRef.current = url;

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
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          sessionOk = true;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          sessionOk = true;
        }

        if (sessionOk) {
          navigate("/dashboard", { replace: true });
        }
      } catch (error: any) {
        console.error("Deep-link OAuth error:", error);
        toast({
          title: "Sign-in failed",
          description: error?.message || "Could not complete sign-in. Please try again.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    import("@capacitor/app")
      .then(async ({ App }) => {
        const listener = await App.addListener("appUrlOpen", (event) => {
          handleOAuthUrl(event.url);
        });

        cleanup = () => listener.remove();

        // Cold-start: check if app was launched via a URL
        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) {
          handleOAuthUrl(launchUrl.url);
        }
      })
      .catch(() => {});

    return () => {
      cleanup?.();
    };
  }, [navigate, toast]);

  return null;
}
