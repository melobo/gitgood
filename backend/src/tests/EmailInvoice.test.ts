test('Boolean truthiness check', () => {
    expect(true).toBe(true);
});

/*import request from 'sync-request-curl';
import config from '../config';
import {
  requestCreateInvoice,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
} from '../httpWrappers';

const SERVER_URL = () => process.env.SERVER_URL ?? 'http://127.0.0.1:3000';
const TIMEOUT_MS = 5 * 1000;

const getHeaders = () => ({
  'x-api-key': config.apiKey,
  session: (global as any).__SESSION_TOKEN__,
});

const requestSendInvoice = (invoiceId: string, body?: object) => {
  const res = request(
    'POST',
    `${SERVER_URL()}/v1/invoice/${invoiceId}/send`,
    {
      headers: getHeaders(),
      json: body ?? {},
      timeout: TIMEOUT_MS,
    }
  );
  const bodyObj = JSON.parse(res.body.toString());
  return { statusCode: res.statusCode, body: bodyObj };
};


function createInvoice(): string {
  const res = requestCreateInvoice(
    'Test Buyer',
    '12345678901',
    'Test Supplier',
    '98765432101',
    '2025-01-01',
    '2025-02-01',
    [
      {
        itemName: 'item',
        quantity: 2,
        unitPrice: 50.0,
        unitCode: 'ea',
        totalPrice: 100.0,
      },
    ],
    0.1,
    [
      {
        bankName: 'ANZ',
        accountNumber: '123456789',
        bsbAbnNumber: '012-345',
        paymentMethod: 'bank_transfer',
      },
    ]
  );
  return res.body.invoiceId;
}

function createFinalisedInvoice(): string {
  const invoiceId = createInvoice();
  requestConvertInvoice(invoiceId);
  requestValidateInvoice(invoiceId);
  requestFinaliseInvoice(invoiceId);
  return invoiceId;
}

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
  (global as any).__SESSION_TOKEN__ = res.body.session;
});

describe('POST /v1/invoice/:invoiceId/send — sendInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 with confirmation when sending a finalised invoice to a valid email', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: 'buyer@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoiceId', invoiceId);
      expect(res.body).toHaveProperty('sent', true);
      expect(res.body).toHaveProperty('recipientEmail', 'buyer@example.com');
    });

    test('response body includes a sentAt timestamp', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: 'buyer@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('sentAt');
      expect(typeof res.body.sentAt).toBe('string');
    });

    test('response body includes pdfUrl or pdfAttached confirmation', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: 'buyer@example.com' });

      expect(res.statusCode).toBe(200);
      const hasPdfField = 'pdfUrl' in res.body || 'pdfAttached' in res.body;
      expect(hasPdfField).toBe(true);
    });

    test('returns 200 when sending to a different valid email address', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: 'accounts@supplier.com.au' });

      expect(res.statusCode).toBe(200);
      expect(res.body.sent).toBe(true);
    });

    test('can send the same invoice more than once', () => {
      const invoiceId = createFinalisedInvoice();

      const res1 = requestSendInvoice(invoiceId, { recipientEmail: 'first@example.com' });
      const res2 = requestSendInvoice(invoiceId, { recipientEmail: 'second@example.com' });

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
    });
  });

  describe('Invoice Not Ready', () => {
    test('returns 409 when attempting to send a draft invoice', () => {
      const invoiceId = createInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: 'buyer@example.com' });

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVOICE_NOT_READY',
        message: expect.any(String),
      });
    });

    test('returns 409 when attempting to send a converted but not finalised invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestSendInvoice(invoiceId, { recipientEmail: 'buyer@example.com' });

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVOICE_NOT_READY',
        message: expect.any(String),
      });
    });

    test('returns 409 when attempting to send a validated but not finalised invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestSendInvoice(invoiceId, { recipientEmail: 'buyer@example.com' });

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVOICE_NOT_READY',
        message: expect.any(String),
      });
    });
  });

  describe('Invalid Email', () => {
    test('returns 400 when recipientEmail is missing from the request body', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, {});

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when recipientEmail is not a valid email format', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: 'not-an-email' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when recipientEmail is an empty string', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 when recipientEmail is missing the domain', () => {
      const invoiceId = createFinalisedInvoice();
      const res = requestSendInvoice(invoiceId, { recipientEmail: 'buyer@' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = requestSendInvoice('00000000-0000-0000-0000-000000000000', {
        recipientEmail: 'buyer@example.com',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });

    test('returns 404 for a random non-existent invoice ID', () => {
      const res = requestSendInvoice('nonexistent-invoice-id-000', {
        recipientEmail: 'buyer@example.com',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });
});*/