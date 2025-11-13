import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Loader2, Plus, Lock, Palette, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const { limits } = usePlanLimits();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (limits.isPremium) {
      fetchTemplates();
    } else {
      setLoading(false);
    }
  }, [limits.isPremium]);

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
              Custom invoice templates are available on the Premium plan. Create branded invoices that stand out.
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

  const defaultTemplates = [
    { name: "Modern", style: "modern", color: "#6366f1" },
    { name: "Classic", style: "classic", color: "#059669" },
    { name: "Minimal", style: "minimal", color: "#64748b" },
    { name: "Bold", style: "bold", color: "#dc2626" },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Invoice Templates</h1>
            <p className="text-muted-foreground mt-2">
              Customize your invoice appearance with branded templates
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
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
                <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div
                    className="w-full h-32 rounded-lg mb-4"
                    style={{ backgroundColor: template.primary_color }}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{template.template_name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{template.layout_style}</p>
                    </div>
                    {template.is_default && <Badge>Default</Badge>}
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
