import request from 'sync-request-curl';
import { InvoiceItem, PaymentDetails } from './invoiceInterface';

const SERVER_URL = 'https://gitgood.onrender.com';
const TIMEOUT_MS = 5 * 1000;
const API_KEY = process.env.API_KEY ?? '';

export const requestClear = () => {
  const res = request('DELETE', `${SERVER_URL}/debug/clear`, { timeout: TIMEOUT_MS });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestHealth = () => {
  const res = request('GET', `${SERVER_URL}/v1/health`, { timeout: TIMEOUT_MS });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestCreateInvoice = (
  buyer_name: string,
  buyer_abn: string,
  supplier_name: string,
  supplier_abn: string,
  issue_date: Date,
  payment_due_date: Date,
  items_list: InvoiceItem[],
  tax_rate: number,
  payment_details: PaymentDetails[],
  additional_notes?: string
) => {
  const res = request('POST', `${SERVER_URL}/v1/invoice`, {
    headers: { 'x-api-key': API_KEY },
    json: {
      buyer_name,
      buyer_abn,
      supplier_name,
      supplier_abn,
      issue_date,
      payment_due_date,
      items_list,
      tax_rate,
      payment_details,
      ...(additional_notes !== undefined && { additional_notes }),
    },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestListInvoices = (
  from_date?: string,
  to_date?: string,
  page?: number,
  limit_per_page?: number
) => {
  const params = new URLSearchParams();
  if (from_date) params.append('from_date', from_date);
  if (to_date) params.append('to_date', to_date);
  if (page !== undefined) params.append('page', String(page));
  if (limit_per_page !== undefined) params.append('limit_per_page', String(limit_per_page));
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = request('GET', `${SERVER_URL}/v1/invoice${qs}`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestGetInvoice = (invoice_id: string) => {
  const res = request('GET', `${SERVER_URL}/v1/invoice/${invoice_id}`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestUpdateInvoice = (invoice_id: string, updates: object) => {
  const res = request('PUT', `${SERVER_URL}/v1/invoice/${invoice_id}`, {
    headers: { 'x-api-key': API_KEY },
    json: updates,
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestValidateInvoice = (invoice_id: string) => {
  const res = request('POST', `${SERVER_URL}/v1/invoice/${invoice_id}/validate`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestListInvoice = (
  from_date?: string,
  to_date?: string,
  page?: number,
  limit_per_page?: number
) => {
  const params = new URLSearchParams();
  if (from_date) params.append('from_date', from_date);
  if (to_date) params.append('to_date', to_date);
  if (page !== undefined) params.append('page', String(page));
  if (limit_per_page !== undefined) params.append('limit_per_page', String(limit_per_page));
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = request('GET', `${SERVER_URL}/v1/invoice${qs}`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestDeleteInvoice = (invoice_id: string) => {
  const res = request('DELETE', `${SERVER_URL}/v1/invoice/${invoice_id}`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestConvertInvoice = (invoice_id: string) => {
  const res = request('POST', `${SERVER_URL}/v1/invoice/${invoice_id}/convert`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestFinaliseInvoice = (invoice_id: string) => {
  const res = request('POST', `${SERVER_URL}/v1/invoice/${invoice_id}/final`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: JSON.parse(res.body.toString()) };
};

export const requestDownloadInvoice = (invoice_id: string, format: string) => {
  const res = request('GET', `${SERVER_URL}/v1/invoice/${invoice_id}/download?format=${format}`, {
    headers: { 'x-api-key': API_KEY },
    timeout: TIMEOUT_MS,
  });
  return { statusCode: res.statusCode, body: res.body.toString() };
};
