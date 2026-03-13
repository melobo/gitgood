import {
  requestClear,
  requestCreateInvoice,
  requestGetInvoice,
  requestDeleteInvoice,
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
 
describe('DELETE /invoice/{invoice_id} — deleteInvoice', () => {
  beforeEach(() => {
    requestClear();
  });
 
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
      expect(res.body).toStrictEqual(error);
    });
 
    test('returns 404 when deleting an invoice that never existed (plausible-looking ID)', () => {
      const res = requestDeleteInvoice('00000000-0000-0000-0000-000000000000');
 
      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual(error);
    });
  });
 
  describe('Invalid ID', () => {
    test('returns 400 for a completely invalid invoice ID format', () => {
      const res = requestDeleteInvoice('!!!invalid-id!!!');
 
      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
 
    test('returns 400 for an empty string invoice ID', () => {
      const res = requestDeleteInvoice('   ');
 
      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
  });
});
 
