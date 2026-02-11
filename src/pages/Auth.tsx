import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/AuthLayout";
import { Loader2, Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

const APP_DOMAIN = "https://cushyinvoice.com";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingFullName, setPendingFullName] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        ensureProfileExists(session.user.id, session.user.email || "");
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (event === 'SIGNED_IN') {
          setTimeout(() => {
            ensureProfileExists(session.user.id, session.user.email || "", session.user.user_metadata?.full_name);
          }, 0);
        }
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const ensureProfileExists = async (userId: string, email: string, fullName?: string) => {
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!existingProfile) {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        
        await supabase.from("profiles").insert({
          id: userId,
          email: email,
          full_name: fullName || null,
          plan_type: 'trial',
          is_premium: true,
          trial_end_date: trialEndDate.toISOString(),
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error ensuring profile exists:", error);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${APP_DOMAIN}/auth/reset`,
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "Check your email", description: "A password reset link has been sent to your email." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reset email.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });

      if (!validation.success) {
        toast({ title: "Validation Error", description: validation.error.errors[0].message, variant: "destructive" });
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please check your credentials.");
          }
          if (error.message.includes("Email not confirmed")) {
            // User hasn't verified email yet — show OTP screen
            setPendingEmail(validation.data.email);
            setShowOtpVerification(true);
            await supabase.auth.resend({ type: 'signup', email: validation.data.email });
            setResendCooldown(60);
            toast({ title: "Email not verified", description: "We've sent a new verification code to your email." });
            setLoading(false);
            return;
          }
          throw error;
        }

        toast({ title: "Welcome back!", description: "You've successfully logged in." });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: {
            data: {
              full_name: validation.data.fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("This email is already registered. Please log in instead.");
          }
          throw error;
        }

        if (data.user) {
          // Store pending info for after OTP verification
          setPendingEmail(validation.data.email);
          setPendingUserId(data.user.id);
          setPendingFullName(validation.data.fullName || "");
          setShowOtpVerification(true);
          setResendCooldown(60);

          toast({
            title: "Verification code sent!",
            description: "Please check your email for the 6-digit code.",
          });
        }
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Auth error:", error);
      }
      toast({ title: "Error", description: error.message || "An error occurred. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
        type: 'signup',
      });

      if (error) throw error;

      if (data.user) {
        // Create profile after successful verification
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: pendingEmail,
          full_name: pendingFullName || null,
          plan_type: 'trial',
          is_premium: true,
          trial_end_date: trialEndDate.toISOString(),
        });

        toast({ title: "Account verified!", description: "Welcome to CushyInvoice. Your 7-day free trial has started." });
        // Auth state change listener will handle navigation
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });
      if (error) throw error;
      setResendCooldown(60);
      toast({ title: "Code resent", description: "A new verification code has been sent to your email." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to resend code.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const isCapacitor = !!(window as any).Capacitor;
    const isCustomDomain =
      !window.location.hostname.includes("lovable.app") &&
      !window.location.hostname.includes("lovableproject.com");

    if (isCapacitor) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${APP_DOMAIN}/auth`,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (!data?.url) throw new Error("No OAuth URL returned");

        const { Browser } = await import("@capacitor/browser");
        
        const sessionCheckHandler = async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            await ensureProfileExists(
              sessionData.session.user.id,
              sessionData.session.user.email || "",
              sessionData.session.user.user_metadata?.full_name
            );
            navigate("/dashboard");
          }
          setLoading(false);
        };

        await Browser.addListener("browserFinished", sessionCheckHandler);
        await Browser.open({ url: data.url, windowName: "_self" });
      } catch (error: any) {
        toast({ title: "Google Sign-In Error", description: error.message || "Failed to start Google sign-in.", variant: "destructive" });
        setLoading(false);
      }
    } else if (isCustomDomain) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        toast({ title: "Google Sign-In Error", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } else {
      // Lovable domain - use managed OAuth
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({ title: "Google Sign-In Error", description: error.message, variant: "destructive" });
        setLoading(false);
      }
    }
  };

  // OTP Verification view
  if (showOtpVerification) {
    return (
      <AuthLayout
        title="Verify your email"
        subtitle={`Enter the 6-digit code sent to ${pendingEmail}`}
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerifyOtp}
            className="w-full h-11 font-medium"
            disabled={loading || otpValue.length !== 6}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowOtpVerification(false);
              setOtpValue("");
            }}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="inline mr-1 h-3 w-3" />
            Back to Sign Up
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Forgot password view
  if (isForgotPassword) {
    return (
      <AuthLayout
        title="Reset your password"
        subtitle="Enter your email and we'll send you a reset link"
      >
        {resetSent ? (
          <div className="space-y-5 text-center">
            <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Check your email for a password reset link. It may take a minute to arrive.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsForgotPassword(false);
                setResetSent(false);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="inline mr-1 h-3 w-3" />
              Back to Sign In
            </button>
          </form>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isLogin ? "Welcome back" : "Create your account"}
      subtitle={
        isLogin
          ? "Enter your credentials to access your account"
          : "Start your 7-day free trial today"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="pl-10 h-11"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            {isLogin && (
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="pl-10 h-11"
            />
          </div>
          {!isLogin && (
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 font-medium" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLogin ? "Sign In" : "Create Account"}
          {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">
              or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium"
          disabled={loading}
          onClick={handleGoogleSignIn}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            disabled={loading}
          >
            {isLogin ? (
              <>Don't have an account? <span className="font-medium text-primary">Sign up free</span></>
            ) : (
              <>Already have an account? <span className="font-medium text-primary">Sign in</span></>
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
