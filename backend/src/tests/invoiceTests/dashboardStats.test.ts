import {
  requestCreateInvoiceV2,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestDeleteInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
  requestDashboardStats,
} from '../../httpWrappers';

// ── Shared helper ─────────────────────────────────────────────────────────────

function createInvoice(): string {
  const res = requestCreateInvoiceV2(
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

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /v1/invoice/stats — getDashboardStats', () => {
  describe('Response shape', () => {
    test('returns 200 with all required status count fields', () => {
      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('draft');
      expect(res.body).toHaveProperty('converted');
      expect(res.body).toHaveProperty('validated');
      expect(res.body).toHaveProperty('finalised');
    });

    test('all count fields are non-negative integers', () => {
      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      for (const field of ['total', 'draft', 'converted', 'validated', 'finalised']) {
        expect(typeof res.body[field]).toBe('number');
        expect(Number.isInteger(res.body[field])).toBe(true);
        expect(res.body[field]).toBeGreaterThanOrEqual(0);
      }
    });

    test('total equals the sum of all status counts', () => {
      createInvoice();
      const id2 = createInvoice();
      requestConvertInvoice(id2);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      const { total, draft, converted, validated, finalised } = res.body;
      expect(total).toBe(draft + converted + validated + finalised);
    });
  });

  describe('Empty store', () => {
    test('returns all zeroes when no invoices exist', () => {
      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body).toStrictEqual({
        total: 0,
        draft: 0,
        converted: 0,
        validated: 0,
        finalised: 0,
      });
    });
  });

  describe('Draft count', () => {
    test('draft count increments by one after creating an invoice', () => {
      createInvoice();
      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.draft).toBe(1);
      expect(res.body.total).toBe(1);
    });

    test('draft count reflects multiple created invoices', () => {
      createInvoice();
      createInvoice();
      createInvoice();

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.draft).toBe(3);
      expect(res.body.total).toBe(3);
    });

    test('draft count decrements after a draft invoice is deleted', () => {
      const id1 = createInvoice();
      createInvoice();

      requestDeleteInvoice(id1);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.draft).toBe(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('Converted count', () => {
    test('converting an invoice moves it from draft to converted', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.draft).toBe(0);
      expect(res.body.converted).toBe(1);
      expect(res.body.total).toBe(1);
    });

    test('converted count reflects multiple converted invoices', () => {
      const id1 = createInvoice();
      const id2 = createInvoice();
      requestConvertInvoice(id1);
      requestConvertInvoice(id2);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.converted).toBe(2);
      expect(res.body.draft).toBe(0);
    });
  });

  describe('Validated count', () => {
    test('validating a converted invoice moves it from converted to validated', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.validated).toBe(1);
      expect(res.body.converted).toBe(0);
      expect(res.body.draft).toBe(0);
      expect(res.body.total).toBe(1);
    });

    test('validated count reflects multiple validated invoices', () => {
      const id1 = createInvoice();
      const id2 = createInvoice();
      requestConvertInvoice(id1);
      requestConvertInvoice(id2);
      requestValidateInvoice(id1);
      requestValidateInvoice(id2);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.validated).toBe(2);
      expect(res.body.converted).toBe(0);
    });
  });

  describe('Finalised count', () => {
    test('finalising a validated invoice moves it from validated to finalised', () => {
      const invoiceId = createInvoice();
      requestConvertInvoice(invoiceId);
      requestValidateInvoice(invoiceId);
      requestFinaliseInvoice(invoiceId);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.finalised).toBe(1);
      expect(res.body.validated).toBe(0);
      expect(res.body.converted).toBe(0);
      expect(res.body.draft).toBe(0);
      expect(res.body.total).toBe(1);
    });

    test('finalised count reflects multiple finalised invoices', () => {
      const id1 = createInvoice();
      const id2 = createInvoice();
      requestConvertInvoice(id1);
      requestConvertInvoice(id2);
      requestValidateInvoice(id1);
      requestValidateInvoice(id2);
      requestFinaliseInvoice(id1);
      requestFinaliseInvoice(id2);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.finalised).toBe(2);
      expect(res.body.total).toBe(2);
    });
  });

  describe('Mixed statuses', () => {
    test('counts are accurate across a mix of all four statuses', () => {
      // 2 drafts
      createInvoice();
      createInvoice();

      // 1 converted
      const c1 = createInvoice();
      requestConvertInvoice(c1);

      // 1 validated
      const v1 = createInvoice();
      requestConvertInvoice(v1);
      requestValidateInvoice(v1);

      // 1 finalised
      const f1 = createInvoice();
      requestConvertInvoice(f1);
      requestValidateInvoice(f1);
      requestFinaliseInvoice(f1);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body).toStrictEqual({
        total: 5,
        draft: 2,
        converted: 1,
        validated: 1,
        finalised: 1,
      });
    });

    test('deleting a draft does not affect converted, validated, or finalised counts', () => {
      const draftId = createInvoice();

      const converted = createInvoice();
      requestConvertInvoice(converted);

      const finalised = createInvoice();
      requestConvertInvoice(finalised);
      requestValidateInvoice(finalised);
      requestFinaliseInvoice(finalised);

      requestDeleteInvoice(draftId);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      expect(res.body.draft).toBe(0);
      expect(res.body.converted).toBe(1);
      expect(res.body.finalised).toBe(1);
      expect(res.body.total).toBe(2);
    });

    test('total always equals draft + converted + validated + finalised regardless of mix', () => {
      createInvoice();
      const c = createInvoice();
      requestConvertInvoice(c);
      const v = createInvoice();
      requestConvertInvoice(v);
      requestValidateInvoice(v);

      const res = requestDashboardStats();

      expect(res.statusCode).toBe(200);
      const { total, draft, converted, validated, finalised } = res.body;
      expect(total).toBe(draft + converted + validated + finalised);
    });

    test('stats update correctly after a full pipeline on one invoice', () => {
      const invoiceId = createInvoice();

      let res = requestDashboardStats();
      expect(res.body).toStrictEqual({ total: 1, draft: 1, converted: 0, validated: 0, finalised: 0 });

      requestConvertInvoice(invoiceId);
      res = requestDashboardStats();
      expect(res.body).toStrictEqual({ total: 1, draft: 0, converted: 1, validated: 0, finalised: 0 });

      requestValidateInvoice(invoiceId);
      res = requestDashboardStats();
      expect(res.body).toStrictEqual({ total: 1, draft: 0, converted: 0, validated: 1, finalised: 0 });

      requestFinaliseInvoice(invoiceId);
      res = requestDashboardStats();
      expect(res.body).toStrictEqual({ total: 1, draft: 0, converted: 0, validated: 0, finalised: 1 });
    });
  });
});
