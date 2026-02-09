import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AddTemplateDialog } from "@/components/AddTemplateDialog";

import { DashboardLayout } from "@/components/DashboardLayout";
import { TemplatePreviewCard } from "@/components/TemplatePreviewCard";
import { Loader2, FileText, Trash2, Plus, Sparkles } from "lucide-react";
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

interface Template {
  id: string;
  template_name: string;
  primary_color: string;
  layout_style: string;
  is_default: boolean;
}

const defaultTemplates = [
  { name: "Modern", style: "modern", color: "#6366f1" },
  { name: "Classic", style: "classic", color: "#059669" },
  { name: "Minimal", style: "minimal", color: "#64748b" },
  { name: "Bold", style: "bold", color: "#dc2626" },
];

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("invoice_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load templates",
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
        .from("invoice_templates")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast({ title: "Template Deleted", description: "The template has been deleted successfully." });
      fetchTemplates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Templates</h1>
            <p className="text-muted-foreground mt-1">
              Customize how your invoices look with branded templates
            </p>
          </div>
          <SubscriptionGuard
            message="Custom templates require a Premium plan."
            fallback={
              <Button variant="outline" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            }
          >
            <AddTemplateDialog onTemplateAdded={fetchTemplates} />
          </SubscriptionGuard>
        </div>

        {/* Default Templates */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Default Templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {defaultTemplates.map((template) => (
              <TemplatePreviewCard
                key={template.style}
                name={template.name}
                style={template.style}
                color={template.color}
              />
            ))}
          </div>
        </section>

        {/* Custom Templates */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Your Custom Templates</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="relative group">
                  <TemplatePreviewCard
                    name={template.template_name}
                    style={template.layout_style}
                    color={template.primary_color}
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(template.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No custom templates yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Create branded templates to make your invoices stand out and look professional
                </p>
                <SubscriptionGuard message="Custom templates require a Premium plan.">
                  <AddTemplateDialog onTemplateAdded={fetchTemplates} />
                </SubscriptionGuard>
              </div>
            </Card>
          )}
        </section>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? Existing invoices using this template won't be affected.
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
