import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Bridge page for iOS OAuth.
 * Supabase redirects here (HTTPS), then this page redirects
 * to the custom scheme so the native app reopens with tokens.
 */
export default function MobileAuthCallback() {
  const [showManualFallback, setShowManualFallback] = useState(false);

  const deepLinkUrl = useMemo(() => {
    const hash = window.location.hash?.replace(/^#/, "") || "";
    const search = window.location.search?.replace(/^\?/, "") || "";

    if (hash) {
      return `cushyinvoice://auth/callback#${hash}`;
    }

    if (search) {
      return `cushyinvoice://auth/callback?${search}`;
    }

    return "cushyinvoice://auth/callback";
  }, []);

  useEffect(() => {
    let isPageHidden = false;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        isPageHidden = true;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // First attempt immediately
    window.location.assign(deepLinkUrl);

    // If iOS blocks automatic redirect, reveal manual fallback
    const fallbackTimer = window.setTimeout(() => {
      if (!isPageHidden) {
        setShowManualFallback(true);
      }
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [deepLinkUrl]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Returning to app...</p>

      {showManualFallback ? (
        <div className="flex flex-col items-center gap-3">
          <Button
            type="button"
            onClick={() => window.location.assign(deepLinkUrl)}
          >
            Open CushyInvoice App
          </Button>
          <p className="text-xs text-muted-foreground">If it still doesn’t open, switch back to the app manually.</p>
        </div>
      ) : null}
    </div>
  );
}
