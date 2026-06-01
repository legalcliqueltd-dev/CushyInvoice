import { format } from "date-fns";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatMoney } from "@/utils/formatAmount";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface CompanyInfo {
  company_name: string;
  company_logo: string | null;
  email: string;
  phone: string;
  address: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_code?: string;
}

interface ClientInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface InvoicePreviewProps {
  companyInfo: CompanyInfo;
  client?: ClientInfo;
  invoiceNumber?: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: LineItem[];
  taxRate: number;
  currency: string;
  notes: string;
  logoBgColor: string;
  status?: string;
  templateColor?: string;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; fg: string; dot: string; label: string }
> = {
  paid: { bg: "#dcfce7", fg: "#15803d", dot: "#22c55e", label: "Paid" },
  sent: { bg: "#dbeafe", fg: "#1d4ed8", dot: "#3b82f6", label: "Sent" },
  overdue: { bg: "#fee2e2", fg: "#b91c1c", dot: "#ef4444", label: "Overdue" },
  draft: { bg: "#f3f4f6", fg: "#4b5563", dot: "#9ca3af", label: "Draft" },
};

export function InvoicePreview({
  companyInfo,
  client,
  invoiceNumber = "INV-XXXXX",
  issueDate,
  dueDate,
  lineItems,
  taxRate,
  currency,
  notes,
  logoBgColor,
  status = "draft",
  templateColor = "#4f46e5",
}: InvoicePreviewProps) {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const tax = subtotal * (Number(taxRate) / 100);
  const total = subtotal + tax;
  const sym = getCurrencySymbol(currency);
  const statusStyle =
    STATUS_STYLES[status.toLowerCase()] ?? STATUS_STYLES.draft;
  const contactBits = [companyInfo.email, companyInfo.phone].filter(Boolean);

  return (
    <div
      className="bg-white text-gray-900 shadow-[0_2px_24px_-4px_rgba(15,23,42,0.08)] rounded-2xl overflow-hidden max-w-[210mm] mx-auto"
      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
    >
      {/* Accent strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: templateColor }} />

      {/* Company header */}
      <div className="px-5 sm:px-8 pt-7 pb-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {companyInfo.company_logo && (
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: logoBgColor }}
            >
              <img
                src={companyInfo.company_logo}
                alt="Logo"
                className="w-full h-full object-contain p-1.5"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 break-words leading-tight">
              {companyInfo.company_name || "Your Company"}
            </h1>
            {contactBits.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 break-words leading-relaxed">
                {contactBits.map((bit, i) => (
                  <span key={i}>
                    {i > 0 && (
                      <span className="mx-1.5 text-gray-300">·</span>
                    )}
                    <span className="break-all">{bit}</span>
                  </span>
                ))}
              </p>
            )}
            {companyInfo.address && (
              <p className="mt-0.5 text-xs text-gray-500 break-words leading-relaxed">
                {companyInfo.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="mx-5 sm:mx-8 h-px"
        style={{ backgroundColor: `${templateColor}1f` }}
      />

      {/* Invoice meta band */}
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.22em]"
            style={{ color: templateColor }}
          >
            Invoice
          </p>
          <p className="mt-0.5 text-base font-mono font-medium text-gray-900 break-all">
            {invoiceNumber}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusStyle.dot }}
          />
          {statusStyle.label}
        </span>
      </div>

      {/* Bill To + dates */}
      <div className="px-5 sm:px-8 pb-6">
        <div className="rounded-2xl bg-gray-50/70 ring-1 ring-gray-100 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <div className="min-w-0 sm:col-span-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1.5">
                Billed To
              </p>
              {client ? (
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm text-gray-900 break-words">
                    {client.name}
                  </p>
                  {client.email && (
                    <p className="text-xs text-gray-500 break-all">
                      {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="text-xs text-gray-500 break-all">
                      {client.phone}
                    </p>
                  )}
                  {client.address && (
                    <p className="text-xs text-gray-500 break-words">
                      {client.address}
                    </p>
                  )}
                  {(client.city || client.state || client.zip_code) && (
                    <p className="text-xs text-gray-500 break-words">
                      {[client.city, client.state, client.zip_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  No client selected
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:gap-5 content-start">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1.5">
                  Issued
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(issueDate, "MMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-1.5">
                  Due
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(dueDate, "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 sm:px-8 pb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-3">
          Items
        </p>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {lineItems.length === 0 ? (
            <p className="text-center text-xs text-gray-400 italic py-6 rounded-xl bg-gray-50/70 ring-1 ring-gray-100">
              No items added
            </p>
          ) : (
            lineItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl ring-1 ring-gray-100 bg-white px-4 py-3 flex justify-between gap-3 hover:ring-gray-200 transition-shadow"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 break-words">
                    {item.description || "—"}
                  </p>
                  <p className="text-xs text-gray-500 tabular-nums mt-1">
                    <span className="font-medium text-gray-700">
                      {Number(item.quantity)}
                    </span>
                    <span className="mx-1.5 text-gray-300">×</span>
                    <span>{formatMoney(sym, item.unit_price)}</span>
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums whitespace-nowrap self-center text-gray-900">
                  {formatMoney(sym, item.amount)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="rounded-xl ring-1 ring-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-bold text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-[0.15em] text-gray-500 w-16">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-[10px] uppercase tracking-[0.15em] text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-6 text-center text-xs text-gray-400 italic"
                    >
                      No items added
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, i) => (
                    <tr
                      key={item.id}
                      className={i !== 0 ? "border-t border-gray-100" : ""}
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 break-words font-medium">
                        {item.description || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 tabular-nums whitespace-nowrap">
                        {Number(item.quantity)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600 tabular-nums whitespace-nowrap">
                        {formatMoney(sym, item.unit_price)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                        {formatMoney(sym, item.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Totals — emphasized card */}
      <div className="px-5 sm:px-8 pt-4 pb-2">
        <div className="ml-auto sm:max-w-sm rounded-2xl bg-gray-50/70 ring-1 ring-gray-100 p-4 sm:p-5 space-y-2.5 text-sm">
          <div className="flex justify-between items-baseline gap-3">
            <span className="text-gray-500 shrink-0">Subtotal</span>
            <span className="tabular-nums text-right text-gray-900 font-medium min-w-0 break-all">
              {formatMoney(sym, subtotal)}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-3">
            <span className="text-gray-500 shrink-0">Tax ({taxRate}%)</span>
            <span className="tabular-nums text-right text-gray-900 font-medium min-w-0 break-all">
              {formatMoney(sym, tax)}
            </span>
          </div>
          <div
            className="h-px w-full"
            style={{ backgroundColor: `${templateColor}33` }}
          />
          <div className="flex justify-between items-end gap-3 pt-1">
            <div className="shrink-0">
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.22em]"
                style={{ color: templateColor }}
              >
                Total
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">
                {currency.toUpperCase()}
              </p>
            </div>
            <span
              className="text-2xl sm:text-3xl font-extrabold tabular-nums text-right min-w-0 break-all leading-none tracking-tight"
              style={{ color: templateColor }}
            >
              {formatMoney(sym, total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="px-5 sm:px-8 pt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-2">
            Notes
          </p>
          <div
            className="text-sm text-gray-600 italic whitespace-pre-wrap rounded-r-md border-l-2 pl-3 py-1"
            style={{ borderColor: templateColor }}
          >
            {notes}
          </div>
        </div>
      )}

      {/* Payment Details */}
      {(companyInfo.bank_name ||
        companyInfo.bank_account_number ||
        companyInfo.bank_routing_code) && (
        <div className="px-5 sm:px-8 pt-5">
          <div className="rounded-2xl bg-gray-50/70 ring-1 ring-gray-100 p-4 sm:p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-3">
              Payment Details
            </p>
            <div className="space-y-1.5 text-xs">
              {companyInfo.bank_name && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-20 shrink-0">Bank</span>
                  <span className="font-medium text-gray-900 break-words min-w-0">
                    {companyInfo.bank_name}
                  </span>
                </div>
              )}
              {companyInfo.bank_account_number && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-20 shrink-0">Account</span>
                  <span className="font-mono font-medium text-gray-900 break-all min-w-0">
                    {companyInfo.bank_account_number}
                  </span>
                </div>
              )}
              {companyInfo.bank_routing_code && (
                <div className="flex gap-3">
                  <span className="text-gray-500 w-20 shrink-0">Routing</span>
                  <span className="font-mono font-medium text-gray-900 break-all min-w-0">
                    {companyInfo.bank_routing_code}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 sm:px-8 mt-6 pt-5 pb-6 border-t border-gray-100">
        <p className="text-center text-[11px] text-gray-400 tracking-wide">
          Thank you for your business
          <span
            className="mx-1.5 inline-block h-1 w-1 rounded-full align-middle"
            style={{ backgroundColor: templateColor }}
          />
          {companyInfo.company_name || "CushyInvoice"}
        </p>
      </div>
    </div>
  );
}
