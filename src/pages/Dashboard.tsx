import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TrialBanner } from "@/components/TrialBanner";
import { PlanLimitsBanner } from "@/components/PlanLimitsBanner";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { AdSenseAd } from "@/components/AdSenseAd";
import { CompactUpgradeBanner } from "@/components/CompactUpgradeBanner";
import { useSubscription } from "@/hooks/useSubscription";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  Eye,
  Plus,
  UserPlus,
  AlertTriangle,
  LayoutDashboard,
  ArrowRight,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  issue_date: string;
  due_date: string;
  clients: {
    name: string;
  };
}

interface DashboardStats {
  totalOutstanding: number;
  totalPaid: number;
  totalInvoices: number;
  draftInvoices: number;
  overdueInvoices: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOutstanding: 0,
    totalPaid: 0,
    totalInvoices: 0,
    draftInvoices: 0,
    overdueInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription } = useSubscription();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;

      const totalInvoices = invoices?.length || 0;
      const draftInvoices = invoices?.filter((inv) => inv.status === "draft").length || 0;
      const today = new Date().toISOString().split("T")[0];
      const overdueInvoices = invoices?.filter(
        (inv) => inv.status !== "paid" && inv.due_date < today
      ).length || 0;
      const totalOutstanding = invoices
        ?.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
        .reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
      const totalPaid = invoices
        ?.filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + Number(inv.total), 0) || 0;

      setStats({
        totalOutstanding,
        totalPaid,
        totalInvoices,
        draftInvoices,
        overdueInvoices,
      });

      setRecentInvoices(invoices?.slice(0, 5) || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching dashboard data:", error);
      }
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-white";
      case "sent":
        return "bg-info text-white";
      case "overdue":
        return "bg-destructive text-white";
      case "draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: "Total Paid",
      value: `$${stats.totalPaid.toFixed(2)}`,
      icon: DollarSign,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Outstanding",
      value: `$${stats.totalOutstanding.toFixed(2)}`,
      icon: Clock,
      iconColor: "text-info",
      bgColor: "bg-info/10",
    },
    {
      label: "Invoices",
      value: stats.totalInvoices,
      icon: FileText,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Overdue",
      value: stats.overdueInvoices,
      icon: AlertTriangle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!subscription.subscribed && (
          <>
            {/* Mobile: single compact banner */}
            <div className="block sm:hidden">
              <CompactUpgradeBanner />
            </div>
            {/* Desktop: full banners */}
            <div className="hidden sm:block space-y-4">
              <TrialBanner />
              <UpgradeBanner />
              <PlanLimitsBanner />
              {!(window as any).Capacitor && (
                <AdSenseAd slot="1234567890" format="horizontal" className="my-2" />
              )}
            </div>
          </>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Overview of your invoicing activity
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={() => navigate("/clients")} variant="outline" size="sm">
              <UserPlus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Add Client</span>
            </Button>
            <Button onClick={() => navigate("/invoices/new")} size="sm">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Invoice</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat) => (
            <Card key={stat.label} className="neo-card-subtle">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold truncate">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Drafts callout */}
        {stats.draftInvoices > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm flex-1">
              You have <span className="font-semibold">{stats.draftInvoices} draft{stats.draftInvoices > 1 ? 's' : ''}</span> pending completion
            </p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/invoices")}>
              View
            </Button>
          </div>
        )}

        {/* Recent Invoices */}
        <Card className="neo-card-subtle">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
              {recentInvoices.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => navigate("/invoices")}>
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">No invoices yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Create your first invoice to start tracking payments
                </p>
                <Button size="sm" onClick={() => navigate("/invoices/new")}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Invoice
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{invoice.clients.name}</span>
                        <Badge className={`${getStatusColor(invoice.status)} text-[10px] px-1.5 py-0`}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {invoice.invoice_number} · Due {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-sm shrink-0">
                      ${Number(invoice.total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {!subscription.subscribed && !(window as any).Capacitor && (
          <AdSenseAd 
            slot="0987654321" 
            format="rectangle"
            className="my-4"
          />
        )}
      </div>
    </DashboardLayout>
  );
}
