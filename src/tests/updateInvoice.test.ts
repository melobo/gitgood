// import request from 'sync-request-curl';
import { Invoice, /* InvoiceStatus, */ HttpReturnObject } from '../invoiceInterface';
import { /* requestClear, */ requestCreateInvoice, requestGetInvoice, requestUpdateInvoice } from '../httpWrappers';

/*  beforeEach(() => {
  requestClear();
}); */

// const SERVER_URL = 'https://gitgood-invoice-api.onrender.com/v1';
// const TIMEOUT_MS = 5 * 1000;
// const API_KEY = process.env.API_KEY;
// const error = { error: expect.any(String) };
// const headers = { 'x-api-key': API_KEY };

// creating a valid draft invoice
/*  function createInvoice(): string {
  const res = request('POST', SERVER_URL + '/invoice', {
    json: {
      buyer_name: 'Test Buyer',
      buyer_abn: '12345678901',
      supplier_name: 'Test Supplier',
      supplier_abn: '98765432101',
      issue_date: '2025-01-01',
      payment_due_date: '2025-02-01',
      items_list: [
        {
          item_name: 'item',
          quantity: 2,
          unit_price: 50.0,
          unit_code: 'ea',
          total_price: 100.0,
        },
      ],
      tax_rate: 0.1,
      payment_details: [
        {
          bank_name: 'ANZ',
          account_number: '123456789',
          bsb_abn_number: '012-345',
          payment_method: 'bank_transfer',
        },
      ],
    },
    headers,
    timeout: TIMEOUT_MS,
  });
  return JSON.parse(res.body.toString()).invoice_id;
} */

