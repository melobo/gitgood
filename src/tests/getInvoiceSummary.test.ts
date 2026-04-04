import {
  requestClear,
  requestCreateInvoice,
  requestGetInvoiceSummary,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestDeleteInvoice
} from '../httpWrappers';

import {
  InvoiceItem,
  PaymentDetails,
} from '../invoiceInterface';

const SUCCESS_CODE = 200;
const NOT_FOUND_CODE = 404;

const validItems: InvoiceItem[] = [
  {
    itemName: 'Consulting Services',
    quantity: 2,
    unitPrice: 500.00,
    unitCode: 'HUR',
    totalPrice: 1000.00,
  },
];

const validPayment: PaymentDetails[] = [
  {
    bankName: 'ANZ',
    accountNumber: '123456789',
    bsbAbnNumber: '012-345',
    paymentMethod: 'bank_transfer',
  },
];

beforeEach(() => {
  requestClear();
});

describe('HTTP tests: GET /v1/invoice/:invoiceId/summary', () => {
  describe('Success Cases', () => {
    test('1) Summary of a draft invoice returns correct fields and values', () => {
      const created = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment,
        'Please pay on time.'
      );
      expect(created.statusCode).toBe(201);

      const { invoiceId } = created.body;
      const res = requestGetInvoiceSummary(invoiceId);

      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body).toStrictEqual({
        invoiceId,
        status: 'draft',
        buyerName: 'Acme Corp',
        supplierName: 'GitGood Pty Ltd',
        issueDate: '2025-03-12',
        paymentDueDate: '2025-04-12',
        subtotal: 1000.00,
        taxRate: 0.1,
        taxAmount: 100.00,
        totalPayable: 1100.00,
        itemCount: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('2) Summary does not expose itemsList, paymentDetails, or ublXml', () => {
      const created = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      const { invoiceId } = created.body;
      const res = requestGetInvoiceSummary(invoiceId);

      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body).not.toHaveProperty('itemsList');
      expect(res.body).not.toHaveProperty('paymentDetails');
      expect(res.body).not.toHaveProperty('ublXml');
      expect(res.body).not.toHaveProperty('additionalNotes');
    });

    test('3) itemCount reflects multiple line items correctly', () => {
      const multiItems: InvoiceItem[] = [
        { itemName: 'Widget A', quantity: 10, unitPrice: 25.00, unitCode: 'EA', totalPrice: 250.00 },
        { itemName: 'Widget B', quantity: 5, unitPrice: 100.00, unitCode: 'EA', totalPrice: 500.00 },
        { itemName: 'Widget C', quantity: 1, unitPrice: 75.00, unitCode: 'EA', totalPrice: 75.00 },
      ];
      const created = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        multiItems,
        0.1,
        validPayment
      );
      const { invoiceId } = created.body;
      const res = requestGetInvoiceSummary(invoiceId);

      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body.itemCount).toBe(3);
      expect(res.body.subtotal).toBe(825.00);
      expect(res.body.taxAmount).toBe(82.50);
      expect(res.body.totalPayable).toBe(907.50);
    });

    test('4) Summary of tax rate 0 invoice has taxAmount of 0 and subtotal equals totalPayable', () => {
      const created = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0,
        validPayment
      );
      const { invoiceId } = created.body;
      const res = requestGetInvoiceSummary(invoiceId);

      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body.taxRate).toBe(0);
      expect(res.body.taxAmount).toBe(0);
      expect(res.body.subtotal).toBe(res.body.totalPayable);
    });

    test('5) Summary of a finalised invoice includes finalisedAt field', () => {
      const created = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      const { invoiceId } = created.body;

      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);
      requestFinaliseInvoice(invoiceId);

      const res = requestGetInvoiceSummary(invoiceId);

      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body.status).toBe('finalised');
      expect(res.body).toHaveProperty('finalisedAt');
      expect(typeof res.body.finalisedAt).toBe('string');
    });

    test('6) Summary of a draft invoice does not include finalisedAt field', () => {
      const created = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      const { invoiceId } = created.body;
      const res = requestGetInvoiceSummary(invoiceId);

      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body).not.toHaveProperty('finalisedAt');
    });

    test('7) Two independent invoices return distinct summaries', () => {
      const res1 = requestCreateInvoice(
        'Buyer One', '12345678901', 'GitGood Pty Ltd', '98765432100',
        '2025-03-12', '2025-04-12', validItems, 0.1, validPayment
      );
      const res2 = requestCreateInvoice(
        'Buyer Two', '11111111111', 'GitGood Pty Ltd', '98765432100',
        '2025-03-12', '2025-04-12', validItems, 0.2, validPayment
      );

      const summary1 = requestGetInvoiceSummary(res1.body.invoiceId);
      const summary2 = requestGetInvoiceSummary(res2.body.invoiceId);

      expect(summary1.statusCode).toBe(SUCCESS_CODE);
      expect(summary2.statusCode).toBe(SUCCESS_CODE);
      expect(summary1.body.invoiceId).not.toBe(summary2.body.invoiceId);
      expect(summary1.body.buyerName).toBe('Buyer One');
      expect(summary2.body.buyerName).toBe('Buyer Two');
      expect(summary1.body.taxRate).toBe(0.1);
      expect(summary2.body.taxRate).toBe(0.2);
    });
  });

  describe('Error Cases', () => {
    test('1) Non-existent invoiceId — NOT FOUND', () => {
      const res = requestGetInvoiceSummary('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(NOT_FOUND_CODE);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String),
      });
    });

    test('2) invoiceId that was created then deleted — NOT FOUND', () => {
      const created = requestCreateInvoice(
        'Acme Corp', '12345678901', 'GitGood Pty Ltd', '98765432100',
        '2025-03-12', '2025-04-12', validItems, 0.1, validPayment
      );
      const { invoiceId } = created.body;

      requestDeleteInvoice(invoiceId);

      const res = requestGetInvoiceSummary(invoiceId);
      expect(res.statusCode).toBe(NOT_FOUND_CODE);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });
});
