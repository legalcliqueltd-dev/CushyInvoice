import { Card } from "@/components/ui/card";

interface TemplatePreviewCardProps {
  name: string;
  style: string;
  color: string;
  onClick?: () => void;
}

export const TemplatePreviewCard = ({ name, style, color, onClick }: TemplatePreviewCardProps) => {
  return (
    <Card
      className="group overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300"
      onClick={onClick}
    >
      {/* Mini invoice preview mockup */}
      <div className="p-4 bg-muted/30">
        <div className="bg-card rounded-md border shadow-sm p-3 space-y-2.5 transition-transform group-hover:scale-[1.02]">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-12 rounded-sm" style={{ backgroundColor: color }} />
            <div className="h-2 w-8 rounded bg-muted" />
          </div>
          {/* Address lines */}
          <div className="space-y-1">
            <div className="h-1.5 w-20 rounded bg-muted" />
            <div className="h-1.5 w-16 rounded bg-muted" />
          </div>
          {/* Table header */}
          <div className="h-2 w-full rounded-sm" style={{ backgroundColor: color, opacity: 0.15 }} />
          {/* Table rows */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-1.5 w-24 rounded bg-muted" />
              <div className="h-1.5 w-8 rounded bg-muted" />
            </div>
            <div className="flex justify-between">
              <div className="h-1.5 w-20 rounded bg-muted" />
              <div className="h-1.5 w-10 rounded bg-muted" />
            </div>
            <div className="flex justify-between">
              <div className="h-1.5 w-16 rounded bg-muted" />
              <div className="h-1.5 w-8 rounded bg-muted" />
            </div>
          </div>
          {/* Total */}
          <div className="flex justify-end pt-1 border-t">
            <div className="h-2 w-14 rounded-sm" style={{ backgroundColor: color, opacity: 0.7 }} />
          </div>
        </div>
      </div>
      {/* Label */}
      <div className="px-4 py-3 border-t">
        <h3 className="font-semibold text-sm">{name}</h3>
        <p className="text-xs text-muted-foreground capitalize">{style} layout</p>
      </div>
    </Card>
  );
};
