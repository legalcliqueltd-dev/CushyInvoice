import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Bridge page for iOS OAuth.
 * Supabase redirects here (HTTPS), then this page redirects
 * to the custom scheme so the native app reopens with tokens.
 */
export default function MobileAuthCallback() {
  useEffect(() => {
    const hash = window.location.hash?.replace(/^#/, "") || "";
    const search = window.location.search?.replace(/^\?/, "") || "";
    const fragment = hash || search;

    if (fragment) {
      // Redirect to custom scheme so iOS app intercepts it
      const customUrl = `cushyinvoice://auth/callback#${fragment}`;
      window.location.replace(customUrl);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Returning to app...</p>
    </div>
  );
}
