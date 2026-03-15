import { ServerError } from './errors';
import { validBanks, validPaymentMethods, ValidateItemsResponse, InvoiceItem, PaymentDetails } from './invoiceInterface';

export function validateName(name: string, type: 'BUYER' | 'SUPPLIER') {
  const validChars = /^[a-zA-Z \-']+$/;
  if (!validChars.test(name)) {
    throw new ServerError('INVALID_REQUEST', `The ${type.toLowerCase()} name provided contains invalid characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed.`);
  }
};

export function validateABN(abn: string, type: 'BUYER' | 'SUPPLIER') {
  if (Number(abn) < 10000000000 || Number(abn) > 99999999999) {
    throw new ServerError('INVALID_REQUEST', `The ${type.toLowerCase()} ABN provided is invalid. It must have 11 digits.`);
  }
};

export function validateDates(issueDateString: string, paymentDueDateString: string): { issueDate: Date; paymentDueDate: Date } {
  const issueDate = new Date(issueDateString);
  const paymentDueDate = new Date(paymentDueDateString);
  const current = new Date();

  if (isNaN(issueDate.getTime())) {
    throw new ServerError('INVALID_REQUEST', 'The provided issue date is invalid. It must be in YYYY-MM-DD format.');
  }
  if (isNaN(paymentDueDate.getTime())) {
    throw new ServerError('INVALID_REQUEST', 'The provided payment due date is invalid. It must be in YYYY-MM-DD format.');
  }

  if (issueDate.setHours(0, 0, 0, 0) > current.setHours(0, 0, 0, 0)) {
    throw new ServerError('INVALID_REQUEST', 'The provided issue date cannot be in the future.');
  }

  if (paymentDueDate < issueDate) {
    throw new ServerError('INVALID_REQUEST', 'Payment due date must be on or after issue date.');
  }

  return { issueDate, paymentDueDate };
};

export function validateItem(item: InvoiceItem) {
  if (item.quantity <= 0) {
    throw new ServerError('INSUFFICIENT_DATA', `Item quantity must be > 0; ${item.item_name}.`);
  }
  if (item.unit_price < 0 || item.total_price < 0) {
    throw new ServerError('INSUFFICIENT_DATA', `Item prices cannot be negative; ${item.item_name}.`);
  }
  if (item.quantity * item.unit_price !== item.total_price) {
    throw new ServerError('INSUFFICIENT_DATA', `Invoice totals are inconsistent. Item totals must equal quantity * unit_price; ${item.item_name}.`);
  }
}

export function validateItems(items: InvoiceItem[]): ValidateItemsResponse {
  if (items.length === 0) {
    throw new ServerError('INSUFFICIENT_DATA', 'Invoice must contain at least one item.');
  }

  let sum: number = 0;
  for (const item of items) {
    validateItem(item);
    sum += item.total_price;
  }

  return { sum };
}

export function validateTotalPayable(sum: number, tax_rate: number, tax_amount: number, total_payable: number) {
  if (tax_rate < 0 || tax_rate > 1) {
    throw new ServerError('INSUFFICIENT_DATA', 'Tax rate must be a positive decimal value.');
  }
  if (sum * tax_rate !== tax_amount) {
    throw new ServerError('INSUFFICIENT_DATA', 'Tax amount on the invoice is inconsistent per the item totals.');
  }
  if (sum + tax_amount !== total_payable) {
    throw new ServerError('INSUFFICIENT_DATA', 'Invoice totals are inconsistent. Total payable must equal item totals * (1 + tax_rate).');
  }
}

export function validatePaymentDetails(paymentDetails: PaymentDetails[]) {
  if (paymentDetails.length === 0) {
    throw new ServerError('INSUFFICIENT_DATA', 'Invoice must contain at least one item.');
  }

  for (const detail of paymentDetails) {
    if (!validBanks.includes(detail.bank_name)) {
      throw new ServerError('INSUFFICIENT_DATA', `Payment details on invoice include an invalid bank name; ${detail.bank_name}.`);
    }
    if (!validPaymentMethods.includes(detail.payment_method)) {
      throw new ServerError('INSUFFICIENT_DATA', `Payment details on invoice include an invalid payment method; ${detail.payment_method}.`);
    }
    if (detail.bsb_abn_number.charAt(3) !== '-' || detail.bsb_abn_number.replace(/-/g, '').length < 6 || Number(detail.bsb_abn_number.replace(/-/g, '')) < 100000 || Number(detail.bsb_abn_number.replace(/-/g, '')) > 999999) {
      throw new ServerError('INSUFFICIENT_DATA', `The BSB provided (${detail.bsb_abn_number}) is invalid. It must have 6 digits, and be in NNN-NNN format.`);
    }
    if (!Number(detail.account_number)) {
      throw new ServerError('INSUFFICIENT_DATA', `The account number provided (${detail.account_number}) is invalid. Only numbers are allowed.`);
    }
  }
}
