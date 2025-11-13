import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { AddTemplateDialog } from "@/components/AddTemplateDialog";
import { Loader2, Palette, FileText, Trash2 } from "lucide-react";
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

interface Template {
  id: string;
  template_name: string;
  primary_color: string;
  layout_style: string;
  is_default: boolean;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

      toast({
        title: "Template Deleted",
        description: "The template has been deleted successfully.",
      });

      fetchTemplates();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const defaultTemplates = [
    { name: "Modern", style: "modern", color: "#6366f1" },
    { name: "Classic", style: "classic", color: "#059669" },
    { name: "Minimal", style: "minimal", color: "#64748b" },
    { name: "Bold", style: "bold", color: "#dc2626" },
  ];

  return (
    <SubscriptionGuard message="Custom invoice templates are available on the Premium plan. Create branded invoices that stand out.">
      <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Invoice Templates</h1>
            <p className="text-muted-foreground mt-2">
              Customize your invoice appearance with branded templates
            </p>
          </div>
          <AddTemplateDialog onTemplateAdded={fetchTemplates} />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Default Templates</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {defaultTemplates.map((template) => (
              <Card key={template.style} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div
                  className="w-full h-32 rounded-lg mb-4"
                  style={{ backgroundColor: template.color }}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{template.style}</p>
                  </div>
                  <Palette className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {templates.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Custom Templates</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow relative group">
                  <div
                    className="w-full h-32 rounded-lg mb-4"
                    style={{ backgroundColor: template.primary_color }}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{template.template_name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{template.layout_style}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.is_default && <Badge>Default</Badge>}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(template.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {templates.length === 0 && (
          <Card className="p-12 text-center mt-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Custom Templates Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create custom templates to match your brand identity
            </p>
            <AddTemplateDialog onTemplateAdded={fetchTemplates} />
          </Card>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this template? Invoices using this template will not be affected.
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
    </div>
    </SubscriptionGuard>
  );
}
