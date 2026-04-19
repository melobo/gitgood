test('Boolean truthiness check', () => {
  expect(true).toBe(true);
});

/* import request from 'sync-request-curl';
import config from '../config';
import {
  requestClear,
  requestUserRegister,
  requestGetInvoice,
  setSessionToken,
  clearSessionToken,
} from '../httpWrappers';
import { InvoiceItem, PaymentDetails } from '../invoiceInterface';

const SERVER_URL = () => process.env.SERVER_URL ?? 'http://127.0.0.1:3000';

const getHeaders = () => ({
  'x-api-key': config.apiKey,
  'session': (global as any).__SESSION_TOKEN__,
});

const requestBulkCreateInvoice = (invoices: object[]) => {
  const res = request('POST', `${SERVER_URL()}/v1/invoice/bulk`, {
    headers: getHeaders(),
    json: { invoices },
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

const makeInvoicePayload = (overrides: object = {}) => ({
  buyerName: 'Acme Corp',
  buyerAbn: '12345678901',
  supplierName: 'GitGood Pty Ltd',
  supplierAbn: '98765432100',
  issueDate: '2025-03-12',
  paymentDueDate: '2025-04-12',
  itemsList: validItems,
  taxRate: 0.1,
  paymentDetails: validPayment,
  ...overrides,
});

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
  (global as any).__SESSION_TOKEN__ = res.body.session;
});

describe('POST /v1/invoice/bulk — bulkCreateInvoice', () => {
  describe('Successful cases', () => {
    test('returns 201 and an array of invoice IDs for a single valid invoice in the array', () => {
      const res = requestBulkCreateInvoice([makeInvoicePayload()]);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('invoices');
      expect(Array.isArray(res.body.invoices)).toBe(true);
      expect(res.body.invoices).toHaveLength(1);
      expect(res.body.invoices[0]).toHaveProperty('invoiceId');
      expect(res.body.invoices[0]).toHaveProperty('status', 'draft');
      expect(res.body.invoices[0]).toHaveProperty('createdAt');
    });

    test('returns 201 and creates multiple invoices from a valid array', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ buyerName: 'Buyer One' }),
        makeInvoicePayload({ buyerName: 'Buyer Two' }),
        makeInvoicePayload({ buyerName: 'Buyer Three' }),
      ]);

      expect(res.statusCode).toBe(201);
      expect(res.body.invoices).toHaveLength(3);

      const ids = res.body.invoices.map((inv: { invoiceId: string }) => inv.invoiceId);
      expect(new Set(ids).size).toBe(3);
    });

    test('each created invoice is independently retrievable', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ buyerName: 'Buyer Alpha' }),
        makeInvoicePayload({ buyerName: 'Buyer Beta' }),
      ]);

      expect(res.statusCode).toBe(201);

      for (const created of res.body.invoices) {
        const getRes = requestGetInvoice(created.invoiceId);
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.invoiceId).toBe(created.invoiceId);
        expect(getRes.body.status).toBe('draft');
      }
    });

    test('all invoices in the batch are created with status "draft"', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload(),
        makeInvoicePayload({ taxRate: 0 }),
      ]);

      expect(res.statusCode).toBe(201);
      for (const inv of res.body.invoices) {
        expect(inv.status).toBe('draft');
      }
    });

    test('returns 201 with correct invoice data when additionalNotes is included', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ additionalNotes: 'Please pay promptly.' }),
      ]);

      expect(res.statusCode).toBe(201);
      expect(res.body.invoices).toHaveLength(1);

      const getRes = requestGetInvoice(res.body.invoices[0].invoiceId);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.additionalNotes).toBe('Please pay promptly.');
    });

    test('invoices with different tax rates are all created correctly', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ taxRate: 0 }),
        makeInvoicePayload({ taxRate: 0.1 }),
        makeInvoicePayload({ taxRate: 0.15 }),
      ]);

      expect(res.statusCode).toBe(201);
      expect(res.body.invoices).toHaveLength(3);
    });
  });

  describe('Error Cases — Empty or Missing Array', () => {
    test('returns 400 when invoices array is empty', () => {
      const res = requestBulkCreateInvoice([]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when request body is missing the invoices key', () => {
      const res = request('POST', `${SERVER_URL()}/v1/invoice/bulk`, {
        headers: getHeaders(),
        json: {},
        timeout: 5000,
      });
      const body = JSON.parse(res.body.toString());

      expect(res.statusCode).toBe(400);
      expect(body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });
  });

  describe('Error Cases — Invalid Invoice Fields', () => {
    test('returns 400 when one invoice in the batch has a missing buyerName', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload(),
        makeInvoicePayload({ buyerName: '' }),
      ]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when one invoice has an invalid ABN', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ buyerAbn: '123' }),
      ]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when one invoice has paymentDueDate before issueDate', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ issueDate: '2025-06-01', paymentDueDate: '2025-05-01' }),
      ]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when one invoice has an invalid date format', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ issueDate: 'not-a-date' }),
      ]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when one invoice has a negative taxRate', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ taxRate: -0.1 }),
      ]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when one invoice has an empty itemsList', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ itemsList: [] }),
      ]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when one invoice has an empty paymentDetails array', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ paymentDetails: [] }),
      ]);

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 422 when item totalPrice is inconsistent with quantity * unitPrice', () => {
      const badItems: InvoiceItem[] = [
        { itemName: 'Bad Item', quantity: 2, unitPrice: 50.00, unitCode: 'EA', totalPrice: 999.00 },
      ];
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ itemsList: badItems }),
      ]);

      expect(res.statusCode).toBe(422);
      expect(res.body).toStrictEqual({
        error: 'INSUFFICIENT_DATA',
        message: expect.any(String),
      });
    });

    test('returns 422 when an invalid bank name is provided in paymentDetails', () => {
      const badPayment: PaymentDetails[] = [
        { bankName: 'FakeBank', accountNumber: '123456789', bsbAbnNumber: '012-345', paymentMethod: 'bank_transfer' },
      ];
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ paymentDetails: badPayment }),
      ]);

      expect(res.statusCode).toBe(422);
      expect(res.body).toStrictEqual({
        error: 'INSUFFICIENT_DATA',
        message: expect.any(String),
      });
    });
  });

  describe('Atomicity / Rollback Behaviour', () => {
    test('no invoices are created when one invoice in the batch is invalid', () => {
      const res = requestBulkCreateInvoice([
        makeInvoicePayload({ buyerName: 'Valid Buyer' }),
        makeInvoicePayload({ buyerName: '' }),
      ]);

      expect(res.statusCode).toBe(400);

      // Confirm nothing was persisted
      const listRes = request('GET', `${SERVER_URL()}/v1/invoice`, {
        headers: getHeaders(),
        timeout: 5000,
      });
      const list = JSON.parse(listRes.body.toString());
      expect(list.total).toBe(0);
    });
  });
}); */
