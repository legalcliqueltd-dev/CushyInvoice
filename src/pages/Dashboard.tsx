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

      // Fetch all invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;

      // Calculate stats
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {!subscription.subscribed && (
          (window as any).Capacitor ? (
            <CompactUpgradeBanner />
          ) : (
            <>
              <TrialBanner />
              <UpgradeBanner />
              <PlanLimitsBanner />
              <AdSenseAd 
                slot="1234567890" 
                format="horizontal"
                className="my-4"
              />
            </>
          )
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Overview of your invoicing activity
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/clients")} className="neo-btn-subtle" size="sm">
              <UserPlus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Client</span>
            </Button>
            <Button onClick={() => navigate("/invoices/new")} className="neo-btn-subtle" size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Invoice</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="neo-stat-card border-l-success">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Paid
              </CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-2xl font-bold truncate">
                ${stats.totalPaid.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total received
              </p>
            </CardContent>
          </Card>

          <Card className="neo-stat-card border-l-info">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Outstanding Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-2xl font-bold truncate">
                ${stats.totalOutstanding.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total unpaid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="neo-stat-card border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time invoices
              </p>
            </CardContent>
          </Card>

          <Card className="neo-stat-card border-l-muted">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Draft Invoices
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draftInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending completion
              </p>
            </CardContent>
          </Card>

          <Card className="neo-stat-card border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdueInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card className="neo-card-subtle">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No invoices yet</p>
                <Button onClick={() => navigate("/invoices/new")}>
                  Create Your First Invoice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-medium truncate">{invoice.invoice_number}</p>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {invoice.clients.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${Number(invoice.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/invoices")}
                >
                  View All Invoices
                </Button>
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
