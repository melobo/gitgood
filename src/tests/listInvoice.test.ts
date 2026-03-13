import {
  requestClear,
  requestCreateInvoice,
  requestListInvoices,
} from '../httpWrappers';
 
const error = { error: expect.any(String) };
 
// creating a valid draft invoice
function createInvoice(): any {
  return requestCreateInvoice(
    'Test Buyer',
    '12345678901',
    'Test Supplier',
    '98765432101',
    '2025-01-01',
    '2025-02-01',
    [
      {
        item_name: 'Item',
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
}
 
describe('GET /invoice — listInvoices', () => {
  beforeEach(() => {
    requestClear();
  });
 
  //successful case
  describe('Successful cases', () => {
    test('returns 200 with valid parameters (no filters)', () => {
      const res = requestListInvoices();
 
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoices');
      expect(Array.isArray(res.body.invoices)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
    });
 
    test('returns 200 with valid from_date and to_date', () => {
      createInvoice();
 
      const res = requestListInvoices('2024-01-01', '2026-12-31');
 
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoices');
      expect(Array.isArray(res.body.invoices)).toBe(true);
    });
 
    test('returns 200 with valid page and limit_per_page', () => {
      const res = requestListInvoices(undefined, undefined, 1, 5);
 
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('page');
    });
  });
 
  //date range errors
  describe('Date Range Errors', () => {
    test('returns 400 when from_date is after to_date', () => {
      const res = requestListInvoices('2026-01-01', '2024-01-01');
 
      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
 
    test('returns 400 when to_date is before from_date', () => {
      const res = requestListInvoices('2025-06-01', '2025-01-01');
 
      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
  });
 
  //type mismatch errors
  describe('Type Mismatch Errors', () => {
    test('returns 400 when page is a string instead of integer', () => {
      const res = requestListInvoices(undefined, undefined, 'abc' as any);
 
      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
  });
});