import {
  requestListInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
} from '../httpWrappers';

const error = { error: expect.any(String), message: expect.any(String) };

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
});

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

    test('returns 200 with valid fromDate and toDate', () => {
      const res = requestListInvoice('2024-01-01', '2026-12-31', undefined, undefined);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('invoices');
      expect(Array.isArray(res.body.invoices)).toBe(true);
    });

    test('returns 200 with valid page and limitPerPage', () => {
      const res = requestListInvoice(undefined, undefined, 1, 5);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('page');
    });
  });

  // date range errors
  describe('Date Range Errors', () => {
    test('returns 400 when fromDate is after toDate', () => {
      const res = requestListInvoice('2026-01-01', '2024-01-01');

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });

    test('returns 400 when toDate is before fromDate', () => {
      const res = requestListInvoice('2026-06-01', '2024-01-01');

      expect(res.statusCode).toBe(400);
      expect(res.body).toStrictEqual(error);
    });
  });
});
