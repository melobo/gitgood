import { ServerError } from './errors';
import { InvoiceListFilters, Invoice, ValidationError, ValidateInvoiceResponse, FinaliseInvoiceResponse } from './invoiceInterface';
import { validateName, validateABN, validateDates, validateItems, validateTotalPayable, validatePaymentDetails } from './validateInvoice';

const invoices: Invoice[] = [];

export function listInvoice(filters: InvoiceListFilters): {
  invoices: Pick<Invoice, 'invoice_id' | 'buyer_name' | 'status' | 'created_at'>[];
  total: number;
  page: number;
} {
  const { from_date, to_date, page = 1, limit_per_page = 20 } = filters;

  if (!Number.isInteger(page) || !Number.isInteger(limit_per_page)) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }
  if (from_date && isNaN(Date.parse(from_date))) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }
  if (to_date && isNaN(Date.parse(to_date))) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }
  if (from_date && to_date && new Date(from_date) > new Date(to_date)) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }

  let result = [...invoices];

  if (from_date) {
    result = result.filter(inv => new Date(inv.created_at) >= new Date(from_date));
  }
  if (to_date) {
    const end = new Date(to_date);
    end.setHours(23, 59, 59, 999);
    result = result.filter(inv => new Date(inv.created_at) <= end);
  }

  const total = result.length;
  const offset = (page - 1) * limit_per_page;
  const paginated = result.slice(offset, offset + limit_per_page);

  return {
    invoices: paginated.map(({ invoice_id, buyer_name, status, created_at }) => ({
      invoice_id, buyer_name, status, created_at,
    })),
    total,
    page,
  };
}

export function getInvoice(invoice_id: string): Invoice {
  const invoice = invoices.find(inv => inv.invoice_id === invoice_id);

  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided invoice ID does not refer to an existing invoice.');
  }

  return invoice;
}

export function validateInvoice(invoice_id: string): ValidateInvoiceResponse {
  const invoice = invoices.find(inv => inv.invoice_id === invoice_id);
  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided invoice ID does not refer to an existing invoice.');
  }
  if (invoice.status === 'draft') {
    throw new ServerError('CONFLICT', 'The invoice corresponding to the provided invoice ID has not yet been converted.');
  }

  const errors: ValidationError[] = [];
  try {
    validateName(invoice.buyer_name, 'BUYER');
    validateABN(invoice.buyer_abn, 'BUYER');
  } catch (err) {
    if (err instanceof ServerError) {
      errors.push({ field: 'buyer', message: err.message });
    }
  }
  try {
    validateName(invoice.buyer_name, 'SUPPLIER');
    validateABN(invoice.buyer_abn, 'SUPPLIER');
  } catch (err) {
    if (err instanceof ServerError) {
      errors.push({ field: 'supplier', message: err.message });
    }
  }
  try {
    validateDates(invoice.issue_date, invoice.payment_due_date);
  } catch (err) {
    if (err instanceof ServerError) {
      errors.push({ field: 'dates', message: err.message });
    }
  }
  try {
    const { sum } = validateItems(invoice.items_list);
    validateTotalPayable(sum, invoice.tax_rate, invoice.tax_amount, invoice.total_payable);
  } catch (err) {
    if (err instanceof ServerError) {
      errors.push({ field: 'items_totals', message: err.message });
    }
  }
  try {
    validatePaymentDetails(invoice.payment_details);
  } catch (err) {
    if (err instanceof ServerError) {
      errors.push({ field: 'payment_details', message: err.message });
    }
  }

  if (errors.length === 0 && invoice.status !== 'finalised') {
    invoice.status = 'validated';
  }

  return {
    invoice_id,
    valid: errors.length === 0,
    errors,
    status: invoice.status
  };
}

export function finaliseInvoice(invoice_id: string): FinaliseInvoiceResponse {
  const invoice = invoices.find(inv => inv.invoice_id === invoice_id);
  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided invoice ID does not refer to an existing invoice.');
  }
  if (invoice.status === 'draft' || invoice.status === 'converted') {
    throw new ServerError('CONFLICT', 'The invoice corresponding to the provided invoice ID has not yet been validated.');
  }

  invoice.status = 'finalised';
  invoice.finalised_at = new Date().toLocaleString();

  return {
    invoice_id,
    status: invoice.status,
    ubl_xml: invoice.ubl_xml as string,
    finalised_at: invoice.finalised_at
  };
}
