import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, Search, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStatusColor } from "@/utils/statusColors";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";

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

export default function Invoices() {
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter((invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clients.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  }, [searchQuery, invoices]);

  const fetchInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
      setFilteredInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <LoadingState variant="table" rows={6} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">Manage all your invoices</p>
          </div>
          <Button onClick={() => navigate("/invoices/new")} className="neo-btn-subtle">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {/* Search */}
        <Card className="neo-card-subtle">
          <CardContent className="pt-6">
            <div className="relative group focus-within:[&_svg]:text-primary">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors pointer-events-none" />
              <Input
                placeholder="Search invoices by number, client, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery ? "No invoices found" : "No invoices yet"}
            description={
              searchQuery
                ? "Try a different search term or clear the filter."
                : "Create your first invoice to start tracking payments."
            }
            action={
              !searchQuery && (
                <Button onClick={() => navigate("/invoices/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Invoice
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Mobile card list (below md) */}
            <div className="space-y-2 md:hidden">
              {paginatedInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="neo-card-subtle cursor-pointer"
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {invoice.invoice_number}
                        </span>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {invoice.clients.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-semibold">
                        ${Number(invoice.total).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop / tablet table (md and up) */}
            <Card className="neo-card-subtle hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                          <TableCell className="font-medium">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={invoice.clients.name}>
                            {invoice.clients.name}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.issue_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${Number(invoice.total).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/invoices/${invoice.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Floating Action Button for mobile */}
        {isMobile && (
          <button
            onClick={() => navigate("/invoices/new")}
            className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Create new invoice"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
