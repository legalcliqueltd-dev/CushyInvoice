import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Loader2, Plus, Lock, Receipt, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  if (!limits.isPremium) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Lock className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Expense tracking is available on the Premium plan. Keep tabs on your business spending.
            </p>
            <Button size="lg" onClick={() => navigate("/subscribe")}>
              Upgrade to Premium
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Expenses</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your business expenses
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
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
          <Card className="p-6">
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

        {expenses.length === 0 ? (
          <Card className="p-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Expenses Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start tracking your business expenses to better manage your finances
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Expense
            </Button>
          </Card>
        ) : (
          <Card>
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
                    <p className="font-semibold text-destructive">
                      -{expense.currency} {Number(expense.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
