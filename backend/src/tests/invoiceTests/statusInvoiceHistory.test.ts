test('Boolean truthiness check', () => {
  expect(true).toBe(true);
});

import {
  requestCreateInvoice,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestDeleteInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
  requestGetInvoiceHistory
} from '../httpWrappers';

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

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
});

describe('GET /v1/invoice/:invoiceId/history — getInvoiceHistory', () => {
  describe('Successful cases — shape', () => {
    test('returns 200 with invoiceId and statusHistory array for a draft invoice', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoiceId', invoiceId);
      expect(res.body).toHaveProperty('statusHistory');
      expect(Array.isArray(res.body.statusHistory)).toBe(true);
    });

    test('each history entry has status and changedAt fields', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body.statusHistory.length).toBeGreaterThan(0);

      for (const entry of res.body.statusHistory) {
        expect(entry).toHaveProperty('status');
        expect(entry).toHaveProperty('changedAt');
        expect(typeof entry.status).toBe('string');
        expect(typeof entry.changedAt).toBe('string');
      }
    });

    test('changedAt values are valid ISO date strings', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      for (const entry of res.body.statusHistory) {
        expect(isNaN(Date.parse(entry.changedAt))).toBe(false);
      }
    });
  });

  describe('Successful cases — draft invoice', () => {
    test('newly created invoice history contains exactly one entry with status "draft"', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body.statusHistory).toHaveLength(1);
      expect(res.body.statusHistory[0].status).toBe('draft');
    });
  });

  describe('Successful cases — status transitions', () => {
    test('history has two entries after convert: draft → converted', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body.statusHistory).toHaveLength(2);
      expect(res.body.statusHistory[0].status).toBe('draft');
      expect(res.body.statusHistory[1].status).toBe('converted');
    });

    test('history has three entries after convert → validate: draft → converted → validated', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body.statusHistory).toHaveLength(3);
      expect(res.body.statusHistory[0].status).toBe('draft');
      expect(res.body.statusHistory[1].status).toBe('converted');
      expect(res.body.statusHistory[2].status).toBe('validated');
    });

    test('history has four entries after full pipeline: draft → converted → validated → finalised', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);
      requestFinaliseInvoice(invoiceId);

      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body.statusHistory).toHaveLength(4);
      expect(res.body.statusHistory[0].status).toBe('draft');
      expect(res.body.statusHistory[1].status).toBe('converted');
      expect(res.body.statusHistory[2].status).toBe('validated');
      expect(res.body.statusHistory[3].status).toBe('finalised');
    });

    test('history entries are ordered chronologically (oldest first)', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      const timestamps = res.body.statusHistory.map((e: { changedAt: string }) =>
        new Date(e.changedAt).getTime()
      );
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    test('re-validating a validated invoice does not add a duplicate history entry', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(200);
      const validatedEntries = res.body.statusHistory.filter(
        (e: { status: string }) => e.status === 'validated'
      );
      expect(validatedEntries).toHaveLength(1);
    });

    test('two independent invoices maintain separate, independent histories', () => {
      const id1 = createInvoice();
      const id2 = createInvoice();

      requestConvertInvoice(id1);
      requestConvertInvoice(id2);
      requestValidateInvoice(id2);
      requestFinaliseInvoice(id2);

      const res1 = requestGetInvoiceHistory(id1);
      const res2 = requestGetInvoiceHistory(id2);

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      expect(res1.body.statusHistory).toHaveLength(2);
      expect(res2.body.statusHistory).toHaveLength(4);
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = requestGetInvoiceHistory('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });

    test('returns 404 for a random non-existent invoice ID', () => {
      const res = requestGetInvoiceHistory('nonexistent-invoice-id-000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });

    test('returns 404 after the invoice has been deleted', () => {
      const invoiceId = createInvoice();
      requestDeleteInvoice(invoiceId);

      const res = requestGetInvoiceHistory(invoiceId);

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });
});
