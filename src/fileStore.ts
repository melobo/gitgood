import fs from 'fs';
import path from 'path';
import { Invoice } from './invoiceInterface';

const DATA_PATH = path.join(__dirname, 'invoices.json');

function init(): void {
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ invoices: {} }, null, 2));
  }
}

function readAll(): Invoice[] {
  if (!fs.existsSync(FILE_PATH)) {
    return [];
  }
  const data = fs.readFileSync(FILE_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeAll(data: { invoices: Record<string, Invoice> }): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getInvoice(invoiceId: string): Invoice | null {
  const db = readAll();
  return db.invoices[invoiceId] || null;
}

function getAllInvoices(): Invoice[] {
  const db = readAll();
  return Object.values(db.invoices);
}

function saveInvoice(invoice: Invoice): void {
  const db = readAll();
  db.invoices[invoice.invoiceId] = invoice;
  writeAll(db);
}

function deleteInvoice(invoiceId: string): boolean {
  const db = readAll();
  if (!db.invoices[invoiceId]) return false;
  delete db.invoices[invoiceId];
  writeAll(db);
  return true;
}

export { init, getInvoice, getAllInvoices, saveInvoice, deleteInvoice, writeAll };
