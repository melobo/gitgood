import request from 'sync-request-curl';
import { requestConvertInvoice, requestValidateInvoice, requestFinaliseInvoice } from '../httpWrappers';

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

/*  // convert invoice usign id
function convertInvoice(invoiceId: string): void {
 request('POST', SERVER_URL + `/invoice/${invoiceId}/convert`, {
   headers,
   timeout: TIMEOUT_MS,
 });
} */

/*  // validate invoice using id
function validateInvoice(invoiceId: string): void {
 request('POST', SERVER_URL + `/invoice/${invoiceId}/validate`, {
   headers,
   timeout: TIMEOUT_MS,
 });
} */

/*  // finalise invoice using id
function finaliseInvoice(invoiceId: string): any {
 return request('POST', SERVER_URL + `/invoice/${invoiceId}/final`, {
   headers,
   timeout: TIMEOUT_MS,
 });
} */

describe('POST /invoice/{invoice_id}/final — finaliseInvoice', () => {
  describe('Successful cases', () => {
    test('returns 200 and status "finalised" for a validated invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestFinaliseInvoice(invoiceId);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body.toString());
      expect(body).toHaveProperty('invoice_id', invoiceId);
      expect(body).toHaveProperty('status', 'finalised');
      expect(body).toHaveProperty('ubl_xml');
      expect(body).toHaveProperty('finalised_at');
    });
  });

  describe('Sequence Errors', () => {
    test('returns 409 when finalising a draft invoice (not yet validated)', () => {
      const invoiceId = createInvoice();

      const res = requestFinaliseInvoice(invoiceId);

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });

    test('returns 409 when finalising a converted but not validated invoice', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestFinaliseInvoice(invoiceId);

      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });
  });

  describe('Not Found', () => {
    test('returns 404 for a well-formed but non-existent invoice ID', () => {
      const res = requestFinaliseInvoice('00000000-0000-0000-0000-000000000000');

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body.toString())).toStrictEqual(error);
    });
  });
});
