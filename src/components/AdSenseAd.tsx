import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdSenseAdProps {
  slot: string;
  format?: string;
  responsive?: boolean;
  className?: string;
}

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
        .single();
      
      // Only show ads to free users (not premium and not on trial)
      if (!profile?.is_premium && profile?.plan_type !== 'trial') {
        setShowAd(true);
      }
    } catch (error) {
      console.error("Error checking ad eligibility:", error);
    }
  };

  useEffect(() => {
    if (showAd && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense error:", error);
      }
    }
  }, [showAd]);

  if (!showAd) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense client ID
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
