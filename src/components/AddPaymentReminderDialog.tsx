import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2 } from "lucide-react";

interface AddPaymentReminderDialogProps {
  invoiceId: string;
  onReminderAdded: () => void;
}

export const AddPaymentReminderDialog = ({ invoiceId, onReminderAdded }: AddPaymentReminderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reminder_type: "before_due",
    days_before_due: 3,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("payment_reminders").insert({
        user_id: user.id,
        invoice_id: invoiceId,
        reminder_type: formData.reminder_type,
        days_before_due: formData.days_before_due,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Reminder Scheduled",
        description: "Payment reminder has been scheduled successfully.",
      });

      setOpen(false);
      setFormData({
        reminder_type: "before_due",
        days_before_due: 3,
      });
      onReminderAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="mr-2 h-4 w-4" />
          Add Reminder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Payment Reminder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reminder_type">Reminder Type</Label>
            <Select
              value={formData.reminder_type}
              onValueChange={(value) => setFormData({ ...formData, reminder_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before_due">Before Due Date</SelectItem>
                <SelectItem value="on_due">On Due Date</SelectItem>
                <SelectItem value="overdue">After Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="days_before_due">
              {formData.reminder_type === "overdue" ? "Days After Due" : "Days Before Due"}
            </Label>
            <Input
              id="days_before_due"
              type="number"
              min="1"
              max="30"
              value={formData.days_before_due}
              onChange={(e) => setFormData({ ...formData, days_before_due: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Reminder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
