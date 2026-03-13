import {
  requestClear,
  requestCreateInvoice,
  requestConvertInvoice,
} from '../httpWrappers';
 
const error = { error: expect.any(String) };
 
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
 
describe('POST /invoice/{invoice_id}/convert — convertInvoice', () => {
  beforeEach(() => {
    requestClear();
  });
 
  describe('Successful cases', () => {
    test('returns 200 and status "converted" for a complete draft invoice', () => {
      const invoiceId = createInvoice();
      const res = requestConvertInvoice(invoiceId);
 
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoice_id', invoiceId);
      expect(res.body).toHaveProperty('status', 'converted');
      expect(res.body).toHaveProperty('ubl_xml');
      expect(typeof res.body.ubl_xml).toBe('string');
    });
  });
 
  describe('Already Converted', () => {
    test('returns 409 when converting an already converted invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
 
      const res = requestConvertInvoice(invoiceId);
      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual(error);
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
        const invoiceId = createRes.body.invoice_id;
        const res = requestConvertInvoice(invoiceId);
        expect(res.statusCode).toBe(422);
        expect(res.body).toStrictEqual(error);
      } else {
        expect(createRes.statusCode).toBe(400);
      }
    });
  });
 
  describe('Not Found', () => {
    test('returns 404 for a non-existent invoice ID', () => {
      const res = requestConvertInvoice('nonexistent-invoice-id-000');
 
      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual(error);
    });
  });
});
