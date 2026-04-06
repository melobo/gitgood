import {
  requestCreateInvoice,
  requestConvertInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken
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

describe('POST /invoice/{invoice_id}/convert — convertInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 and status "converted" for a complete draft invoice', () => {
      const invoiceId = createInvoice();
      const res = requestConvertInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoiceId', invoiceId);
      expect(res.body).toHaveProperty('status', 'converted');
      expect(res.body).toHaveProperty('ublXml');
      expect(typeof res.body.ublXml).toBe('string');
    });
  });

  describe('Already Converted', () => {
    test('returns 409 when converting an already converted invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestConvertInvoice(invoiceId);
      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'ALREADY_CONVERTED',
        message: expect.any(String),
      });
    });
  });

  describe('Insufficient Data', () => {
    test('returns 422 when invoice is missing required fields for conversion', () => {
      const createRes = requestCreateInvoice(
        '',
        '',
        '',
        '',
        '2025-01-01',
        '2025-02-01',
        [],
        0.1,
        []
      );

      // attempt conversion if server allows with insufficient data
      if (createRes.statusCode === 201) {
        const invoiceId = createRes.body.invoiceId;
        const res = requestConvertInvoice(invoiceId);
        expect(res.statusCode).toBe(422);
        expect(res.body).toStrictEqual({
          error: 'INSUFFICIENT_DATA',
          message: expect.any(String),
        });
      } else {
        expect(createRes.statusCode).toBe(400);
      }
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a non-existent invoice ID', () => {
      const res = requestConvertInvoice('nonexistent-invoice-id-000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });
});
