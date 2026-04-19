test('Boolean truthiness check', () => {
  expect(true).toBe(true);
});

import request from 'sync-request-curl';
import config from '../config';
import {
  requestCreateInvoice,
  requestGetInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
} from '../httpWrappers';

const SERVER_URL = () => process.env.SERVER_URL ?? 'http://127.0.0.1:3000';
const TIMEOUT_MS = 5 * 1000;

const getHeaders = () => ({
  'x-api-key': config.apiKey,
  'session': (global as any).__SESSION_TOKEN__,
});

const requestBatchAction = (action: string, invoiceIds: string[]) => {
  const res = request(
    'POST',
    `${SERVER_URL()}/v1/invoices/batch/${action}`,
    {
      headers: getHeaders(),
      json: { invoiceIds },
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

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
  (global as any).__SESSION_TOKEN__ = res.body.session;
});

describe('POST /v1/invoices/batch/:action — batchInvoice', () => {
  describe('action: convert', () => {
    describe('Successful cases', () => {
      test('returns 200 with per-invoice results for a single draft invoice', () => {
        const invoiceId = createInvoice();
        const res = requestBatchAction('convert', [invoiceId]);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('results');
        expect(Array.isArray(res.body.results)).toBe(true);
        expect(res.body.results).toHaveLength(1);
        expect(res.body.results[0]).toHaveProperty('invoiceId', invoiceId);
        expect(res.body.results[0]).toHaveProperty('status', 'converted');
        expect(res.body.results[0]).toHaveProperty('success', true);
      });

      test('returns 200 and converts multiple draft invoices in one batch', () => {
        const id1 = createInvoice();
        const id2 = createInvoice();
        const id3 = createInvoice();

        const res = requestBatchAction('convert', [id1, id2, id3]);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(3);
        for (const result of res.body.results) {
          expect(result.success).toBe(true);
          expect(result.status).toBe('converted');
        }
      });

      test('each converted invoice is retrievable with status "converted"', () => {
        const id1 = createInvoice();
        const id2 = createInvoice();

        requestBatchAction('convert', [id1, id2]);

        expect(requestGetInvoice(id1).body.status).toBe('converted');
        expect(requestGetInvoice(id2).body.status).toBe('converted');
      });

      test('returns partial success — valid IDs succeed, non-existent IDs fail', () => {
        const invoiceId = createInvoice();
        const res = requestBatchAction('convert', [invoiceId, '00000000-0000-0000-0000-000000000000']);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(2);

        const succeeded = res.body.results.find((r: any) => r.invoiceId === invoiceId);
        const failed = res.body.results.find((r: any) => r.invoiceId === '00000000-0000-0000-0000-000000000000');

        expect(succeeded.success).toBe(true);
        expect(failed.success).toBe(false);
        expect(failed.error).toBe('NOT_FOUND');
      });

      test('already-converted invoice returns a failure entry with ALREADY_CONVERTED error', () => {
        const invoiceId = createInvoice();
        requestBatchAction('convert', [invoiceId]);

        const res = requestBatchAction('convert', [invoiceId]);

        expect(res.statusCode).toBe(200);
        const result = res.body.results[0];
        expect(result.success).toBe(false);
        expect(result.error).toBe('ALREADY_CONVERTED');
      });
    });

    describe('Error Cases', () => {
      test('returns 400 when invoiceIds array is empty', () => {
        const res = requestBatchAction('convert', []);

        expect(res.statusCode).toBe(400);
        expect(res.body).toStrictEqual({
          error: 'INVALID_REQUEST',
          message: expect.any(String),
        });
      });

      test('returns 400 when invoiceIds is missing from the body', () => {
        const res = request('POST', `${SERVER_URL()}/v1/invoices/batch/convert`, {
          headers: getHeaders(),
          json: {},
          timeout: TIMEOUT_MS,
        });
        const body = JSON.parse(res.body.toString());

        expect(res.statusCode).toBe(400);
        expect(body).toStrictEqual({
          error: 'INVALID_REQUEST',
          message: expect.any(String),
        });
      });

      test('returns 400 for an unknown action', () => {
        const invoiceId = createInvoice();
        const res = requestBatchAction('explode', [invoiceId]);

        expect(res.statusCode).toBe(400);
        expect(res.body).toStrictEqual({
          error: 'INVALID_REQUEST',
          message: expect.any(String),
        });
      });
    });
  });

  describe('action: validate', () => {
    describe('Successful cases', () => {
      test('returns 200 with per-invoice results for a single converted invoice', () => {
        const invoiceId = createInvoice();
        requestBatchAction('convert', [invoiceId]);

        const res = requestBatchAction('validate', [invoiceId]);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(1);
        expect(res.body.results[0]).toHaveProperty('invoiceId', invoiceId);
        expect(res.body.results[0]).toHaveProperty('status', 'validated');
        expect(res.body.results[0]).toHaveProperty('success', true);
      });

      test('validates multiple converted invoices in one batch', () => {
        const id1 = createInvoice();
        const id2 = createInvoice();
        requestBatchAction('convert', [id1, id2]);

        const res = requestBatchAction('validate', [id1, id2]);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(2);
        for (const result of res.body.results) {
          expect(result.success).toBe(true);
          expect(result.status).toBe('validated');
        }
      });

      test('draft invoice returns a failure entry — not yet converted', () => {
        const invoiceId = createInvoice();
        const res = requestBatchAction('validate', [invoiceId]);

        expect(res.statusCode).toBe(200);
        const result = res.body.results[0];
        expect(result.success).toBe(false);
        expect(result.error).toBe('INVALID_REQUEST');
      });

      test('non-existent invoice ID returns a failure entry with NOT_FOUND', () => {
        const res = requestBatchAction('validate', ['00000000-0000-0000-0000-000000000000']);

        expect(res.statusCode).toBe(200);
        const result = res.body.results[0];
        expect(result.success).toBe(false);
        expect(result.error).toBe('NOT_FOUND');
      });
    });

    describe('Error Cases', () => {
      test('returns 400 when invoiceIds array is empty', () => {
        const res = requestBatchAction('validate', []);

        expect(res.statusCode).toBe(400);
        expect(res.body).toStrictEqual({
          error: 'INVALID_REQUEST',
          message: expect.any(String),
        });
      });
    });
  });

  describe('action: finalise', () => {
    describe('Successful cases', () => {
      test('returns 200 with per-invoice results for a single validated invoice', () => {
        const invoiceId = createInvoice();
        requestBatchAction('convert', [invoiceId]);
        requestBatchAction('validate', [invoiceId]);

        const res = requestBatchAction('finalise', [invoiceId]);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(1);
        expect(res.body.results[0]).toHaveProperty('invoiceId', invoiceId);
        expect(res.body.results[0]).toHaveProperty('status', 'finalised');
        expect(res.body.results[0]).toHaveProperty('success', true);
      });

      test('finalises multiple validated invoices in one batch', () => {
        const id1 = createInvoice();
        const id2 = createInvoice();
        requestBatchAction('convert', [id1, id2]);
        requestBatchAction('validate', [id1, id2]);

        const res = requestBatchAction('finalise', [id1, id2]);

        expect(res.statusCode).toBe(200);
        expect(res.body.results).toHaveLength(2);
        for (const result of res.body.results) {
          expect(result.success).toBe(true);
          expect(result.status).toBe('finalised');
        }
      });

      test('each finalised invoice is retrievable with status "finalised"', () => {
        const id1 = createInvoice();
        const id2 = createInvoice();
        requestBatchAction('convert', [id1, id2]);
        requestBatchAction('validate', [id1, id2]);
        requestBatchAction('finalise', [id1, id2]);

        expect(requestGetInvoice(id1).body.status).toBe('finalised');
        expect(requestGetInvoice(id2).body.status).toBe('finalised');
      });

      test('draft invoice returns a failure entry — not yet validated', () => {
        const invoiceId = createInvoice();
        const res = requestBatchAction('finalise', [invoiceId]);

        expect(res.statusCode).toBe(200);
        const result = res.body.results[0];
        expect(result.success).toBe(false);
        expect(result.error).toBe('INVOICE_NOT_VALIDATED');
      });

      test('converted (not validated) invoice returns a failure entry', () => {
        const invoiceId = createInvoice();
        requestBatchAction('convert', [invoiceId]);

        const res = requestBatchAction('finalise', [invoiceId]);

        expect(res.statusCode).toBe(200);
        const result = res.body.results[0];
        expect(result.success).toBe(false);
        expect(result.error).toBe('INVOICE_NOT_VALIDATED');
      });

      test('non-existent invoice ID returns a failure entry with NOT_FOUND', () => {
        const res = requestBatchAction('finalise', ['00000000-0000-0000-0000-000000000000']);

        expect(res.statusCode).toBe(200);
        const result = res.body.results[0];
        expect(result.success).toBe(false);
        expect(result.error).toBe('NOT_FOUND');
      });
    });

    describe('Error Cases', () => {
      test('returns 400 when invoiceIds array is empty', () => {
        const res = requestBatchAction('finalise', []);

        expect(res.statusCode).toBe(400);
        expect(res.body).toStrictEqual({
          error: 'INVALID_REQUEST',
          message: expect.any(String),
        });
      });
    });
  });

  describe('Full pipeline via batch', () => {
    test('convert → validate → finalise in three sequential batch calls produces finalised invoices', () => {
      const id1 = createInvoice();
      const id2 = createInvoice();

      requestBatchAction('convert', [id1, id2]);
      requestBatchAction('validate', [id1, id2]);
      const finalRes = requestBatchAction('finalise', [id1, id2]);

      expect(finalRes.statusCode).toBe(200);
      for (const result of finalRes.body.results) {
        expect(result.success).toBe(true);
        expect(result.status).toBe('finalised');
      }
    });
  });
}); 
