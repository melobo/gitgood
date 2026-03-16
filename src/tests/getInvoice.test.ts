import {
  requestCreateInvoice,
  requestGetInvoice,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestClear
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
});

describe('GET /invoice/{invoice_id} — getInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 with full invoice details for a valid invoice_id', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoiceId', invoiceId);
      expect(res.body).toHaveProperty('status', 'draft');
      expect(res.body).toHaveProperty('buyerName', 'Test Buyer');
      expect(res.body).toHaveProperty('supplierName', 'Test Supplier');
      expect(res.body).toHaveProperty('issueDate', '2025-01-01');
      expect(res.body).toHaveProperty('paymentDueDate', '2025-02-01');
      expect(res.body).toHaveProperty('itemsList');
      expect(res.body).toHaveProperty('taxRate', 0.1);
      expect(res.body).toHaveProperty('taxAmount');
      expect(res.body).toHaveProperty('totalPayable');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
    });

    test('items_list contains the correct item data', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.itemsList)).toBe(true);
      expect(res.body.itemsList.length).toBe(1);
      expect(res.body.itemsList[0]).toHaveProperty('itemName', 'item');
      expect(res.body.itemsList[0]).toHaveProperty('quantity', 2);
      expect(res.body.itemsList[0]).toHaveProperty('unitPrice', 50.0);
    });

    test('tax_amount and total_payable are correctly calculated', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      // subtotal = 100, tax = 10, total = 110
      expect(res.body.taxAmount).toBe(10);
      expect(res.body.totalPayable).toBe(110);
    });

    test('returns status "converted" after invoice is converted', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'converted');
      expect(res.body).toHaveProperty('ublXml');
      expect(typeof res.body.ublXml).toBe('string');
    });

    test('returns status "validated" after invoice is validated', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'validated');
    });

    test('returns status "finalised" and finalised_at after invoice is finalised', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);
      requestFinaliseInvoice(invoiceId);

      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'finalised');
      expect(res.body).toHaveProperty('finalisedAt');
      expect(typeof res.body.finalisedAt).toBe('string');
    });

    test('two different invoices have different invoice_ids', () => {
      const invoiceId1 = createInvoice();
      const invoiceId2 = createInvoice();

      expect(invoiceId1).not.toBe(invoiceId2);

      const res1 = requestGetInvoice(invoiceId1);
      const res2 = requestGetInvoice(invoiceId2);

      expect(res1.body.invoiceId).toBe(invoiceId1);
      expect(res2.body.invoiceId).toBe(invoiceId2);
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = requestGetInvoice('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });

    test('returns 404 for a random non-existent invoice ID', () => {
      const res = requestGetInvoice('nonexistent-invoice-id-000');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });
});
