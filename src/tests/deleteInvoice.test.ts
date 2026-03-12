import request from 'sync-request-curl';
import { requestDeleteInvoice } from '../httpWrappers';

const SERVER_URL = 'https://gitgood-invoice-api.onrender.com/v1';
const TIMEOUT_MS = 5 * 1000;
const API_KEY = process.env.API_KEY;

const error = { error: expect.any(String) };
const headers = { 'x-api-key': API_KEY };

// creating a valid draft invoice
function createInvoice(): string {
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
}

/*  // delete invoice by id
function deleteInvoice(invoiceId: string): any {
 return request('DELETE', SERVER_URL + `/invoice/${invoiceId}`, {
   headers,
   timeout: TIMEOUT_MS,
 });
} */

describe('DELETE /invoice/{invoice_id} — deleteInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 and confirmation message when deleting a draft invoice', () => {
      const invoiceId = createInvoice();

      const res = requestDeleteInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body.toString());
      expect(body).toHaveProperty('invoice_id', invoiceId);
      expect(body).toHaveProperty('message');
      expect(typeof body.message).toBe('string');
    });

    test('deleted invoice is no longer retrievable', () => {
      const invoiceId = createInvoice();
      requestDeleteInvoice(invoiceId);

      const getRes = request('GET', SERVER_URL + `/invoice/${invoiceId}`, {
        headers,
        timeout: TIMEOUT_MS,
      });

      expect(getRes.statusCode).toBe(404);
    });
  });

  describe('Not Found', () => {
    test('returns 404 when deleting an already deleted invoice', () => {
      const invoiceId = createInvoice();
      requestDeleteInvoice(invoiceId);

      const res = requestDeleteInvoice(invoiceId);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });

    test('returns 404 when deleting an invoice that never existed (plausible-looking ID)', () => {
      const res = requestDeleteInvoice('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });
  });

  describe('Invalid ID', () => {
    test('returns 400 for a completely invalid invoice ID format', () => {
      const res = requestDeleteInvoice('!!!invalid-id!!!');

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });

    test('returns 400 for an empty string invoice ID', () => {
      const res = requestDeleteInvoice('   ');

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });
  });
});
