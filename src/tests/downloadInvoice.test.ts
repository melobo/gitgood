import request from 'sync-request-curl';


const SERVER_URL = 'https://gitgood-invoice-api.onrender.com/v1';
const TIMEOUT_MS = 5 * 1000;
const API_KEY = process.env.API_KEY;


const error = { error: expect.any(String) };
const headers = { 'x-api-key': API_KEY };


//creating a valid draft invoice
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


//convert validate and finalise invoice requests
function createFinalisedInvoice(): string {
 const invoiceId = createInvoice();


 request('POST', SERVER_URL + `/invoice/${invoiceId}/convert`, { headers, timeout: TIMEOUT_MS });
 request('POST', SERVER_URL + `/invoice/${invoiceId}/validate`, { headers, timeout: TIMEOUT_MS });
 request('POST', SERVER_URL + `/invoice/${invoiceId}/final`, { headers, timeout: TIMEOUT_MS });


 return invoiceId;
}


// downloading invoice
function downloadInvoice(invoiceId: string, format?: string): any {
 const query = format ? `?format=${format}` : '';
 return request('GET', SERVER_URL + `/invoice/${invoiceId}/download${query}`, {
   headers,
   timeout: TIMEOUT_MS,
 });
}


describe('GET /invoice/{invoice_id}/download — downloadInvoice', () => {
 describe('Successful cases', () => {
   test('returns 200 when downloading a finalised invoice as xml (default)', () => {
     const invoiceId = createFinalisedInvoice();


     const res = downloadInvoice(invoiceId, 'xml');
     expect(res.statusCode).toBe(200);
   });


   test('returns 200 when downloading a finalised invoice as json', () => {
     const invoiceId = createFinalisedInvoice();


     const res = downloadInvoice(invoiceId, 'json');
     expect(res.statusCode).toBe(200);
   });


   test('returns 200 with no format param (uses default xml)', () => {
     const invoiceId = createFinalisedInvoice();


     const res = downloadInvoice(invoiceId);
     expect(res.statusCode).toBe(200);
   });
 });


 describe('Invalid Format', () => {
   test('returns 400 for unsupported format value', () => {
     const invoiceId = createFinalisedInvoice();


     const res = downloadInvoice(invoiceId, 'pdf');


     expect(res.statusCode).toBe(400);
     expect(JSON.parse(res.body.toString())).toStrictEqual(error);
   });


   test('returns 400 for completely invalid format string', () => {
     const invoiceId = createFinalisedInvoice();


     const res = downloadInvoice(invoiceId, 'invalidformat');


     expect(res.statusCode).toBe(400);
     expect(JSON.parse(res.body.toString())).toStrictEqual(error);
   });
 });


 describe('Not Ready', () => {
   test('returns 409 when attempting to download a draft invoice', () => {
     const invoiceId = createInvoice();


     const res = downloadInvoice(invoiceId, 'xml');


     expect(res.statusCode).toBe(409);
     expect(JSON.parse(res.body.toString())).toStrictEqual(error);
   });


   test('returns 409 when attempting to download a converted (not finalised) invoice', () => {
     const invoiceId = createInvoice();
     request('POST', SERVER_URL + `/invoice/${invoiceId}/convert`, { headers, timeout: TIMEOUT_MS });


     const res = downloadInvoice(invoiceId, 'xml');


     expect(res.statusCode).toBe(409);
     expect(JSON.parse(res.body.toString())).toStrictEqual(error);
   });
 });


 describe('Not Found', () => {
   test('returns 404 for a well-formed but non-existent invoice ID', () => {
     const res = downloadInvoice('00000000-0000-0000-0000-000000000000', 'xml');


     expect(res.statusCode).toBe(404);
     expect(JSON.parse(res.body.toString())).toStrictEqual(error);
   });
 });
});

