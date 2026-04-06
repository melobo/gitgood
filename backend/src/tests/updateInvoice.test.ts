import {
  Invoice,
  HttpReturnObject
} from '../invoiceInterface';
import {
  requestCreateInvoice,
  requestGetInvoice,
  requestUpdateInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
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

describe('PUT /v1/invoice/:invoice_id', () => {
  describe('error cases', () => {
    test('NOT_FOUND - invoice not found', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId + 9999, { buyerName: 'New Test Buyer' });
      expect(res.statusCode).toStrictEqual(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - buyer name contains invalid characters', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { buyerName: 'New Test Buyer!!!!' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - buyer ABN is <11 digits long', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { buyerAbn: '1234567890' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - buyer ABN is >11 digits long', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { buyerAbn: '12345678901233' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - supplier name contains invalid characters', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { supplierName: 'New Test Supplier :PP' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - supplier ABN is <11 digits long', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { supplierAbn: '9876543210' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - supplier ABN is >11 digits long', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { supplierAbn: '9876543210111' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - issue date is of an invalid format', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { issueDate: 'not-a-date' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - issue date is after payment date', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { paymentDate: 'not-a-date' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - payment date is of an invalid format', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { paymentDate: 'not-a-date' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - payment date is before issue date', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { paymentDate: new Date('2024-01-01') });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (name)', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { itemDetails: [{ itemName: 'updated item!!!!! hehe' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (quantity)', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { itemDetails: [{ quantity: -5 }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (quantity)', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { itemDetails: [{ quantity: 'two' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (unitPrice)', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { itemDetails: [{ unitPrice: 59 }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (unitPrice)', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { itemDetails: [{ unitPrice: 'fifty' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (unitPrice)', () => {
      const invoiceId = createInvoice();

      const res1 = requestUpdateInvoice(invoiceId, { itemDetails: [{ unitCode: 'ea!!/!!' }] });
      expect(res1.statusCode).toStrictEqual(400);
      expect(res1.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });

      const res2 = requestUpdateInvoice(invoiceId, { itemDetails: [{ unitCode: 30 }] });
      expect(res2.statusCode).toStrictEqual(400);
      expect(res2.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (totalPrice)', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { itemDetails: [{ unitPrice: 150 }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (total_price)', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { itemDetails: [{ unitPrice: 'one-hundred' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - tax rate is of an invalid format', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { taxRate: '10 percent' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - invalid bankName', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { paymentDetails: [{ bankName: 'fake-bank' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - invalid payment_method', () => {
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { paymentDetails: [{ paymentMethod: 'scam' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });
  });

  describe('success cases', () => {
    test('successfully updates all invoice fields', () => {
      const invoiceId = createInvoice();

      const beforeUpdate = requestGetInvoice(invoiceId) as HttpReturnObject<Invoice>;

      expect(beforeUpdate.body.status).toStrictEqual('draft');
      expect(beforeUpdate.body.buyerName).toStrictEqual('Test Buyer');
      expect(beforeUpdate.body.buyerAbn).toStrictEqual('12345678901');
      expect(beforeUpdate.body.supplierName).toStrictEqual('Test Supplier');
      expect(beforeUpdate.body.supplierAbn).toStrictEqual('98765432101');
      expect(beforeUpdate.body.issueDate).toStrictEqual('2025-01-01');
      expect(beforeUpdate.body.paymentDueDate).toStrictEqual('2025-02-01');
      expect(beforeUpdate.body.itemsList).toStrictEqual([{ itemName: 'item', quantity: 2, unitPrice: 50.0, unitCode: 'ea', totalPrice: 100.0 }]);
      expect(beforeUpdate.body.taxRate).toStrictEqual(0.1);
      expect(beforeUpdate.body.taxAmount).toStrictEqual(10);
      expect(beforeUpdate.body.totalPayable).toStrictEqual(110);
      expect(beforeUpdate.body.paymentDetails).toStrictEqual([{ bankName: 'ANZ', accountNumber: '123456789', bsbAbnNumber: '012-345', paymentMethod: 'bank_transfer' }]);

      const res = requestUpdateInvoice(invoiceId, {
        buyerName: 'New Test Buyer',
        buyerAbn: '12345678902',
        supplierName: 'New Test Supplier',
        supplierAbn: '98765432102',
        issueDate: '2025-01-02',
        paymentDate: '2025-02-02',
        itemDetails: [{ itemName: 'new item', quantity: 3, unitPrice: 75.0, unitCode: 'hi', totalPrice: 225.0 }],
        taxRate: 0.15,
        paymentDetails: [{ bankName: 'CommBank', accountNumber: '123456788', bsbAbnNumber: '012-346', paymentMethod: 'direct_debit' }],
      }) as HttpReturnObject<{ invoiceId: string; status: string; updatedAt: string }>;
      expect(res.statusCode).toStrictEqual(200);

      const updatedInfo = requestGetInvoice(invoiceId) as HttpReturnObject<Invoice>;
      expect(updatedInfo.body.status).toStrictEqual('draft');
      expect(updatedInfo.body.buyerName).toStrictEqual('New Test Buyer');
      expect(updatedInfo.body.buyerAbn).toStrictEqual('12345678902');
      expect(updatedInfo.body.supplierName).toStrictEqual('New Test Supplier');
      expect(updatedInfo.body.supplierAbn).toStrictEqual('98765432102');
      expect(updatedInfo.body.issueDate).toStrictEqual('2025-01-02');
      expect(updatedInfo.body.paymentDueDate).toStrictEqual('2025-02-02');
      expect(updatedInfo.body.itemsList).toStrictEqual([{ itemName: 'new item', quantity: 3, unitPrice: 75.0, unitCode: 'hi', totalPrice: 225.0 }]);
      expect(updatedInfo.body.taxRate).toStrictEqual(0.15);
      expect(updatedInfo.body.taxAmount).toStrictEqual(33.75);
      expect(updatedInfo.body.totalPayable).toStrictEqual(258.75);
      expect(updatedInfo.body.paymentDetails).toStrictEqual([{ bankName: 'CommBank', accountNumber: '123456788', bsbAbnNumber: '012-346', paymentMethod: 'direct_debit' }]);
    });
  });
});
