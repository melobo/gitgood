import {
  requestCreateInvoice,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
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
        item_name: 'item',
        quantity: 2,
        unit_price: 50.0,
        unit_code: 'ea',
        total_price: 100.0,
      },
    ],
    0.1,
    [
      {
        bank_name: 'ANZ',
        account_number: '123456789',
        bsb_abn_number: '012-345',
        payment_method: 'bank_transfer',
      },
    ]
  );
  return res.body.invoice_id;
}

describe('POST /invoice/{invoice_id}/final — finaliseInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 and status "finalised" for a validated invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestFinaliseInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoice_id', invoiceId);
      expect(res.body).toHaveProperty('status', 'finalised');
      expect(res.body).toHaveProperty('ubl_xml');
      expect(res.body).toHaveProperty('finalised_at');
    });
  });

  describe('Sequence Errors', () => {
    test('returns 409 when finalising a draft invoice (not yet validated)', () => {
      const invoiceId = createInvoice();

      const res = requestFinaliseInvoice(invoiceId);

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVOICE_NOT_VALIDATED',
        message: expect.any(String),
      });
    });

    test('returns 409 when finalising a converted but not validated invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestFinaliseInvoice(invoiceId);

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVOICE_NOT_VALIDATED',
        message: expect.any(String),
      });
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = requestFinaliseInvoice('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });
});