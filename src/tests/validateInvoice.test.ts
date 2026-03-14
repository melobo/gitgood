import { requestCreateInvoice, requestConvertInvoice, requestValidateInvoice, requestFinaliseInvoice } from '../httpWrappers';

function createInvoice(): string {
  const res = requestCreateInvoice(
    'Theo Philip',
    '12345678901',
    'ACME Corp',
    '98765432101',
    '2026-02-02',
    '2026-03-02',
    [
      {
        item_name: 'Book',
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
        payment_method: 'bankTransfer',
      },
    ]
  );
  return res.body.invoice_id;
}

function createConvertInvoice(): string {
  const invoiceId = createInvoice();
  requestConvertInvoice(invoiceId);
  return invoiceId;
}

describe('validateInvoice POST /v1/invoices/:invoice_id/validate', () => {
  describe('successful case', () => {
    test('returns 200 and valid for a converted invoice', () => {
      const invoiceId = createConvertInvoice();
      const res = requestValidateInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toStrictEqual({
        invoice_id: invoiceId,
        valid: true,
        errors: [],
        status: 'validated'
      });
    });
  });

  describe('invalid invoiceID test', () => {
    test('returns 404 for non-existent invoiceID', () => {
      const res = requestValidateInvoice('nonexistent-invoice-id-233');
      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });

  describe('not converted yet test', () => {
    test('returns 409 when validating a draft invoice', () => {
      const invoiceId = createInvoice();
      const res = requestValidateInvoice(invoiceId);

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });
  });

  describe('already validated test', () => {
    test('status remains validated when validating an already validated invoice', () => {
      const invoiceId = createConvertInvoice();
      requestValidateInvoice(invoiceId);

      // validate again
      const res = requestValidateInvoice(invoiceId);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('validated');
    });
  });

  describe('finalised invoice test', () => {
    test('status remains finalised instead of validated when validating a finalised invoice', () => {
      const invoiceId = createConvertInvoice();
      requestValidateInvoice(invoiceId);
      requestFinaliseInvoice(invoiceId);

      const res = requestValidateInvoice(invoiceId);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('finalised');
    });
  });
});
