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

  return (
    <div className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden max-w-[210mm] mx-auto" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <div className="text-white px-8 py-6 flex items-center justify-between" style={{ backgroundColor: templateColor }}>
        <div className="flex items-center gap-4">
          {companyInfo.company_logo && (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ backgroundColor: logoBgColor }}
            >
              <img
                src={companyInfo.company_logo}
                alt="Logo"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
          )}
          <h1 className="text-xl font-bold">
            {companyInfo.company_name || "INVOICE"}
          </h1>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">Invoice #{invoiceNumber}</p>
          <p className="uppercase text-xs mt-1 opacity-80">{status}</p>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* From / To */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
            <p className="font-semibold text-sm">{companyInfo.company_name || "Your Company"}</p>
            {companyInfo.address && <p className="text-xs text-gray-500">{companyInfo.address}</p>}
            {companyInfo.email && <p className="text-xs text-gray-500">{companyInfo.email}</p>}
            {companyInfo.phone && <p className="text-xs text-gray-500">{companyInfo.phone}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
            {client ? (
              <>
                <p className="font-semibold text-sm">{client.name}</p>
                <p className="text-xs text-gray-500">{client.email}</p>
                {client.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
                {client.address && (
                  <>
                    <p className="text-xs text-gray-500">{client.address}</p>
                    {client.city && (
                      <p className="text-xs text-gray-500">
                        {client.city}{client.state && `, ${client.state}`} {client.zip_code}
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">No client selected</p>
            )}
          </div>
        </div>

        {/* Details Bar */}
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Issue Date</p>
            <p className="text-sm font-semibold mt-0.5">{format(issueDate, "MMM dd, yyyy")}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Due Date</p>
            <p className="text-sm font-semibold mt-0.5">{format(dueDate, "MMM dd, yyyy")}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Amount Due</p>
            <p className="text-sm font-semibold mt-0.5 break-all tabular-nums">{formatMoney(sym, total)}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ backgroundColor: templateColor }}>
                <th className="text-left py-2 px-3 font-semibold text-xs rounded-tl-lg">Description</th>
                <th className="text-center py-2 px-3 font-semibold text-xs">Qty</th>
                <th className="text-right py-2 px-3 font-semibold text-xs">Unit Price</th>
                <th className="text-right py-2 px-3 font-semibold text-xs rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={item.id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                  <td className="py-2 px-3 text-xs break-words">{item.description || "—"}</td>
                  <td className="py-2 px-3 text-xs text-center tabular-nums whitespace-nowrap">{Number(item.quantity)}</td>
                  <td className="py-2 px-3 text-xs text-right tabular-nums whitespace-nowrap">{formatMoney(sym, item.unit_price)}</td>
                  <td className="py-2 px-3 text-xs text-right font-medium tabular-nums whitespace-nowrap">{formatMoney(sym, item.amount)}</td>
                </tr>
              ))}
              {lineItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-xs text-gray-400 italic">No items added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 max-w-full space-y-1 text-sm">
            <div className="flex justify-between gap-3 text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums break-all text-right">{formatMoney(sym, subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3 text-gray-500">
              <span>Tax ({taxRate}%)</span>
              <span className="tabular-nums break-all text-right">{formatMoney(sym, tax)}</span>
            </div>
            <div className="my-1" style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: templateColor }} />
            <div className="flex justify-between gap-3 font-bold" style={{ color: templateColor }}>
              <span>Total</span>
              <span className="tabular-nums break-all text-right">{formatMoney(sym, total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {/* Bank Details */}
        {(companyInfo.bank_name || companyInfo.bank_account_number || companyInfo.bank_routing_code) && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Details</p>
            <div className="text-xs text-gray-600 space-y-0.5">
              {companyInfo.bank_name && <p><span className="font-medium">Bank:</span> {companyInfo.bank_name}</p>}
              {companyInfo.bank_account_number && <p><span className="font-medium">Account:</span> {companyInfo.bank_account_number}</p>}
              {companyInfo.bank_routing_code && <p><span className="font-medium">Routing/Sort Code:</span> {companyInfo.bank_routing_code}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-gray-100 text-center">
        <p className="text-[10px] text-gray-400">Thank you for your business!</p>
      </div>
    </div>
  );
}
