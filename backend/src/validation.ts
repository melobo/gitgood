import validator from 'validator';
import { ServerError } from './errors';
import {
  MIN_PASSWORD_LENGTH,
  User,
  validBanks,
  validPaymentMethods,
  ValidateItemsResponse,
  InvoiceItem,
  PaymentDetails
} from './invoiceInterface';
import { getSession } from './dynamoService';

export function validateName(
  name: string, type: 'BUYER' | 'SUPPLIER'
) {
  const validChars = /^[a-zA-Z \-']+$/;
  if (!validChars.test(name) || /\d/g.test(name)) {
    throw new ServerError(
      'INVALID_REQUEST',
      `The ${type.toLowerCase()} name provided contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed.`
    );
  }
};

export function validateABN(
  abn: string, type: 'BUYER' | 'SUPPLIER'
) {
  if (Number(abn) < 10000000000 || Number(abn) > 99999999999) {
    throw new ServerError(
      'INVALID_REQUEST',
      `The ${type.toLowerCase()} ABN provided is invalid. It must have 11 digits.`
    );
  }
};

export function validateDates(
  issueDateString: string,
  paymentDueDateString: string
): void {
  const issueDate = new Date(issueDateString);
  const paymentDueDate = new Date(paymentDueDateString);
  const current = new Date();

  if (isNaN(issueDate.getTime())) {
    throw new ServerError(
      'INVALID_REQUEST',
      'The provided issue date is invalid. It must be in YYYY-MM-DD format.'
    );
  }

  if (isNaN(paymentDueDate.getTime())) {
    throw new ServerError(
      'INVALID_REQUEST',
      'The provided payment due date is invalid. It must be in YYYY-MM-DD format.'
    );
  }

  if (issueDate.setHours(0, 0, 0, 0) > current.setHours(0, 0, 0, 0)) {
    throw new ServerError(
      'INVALID_REQUEST',
      'The provided issue date cannot be in the future.'
    );
  }

  if (paymentDueDate < issueDate) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Payment due date must be on or after issue date.'
    );
  }
};

export function validateItem(item: InvoiceItem) {
  if (item.quantity <= 0) {
    throw new ServerError(
      'INSUFFICIENT_DATA',
      `Item quantity must be > 0; ${item.itemName}.`
    );
  }

  if (item.unitPrice < 0 || item.totalPrice < 0) {
    throw new ServerError(
      'INSUFFICIENT_DATA',
      `Item prices cannot be negative; ${item.itemName}.`
    );
  }

  if (parseFloat((item.quantity * item.unitPrice).toFixed(2)) !== item.totalPrice) {
    throw new ServerError('INSUFFICIENT_DATA', `Invoice totals are inconsistent. Item totals must equal quantity * unitPrice; ${item.itemName}.`);
  }
};

export function validateItems(items: InvoiceItem[]): ValidateItemsResponse {
  if (items.length === 0) {
    throw new ServerError(
      'INSUFFICIENT_DATA',
      'Invoice must contain at least one item.'
    );
  }

  let sum = 0;
  for (const item of items) {
    validateItem(item);
    sum += item.totalPrice;
  }

  return { sum };
};

export function validateTotalPayable(sum: number, taxRate: number, taxAmount: number, totalPayable: number) {
  if (taxRate < 0 || taxRate > 1) {
    throw new ServerError(
      'INSUFFICIENT_DATA',
      'Tax rate must be a positive decimal value.');
  }

  if (parseFloat((sum * taxRate).toFixed(2)) !== taxAmount) {
    throw new ServerError('INSUFFICIENT_DATA', 'Tax amount on the invoice is inconsistent per the item totals.');
  }

  if (parseFloat((sum + taxAmount).toFixed(2)) !== totalPayable) {
    throw new ServerError('INSUFFICIENT_DATA', 'Invoice totals are inconsistent. Total payable must equal item totals * (1 + taxRate).');
  }
};

export function validatePaymentDetails(paymentDetails: PaymentDetails[]) {
  if (paymentDetails.length === 0) {
    throw new ServerError(
      'INSUFFICIENT_DATA',
      'Invoice must contain at least one payment detail.'
    );
  }

  for (const detail of paymentDetails) {
    if (!validBanks.includes(detail.bankName)) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `Payment details on invoice include an invalid bank name; ${detail.bankName}.`
      );
    }

    if (!validPaymentMethods.includes(detail.paymentMethod)) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `Payment details on invoice include an invalid payment method; ${detail.paymentMethod}.`
      );
    }

    const digits = detail.bsbAbnNumber.replace(/-/g, '');
    if (detail.bsbAbnNumber.charAt(3) !== '-' || digits.length !== 6 || !/^\d{6}$/.test(digits)) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `The BSB provided (${detail.bsbAbnNumber}) is invalid. It must have 6 digits, and be in NNN-NNN format.`
      );
    }

    if (!Number(detail.accountNumber)) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `The account number provided (${detail.accountNumber}) is invalid. Only numbers are allowed.`
      );
    }
  }
};

export function validateEmail(
  email: string, existingUser: User | null
) {
  if (!validator.isEmail(email)) {
    throw new ServerError('INVALID_REQUEST', 'The provided email address is not in a valid format.');
  }
  if (existingUser) {
    throw new ServerError('CONFLICT', 'The provided email address is already registered to another user.');
  }
};

export function validatePassword(
  password: string
) {
  const hasNumber = /[0-9]/;
  const hasLetter = /[a-zA-Z]/;
  if (password.length < MIN_PASSWORD_LENGTH || !hasNumber.test(password) || !hasLetter.test(password)) {
    throw new ServerError('INVALID_REQUEST', 'The provided password does not meet the required criteria.');
  }
};

export function authoriseLogin(email: string, password: string, user: User | null): User {
  if (!user) {
    throw new ServerError('UNAUTHORIZED', 'The provided email address does not exist.');
  }
  if (user.password !== password) {
    throw new ServerError('UNAUTHORIZED', 'The provided password is incorrect.');
  }
  return user;
};

export function validateUserId(id: string, user: User | null): User {
  if (!user) {
    throw new ServerError('NOT_FOUND', 'The provided user ID does not refer to an existing user.');
  }
  return user;
};

export function validatePasswordUpdate(hashedOldPassword: string, hashedNewPassword: string, user: User) {
  if (user.password !== hashedOldPassword) {
    throw new ServerError('INVALID_REQUEST', 'The old password provided is incorrect.');
  }
  if (hashedOldPassword === hashedNewPassword) {
    throw new ServerError('INVALID_REQUEST', 'The new password provided matches the current.');
  }
};

export async function validateSessionToken(token: string | undefined): Promise<{ userId: string }> {
  if (!token) {
    throw new ServerError('UNAUTHORIZED', 'No session token has been provided.');
  }
  const session = await getSession(token);
  if (!session) {
    throw new ServerError('UNAUTHORIZED', 'The provided session token does not refer to a valid logged in user session.');
  }
  return { userId: session.userId };
};
