export type InvoiceStatus = "paid" | "sent" | "overdue" | "draft" | string;

export const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case "paid":
      return "bg-success text-white";
    case "sent":
      return "bg-info text-white";
    case "overdue":
      return "bg-destructive text-white";
    case "draft":
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const getStatusBorderClass = (status: InvoiceStatus): string => {
  switch (status) {
    case "paid":
      return "border-l-success";
    case "sent":
      return "border-l-info";
    case "overdue":
      return "border-l-destructive";
    case "draft":
    default:
      return "border-l-muted";
  }
};
