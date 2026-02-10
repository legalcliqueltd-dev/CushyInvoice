import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GradientButton } from "@/components/ui/gradient-button";
import { Receipt, FileText, Users, TrendingUp, Zap, Twitter, Linkedin, Facebook, Instagram, MessageCircle, ArrowRight, Star, Loader2 } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Easy Invoicing",
    desc: "Whip up clean, pro invoices in literally seconds. no more spreadsheet nightmares.",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    iconBg: "bg-blue-400",
  },
  {
    icon: Users,
    title: "Client Hub",
    desc: "All your clients, contacts & history in one spot. Stay organized effortlessly.",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    iconBg: "bg-purple-400",
  },
  {
    icon: TrendingUp,
    title: "Payment Tracking",
    desc: "Know exactly who owes what. Get paid faster with automatic reminders.",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconBg: "bg-emerald-400",
  },
  {
    icon: Zap,
    title: "PDF Export",
    desc: "Download & share invoices as pixel-perfect PDFs. Look professional, always.",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    iconBg: "bg-orange-400",
  },
];

const testimonials = [
  {
    text: "CushyInvoice has completely transformed how I manage my freelance business. Creating invoices is now a breeze!",
    name: "Sarah Johnson",
    role: "Freelance Designer",
    color: "bg-pink-400",
    rotate: "-rotate-1",
  },
  {
    text: "The payment tracking feature is fantastic. I always know who owes what and when payments are due.",
    name: "Michael Chen",
    role: "Consulting Services",
    color: "bg-blue-400",
    rotate: "rotate-1",
  },
  {
    text: "Simple, professional, and exactly what my small business needed. Highly recommended!",
    name: "Emma Williams",
    role: "Photography Studio",
    color: "bg-emerald-400",
    rotate: "-rotate-2",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [checkingNative, setCheckingNative] = useState(() => !!(window as any).Capacitor);

  useEffect(() => {
    if (!(window as any).Capacitor) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
    }).catch(() => {
      navigate("/auth", { replace: true });
    });
  }, [navigate]);

  if (checkingNative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background landing-noise overflow-x-hidden">
      {/* Animated gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-blob-float" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full bg-purple-500/15 blur-[100px] animate-blob-float-reverse" />
        <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-[110px] animate-blob-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b-2 border-foreground/10 bg-background/90 backdrop-blur-md safe-top">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight">CushyInvoice</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="neo-brutal-btn rounded-lg px-3 sm:px-4 py-2 text-sm font-bold bg-background text-foreground min-h-[44px]"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="neo-brutal-btn rounded-lg px-3 sm:px-4 py-2 text-sm font-bold bg-primary text-primary-foreground min-h-[44px]"
            >
              <span className="hidden sm:inline">Get Started →</span>
              <span className="sm:hidden">Start →</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20 lg:py-32 relative">
        <div className="text-center max-w-3xl mx-auto space-y-6 sm:space-y-8 relative z-10">
          <div className="inline-block neo-brutal-btn rounded-full px-4 py-1.5 text-sm font-bold bg-primary/10 text-foreground cursor-default" style={{ boxShadow: "3px 3px 0px hsl(var(--foreground) / 0.3)" }}>
            ✨ invoicing, but make it fun
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1]">
            stop chasing payments.
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">start vibing</span>
              <span className="absolute inset-0 bg-primary/20 -skew-y-1 rounded-md scale-110" />
            </span>
            {" "}with your invoices.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto">
            Create professional invoices in minutes. Track payments, manage clients, and actually enjoy running your business. fr fr. 💅
          </p>

          {/* Squiggle arrow decoration */}
          <svg className="mx-auto w-16 h-10 text-primary/50" viewBox="0 0 64 40" fill="none">
            <path d="M4 8 C 16 2, 28 18, 32 10 S 48 2, 60 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M52 6 L60 12 L52 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <GradientButton onClick={() => navigate("/auth")} className="text-lg px-10 py-5 w-full sm:w-auto">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </GradientButton>
            <button
              onClick={() => window.open("https://wa.me/2348129797793", "_blank")}
              className="neo-brutal-btn rounded-xl px-8 py-4 text-base font-bold bg-emerald-400 text-foreground inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Support
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-black mb-3">everything you need 🚀</h2>
          <p className="text-muted-foreground text-lg">No bloat. Just the tools that actually matter.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`neo-card rounded-2xl p-6 space-y-4 ${f.bg}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-12 h-12 ${f.iconBg} rounded-xl border-2 border-foreground flex items-center justify-center`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-black text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-black mb-3">real people, real love 💜</h2>
          <p className="text-muted-foreground text-lg">Join thousands of happy business owners</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`neo-card rounded-2xl p-6 space-y-4 bg-card ${t.rotate}`}
            >
              <div className="flex gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${t.color} rounded-full border-2 border-foreground flex items-center justify-center text-white font-black text-sm`}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <div className="relative overflow-hidden rounded-3xl border-2 border-foreground bg-gradient-to-br from-primary via-primary/90 to-purple-600 p-12 lg:p-16 text-center">
          {/* Noise overlay on CTA */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }} />
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-5xl font-black mb-4 text-primary-foreground">
              ready to level up? 🔥
            </h2>
            <p className="text-lg lg:text-xl mb-8 text-primary-foreground/80 max-w-lg mx-auto">
              Join thousands of small businesses using CushyInvoice to get paid faster.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="neo-brutal-btn rounded-xl px-10 py-4 text-lg font-black bg-yellow-400 text-foreground inline-flex items-center gap-2"
              style={{ borderColor: "hsl(var(--foreground))" }}
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-foreground/10 mt-16 relative z-10 safe-bottom">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-lg p-1.5">
                <Receipt className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-black">CushyInvoice</span>
            </div>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/109821013", label: "LinkedIn" },
                { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61583939240091", label: "Facebook" },
                { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-brutal-btn rounded-lg p-2 bg-background text-foreground"
                  style={{ boxShadow: "2px 2px 0px hsl(var(--foreground) / 0.3)", border: "2px solid hsl(var(--foreground) / 0.3)" }}
                  aria-label={s.label}
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Privacy Policy
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Terms of Service
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 CushyInvoice. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
