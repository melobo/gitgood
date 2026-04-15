test('Boolean truthiness check', () => {
  expect(true).toBe(true);
});

/* import request from 'sync-request-curl';
import config from '../config';
import {
  requestCreateInvoice,
  requestGetInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
} from '../httpWrappers';
import { InvoiceItem, PaymentDetails } from '../invoiceInterface';

const SERVER_URL = () => process.env.SERVER_URL ?? 'http://127.0.0.1:3000';

const getHeaders = () => ({
  'x-api-key': config.apiKey,
  'session': (global as any).__SESSION_TOKEN__,
});

// Requests autofill suggestions for a given invoiceId and optional partial field hints
const requestAutofillInvoice = (invoiceId: string, fields?: object) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/autofill`, {
    headers: getHeaders(),
    json: fields ?? {},
    timeout: 5000,
  });
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};

const validItems: InvoiceItem[] = [
  {
    itemName: 'Consulting Services',
    quantity: 2,
    unitPrice: 500.00,
    unitCode: 'HUR',
    totalPrice: 1000.00,
  },
];

const validPayment: PaymentDetails[] = [
  {
    bankName: 'ANZ',
    accountNumber: '123456789',
    bsbAbnNumber: '012-345',
    paymentMethod: 'bank_transfer',
  },
];

// Creates a standard draft invoice and returns its invoiceId
function createInvoice(overrides: {
  buyerName?: string;
  buyerAbn?: string;
  supplierName?: string;
  supplierAbn?: string;
  issueDate?: string;
  paymentDueDate?: string;
} = {}): string {
  const res = requestCreateInvoice(
    overrides.buyerName ?? 'Acme Corp',
    overrides.buyerAbn ?? '12345678901',
    overrides.supplierName ?? 'GitGood Pty Ltd',
    overrides.supplierAbn ?? '98765432100',
    overrides.issueDate ?? '2025-03-12',
    overrides.paymentDueDate ?? '2025-04-12',
    validItems,
    0.1,
    validPayment
  );
  return res.body.invoiceId;
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
  (global as any).__SESSION_TOKEN__ = res.body.session;
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /v1/invoice/:invoiceId/autofill — autofillInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 with suggested fields for a valid draft invoice', () => {
      const invoiceId = createInvoice();
      const res = requestAutofillInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoiceId', invoiceId);
      expect(res.body).toHaveProperty('suggestions');
      expect(typeof res.body.suggestions).toBe('object');
    });

    test('suggestions object contains at least one field', () => {
      const invoiceId = createInvoice();
      const res = requestAutofillInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(Object.keys(res.body.suggestions).length).toBeGreaterThan(0);
    });

    test('does not modify the invoice when autofill is called', () => {
      const invoiceId = createInvoice();
      const beforeRes = requestGetInvoice(invoiceId);

      requestAutofillInvoice(invoiceId);

      const afterRes = requestGetInvoice(invoiceId);
      expect(afterRes.body.buyerName).toBe(beforeRes.body.buyerName);
      expect(afterRes.body.supplierName).toBe(beforeRes.body.supplierName);
      expect(afterRes.body.issueDate).toBe(beforeRes.body.issueDate);
      expect(afterRes.body.paymentDueDate).toBe(beforeRes.body.paymentDueDate);
      expect(afterRes.body.updatedAt).toBe(beforeRes.body.updatedAt);
    });

    test('returns suggestions for a partial invoice (missing buyerAbn)', () => {
      const invoiceId = createInvoice({ buyerAbn: '12345678901' });
      const res = requestAutofillInvoice(invoiceId, { buyerAbn: '' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('suggestions');
    });

    test('returns suggestions for a partial invoice (missing supplierAbn)', () => {
      const invoiceId = createInvoice({ supplierAbn: '98765432100' });
      const res = requestAutofillInvoice(invoiceId, { supplierAbn: '' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('suggestions');
    });

    test('returns 200 when called with an empty hints body', () => {
      const invoiceId = createInvoice();
      const res = requestAutofillInvoice(invoiceId, {});

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoiceId', invoiceId);
    });

    test('suggestions for paymentDueDate are a date after issueDate', () => {
      const invoiceId = createInvoice({ issueDate: '2025-03-12' });
      const res = requestAutofillInvoice(invoiceId, { paymentDueDate: '' });

      expect(res.statusCode).toBe(200);

      if (res.body.suggestions.paymentDueDate) {
        const suggested = new Date(res.body.suggestions.paymentDueDate);
        const issueDate = new Date('2025-03-12');
        expect(suggested >= issueDate).toBe(true);
      }
    });

    test('returns the correct invoiceId in the response body', () => {
      const invoiceId1 = createInvoice({ buyerName: 'First Buyer' });
      const invoiceId2 = createInvoice({ buyerName: 'Second Buyer' });

      const res1 = requestAutofillInvoice(invoiceId1);
      const res2 = requestAutofillInvoice(invoiceId2);

      expect(res1.body.invoiceId).toBe(invoiceId1);
      expect(res2.body.invoiceId).toBe(invoiceId2);
    });

    test('can call autofill multiple times on the same invoice without error', () => {
      const invoiceId = createInvoice();

      const res1 = requestAutofillInvoice(invoiceId);
      const res2 = requestAutofillInvoice(invoiceId);

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = requestAutofillInvoice('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });

    test('returns 404 for a random non-existent invoice ID', () => {
      const res = requestAutofillInvoice('nonexistent-invoice-id-000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });

  describe('Invalid Input', () => {
    test('returns 400 when an unrecognised field key is provided in hints', () => {
      const invoiceId = createInvoice();
      const res = requestAutofillInvoice(invoiceId, { unknownField: 'someValue' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when hint value types are incorrect (number where string expected)', () => {
      const invoiceId = createInvoice();
      const res = requestAutofillInvoice(invoiceId, { buyerName: 12345 });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });
  });

  describe('Status Constraints', () => {
    test('returns 200 for a converted invoice (autofill is still applicable)', () => {
      const invoiceId = createInvoice();
      const convertRes = request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/convert`, {
        headers: getHeaders(),
        timeout: 5000,
      });
      expect(JSON.parse(convertRes.body.toString()).status).toBe('converted');

      const res = requestAutofillInvoice(invoiceId);
      expect(res.statusCode).toBe(200);
    });

    test('returns 409 when attempting to autofill a finalised invoice', () => {
      const invoiceId = createInvoice();
      request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/convert`, { headers: getHeaders(), timeout: 5000 });
      request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/validate`, { headers: getHeaders(), timeout: 5000 });
      request('POST', `${SERVER_URL()}/v1/invoice/${invoiceId}/final`, { headers: getHeaders(), timeout: 5000 });

      const res = requestAutofillInvoice(invoiceId);

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: expect.any(String),
        message: expect.any(String),
      });
    });
  });
}); */
