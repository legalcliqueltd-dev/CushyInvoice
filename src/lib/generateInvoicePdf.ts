import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { getCurrencySymbol } from './currencies';

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
  logo_bg_color?: string;
  clients: Client;
  invoice_items: InvoiceItem[];
}

interface CompanyData {
  company_name?: string;
  company_logo?: string;
  address?: string;
  email?: string;
  phone?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_code?: string;
}

// Helper function to load image as base64 using fetch (better for Supabase Storage)
async function loadImageAsBase64(url: string): Promise<string | null> {
  // First try fetch method (works better with Supabase Storage CORS)
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (fetchError) {
    console.log('Fetch method failed, trying Image element:', fetchError);
  }
  
  // Fallback to Image element method
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error('Canvas error:', e);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image:', url);
        resolve(null);
      };
      
      // Add timestamp to bypass cache and force fresh CORS request
      const separator = url.includes('?') ? '&' : '?';
      img.src = `${url}${separator}t=${Date.now()}`;
    } catch (e) {
      console.error('Image loading error:', e);
      resolve(null);
    }
  });
}

export async function generateInvoicePdf(
  invoice: InvoiceData,
  company: CompanyData
): Promise<Blob> {
  // Debug: Log company data received
  console.log('PDF Generation - Company data received:', JSON.stringify(company, null, 2));
  
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

  // Add company logo if available
  let logoXOffset = margin;
  if (company.company_logo) {
    try {
      console.log('Loading logo from:', company.company_logo);
      const logoBase64 = await loadImageAsBase64(company.company_logo);
      if (logoBase64) {
        console.log('Logo loaded successfully');
        const imageFormat = logoBase64.includes('image/png') ? 'PNG' : 'JPEG';
        
        // Draw rounded background behind logo
        const bgColor = invoice.logo_bg_color || '#ffffff';
        const r = parseInt(bgColor.slice(1, 3), 16);
        const g = parseInt(bgColor.slice(3, 5), 16);
        const b = parseInt(bgColor.slice(5, 7), 16);
        doc.setFillColor(r, g, b);
        doc.roundedRect(margin, 6, 34, 34, 4, 4, 'F');
        
        doc.addImage(logoBase64, imageFormat, margin + 2, 8, 30, 30);
        logoXOffset = margin + 42;
      } else {
        console.log('Logo failed to load - logoBase64 is null');
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  } else {
    console.log('No company logo URL provided');
  }

  // Company name or "INVOICE" header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const headerText = company.company_name || 'INVOICE';
  console.log('PDF Header text:', headerText);
  doc.text(headerText, logoXOffset, 28);

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

  autoTable(doc, {
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
  const finalY = (doc as any).lastAutoTable.finalY + 10;

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
    summaryY += splitNotes.length * 5 + 5;
  }

  // Bank Details section
  const hasBankDetails = company.bank_name || company.bank_account_number || company.bank_routing_code;
  if (hasBankDetails) {
    summaryY = Math.max(summaryY, (invoice.notes ? summaryY : summaryY + 25));
    if (!invoice.notes) summaryY += 25;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedColor);
    doc.text('PAYMENT DETAILS', margin, summaryY);
    
    summaryY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);

    if (company.bank_name) {
      doc.text(`Bank: ${company.bank_name}`, margin, summaryY);
      summaryY += 5;
    }
    if (company.bank_account_number) {
      doc.text(`Account: ${company.bank_account_number}`, margin, summaryY);
      summaryY += 5;
    }
    if (company.bank_routing_code) {
      doc.text(`Routing/Sort Code: ${company.bank_routing_code}`, margin, summaryY);
      summaryY += 5;
    }
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

export async function savePdfToDevice(blob: Blob, filename: string): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;

    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    // Convert blob to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // strip data:...;base64, prefix
      };
      reader.readAsDataURL(blob);
    });

    const platform = Capacitor.getPlatform();
    const directory = platform === 'ios' ? Directory.Documents : Directory.Documents;

    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory,
    });

    return true;
  } catch (e) {
    console.error('savePdfToDevice error:', e);
    return false;
  }
}
