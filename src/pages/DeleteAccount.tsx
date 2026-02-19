import { useState } from "react";
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DeleteAccount = () => {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate submission — in production this would trigger an email/support ticket
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Delete Account</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Request permanent deletion of your CushyInvoice account and all associated data.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Request Received</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We've received your account deletion request for <strong>{email}</strong>. 
              Our team will process it within 30 days and send you a confirmation email.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at{" "}
              <a href="mailto:support@cushyinvoice.com" className="text-primary hover:underline">
                support@cushyinvoice.com
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Warning box */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">This action is permanent and cannot be undone.</p>
                  <p className="text-sm text-muted-foreground">
                    Deleting your account will permanently remove:
                  </p>
                </div>
              </div>
              <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-1">
                <li>Your profile and account information</li>
                <li>All invoices, clients, and products you've created</li>
                <li>Expense records and reports</li>
                <li>Invoice templates and settings</li>
                <li>Subscription history and payment records</li>
              </ul>
            </div>

            {/* Alternatives */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <p className="font-medium text-foreground">Before you go, consider:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>
                  <strong>Cancel your subscription</strong> — you can keep your data without being charged via{" "}
                  <Link to="/settings" className="text-primary hover:underline">Settings</Link>.
                </li>
                <li>
                  <strong>Contact support</strong> — we can help resolve any issues at{" "}
                  <a href="mailto:support@cushyinvoice.com" className="text-primary hover:underline">
                    support@cushyinvoice.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Deletion form */}
            <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Submit Deletion Request
              </h2>

              <div className="space-y-2">
                <Label htmlFor="email">Your account email address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for deletion (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Help us improve by sharing why you're leaving..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                By submitting this request, you acknowledge that all your data will be permanently deleted within 30 days. 
                Data that is required to be retained by law (e.g. financial records) may be kept for the legally required period.
              </p>

              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={loading || !email}
              >
                {loading ? "Submitting..." : "Submit Deletion Request"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccount;
