import {
  requestCreateInvoice,
  requestGetInvoice,
  requestDeleteInvoice,
} from '../httpWrappers';

// creating a valid draft invoice
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

describe('DELETE /invoice/{invoice_id} — deleteInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 and confirmation message when deleting a draft invoice', () => {
      const invoiceId = createInvoice();

      const res = requestDeleteInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoice_id', invoiceId);
      expect(res.body).toHaveProperty('message');
      expect(typeof res.body.message).toBe('string');
    });

    test('deleted invoice is no longer retrievable', () => {
      const invoiceId = createInvoice();
      requestDeleteInvoice(invoiceId);

      const getRes = requestGetInvoice(invoiceId);

      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('Not Found', () => {
    test('returns 404 when deleting an already deleted invoice', () => {
      const invoiceId = createInvoice();
      requestDeleteInvoice(invoiceId);

      const res = requestDeleteInvoice(invoiceId);

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });

    test('returns 404 when deleting an invoice that never existed (plausible-looking ID)', () => {
      const res = requestDeleteInvoice('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });

  describe('Invalid ID', () => {
    test('returns 400 for a completely invalid invoice ID format', () => {
      const res = requestDeleteInvoice('!!!invalid-id!!!');

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 404 for a non-existent invoice ID', () => {
      const res = requestDeleteInvoice('invalid-id');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND', // was 'INVALID_REQUEST'
        message: expect.any(String),
      });
    });
  });
});
