import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { getCurrencySymbol } from './currencies';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Client {
  name: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
}

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes?: string;
  clients: Client;
  invoice_items: InvoiceItem[];
}

interface CompanyData {
  company_name?: string;
  company_logo?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export async function generateInvoicePdf(
  invoice: InvoiceData,
  company: CompanyData
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name or "INVOICE" header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(company.company_name || 'INVOICE', margin, 30);

  // Invoice number on the right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #${invoice.invoice_number}`, pageWidth - margin, 25, { align: 'right' });
  
  // Status badge
  const statusText = invoice.status.toUpperCase();
  doc.setFontSize(10);
  doc.text(statusText, pageWidth - margin, 35, { align: 'right' });

  yPos = 60;

  // Reset text color
  doc.setTextColor(...textColor);

  // Two column layout for From/To
  const colWidth = (pageWidth - margin * 2 - 20) / 2;

  // FROM section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('FROM', margin, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  yPos += 7;
  doc.setFontSize(11);
  doc.text(company.company_name || 'Your Company', margin, yPos);
  if (company.address) {
    yPos += 5;
    doc.setFontSize(9);
    doc.text(company.address, margin, yPos);
  }
  if (company.email) {
    yPos += 5;
    doc.text(company.email, margin, yPos);
  }
  if (company.phone) {
    yPos += 5;
    doc.text(company.phone, margin, yPos);
  }

  // BILL TO section (right column)
  let billToY = 60;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedColor);
  doc.text('BILL TO', margin + colWidth + 20, billToY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  billToY += 7;
  doc.setFontSize(11);
  doc.text(invoice.clients.name, margin + colWidth + 20, billToY);
  billToY += 5;
  doc.setFontSize(9);
  doc.text(invoice.clients.email, margin + colWidth + 20, billToY);
  if (invoice.clients.phone) {
    billToY += 5;
    doc.text(invoice.clients.phone, margin + colWidth + 20, billToY);
  }
  if (invoice.clients.address) {
    billToY += 5;
    doc.text(invoice.clients.address, margin + colWidth + 20, billToY);
    if (invoice.clients.city) {
      billToY += 5;
      const cityLine = `${invoice.clients.city}${invoice.clients.state ? ', ' + invoice.clients.state : ''} ${invoice.clients.zip_code || ''}`;
      doc.text(cityLine.trim(), margin + colWidth + 20, billToY);
    }
  }

  yPos = Math.max(yPos, billToY) + 15;

  // Invoice details box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, 'F');
  
  const detailsY = yPos + 10;
  const detailSpacing = (pageWidth - margin * 2) / 3;
  
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('ISSUE DATE', margin + 10, detailsY);
  doc.text('DUE DATE', margin + detailSpacing + 10, detailsY);
  doc.text('AMOUNT DUE', margin + detailSpacing * 2 + 10, detailsY);
  
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(invoice.issue_date), 'MMM dd, yyyy'), margin + 10, detailsY + 8);
  doc.text(format(new Date(invoice.due_date), 'MMM dd, yyyy'), margin + detailSpacing + 10, detailsY + 8);
  doc.text(`${getCurrencySymbol(invoice.currency)}${Number(invoice.total).toFixed(2)}`, margin + detailSpacing * 2 + 10, detailsY + 8);

  yPos += 35;

  // Items table
  const tableData = invoice.invoice_items.map(item => [
    item.description,
    item.quantity.toString(),
    `${getCurrencySymbol(invoice.currency)}${Number(item.unit_price).toFixed(2)}`,
    `${getCurrencySymbol(invoice.currency)}${Number(item.amount).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  // Get final Y position after table
  const finalY = doc.lastAutoTable.finalY + 10;

  // Summary section (right aligned)
  const summaryX = pageWidth - margin - 80;
  let summaryY = finalY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal:', summaryX, summaryY);
  doc.setTextColor(...textColor);
  doc.text(`${getCurrencySymbol(invoice.currency)}${Number(invoice.subtotal).toFixed(2)}`, pageWidth - margin, summaryY, { align: 'right' });

  summaryY += 8;
  doc.setTextColor(...mutedColor);
  doc.text(`Tax (${Number(invoice.tax_rate)}%):`, summaryX, summaryY);
  doc.setTextColor(...textColor);
  doc.text(`${getCurrencySymbol(invoice.currency)}${Number(invoice.tax_amount).toFixed(2)}`, pageWidth - margin, summaryY, { align: 'right' });

  summaryY += 10;
  doc.setDrawColor(...primaryColor);
  doc.line(summaryX - 10, summaryY - 3, pageWidth - margin, summaryY - 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Total:', summaryX, summaryY + 5);
  doc.text(`${getCurrencySymbol(invoice.currency)}${Number(invoice.total).toFixed(2)}`, pageWidth - margin, summaryY + 5, { align: 'right' });

  // Notes section
  if (invoice.notes) {
    summaryY += 25;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedColor);
    doc.text('NOTES', margin, summaryY);
    
    summaryY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, summaryY);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

  return doc.output('blob');
}

export function downloadPdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
