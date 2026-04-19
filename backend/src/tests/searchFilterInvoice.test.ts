import {
  requestCreateInvoice,
  requestListInvoice,
  requestConvertInvoice,
  requestValidateInvoice,
  requestFinaliseInvoice,
  requestClear,
  requestUserRegister,
  setSessionToken,
  clearSessionToken,
} from '../httpWrappers';
import { InvoiceItem, PaymentDetails, InvoiceOverrides } from '../invoiceInterface';

const validItems = (price = 500.00): InvoiceItem[] => [
  {
    itemName: 'Services',
    quantity: 1,
    unitPrice: price,
    unitCode: 'HUR',
    totalPrice: price,
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

function createInv(overrides: InvoiceOverrides = {}): string {
  const res = requestCreateInvoice(
    overrides.buyerName ?? 'Acme Corp',
    '12345678901',
    overrides.supplierName ?? 'GitGood Pty Ltd',
    '98765432100',
    '2025-03-12',
    '2025-04-12',
    validItems(overrides.price),
    0.1,
    validPayment
  );
  return res.body.invoiceId;
}

beforeEach(() => {
  requestClear();
  clearSessionToken();
  const res = requestUserRegister('test@example.com', 'password1', 'Test User');
  setSessionToken(res.body.session);
});

describe('GET /v1/invoice — Advanced Search and Filtering', () => {
  describe('Filter by Status', () => {
    test('returns only invoices matching the status "draft"', () => {
      createInv(); // Draft
      const finalId = createInv();
      requestConvertInvoice(finalId);
      requestValidateInvoice(finalId);
      requestFinaliseInvoice(finalId);

      const res = requestListInvoice({ status: 'draft' });
      expect(res.statusCode).toBe(200);
      expect(res.body.invoices.every((i: { status: string }) => i.status === 'draft')).toBe(true);
      expect(res.body.total).toBe(1);
    });
  });

  describe('Filter by Names (Buyer/Supplier)', () => {
    test('filters by buyerName correctly', () => {
      createInv({ buyerName: 'Unique Buyer' });
      createInv({ buyerName: 'Other Corp' });

      const res = requestListInvoice({ buyerName: 'Unique Buyer' });
      expect(res.body.total).toBe(1);
      expect(res.body.invoices[0].buyerName).toBe('Unique Buyer');
    });

    test('filters by supplierName correctly', () => {
      createInv({ supplierName: 'Specialist Supplies' });

      const res = requestListInvoice({ supplierName: 'Specialist Supplies' });
      expect(res.body.total).toBe(1);
    });
  });

  describe('Filter by Amount Ranges (minAmount/maxAmount)', () => {
    test('returns invoices within a specific price range', () => {
      createInv({ price: 100 });
      createInv({ price: 500 });
      createInv({ price: 1000 });

      const res = requestListInvoice({ minAmount: 200, maxAmount: 600 });
      expect(res.body.total).toBe(1);

      expect(res.body.invoices[0].totalPayable).toBe(550);
    });

    test('returns 400 for invalid amount values (non-numeric strings)', () => {
      // @ts-expect-error because an error is expected
      const res = requestListInvoice({ minAmount: 'invalid-price' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Keyword Search', () => {
    test('finds invoice by keyword in buyerName or supplierName', () => {
      createInv({ buyerName: 'Cyberdyne Systems' });
      createInv({ buyerName: 'Weyland-Yutani' });

      const res = requestListInvoice({ search: 'Cyber' });
      expect(res.body.total).toBe(1);
      expect(res.body.invoices[0].buyerName).toContain('Cyberdyne');
    });
  });

  describe('Pagination & Combinations', () => {
    test('combines status and search with pagination', () => {
      createInv({ buyerName: 'Apple', price: 100 });
      createInv({ buyerName: 'Apple', price: 200 });
      createInv({ buyerName: 'Banana', price: 100 });

      const res = requestListInvoice({
        search: 'Apple',
        page: 1,
        limitPerPage: 1
      });

      expect(res.body.total).toBe(2); // Two Apple invoices
      expect(res.body.invoices).toHaveLength(1); // But only one per page
    });
  });
});
