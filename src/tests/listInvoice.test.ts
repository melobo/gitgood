// import request from 'sync-request-curl';
import { /* requestCreateInvoice, */ requestListInvoice } from '../httpWrappers';

// const SERVER_URL = 'https://gitgood-invoice-api.onrender.com/v1';
// const TIMEOUT_MS = 5 * 1000;
// const API_KEY = process.env.API_KEY;

const error = { error: expect.any(String) };
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

/*  function createInvoice(): string {
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
} */

describe('GET /invoice — listInvoices', () => {
  // successful case
  describe('Successful cases', () => {
    test('returns 200 with valid parameters (no filters)', () => {
      const res = requestListInvoice();

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoices');
      expect(Array.isArray(res.body.invoices)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
    });

    test('returns 200 with valid from_date and to_date', () => {
      // createInvoice();

      const res = requestListInvoice('2024-01-01', '2026-12-31', undefined, undefined);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoices');
      expect(Array.isArray(res.body.invoices)).toBe(true);
    });

    test('returns 200 with valid page and limit_per_page', () => {
      /*  const res = request('GET', SERVER_URL + '/invoice?page=1&limit_per_page=5', {
        headers,
        timeout: TIMEOUT_MS,
      }); */

      const res = requestListInvoice(undefined, undefined, 1, 5);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('page');
    });
  });

  // date range errors
  describe('Date Range Errors', () => {
    test('returns 400 when from_date is after to_date', () => {
      const res = requestListInvoice('2026-01-01', '2024-01-01');
      /*  const res = request('GET', SERVER_URL + '/invoice?from_date=2026-01-01&to_date=2024-01-01', {
        headers,
        timeout: TIMEOUT_MS,
      }); */

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });

    test('returns 400 when to_date is before from_date', () => {
      const res = requestListInvoice('2026-06-01', '2024-01-01');
      /*  const res = request('GET', SERVER_URL + '/invoice?from_date=2025-06-01&to_date=2025-01-01', {
        headers,
        timeout: TIMEOUT_MS,
      }); */

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
  });

  // type mismatch errors
  /* describe('Type Mismatch Errors', () => {
    test('returns 400 when page is a string instead of integer', () => {
      const res = requestListInvoice(undefined, undefined, 'abc');
      const res = request('GET', SERVER_URL + '/invoice?page=abc', {
        headers,
        timeout: TIMEOUT_MS,
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });
  }); */
});
