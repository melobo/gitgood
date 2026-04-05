import {
  validateName,
  validateABN,
  validateDates,
  validateItem,
  validateItems,
  validateTotalPayable,
  validatePaymentDetails,
} from '../validation';
import { ServerError, errorToStatus, handleError } from '../errors';
import { Response } from 'express';

// ── validateName ──────────────────────────────────────────────────────────────

describe('validateName', () => {
  test('accepts valid buyer name', () => {
    expect(() => validateName('John Smith', 'BUYER')).not.toThrow();
  });

  test('accepts name with hyphen and apostrophe', () => {
    expect(() => validateName("O'Brien-Smith", 'SUPPLIER')).not.toThrow();
  });

  test('throws on invalid characters', () => {
    expect(() => validateName('John!!!', 'BUYER')).toThrow(ServerError);
  });

  test('throws for supplier with invalid characters', () => {
    expect(() => validateName('ACME@Corp', 'SUPPLIER')).toThrow(ServerError);
  });
});

// ── validateABN ───────────────────────────────────────────────────────────────

describe('validateABN', () => {
  test('accepts valid 11-digit ABN', () => {
    expect(() => validateABN('12345678901', 'BUYER')).not.toThrow();
  });

  test('throws on ABN too short', () => {
    expect(() => validateABN('1234567890', 'BUYER')).toThrow(ServerError);
  });

  test('throws on ABN too long', () => {
    expect(() => validateABN('123456789012', 'SUPPLIER')).toThrow(ServerError);
  });
});

// ── validateDates ─────────────────────────────────────────────────────────────

describe('validateDates', () => {
  test('accepts valid dates', () => {
    expect(() => validateDates('2025-01-01', '2025-02-01')).not.toThrow();
  });

  test('throws on invalid issue date', () => {
    expect(() => validateDates('not-a-date', '2025-02-01')).toThrow(ServerError);
  });

  test('throws on invalid payment due date', () => {
    expect(() => validateDates('2025-01-01', 'not-a-date')).toThrow(ServerError);
  });

  test('throws when issue date is in the future', () => {
    expect(() => validateDates('2099-01-01', '2099-02-01')).toThrow(ServerError);
  });

  test('throws when payment due date is before issue date', () => {
    expect(() => validateDates('2025-02-01', '2025-01-01')).toThrow(ServerError);
  });
});

// ── validateItem ──────────────────────────────────────────────────────────────

describe('validateItem', () => {
  test('accepts valid item', () => {
    expect(() => validateItem({ itemName: 'Widget', quantity: 2, unitPrice: 50, unitCode: 'ea', totalPrice: 100 })).not.toThrow();
  });

  test('throws on zero quantity', () => {
    expect(() => validateItem({ itemName: 'Widget', quantity: 0, unitPrice: 50, unitCode: 'ea', totalPrice: 0 })).toThrow(ServerError);
  });

  test('throws on negative quantity', () => {
    expect(() => validateItem({ itemName: 'Widget', quantity: -1, unitPrice: 50, unitCode: 'ea', totalPrice: -50 })).toThrow(ServerError);
  });

  test('throws on negative unit price', () => {
    expect(() => validateItem({ itemName: 'Widget', quantity: 2, unitPrice: -50, unitCode: 'ea', totalPrice: -100 })).toThrow(ServerError);
  });

  test('throws on negative total price', () => {
    expect(() => validateItem({ itemName: 'Widget', quantity: 2, unitPrice: 50, unitCode: 'ea', totalPrice: -100 })).toThrow(ServerError);
  });

  test('throws on inconsistent total price', () => {
    expect(() => validateItem({ itemName: 'Widget', quantity: 2, unitPrice: 50, unitCode: 'ea', totalPrice: 999 })).toThrow(ServerError);
  });
});

// ── validateItems ─────────────────────────────────────────────────────────────

describe('validateItems', () => {
  test('accepts valid items and returns sum', () => {
    const result = validateItems([
      { itemName: 'A', quantity: 2, unitPrice: 50, unitCode: 'ea', totalPrice: 100 },
      { itemName: 'B', quantity: 1, unitPrice: 25, unitCode: 'ea', totalPrice: 25 },
    ]);
    expect(result.sum).toBe(125);
  });

  test('throws on empty items array', () => {
    expect(() => validateItems([])).toThrow(ServerError);
  });
});

