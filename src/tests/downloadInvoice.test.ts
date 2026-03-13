import {
  requestClear,
  requestCreateInvoice,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestDownloadInvoice,
} from '../httpWrappers';
 
const error = { error: expect.any(String) };
 
//creating a valid draft invoice
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
 
//convert validate and finalise invoice requests
function createFinalisedInvoice(): string {
  const invoiceId = createInvoice();
 
  requestConvertInvoice(invoiceId);
  requestValidateInvoice(invoiceId);
  requestFinaliseInvoice(invoiceId);
 
  return invoiceId;
}
 
// downloading invoice
function downloadInvoice(invoiceId: string, format: string = 'xml'): any {
  return requestDownloadInvoice(invoiceId, format);
}
 
describe('GET /invoice/{invoice_id}/download — downloadInvoice', () => {
  beforeEach(() => {
    requestClear();
  });
 
  describe('Successful cases', () => {
    test('returns 200 when downloading a finalised invoice as xml (default)', () => {
      const invoiceId = createFinalisedInvoice();
 
      const res = downloadInvoice(invoiceId, 'xml');
      expect(res.statusCode).toBe(200);
    });
 
    test('returns 200 when downloading a finalised invoice as json', () => {
      const invoiceId = createFinalisedInvoice();
 
      const res = downloadInvoice(invoiceId, 'json');
      expect(res.statusCode).toBe(200);
    });
 
    test('returns 200 with no format param (uses default xml)', () => {
      const invoiceId = createFinalisedInvoice();
 
      const res = downloadInvoice(invoiceId);
      expect(res.statusCode).toBe(200);
    });
  });
 
  describe('Invalid Format', () => {
    test('returns 400 for unsupported format value', () => {
      const invoiceId = createFinalisedInvoice();
 
      const res = downloadInvoice(invoiceId, 'pdf');
 
      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
 
    test('returns 400 for completely invalid format string', () => {
      const invoiceId = createFinalisedInvoice();
 
      const res = downloadInvoice(invoiceId, 'invalidformat');
 
      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
  });
 
  describe('Not Ready', () => {
    test('returns 409 when attempting to download a draft invoice', () => {
      const invoiceId = createInvoice();
 
      const res = downloadInvoice(invoiceId, 'xml');
 
      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual(error);
    });
 
    test('returns 409 when attempting to download a converted (not finalised) invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
 
      const res = downloadInvoice(invoiceId, 'xml');
 
      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual(error);
    });
  });
 
  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = downloadInvoice('00000000-0000-0000-0000-000000000000', 'xml');
 
      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual(error);
    });
  });
});