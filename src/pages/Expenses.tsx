import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { Loader2, Receipt, DollarSign, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Expense {
  id: string;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<{ [key: string]: number }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { limits } = usePlanLimits();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (limits.isPremium) {
      fetchExpenses();
    } else {
      setLoading(false);
    }
  }, [limits.isPremium]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (error) throw error;
      
      setExpenses(data || []);
      
      const total = data?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      setTotalExpenses(total);

      const categoryMap: { [key: string]: number } = {};
      data?.forEach((expense) => {
        const category = expense.category;
        categoryMap[category] = (categoryMap[category] || 0) + Number(expense.amount);
      });
      setCategoryTotals(categoryMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Expense Deleted",
        description: "The expense has been deleted successfully.",
      });

      fetchExpenses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (!limits.isPremium) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center neo-card-subtle">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Lock className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Expense tracking is available on the Premium plan. Keep tabs on your business spending.
            </p>
            <Button size="lg" onClick={() => navigate("/subscribe")} className="neo-btn-subtle">
              Upgrade to Premium
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              Track and manage your business expenses
            </p>
          </div>
          <AddExpenseDialog onExpenseAdded={fetchExpenses} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 neo-stat-card border-l-destructive">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <DollarSign className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 neo-stat-card border-l-primary">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {Object.keys(categoryTotals).length > 0 && (
          <Card className="p-6 neo-card-subtle">
            <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
            <div className="grid gap-3">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg border-l-4 border-l-destructive">
                    <span className="font-medium">{category}</span>
                    <span className="text-destructive font-semibold">${total.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {expenses.length === 0 ? (
          <Card className="p-12 text-center neo-card-subtle">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Expenses Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start tracking your business expenses to better manage your finances
            </p>
            <AddExpenseDialog onExpenseAdded={fetchExpenses} />
          </Card>
        ) : (
          <Card className="neo-card-subtle">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{expense.description || expense.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.expense_date).toLocaleDateString()} • {expense.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-destructive">
                        -{expense.currency} {Number(expense.amount).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
