import { InvoiceStatus } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function requestUserRegister(email: string, password: string, name: string): Promise<string> {
  console.log(import.meta.env.VITE_API_BASE_URL)
  const res = await fetch(`${BASE_URL}/v1/admin/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY
    },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? 'Registration failed.');
  }
  return data.session;
}

export async function requestUserLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? 'Invalid credentials.');
  }
  return data.session;
}

export async function requestListInvoice(fromDate?: string, toDate?: string, page?: number, limitPerPage?: number,
  filter?: string, status?: InvoiceStatus, buyerName?: string, supplierName?: string, minAmount?: number, maxAmount?: number) {
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
  const res = await fetch(`${BASE_URL}/v2/invoice${qs}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'session': localStorage.getItem('session') ?? '',
      'x-api-key': import.meta.env.VITE_API_KEY
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? 'Failed to fetch invoices.');
  }
  return data;
}

export async function requestDashboardStats() {
  const res = await fetch(`${BASE_URL}/v1/invoices/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'session': localStorage.getItem('session') ?? '',
      'x-api-key': import.meta.env.VITE_API_KEY
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? 'Stats retrieval failed.');
  }
  return data;
};

export async function requestDeleteInvoice(invoiceId: string) {
  const res = await fetch(`${BASE_URL}/v1/invoice/${invoiceId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'session': localStorage.getItem('session') ?? '',
      'x-api-key': import.meta.env.VITE_API_KEY
     },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? 'Stats retrieval failed.');
  }
  return data;
};