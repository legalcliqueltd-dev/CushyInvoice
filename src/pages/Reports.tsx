import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReportData {
  totalPaid: number;
  totalUnpaid: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  invoices: any[];
}

export default function Reports() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportData, setReportData] = useState<ReportData>({
    totalPaid: 0,
    totalUnpaid: 0,
    paidInvoicesCount: 0,
    unpaidInvoicesCount: 0,
    invoices: [],
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [dateFrom, dateTo]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("user_id", user.id);

      if (dateFrom) {
        query = query.gte("issue_date", format(dateFrom, "yyyy-MM-dd"));
      }
      if (dateTo) {
        query = query.lte("issue_date", format(dateTo, "yyyy-MM-dd"));
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      const paidInvoices = invoices?.filter((inv) => inv.status === "paid") || [];
      const unpaidInvoices = invoices?.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled") || [];

      const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      setReportData({
        totalPaid,
        totalUnpaid,
        paidInvoicesCount: paidInvoices.length,
        unpaidInvoicesCount: unpaidInvoices.length,
        invoices: invoices || [],
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching report data:", error);
      }
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvHeaders = ["Invoice Number", "Client", "Issue Date", "Due Date", "Status", "Total"];
    const csvRows = reportData.invoices.map((inv) => [
      inv.invoice_number,
      inv.clients?.name || "",
      format(new Date(inv.issue_date), "yyyy-MM-dd"),
      format(new Date(inv.due_date), "yyyy-MM-dd"),
      inv.status,
      Number(inv.total).toFixed(2),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported to CSV",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your invoicing performance
          </p>
        </div>

        {/* Date Range Filter */}
        <Card className="neo-card-subtle">
          <CardHeader>
            <CardTitle>Filter by Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Stats */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="neo-stat-card border-l-success">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    ${reportData.totalPaid.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportData.paidInvoicesCount} invoice{reportData.paidInvoicesCount !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card className="neo-stat-card border-l-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    ${reportData.totalUnpaid.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportData.unpaidInvoicesCount} invoice{reportData.unpaidInvoicesCount !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Export Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Export Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Download invoice data as CSV ({reportData.invoices.length} invoice{reportData.invoices.length !== 1 ? "s" : ""})
                    </p>
                  </div>
                  <Button onClick={exportToCSV} disabled={reportData.invoices.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export to CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
