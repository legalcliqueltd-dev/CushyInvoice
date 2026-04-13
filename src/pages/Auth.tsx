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
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        ensureProfileExists(session.user.id, session.user.email || "");
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        if (event === 'SIGNED_IN') {
          setTimeout(() => {
            ensureProfileExists(session.user.id, session.user.email || "", session.user.user_metadata?.full_name);
          }, 0);
        }
        navigate("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);


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

        // Send welcome email (fire and forget)
        supabase.functions.invoke("send-welcome-email", {
          body: { userId },
        }).catch(() => {});
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
          throw error;
        }

        // Password correct — auth state change listener handles redirect to dashboard
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

        // Auto-confirm is enabled, so the user is signed in immediately.
        // The onAuthStateChange listener handles redirect to dashboard.
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




  const startManagedGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${APP_DOMAIN}/auth`,
      extraParams: {
        prompt: "select_account",
      },
    });

    return error ?? null;
  };

  const openOAuthUrl = async (url: string) => {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url, windowName: "_self" });
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const isCapacitor = !!(window as any).Capacitor;

    if (isCapacitor) {
      const platform = (window as any).Capacitor?.getPlatform?.();
      const IOS_CLIENT_ID = "261698725488-qsbo20fl2qi11frd50aab93f0r39lckn.apps.googleusercontent.com";
      const WEB_CLIENT_ID = "261698725488-o5bgnrchhborkjp2gc7nguidc4b3bbma.apps.googleusercontent.com";

      // Try to get the plugin — first from Capacitor.Plugins, then via dynamic import
      let googleAuthPlugin = (window as any).Capacitor?.Plugins?.GoogleAuth;
      if (!googleAuthPlugin?.signIn) {
        try {
          const mod = await import("@deldev/capacitor-google-auth");
          googleAuthPlugin = mod.GoogleAuth ?? mod.default ?? mod;
        } catch {
          googleAuthPlugin = null;
        }
      }

      if (googleAuthPlugin?.signIn) {
        try {
          console.log("[GoogleAuth] Native plugin found. Platform:", platform);

          // initialize() is required by @deldev/capacitor-google-auth before signIn()
          if (typeof googleAuthPlugin.initialize === "function") {
            console.log("[GoogleAuth] Calling initialize()...");
            await googleAuthPlugin.initialize({
              clientId: platform === "ios" ? IOS_CLIENT_ID : WEB_CLIENT_ID,
              serverClientId: WEB_CLIENT_ID,
              scopes: ["profile", "email"],
              grantOfflineAccess: true,
            });
          }

          console.log("[GoogleAuth] Calling signIn()...");
          const googleUser = await googleAuthPlugin.signIn();
          console.log("[GoogleAuth] signIn() returned:", JSON.stringify(googleUser, null, 2));
          const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;

          if (!idToken) {
            throw new Error("No ID token returned from Google Sign-In");
          }

          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });

          if (error) throw error;
          return;
        } catch (error: any) {
          const message = error?.message || "Failed to sign in with Google.";
          const code = String(error?.code ?? "");
          const isCancelled = code === "USER_CANCELLED" || message.includes("popup_closed") || message.includes("canceled");

          console.error("[GoogleAuth] Native signIn error:", JSON.stringify(error, null, 2));

          if (isCancelled) {
            setLoading(false);
            return;
          }

          // Native plugin exists but failed — show error, don't silently fall back to browser
          toast({ title: "Google Sign-In Error", description: message, variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      // Browser OAuth fallback — ONLY reached if native plugin is not available at all
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${APP_DOMAIN}/auth-mobile-callback.html`,
          skipBrowserRedirect: true,
        },
      });
      if (oauthErr) {
        toast({ title: "Google Sign-In Error", description: oauthErr.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (data?.url) {
        await openOAuthUrl(data.url);
      }
      setLoading(false);
      return;
    }

    // Web: use direct Supabase OAuth (managed /~oauth doesn't work on custom domains)
    const { error: webOauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${APP_DOMAIN}/auth`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (webOauthErr) {
      toast({ title: "Google Sign-In Error", description: webOauthErr.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    const isCapacitor = !!(window as any).Capacitor;

    if (isCapacitor) {
      // Native: Manually construct the Lovable OAuth broker URL and open it
      // in an external browser via @capacitor/browser. The lovable SDK's
      // signInWithOAuth() navigates the webview to /~oauth/initiate which
      // causes a 404 because that path is only handled by Lovable's proxy.
      // Instead, we build the full URL with the published domain and open externally.
      try {
        const state = [...crypto.getRandomValues(new Uint8Array(16))]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const params = new URLSearchParams({
          provider: "apple",
          redirect_uri: `https://cushyinvoice.lovable.app/auth-mobile-callback.html`,
          state,
        });

        // Use .lovable.app domain for OAuth broker — /~oauth/ only works on Lovable's proxy, not custom domains
        const oauthUrl = `https://cushyinvoice.lovable.app/~oauth/initiate?${params.toString()}`;
        console.log("[AppleAuth] Opening OAuth URL in external browser:", oauthUrl);

        await openOAuthUrl(oauthUrl);
        // The external browser will complete Apple auth, redirect to
        // auth-mobile-callback.html, which forwards tokens via cushyinvoice:// scheme.
        // DeepLinkHandler picks up the deep link and establishes the session.
      } catch (error: any) {
        toast({ title: "Apple Sign-In Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Web: manually redirect to .lovable.app OAuth broker (custom domains don't proxy /~oauth/)
    try {
      const appleOAuthUrl = `https://cushyinvoice.lovable.app/~oauth/initiate?provider=apple&redirect_uri=${encodeURIComponent(`https://cushyinvoice.lovable.app/auth`)}`;
      window.location.href = appleOAuthUrl;
      return;
    } catch (error: any) {
      toast({ title: "Apple Sign-In Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      setLoading(false);
    }
  };

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

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium"
          disabled={loading}
          onClick={handleAppleSignIn}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
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
