import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdSenseAdProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}

// Replace with your actual Google AdSense publisher ID
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || "";

export const AdSenseAd = ({ 
  slot, 
  format = "auto", 
  responsive = true,
  className = ""
}: AdSenseAdProps) => {
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    checkIfShouldShowAd();
  }, []);

  const checkIfShouldShowAd = async () => {
    // Don't show ads if AdSense is not configured
    if (!ADSENSE_CLIENT_ID) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowAd(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, plan_type')
        .eq('id', user.id)
        .maybeSingle();
      
      // Only show ads to free users (not premium and not on trial)
      if (!profile?.is_premium && profile?.plan_type !== 'trial') {
        setShowAd(true);
      }
    } catch (error) {
      console.error("Error checking ad eligibility:", error);
    }
  };

  useEffect(() => {
    if (showAd && ADSENSE_CLIENT_ID && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense error:", error);
      }
    }
  }, [showAd]);

  if (!showAd || !ADSENSE_CLIENT_ID) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
