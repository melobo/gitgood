import { Invoice, InvoiceItem, InvoiceStatus, PaymentDetails } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function requestUserRegister(email: string, password: string, name: string): Promise<string> {
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

export async function requestListInvoice(filters: {
  fromDate?: string, toDate?: string, page?: number, limitPerPage?: number,
  filter?: string, status?: InvoiceStatus, buyerName?: string, supplierName?: string, minAmount?: number, maxAmount?: number } = {}
): Promise<Invoice[]> {
  const params = new URLSearchParams();
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);
  if (filters.page !== undefined) params.append('page', String(filters.page));
  if (filters.limitPerPage !== undefined) params.append('limitPerPage', String(filters.limitPerPage));
  if (filters.filter) params.append('filter', filters.filter);
  if (filters.status) params.append('status', filters.status);
  if (filters.buyerName) params.append('buyerName', filters.buyerName);
  if (filters.supplierName) params.append('supplierName', filters.supplierName);
  if (filters.minAmount !== undefined) params.append('minAmount', String(filters.minAmount));
  if (filters.maxAmount !== undefined) params.append('maxAmount', String(filters.maxAmount));

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
  return data.invoices;
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

export async function requestCreateInvoice(
  buyerName: string,
  buyerAbn: string,
  supplierName: string,
  supplierAbn: string,
  issueDate: string,
  paymentDueDate: string,
  itemsList: InvoiceItem[],
  taxRate: number,
  paymentDetails: PaymentDetails[],
  additionalNotes?: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/v2/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY,
      'session': localStorage.getItem('session') ?? '',
    },
    body: JSON.stringify({
      buyerName,
      buyerAbn,
      supplierName,
      supplierAbn,
      issueDate,
      paymentDueDate,
      itemsList,
      taxRate,
      paymentDetails,
      ...(additionalNotes && { additionalNotes }),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? 'Failed to create invoice.');
  }
  return data.invoiceId;
}

export async function requestBulkCreateInvoice(
  invoices: object[]
): Promise<{ invoices: Invoice[] }> {
  const res = await fetch(`${BASE_URL}/v2/invoice/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY,
      'session': localStorage.getItem('session') ?? '',
    },
    body: JSON.stringify({ invoices }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? 'Bulk upload failed.');
  }
  return data;
}

export async function requestAiAutofill(body: object): Promise<{
  invoice: {
    buyerName?: string;
    buyerAbn?: string;
    supplierName?: string;
    supplierAbn?: string;
    issueDate?: string;
    paymentDueDate?: string;
    itemsList?: Array<{
      itemName: string;
      quantity: number;
      unitPrice: number;
      unitCode: string;
      totalPrice: number;
    }>;
    taxRate?: number;
    paymentDetails?: Array<{
      bankName: string;
      accountNumber: string;
      bsbAbnNumber: string;
      paymentMethod: string;
    }>;
    additionalNotes?: string;
  };
  missingFields: string[];
  confidence: 'high' | 'medium' | 'low';
}> {
  const res = await fetch(`${BASE_URL}/v1/invoice/autofill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_API_KEY,
      'session': localStorage.getItem('session') ?? '',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? 'Autofill failed.');
  return data;
};
