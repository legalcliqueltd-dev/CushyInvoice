import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { InvoicePreview } from '@/components/InvoicePreview';

interface InvoiceItem {
  id?: string;
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
  template_color?: string;
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

// A4 width in CSS pixels at 96dpi (210mm). The InvoicePreview card is capped at
// max-w-[210mm], so rendering in a container this wide fills the page edge-to-edge.
const A4_WIDTH_PX = 794;

// Load a remote image as a base64 data URL so html2canvas never has to make a
// (potentially CORS-blocked) network request while capturing.
async function loadImageAsBase64(url: string): Promise<string | null> {
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
            resolve(canvas.toDataURL('image/png'));
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
      const separator = url.includes('?') ? '&' : '?';
      img.src = `${url}${separator}t=${Date.now()}`;
    } catch (e) {
      console.error('Image loading error:', e);
      resolve(null);
    }
  });
}

function waitForImages(el: HTMLElement): Promise<void[]> {
  const imgs = Array.from(el.querySelectorAll('img'));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

const nextFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

/**
 * Generate the invoice PDF by rendering the exact same <InvoicePreview>
 * component the user sees on screen, then capturing it to an image and
 * placing it into an A4 PDF. This guarantees the downloaded/shared/emailed
 * invoice is visually identical to the in-app preview.
 */
export async function generateInvoicePdf(
  invoice: InvoiceData,
  company: CompanyData
): Promise<Blob> {
  // Pre-load the logo as base64 so the capture doesn't depend on the network.
  let logoData: string | null = null;
  if (company.company_logo) {
    logoData = await loadImageAsBase64(company.company_logo);
  }

  // Off-screen host for the preview. Fixed + far off-canvas so it never flashes
  // on screen but still has real layout/computed styles for html2canvas.
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = `${A4_WIDTH_PX}px`;
  container.style.background = '#ffffff';
  container.style.zIndex = '-1';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    flushSync(() => {
      root.render(
        <InvoicePreview
          companyInfo={{
            company_name: company.company_name || '',
            company_logo: logoData,
            email: company.email || '',
            phone: company.phone || '',
            address: company.address || '',
            bank_name: company.bank_name,
            bank_account_number: company.bank_account_number,
            bank_routing_code: company.bank_routing_code,
          }}
          client={{
            name: invoice.clients.name,
            email: invoice.clients.email,
            phone: invoice.clients.phone,
            address: invoice.clients.address,
            city: invoice.clients.city,
            state: invoice.clients.state,
            zip_code: invoice.clients.zip_code,
          }}
          invoiceNumber={invoice.invoice_number}
          issueDate={new Date(invoice.issue_date)}
          dueDate={new Date(invoice.due_date)}
          lineItems={invoice.invoice_items.map((item, i) => ({
            id: item.id || String(i),
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          }))}
          taxRate={Number(invoice.tax_rate)}
          currency={invoice.currency}
          notes={invoice.notes || ''}
          logoBgColor={invoice.logo_bg_color || '#ffffff'}
          status={invoice.status}
          templateColor={invoice.template_color || '#4f46e5'}
        />
      );
    });

    const card = container.firstElementChild as HTMLElement;
    await waitForImages(container);
    await nextFrame();

    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: A4_WIDTH_PX,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      // Content taller than one page: paint the same tall image on successive
      // pages, shifting it up by one page height each time (standard slice trick).
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0.5) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    return pdf.output('blob');
  } finally {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
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

    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
    });

    return true;
  } catch (e) {
    console.error('savePdfToDevice error:', e);
    return false;
  }
}
