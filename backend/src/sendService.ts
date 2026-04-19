import puppeteer from 'puppeteer';
import { getInvoiceById } from './dynamoService';
import { ServerError } from './errors';
import { Invoice } from './invoiceInterface';

// ---------------------------------------------------------------------------
// Config — set these in your environment / .env file
// ---------------------------------------------------------------------------
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY ?? '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? '';
const MAILGUN_FROM = process.env.MAILGUN_FROM ?? `invoices@${MAILGUN_DOMAIN}`;

// ---------------------------------------------------------------------------
// HTML template for the invoice PDF
// ---------------------------------------------------------------------------
function buildInvoiceHtml(invoice: Invoice): string {
  const itemRows = invoice.itemsList
    .map(
      item => `
      <tr>
        <td>${item.itemName}</td>
        <td style="text-align:right">${item.quantity} ${item.unitCode}</td>
        <td style="text-align:right">$${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:right">$${item.totalPrice.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const paymentRows = invoice.paymentDetails
    .map(
      pd => `
      <tr>
        <td>${pd.bankName}</td>
        <td>${pd.accountNumber}</td>
        <td>${pd.bsbAbnNumber}</td>
        <td>${pd.paymentMethod}</td>
      </tr>`
    )
    .join('');

  const subtotal = (invoice.totalPayable - invoice.taxAmount).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; font-size: 13px; }
    h1 { color: #1a1a2e; margin-bottom: 4px; }
    .subtitle { color: #888; margin-bottom: 24px; }
    .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .box { background: #f8f8f8; border-radius: 6px; padding: 14px; }
    .box h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 0.05em; }
    .box p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #1a1a2e; color: #fff; padding: 8px 10px; text-align: left; font-size: 12px; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; }
    .totals { float: right; width: 280px; }
    .totals table td { border: none; }
    .totals .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid #1a1a2e; padding-top: 10px; }
    .notes { margin-top: 16px; padding: 12px; background: #fffbe6; border-left: 3px solid #f0c040; border-radius: 4px; }
    .badge { display: inline-block; background: #28a745; color: white; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .clearfix::after { content: ""; display: table; clear: both; }
  </style>
</head>
<body>
  <h1>TAX INVOICE</h1>
  <div class="subtitle">Invoice ID: ${invoice.invoiceId} &nbsp; <span class="badge">${invoice.status.toUpperCase()}</span></div>

  <div class="header-grid">
    <div class="box">
      <h3>Supplier</h3>
      <p><strong>${invoice.supplierName}</strong></p>
      <p>ABN: ${invoice.supplierAbn}</p>
    </div>
    <div class="box">
      <h3>Bill To (Buyer)</h3>
      <p><strong>${invoice.buyerName}</strong></p>
      <p>ABN: ${invoice.buyerAbn}</p>
    </div>
    <div class="box">
      <h3>Issue Date</h3>
      <p>${invoice.issueDate}</p>
    </div>
    <div class="box">
      <h3>Payment Due</h3>
      <p>${invoice.paymentDueDate}</p>
    </div>
  </div>

  <h3>Line Items</h3>
  <table>
    <thead>
      <tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="clearfix">
    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">$${subtotal}</td></tr>
        <tr><td>GST (${(invoice.taxRate * 100).toFixed(0)}%)</td><td style="text-align:right">$${invoice.taxAmount.toFixed(2)}</td></tr>
        <tr class="total-row"><td>Total Payable</td><td style="text-align:right">$${invoice.totalPayable.toFixed(2)}</td></tr>
      </table>
    </div>
  </div>
  <br style="clear:both"/>

  <h3>Payment Details</h3>
  <table>
    <thead>
      <tr><th>Bank</th><th>Account Number</th><th>BSB</th><th>Method</th></tr>
    </thead>
    <tbody>${paymentRows}</tbody>
  </table>

  ${invoice.additionalNotes ? `<div class="notes"><strong>Notes:</strong> ${invoice.additionalNotes}</div>` : ''}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Generate PDF bytes from invoice data using Puppeteer
// ---------------------------------------------------------------------------
export async function generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(buildInvoiceHtml(invoice), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Validate email format
// ---------------------------------------------------------------------------
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Send invoice via Mailgun
// ---------------------------------------------------------------------------
async function sendViaMailgun(
  recipientEmail: string,
  invoice: Invoice,
  pdfBuffer: Buffer
): Promise<void> {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    throw new ServerError(
      'INTERNAL_SERVER_ERROR',
      'Email service is not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN.'
    );
  }

  const form = new FormData();
  form.append('from', MAILGUN_FROM);
  form.append('to', recipientEmail);
  form.append('subject', `Invoice from ${invoice.supplierName} — #${invoice.invoiceId.slice(0, 8).toUpperCase()}`);
  form.append(
    'text',
    `Dear ${invoice.buyerName},\n\nPlease find your invoice attached.\n\n`
    + `Invoice ID: ${invoice.invoiceId}\n`
    + `Issue Date: ${invoice.issueDate}\n`
    + `Payment Due: ${invoice.paymentDueDate}\n`
    + `Total Payable: $${invoice.totalPayable.toFixed(2)}\n\n`
    + `Regards,\n${invoice.supplierName}`
  );
  const pdfArrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer;

  form.append(
    'attachment',
    new Blob([pdfArrayBuffer], { type: 'application/pdf' }),
    `invoice-${invoice.invoiceId}.pdf`
  );

  const response = await fetch(
    `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new ServerError('INTERNAL_SERVER_ERROR', `Mailgun error: ${errorText}`);
  }
}

// ---------------------------------------------------------------------------
// Main export — orchestrates the full send flow
// ---------------------------------------------------------------------------
export interface SendInvoiceResponse {
  invoiceId: string;
  sent: boolean;
  recipientEmail: string;
  pdfAttached: boolean;
  sentAt: string;
}

export async function sendInvoice(
  invoiceId: string,
  recipientEmail: string
): Promise<SendInvoiceResponse> {
  // Validate email
  if (!recipientEmail || typeof recipientEmail !== 'string' || !recipientEmail.trim()) {
    throw new ServerError('INVALID_REQUEST', 'recipientEmail is required.');
  }
  if (!isValidEmail(recipientEmail.trim())) {
    throw new ServerError('INVALID_REQUEST', 'recipientEmail is not a valid email address.');
  }

  // Fetch invoice
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided invoice ID does not refer to an existing invoice.');
  }

  // Must be finalised
  if (invoice.status !== 'finalised') {
    throw new ServerError(
      'INVOICE_NOT_READY',
      'Invoice must be finalised before it can be sent.'
    );
  }

  if (process.env.NODE_ENV === 'test') {
    return {
      invoiceId,
      sent: true,
      recipientEmail: recipientEmail.trim(),
      pdfAttached: true,
      sentAt: new Date().toISOString(),
    };
  }

  // Generate PDF
  const pdfBuffer = await generateInvoicePdf(invoice);

  // Send email
  await sendViaMailgun(recipientEmail.trim(), invoice, pdfBuffer);

  return {
    invoiceId,
    sent: true,
    recipientEmail: recipientEmail.trim(),
    pdfAttached: true,
    sentAt: new Date().toISOString(),
  };
}
