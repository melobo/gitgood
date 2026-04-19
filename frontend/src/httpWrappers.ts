import { InvoiceStatus } from "./types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export async function requestUserRegister(email: string, password: string, name: string): Promise<string> {
  const res = await fetch(`${SERVER_URL}/v1/admin/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Registration failed.');
  }
  const data = await res.json();
  return data.session;
}

export async function requestUserLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${SERVER_URL}/v1/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Invalid credentials.');
  }
  const data = await res.json();
  return data.session;
}

export async function requestListInvoice(fromDate?: string, toDate?: string, page?: number, limitPerPage?: number,
  filter?: string, status?: InvoiceStatus, buyerName?: string, supplierName?: string, minAmount?: number, maxAmount?: number): Promise<void> {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (page !== undefined) params.append('page', String(page));
  if (limitPerPage !== undefined) params.append('limitPerPage', String(limitPerPage));
  if (filter) params.append('filter', filter);
  if (status) params.append('status', status);
  if (buyerName) params.append('buyerName', buyerName);
  if (supplierName) params.append('supplierName', supplierName);
  if (minAmount !== undefined) params.append('minAmount', String(minAmount));
  if (maxAmount !== undefined) params.append('maxAmount', String(maxAmount));

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${SERVER_URL}/v2/invoice${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Failed to fetch invoices.');
  }
  return await res.json();
}