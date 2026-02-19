import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowRight, ArrowLeft, Receipt } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function VerifyOtp() {
  const [otpValue, setOtpValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const pendingEmail = (location.state as any)?.email || "";
  const pendingUserId = (location.state as any)?.userId || "";
  const pendingFullName = (location.state as any)?.fullName || "";

  useEffect(() => {
    // If no email was passed, redirect back to auth
    if (!pendingEmail) {
      navigate("/auth", { replace: true });
    }
  }, [pendingEmail, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter the full 6-digit code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpValue,
        type: "signup",
      });

      if (error) throw error;

      if (data.user) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: pendingEmail,
          full_name: pendingFullName || null,
          plan_type: "trial",
          is_premium: true,
          trial_end_date: trialEndDate.toISOString(),
        });

        supabase.functions.invoke("send-welcome-email", {
          body: { userId: data.user.id },
        }).catch(() => {});

        toast({ title: "Account verified!", description: "Welcome to CushyInvoice. Your 7-day free trial has started." });
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message || "Invalid or expired code. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
      if (error) throw error;
      setResendCooldown(60);
      toast({ title: "Code resent", description: "A new verification code has been sent to your email." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to resend code.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 safe-top safe-bottom">
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">CushyInvoice</span>
        </div>

        {/* Mail icon */}
        <div className="rounded-full bg-primary/10 p-5">
          <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Verify your email</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{pendingEmail}</span>
          </p>
        </div>

        {/* OTP Card */}
        <div className="w-full bg-card rounded-2xl p-6 sm:p-8 border shadow-sm space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue} autoFocus>
              <InputOTPGroup className="gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl font-semibold rounded-lg border-2 border-input"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerifyOtp}
            className="w-full h-12 sm:h-13 text-base font-medium"
            disabled={loading || otpValue.length !== 6}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {/* Resend & Back */}
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Didn't receive the code? </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
