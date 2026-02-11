import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddTemplateDialogProps {
  onTemplateAdded: () => void;
}

export const AddTemplateDialog = ({ onTemplateAdded }: AddTemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    template_name: "",
    primary_color: "#6366f1",
    secondary_color: "#64748b",
    font_family: "Inter",
    layout_style: "modern",
    is_default: false,
    gradient_start_color: "",
    gradient_end_color: "",
    gradient_direction: "to bottom right",
    watermark_text: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (formData.is_default) {
        await supabase
          .from("invoice_templates")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true);
      }

      const { error } = await supabase.from("invoice_templates").insert({
        user_id: user.id,
        template_name: formData.template_name,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        font_family: formData.font_family,
        layout_style: formData.layout_style,
        is_default: formData.is_default,
        gradient_start_color: formData.gradient_start_color || null,
        gradient_end_color: formData.gradient_end_color || null,
        gradient_direction: formData.gradient_direction,
        watermark_text: formData.watermark_text || null,
      });

      if (error) throw error;

      toast({
        title: "Template Created",
        description: "Your custom template has been created successfully.",
      });

      setOpen(false);
      setFormData({
        template_name: "",
        primary_color: "#6366f1",
        secondary_color: "#64748b",
        font_family: "Inter",
        layout_style: "modern",
        is_default: false,
        gradient_start_color: "",
        gradient_end_color: "",
        gradient_direction: "to bottom right",
        watermark_text: "",
      });
      onTemplateAdded();
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] neo-card-subtle max-h-[85vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create Custom Template</DialogTitle>
          <DialogDescription className="sr-only">
            Design a custom invoice template
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="template_name">Template Name</Label>
            <Input
              id="template_name"
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              placeholder="My Custom Template"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  placeholder="#64748b"
                />
              </div>
            </div>
          </div>

          {/* Gradient Section */}
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <Label className="text-sm font-semibold">Header Gradient (optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gradient_start" className="text-xs">Start Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="gradient_start"
                    type="color"
                    value={formData.gradient_start_color || "#6366f1"}
                    onChange={(e) => setFormData({ ...formData, gradient_start_color: e.target.value })}
                    className="w-12 h-9"
                  />
                  <Input
                    type="text"
                    value={formData.gradient_start_color}
                    onChange={(e) => setFormData({ ...formData, gradient_start_color: e.target.value })}
                    placeholder="None"
                    className="text-xs"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="gradient_end" className="text-xs">End Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="gradient_end"
                    type="color"
                    value={formData.gradient_end_color || "#4f46e5"}
                    onChange={(e) => setFormData({ ...formData, gradient_end_color: e.target.value })}
                    className="w-12 h-9"
                  />
                  <Input
                    type="text"
                    value={formData.gradient_end_color}
                    onChange={(e) => setFormData({ ...formData, gradient_end_color: e.target.value })}
                    placeholder="None"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="gradient_direction" className="text-xs">Direction</Label>
              <Select
                value={formData.gradient_direction}
                onValueChange={(value) => setFormData({ ...formData, gradient_direction: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to right">Left → Right</SelectItem>
                  <SelectItem value="to bottom">Top → Bottom</SelectItem>
                  <SelectItem value="to bottom right">Diagonal ↘</SelectItem>
                  <SelectItem value="to bottom left">Diagonal ↙</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.gradient_start_color && formData.gradient_end_color && (
              <div
                className="h-8 rounded-md border"
                style={{
                  background: `linear-gradient(${formData.gradient_direction}, ${formData.gradient_start_color}, ${formData.gradient_end_color})`,
                }}
              />
            )}
          </div>

          {/* Watermark */}
          <div>
            <Label htmlFor="watermark_text">Watermark Text (optional)</Label>
            <Input
              id="watermark_text"
              value={formData.watermark_text}
              onChange={(e) => setFormData({ ...formData, watermark_text: e.target.value })}
              placeholder="e.g. DRAFT, CONFIDENTIAL"
            />
            <p className="text-xs text-muted-foreground mt-1">Displays faintly across the invoice body</p>
          </div>

          <div>
            <Label htmlFor="layout_style">Layout Style</Label>
            <Select
              value={formData.layout_style}
              onValueChange={(value) => setFormData({ ...formData, layout_style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="font_family">Font Family</Label>
            <Select
              value={formData.font_family}
              onValueChange={(value) => setFormData({ ...formData, font_family: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_default: checked as boolean })
              }
            />
            <Label htmlFor="is_default" className="cursor-pointer">
              Set as default template
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="neo-btn-subtle">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
