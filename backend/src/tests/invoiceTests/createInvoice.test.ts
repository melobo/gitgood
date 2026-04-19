import {
  requestClear,
  requestCreateInvoice,
  requestUserRegister,
  setSessionToken,
  clearSessionToken
} from '../../httpWrappers';
import {
  InvoiceItem,
  PaymentDetails
} from '../../invoiceInterface';

const SUCCESS_CODE = 201;
const BAD_REQUEST_CODE = 400;

// ========================================================================== //
//                          /v1/invoice tests                                  //
// ========================================================================== //

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
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
});

describe('HTTP tests: POST /v1/invoice', () => {
  describe('Success Cases', () => {
    test('1) Successful invoice creation with all fields', () => {
      const res = requestCreateInvoice(
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
      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body).toStrictEqual({
        invoiceId: expect.any(String),
        status: 'draft',
        createdAt: expect.any(String),
      });
    });

    test('2) Successful invoice creation without optional additional_notes', () => {
      const res = requestCreateInvoice(
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
      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body).toStrictEqual({
        invoiceId: expect.any(String),
        status: 'draft',
        createdAt: expect.any(String),
      });
    });

    test('3) Multiple invoices can be created independently', () => {
      const res1 = requestCreateInvoice(
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
      const res2 = requestCreateInvoice(
        'Other Buyer',
        '11111111111',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res1.statusCode).toBe(SUCCESS_CODE);
      expect(res2.statusCode).toBe(SUCCESS_CODE);
      expect(res1.body.invoiceId).not.toBe(res2.body.invoiceId);
    });

    test('4) Invoice with multiple line items', () => {
      const multiItems: InvoiceItem[] = [
        {
          itemName: 'Widget A',
          quantity: 10,
          unitPrice: 25.00,
          unitCode: 'EA',
          totalPrice: 250.00,
        },
        {
          itemName: 'Widget B',
          quantity: 5,
          unitPrice: 100.00,
          unitCode: 'EA',
          totalPrice: 500.00,
        },
      ];
      const res = requestCreateInvoice(
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
      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body.status).toBe('draft');
    });

    test('5) Tax rate of 0 is valid', () => {
      const res = requestCreateInvoice(
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
      expect(res.statusCode).toBe(SUCCESS_CODE);
      expect(res.body.status).toBe('draft');
    });
  });

  describe('Error Cases', () => {
    test('1) Missing buyer_name — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        '',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('2) Missing buyer_abn — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('3) Missing supplier_name — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        '',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('4) Missing supplier_abn — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('5) Missing issue_date — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('6) Missing payment_due_date — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('7) Empty items_list — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        [],
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('8) Negative tax_rate — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        -0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('9) Empty payment_details — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        validItems,
        0.1,
        []
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('10) payment_due_date before issue_date — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-04-12',
        '2025-03-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('11) Invalid date format for issue_date — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        'not-a-date',
        '2025-04-12',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('12) Invalid date format for payment_due_date — BAD REQUEST', () => {
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        'not-a-date',
        validItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('13) Item with negative unit_price — BAD REQUEST', () => {
      const badItems: InvoiceItem[] = [
        { ...validItems[0], unitPrice: -50, totalPrice: -100 },
      ];
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        badItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });

    test('14) Item with zero quantity — BAD REQUEST', () => {
      const badItems: InvoiceItem[] = [
        { ...validItems[0], quantity: 0, totalPrice: 0 },
      ];
      const res = requestCreateInvoice(
        'Acme Corp',
        '12345678901',
        'GitGood Pty Ltd',
        '98765432100',
        '2025-03-12',
        '2025-04-12',
        badItems,
        0.1,
        validPayment
      );
      expect(res.statusCode).toBe(BAD_REQUEST_CODE);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String),
      });
    });
  });
});
