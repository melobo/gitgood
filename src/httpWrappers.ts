import request from 'sync-request-curl';
import config from './config';
import { InvoiceItem, PaymentDetails } from './invoiceInterface';

const SERVER_URL = () => process.env.SERVER_URL ?? 'http://localhost:3000';
const headers = {
  'x-api-key': config.apiKey, // always from config
};
const TIMEOUT_MS = 5 * 1000;

export const requestClear = () => {
  const res = request('DELETE', `${SERVER_URL()}/debug/clear`, { headers });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
};

export const requestHealth = () => {
  const res = request('GET', `${SERVER_URL()}/v1/health`, { headers, timeout: TIMEOUT_MS });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestCreateInvoice = (
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
) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice`, {
    headers,
    json: {
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
    },
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestListInvoice = (
  fromDate?: string,
  toDate?: string,
  page?: number,
  limitPerPage?: number
) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (page !== undefined) params.append('page', String(page));
  if (limitPerPage !== undefined) params.append('limitPerPage', String(limitPerPage));
  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = request('GET', `${SERVER_URL()}/v1/invoice${qs}`, { headers,timeout: TIMEOUT_MS });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestGetInvoice = (invoiceId: string) => {
  const res = request('GET', `${SERVER_URL()}/v1/invoice/${invoiceId}`, { headers, timeout: TIMEOUT_MS });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUpdateInvoice = (invoiceId: string, updates: object) => {
  const res = request('PUT', `${SERVER_URL()}/v1/invoice/${invoiceId}`, {
    headers,
    json: updates,
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestDeleteInvoice = (invoiceId: string) => {
  const res = request('DELETE', `${SERVER_URL()}/v1/invoice/${invoiceId}`, { headers, timeout: TIMEOUT_MS});
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestConvertInvoice = (invoiceId: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/convert`, { headers, timeout: TIMEOUT_MS });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestValidateInvoice = (invoiceId: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/validate`, { headers, timeout: TIMEOUT_MS});
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestFinaliseInvoice = (invoiceId: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/final`, { headers, timeout: TIMEOUT_MS });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestDownloadInvoice = (invoiceId: string, format: string) => {
  const res = request('GET', `${SERVER_URL()}/v1/invoice/${invoiceId}/download?format=${format}`, { headers, timeout: TIMEOUT_MS, });
  const raw = res.body.toString();
  try {
    const bodyObj = JSON.parse(raw);
    return { statusCode: res.statusCode, body: bodyObj };
  } catch {
    return { statusCode: res.statusCode, body: raw };
  }
};