// ── validateTotalPayable ──────────────────────────────────────────────────────

describe('validateTotalPayable', () => {
  test('accepts valid totals', () => {
    expect(() => validateTotalPayable(100, 0.1, 10, 110)).not.toThrow();
  });

  test('throws on negative tax rate', () => {
    expect(() => validateTotalPayable(100, -0.1, -10, 90)).toThrow(ServerError);
  });

  test('throws on tax rate above 1', () => {
    expect(() => validateTotalPayable(100, 1.5, 150, 250)).toThrow(ServerError);
  });

  test('throws on inconsistent tax amount', () => {
    expect(() => validateTotalPayable(100, 0.1, 99, 199)).toThrow(ServerError);
  });

  test('throws on inconsistent total payable', () => {
    expect(() => validateTotalPayable(100, 0.1, 10, 999)).toThrow(ServerError);
  });
});

// ── validatePaymentDetails ────────────────────────────────────────────────────

describe('validatePaymentDetails', () => {
  test('accepts valid payment details', () => {
    expect(() => validatePaymentDetails([
      { bankName: 'ANZ', accountNumber: '123456789', bsbAbnNumber: '012-345', paymentMethod: 'bank_transfer' },
    ])).not.toThrow();
  });

  test('throws on empty payment details', () => {
    expect(() => validatePaymentDetails([])).toThrow(ServerError);
  });

  test('throws on invalid bank name', () => {
    expect(() => validatePaymentDetails([
      { bankName: 'FakeBank', accountNumber: '123456789', bsbAbnNumber: '012-345', paymentMethod: 'bank_transfer' },
    ])).toThrow(ServerError);
  });

  test('throws on invalid payment method', () => {
    expect(() => validatePaymentDetails([
      { bankName: 'ANZ', accountNumber: '123456789', bsbAbnNumber: '012-345', paymentMethod: 'cash' },
    ])).toThrow(ServerError);
  });

  test('throws on invalid BSB format', () => {
    expect(() => validatePaymentDetails([
      { bankName: 'ANZ', accountNumber: '123456789', bsbAbnNumber: '01-2345', paymentMethod: 'bank_transfer' },
    ])).toThrow(ServerError);
  });

  test('throws on non-numeric account number', () => {
    expect(() => validatePaymentDetails([
      { bankName: 'ANZ', accountNumber: 'ABCDEFGHI', bsbAbnNumber: '012-345', paymentMethod: 'bank_transfer' },
    ])).toThrow(ServerError);
  });
});

// ── errorToStatus ─────────────────────────────────────────────────────────────

describe('errorToStatus', () => {
  test.each([
    ['UNAUTHORIZED', 401],
    ['INVALID_REQUEST', 400],
    ['NOT_FOUND', 404],
    ['INSUFFICIENT_DATA', 422],
    ['CONFLICT', 409],
    ['ALREADY_FINALISED', 409],
    ['ALREADY_CONVERTED', 409],
    ['INVOICE_NOT_CONVERTED', 409],
    ['INVOICE_NOT_VALIDATED', 409],
    ['INVOICE_NOT_READY', 409],
    ['INTERNAL_SERVER_ERROR', 500],
  ])('%s → %i', (error, status) => {
    expect(errorToStatus(error)).toBe(status);
  });

  test('throws on unknown error type', () => {
    expect(() => errorToStatus('UNKNOWN_ERROR')).toThrow();
  });
});

// ── handleError ───────────────────────────────────────────────────────────────

describe('handleError', () => {
  const mockRes = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { res: { status } as unknown as Response, json, status };
  };

  test('handles ServerError correctly', () => {
    const { res, status, json } = mockRes();
    handleError(res, new ServerError('NOT_FOUND', 'Not found'));
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'NOT_FOUND', message: 'Not found' });
  });

  test('rethrows unrecognised errors', () => {
    const { res } = mockRes();
    expect(() => handleError(res, new Error('unexpected'))).toThrow('unexpected');
  });
});
