import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import {
  Receipt,
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  Menu,
  X,
  Plus,
  BarChart3,
  Settings,
  Crown,
  RefreshCw,
  Wallet,
  Palette,
  MoreHorizontal,
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useTheme } from "@/hooks/useTheme";
import { Session } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/recurring", icon: RefreshCw, label: "Recurring", premium: true },
  { to: "/expenses", icon: Wallet, label: "Expenses", premium: true },
  { to: "/templates", icon: Palette, label: "Templates", premium: true },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

// Bottom nav shows these 4 items + More
const bottomNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { subscription: sub } = useSubscription();
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % 3]);
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session && event !== "INITIAL_SESSION") {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  const getUserDisplayName = () => {
    const meta = session?.user?.user_metadata;
    const provider = session?.user?.app_metadata?.provider;
    
    if (provider === "apple") {
      return meta?.full_name || meta?.name || "Apple Account";
    }
    
    return meta?.full_name || meta?.name || session?.user?.email || "";
  };

  const displayName = getUserDisplayName();

  const userInitials = (() => {
    const meta = session?.user?.user_metadata;
    const name = meta?.full_name || meta?.name;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    return session?.user?.email
      ? session.user.email.substring(0, 2).toUpperCase()
      : "U";
  })();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-card border-r border-border shadow-elevated transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full safe-top">
          {/* Logo Header */}
          <div className="h-16 px-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg overflow-hidden">
                <img src="/favicon.png" alt="CushyInvoice" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-extrabold tracking-tight">CushyInvoice</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 border-l-2 border-l-transparent min-h-[44px]"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-l-primary"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                <span className="flex-1 text-sm">{item.label}</span>
                {item.premium && !sub.subscribed && (
                  <span className="premium-badge" title="Premium Feature">
                    <Crown className="h-4 w-4" />
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 pb-20 lg:pb-4 border-t border-border safe-bottom">
            <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-muted/50 rounded-xl">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium truncate">
                  {displayName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[44px]"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[280px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <Menu className="h-4 w-4" />
              </button>
              {location.pathname !== "/dashboard" && (
                <>
                  <div className="h-4 w-px bg-border lg:hidden" />
                  <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0"></div>

            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              className="h-9 w-9 flex-shrink-0"
              title={`Theme: ${theme}`}
            >
              <ThemeIcon className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => navigate("/invoices/new")}
              className="gap-2 shadow-sm flex-shrink-0"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Invoice</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </header>

        {/* Page content - add bottom padding for mobile nav */}
        <main className="p-3 sm:p-4 lg:p-8 pb-24 lg:pb-8 safe-left safe-right animate-fade-in">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav lg:hidden">
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`mobile-bottom-nav-item ${isActiveRoute(item.to) ? "active" : ""}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => navigate("/settings")}
            className={`mobile-bottom-nav-item ${isActiveRoute("/settings") ? "active" : ""}`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
