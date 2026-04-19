import request from 'sync-request-curl';
import config from './config';
import { InvoiceItem, PaymentDetails } from './invoiceInterface';

const SERVER_URL = () => process.env.SERVER_URL ?? 'http://127.0.0.1:3000';
const TIMEOUT_MS = 5 * 1000;

let sessionToken: string | undefined;

export function setSessionToken(token: string) {
  sessionToken = token;
}

export function clearSessionToken() {
  sessionToken = undefined;
}

export const getHeaders = () => ({
  'x-api-key': config.apiKey,
  ...(sessionToken && { session: sessionToken }),
});

export const requestClear = () => {
  const res = request('DELETE', `${SERVER_URL()}/debug/clear`, { headers: getHeaders() });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString())
  };
};

export const requestHealth = () => {
  const res = request('GET', `${SERVER_URL()}/v1/health`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
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
    headers: getHeaders(),
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

export const requestListInvoice = (filters: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limitPerPage?: number;
} = {}) => {
  const { fromDate, toDate, page, limitPerPage } = filters;

  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (page !== undefined) params.append('page', String(page));
  if (limitPerPage !== undefined) params.append('limitPerPage', String(limitPerPage));

  const qs = params.toString() ? `?${params.toString()}` : '';

  const res = request('GET', `${SERVER_URL()}/v1/invoice${qs}`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestListInvoiceV2 = (filters: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limitPerPage?: number;
  filter?: string;
  status?: string;
  buyerName?: string;
  supplierName?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
} = {}) => {
  const { fromDate, toDate, page, limitPerPage, filter, status, buyerName, supplierName, minAmount, maxAmount } = filters;

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

  const res = request('GET', `${SERVER_URL()}/v2/invoice${qs}`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestGetInvoiceHistory = (invoiceId: string) => {
  const res = request('GET', `${SERVER_URL()}/v1/invoice/${invoiceId}/history`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestGetInvoice = (invoiceId: string) => {
  const res = request('GET', `${SERVER_URL()}/v1/invoice/${invoiceId}`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUpdateInvoice = (invoiceId: string, updates: object) => {
  const res = request('PUT', `${SERVER_URL()}/v1/invoice/${invoiceId}`, {
    headers: getHeaders(),
    json: updates,
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestDeleteInvoice = (invoiceId: string) => {
  const res = request('DELETE', `${SERVER_URL()}/v1/invoice/${invoiceId}`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestConvertInvoice = (invoiceId: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/convert`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestValidateInvoice = (invoiceId: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/validate`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestFinaliseInvoice = (invoiceId: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/final`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestDownloadInvoice = (invoiceId: string, format: string) => {
  const res = request('GET', `${SERVER_URL()}/v1/invoice/${invoiceId}/download?format=${format}`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const raw = res.body.toString();
  try {
    const bodyObj = JSON.parse(raw);
    return { statusCode: res.statusCode, body: bodyObj };
  } catch {
    return { statusCode: res.statusCode, body: raw };
  }
};

export const requestGetInvoiceSummary = (invoiceId: string) => {
  const res = request('GET', `${SERVER_URL()}/v1/invoice/${invoiceId}/summary`, {
    headers: getHeaders(),
    timeout: TIMEOUT_MS
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUserRegister = (email: string, password: string, name: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/admin/auth/register`, {
    headers: getHeaders(),
    json: { email, password, name },
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUserLogin = (email: string, password: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/admin/auth/login`, {
    headers: getHeaders(),
    json: { email, password },
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUserDetails = (token: string) => {
  const res = request('GET', `${SERVER_URL()}/v1/admin/user/details`, {
    headers: { ...getHeaders(), session: token },
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUserDetailsUpdate = (token: string, email?: string, name?: string) => {
  const res = request('PUT', `${SERVER_URL()}/v1/admin/user/details`, {
    headers: { ...getHeaders(), session: token },
    json: { email, name },
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUserPasswordUpdate = (token: string, oldPassword: string, newPassword: string) => {
  const res = request('PUT', `${SERVER_URL()}/v1/admin/user/password`, {
    headers: { ...getHeaders(), session: token },
    json: { oldPassword, newPassword },
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

export const requestUserLogout = (token: string) => {
  const res = request('POST', `${SERVER_URL()}/v1/admin/auth/logout`, {
    headers: { ...getHeaders(), session: token },
    timeout: TIMEOUT_MS,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};