function createInvoice(): string {
  const res = requestCreateInvoice(
    'Test Buyer',
    '12345678901',
    'Test Supplier',
    '98765432101',
    new Date('2025-01-01'),
    new Date('2025-02-01'),
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

describe('PUT /v1/invoice/:invoice_id', () => {
  describe('error cases', () => {
    test('NOT_FOUND - invoice not found', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId + 9999, { buyer_name: 'New Test Buyer' });
      expect(res.statusCode).toStrictEqual(404);
      expect(res.body).toStrictEqual({
        error: 'NOT_FOUND',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - buyer name contains invalid characters', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { buyer_name: 'New Test Buyer!!!!' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - buyer ABN is <11 digits long', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { buyer_abn: '1234567890' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - buyer ABN is >11 digits long', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { buyer_abn: '12345678901233' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - supplier name contains invalid characters', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { supplier_name: 'New Test Supplier :PP' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - supplier ABN is <11 digits long', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { supplier_abn: '9876543210' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - supplier ABN is >11 digits long', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { supplier_abn: '9876543210111' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - issue date is of an invalid format', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { issue_date: new Date('not-a-date') });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - issue date is after payment date', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { issue_date: new Date('2025-02-03') });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - payment date is of an invalid format', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { payment_date: new Date('not-a-date') });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - payment date is before issue date', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { payment_date: new Date('2024-01-01') });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (name)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { item_details: [{ item_name: 'updated item!!!!! hehe' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (quantity)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { item_details: [{ quantity: -5 }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (quantity)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { item_details: [{ quantity: 'two' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (unit_price)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { item_details: [{ unit_price: 59 }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (unit_price)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { item_details: [{ unit_price: 'fifty' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (unit_price)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res1 = requestUpdateInvoice(invoiceId, { item_details: [{ unit_code: 'ea!!/!!' }] });
      expect(res1.statusCode).toStrictEqual(400);
      expect(res1.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });

      const res2 = requestUpdateInvoice(invoiceId, { item_details: [{ unit_code: 30 }] });
      expect(res2.statusCode).toStrictEqual(400);
      expect(res2.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are invalid (total_price)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { item_details: [{ unit_price: 150 }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - new item details are of an invalid format (total_price)', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { item_details: [{ unit_price: 'one-hundred' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - tax rate is of an invalid format', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { tax_rate: '10 percent' });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - invalid bank_name', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { payment_details: [{ bank_name: 'fake-bank' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });

    test('INVALID_REQUEST - invalid payment_method', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const res = requestUpdateInvoice(invoiceId, { payment_details: [{ payment_method: 'scam' }] });
      expect(res.statusCode).toStrictEqual(400);
      expect(res.body).toStrictEqual({
        error: 'INVALID_REQUEST',
        message: expect.any(String)
      });
    });
  });

  describe('success cases', () => {
    test('successfully updates all invoice fields', () => {
      /*  const invoice = requestCreateInvoice('Test Buyer', '12345678901', 'Test Supplier', '98765432101', new Date('2025-01-01'), new Date('2025-02-01'),
        [{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }], 0.1, [{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]) as HttpReturnObject<{ invoice_id: string; status: InvoiceStatus; created_at: string }>;
      expect(invoice.statusCode).toStrictEqual(201);  */
      const invoiceId = createInvoice();

      const beforeUpdate = requestGetInvoice(invoiceId) as HttpReturnObject<Invoice>;

      expect(beforeUpdate.body.status).toStrictEqual('draft');
      expect(beforeUpdate.body.buyer_name).toStrictEqual('Test Buyer');
      expect(beforeUpdate.body.buyer_abn).toStrictEqual('12345678901');
      expect(beforeUpdate.body.supplier_name).toStrictEqual('Test Supplier');
      expect(beforeUpdate.body.supplier_abn).toStrictEqual('98765432101');
      expect(beforeUpdate.body.issue_date).toStrictEqual(new Date('2025-01-01'));
      expect(beforeUpdate.body.payment_due_date).toStrictEqual(new Date('2025-02-01'));
      expect(beforeUpdate.body.items_list).toStrictEqual([{ item_name: 'item', quantity: 2, unit_price: 50.0, unit_code: 'ea', total_price: 100.0 }]);
      expect(beforeUpdate.body.tax_rate).toStrictEqual(0.1);
      expect(beforeUpdate.body.tax_amount).toStrictEqual(10);
      expect(beforeUpdate.body.total_payable).toStrictEqual(110);
      expect(beforeUpdate.body.payment_details).toStrictEqual([{ bank_name: 'ANZ', account_number: '123456789', bsb_abn_number: '012-345', payment_method: 'bank_transfer' }]);
      // expect(beforeUpdate.body.created_at).toStrictEqual(invoice.body.created_at);
      // expect(beforeUpdate.body.updated_at).toStrictEqual(invoice.body.created_at);

      const res = requestUpdateInvoice(invoiceId, { buyer_name: 'New Test Buyer', buyer_abn: '12345678902', supplier_name: 'New Test Supplier', supplier_abn: '98765432102', issue_date: new Date('2025-01-02'), payment_date: new Date('2025-02-02'), item_details: [{ item_name: 'new item', quantity: 3, unit_price: 75.0, unit_code: 'hi', total_price: 225.0 }], tax_rate: 0.15, payment_details: [{ bank_name: 'COMMBANK', account_number: '123456788', bsb_abn_number: '012-346', payment_method: 'direct_debit' }] }) as HttpReturnObject<{ invoice_id: string; status: string; updated_at: string }>;
      expect(res.statusCode).toStrictEqual(200);

      const updatedInfo = requestGetInvoice(invoiceId) as HttpReturnObject<Invoice>;
      expect(updatedInfo.body.status).toStrictEqual('draft');
      expect(updatedInfo.body.buyer_name).toStrictEqual('New Test Buyer');
      expect(updatedInfo.body.buyer_abn).toStrictEqual('12345678902');
      expect(updatedInfo.body.supplier_name).toStrictEqual('New Test Supplier');
      expect(updatedInfo.body.supplier_abn).toStrictEqual('98765432102');
      expect(updatedInfo.body.issue_date).toStrictEqual(new Date('2025-01-02'));
      expect(updatedInfo.body.payment_due_date).toStrictEqual(new Date('2025-02-02'));
      expect(updatedInfo.body.items_list).toStrictEqual([{ item_name: 'new item', quantity: 3, unit_price: 75.0, unit_code: 'hi', total_price: 225.0 }]);
      expect(updatedInfo.body.tax_rate).toStrictEqual(0.15);
      expect(updatedInfo.body.tax_amount).toStrictEqual(33.75);
      expect(updatedInfo.body.total_payable).toStrictEqual(258.75);
      expect(updatedInfo.body.payment_details).toStrictEqual([{ bank_name: 'COMMBANK', account_number: '123456788', bsb_abn_number: '012-346', payment_method: 'direct_debit' }]);
      // expect(updatedInfo.body.created_at).toStrictEqual(invoice.body.created_at);
      // expect(updatedInfo.body.updated_at).toStrictEqual(res.body.updated_at);
    });
  });
});
