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

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
});

describe('POST /invoice/{invoice_id}/final — finaliseInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 and status "finalised" for a validated invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);
      const res = requestFinaliseInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoiceId', invoiceId);
      expect(res.body).toHaveProperty('status', 'finalised');
      expect(res.body).toHaveProperty('ublXml');
      expect(res.body).toHaveProperty('finalisedAt');
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
