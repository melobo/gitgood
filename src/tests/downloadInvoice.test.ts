import {
  requestCreateInvoice,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestDownloadInvoice,
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

// convert validate and finalise invoice requests
function createFinalisedInvoice(): string {
  const invoiceId = createInvoice();

  requestConvertInvoice(invoiceId);
  requestValidateInvoice(invoiceId);
  requestFinaliseInvoice(invoiceId);

  return invoiceId;
}

describe('GET /invoice/{invoice_id}/download — downloadInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 when downloading a finalised invoice as xml (default)', () => {
      const invoiceId = createFinalisedInvoice();

      const res = requestDownloadInvoice(invoiceId, 'xml');
      expect(res.statusCode).toBe(200);
    });

    test('returns 200 when downloading a finalised invoice as json', () => {
      const invoiceId = createFinalisedInvoice();

      const res = requestDownloadInvoice(invoiceId, 'json');
      expect(res.statusCode).toBe(200);
    });

    test('returns 200 with no format param (uses default xml)', () => {
      const invoiceId = createFinalisedInvoice();

      const res = requestDownloadInvoice(invoiceId, 'xml');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Invalid Format', () => {
    test('returns 400 for unsupported format value', () => {
      const invoiceId = createFinalisedInvoice();

      const res = requestDownloadInvoice(invoiceId, 'pdf');

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('returns 400 for completely invalid format string', () => {
      const invoiceId = createFinalisedInvoice();

      const res = requestDownloadInvoice(invoiceId, 'invalidformat');

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });
  });

  describe('Not Ready', () => {
    test('returns 409 when attempting to download a draft invoice', () => {
      const invoiceId = createInvoice();

      const res = requestDownloadInvoice(invoiceId, 'xml');

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVOICE_NOT_READY',
        message: expect.any(String),
      });
    });

    test('returns 409 when attempting to download a converted (not finalised) invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestDownloadInvoice(invoiceId, 'xml');

      expect(res.statusCode).toBe(409);
      expect(res.body).toStrictEqual({
        error: 'INVOICE_NOT_READY',
        message: expect.any(String),
      });
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = requestDownloadInvoice('00000000-0000-0000-0000-000000000000', 'xml');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });
});
