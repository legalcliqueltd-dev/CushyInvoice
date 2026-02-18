

# Fix WhatsApp PDF Attachment and Truncated Text on Invoice Page

## Issue 1: WhatsApp Not Attaching PDF

**Root cause:** The current WhatsApp sharing uses `wa.me/?text=...` which only supports text messages -- it cannot attach files. The PDF is downloaded separately to the device, but users have to manually attach it.

**Fix:** Use the Web Share API (`navigator.share`) with the PDF file when available (works on mobile devices). This opens the native share sheet where the user can pick WhatsApp and the PDF will be attached automatically. Fall back to the current `wa.me` text-only approach only on desktop browsers that don't support file sharing.

### Changes in `src/components/ShareInvoiceDialog.tsx`:
- Update `handleShareWhatsApp` to try `navigator.share({ files: [pdfFile], text: ... })` first
- If `navigator.share` with files is supported, share directly with PDF attached
- Fall back to current `wa.me` URL + separate PDF download only when native sharing is unavailable

## Issue 2: Text Truncated on Invoice Detail Page

**Root cause:** On mobile screens, the Items table columns and the Details sidebar have fixed/narrow widths causing text like amounts ("₦400000.00"), invoice number ("INV-00001"), and dates ("Feb 18, 2026") to be cut off.

**Fix:** Adjust responsive styles so content doesn't overflow on small screens.

### Changes in `src/pages/InvoiceDetail.tsx`:
- Remove `truncate` from amount values in summary cards so full currency amounts show
- Remove `max-w-[120px]` constraint on the description table cell
- Use `text-[11px]` or smaller font for table cells on mobile to fit more content
- In the Details sidebar card, allow text to wrap instead of truncating invoice numbers and dates
- Ensure the Items table scrolls horizontally gracefully with proper minimum widths

### Specific fixes:
- Summary cards: remove `truncate` from currency amounts, use smaller text if needed
- Items table: reduce cell padding, use smaller font sizes for mobile
- Details sidebar: remove `truncate` and `whitespace-nowrap` from values that get cut off, allow wrapping
- Add `overflow-x-auto` wrapper around the items table (already present, but ensure inner content has proper min-widths)

