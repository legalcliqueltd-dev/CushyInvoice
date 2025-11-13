import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, ExternalLink, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface EmailLog {
  id: string;
  invoice_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  email_type: string;
  created_at: string;
  sent_manually: boolean;
  invoices?: {
    invoice_number: string;
  };
}

const EmailNotifications = () => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from("email_logs" as any)
        .select(`
          *,
          invoices (
            invoice_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmails((data as any) || []);
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

  const handleMarkAsSent = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from("email_logs" as any)
        .update({ sent_manually: true } as any)
        .eq("id", emailId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email marked as sent",
      });

      fetchEmails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createMailtoLink = (email: EmailLog) => {
    const body = encodeURIComponent(email.body);
    const subject = encodeURIComponent(email.subject);
    return `mailto:${email.recipient_email}?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading emails...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Notifications</h1>
          <p className="text-muted-foreground">
            View and send generated email notifications
          </p>
        </div>

        {emails.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No email notifications yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <Card key={email.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{email.subject}</CardTitle>
                      <CardDescription>
                        To: {email.recipient_email} •{" "}
                        {format(new Date(email.created_at), "PPp")}
                        {email.invoices && (
                          <> • Invoice: {email.invoices.invoice_number}</>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={email.email_type === "reminder" ? "destructive" : "default"}>
                        {email.email_type}
                      </Badge>
                      {email.sent_manually && (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Sent
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {email.body}
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="default"
                    >
                      <a
                        href={createMailtoLink(email)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Send via Email Client
                      </a>
                    </Button>
                    {!email.sent_manually && (
                      <Button
                        variant="outline"
                        onClick={() => handleMarkAsSent(email.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Sent
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmailNotifications;
