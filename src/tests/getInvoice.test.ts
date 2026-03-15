import {
  requestCreateInvoice,
  requestGetInvoice,
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
  return res.body.invoice_id;
}

describe('GET /invoice/{invoice_id} — getInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 with full invoice details for a valid invoice_id', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoice_id', invoiceId);
      expect(res.body).toHaveProperty('status', 'draft');
      expect(res.body).toHaveProperty('buyer_name', 'Test Buyer');
      expect(res.body).toHaveProperty('supplier_name', 'Test Supplier');
      expect(res.body).toHaveProperty('issue_date', '2025-01-01');
      expect(res.body).toHaveProperty('payment_due_date', '2025-02-01');
      expect(res.body).toHaveProperty('items_list');
      expect(res.body).toHaveProperty('tax_rate', 0.1);
      expect(res.body).toHaveProperty('tax_amount');
      expect(res.body).toHaveProperty('total_payable');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');
    });

    test('items_list contains the correct item data', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.items_list)).toBe(true);
      expect(res.body.items_list.length).toBe(1);
      expect(res.body.items_list[0]).toHaveProperty('item_name', 'item');
      expect(res.body.items_list[0]).toHaveProperty('quantity', 2);
      expect(res.body.items_list[0]).toHaveProperty('unit_price', 50.0);
    });

    test('tax_amount and total_payable are correctly calculated', () => {
      const invoiceId = createInvoice();
      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      // subtotal = 100, tax = 10, total = 110
      expect(res.body.tax_amount).toBe(10);
      expect(res.body.total_payable).toBe(110);
    });

    test('returns status "converted" after invoice is converted', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestGetInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'converted');
      expect(res.body).toHaveProperty('ubl_xml');
      expect(typeof res.body.ubl_xml).toBe('string');
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
      expect(res.body).toHaveProperty('finalised_at');
      expect(typeof res.body.finalised_at).toBe('string');
    });

    test('two different invoices have different invoice_ids', () => {
      const invoiceId1 = createInvoice();
      const invoiceId2 = createInvoice();

      expect(invoiceId1).not.toBe(invoiceId2);

      const res1 = requestGetInvoice(invoiceId1);
      const res2 = requestGetInvoice(invoiceId2);

      expect(res1.body.invoice_id).toBe(invoiceId1);
      expect(res2.body.invoice_id).toBe(invoiceId2);
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

    test('returns 404 for an empty string invoice ID', () => {
      const res = requestGetInvoice(' ');

      expect(res.statusCode).toBe(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });
  });
});
