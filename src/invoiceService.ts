import { ServerError } from './errors';
import {
  InvoiceListFilters,
  Invoice,
  ValidationError,
  ValidateInvoiceResponse } from './invoiceInterface';
import {
  validateName,
  validateABN,
  validateDates,
  validateItems,
  validateTotalPayable,
  validatePaymentDetails
} from './validateInvoice';

const invoices: Invoice[] = [];

export function listInvoice(filters: InvoiceListFilters): {
  invoices: Pick<Invoice, 'invoiceId' | 'buyerName' | 'status' | 'createdAt'>[];
  total: number;
  page: number;
} {
  const { fromDate, toDate, page = 1, limitPerPage = 20 } = filters;

  if (!Number.isInteger(page) || !Number.isInteger(limitPerPage)) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }
  if (fromDate && isNaN(Date.parse(fromDate))) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }
  if (toDate && isNaN(Date.parse(toDate))) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }
  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    throw new ServerError('INVALID_REQUEST', 'Missing or Invalid Fields');
  }

  let result = [...invoices];

  if (fromDate) {
    result = result.filter(inv => new Date(inv.createdAt) >= new Date(fromDate));
  }
  if (toDate) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    result = result.filter(inv => new Date(inv.createdAt) <= end);
  }

  const total = result.length;
  const offset = (page - 1) * limitPerPage;
  const paginated = result.slice(offset, offset + limitPerPage);

  return {
    invoices: paginated.map(({ invoiceId, buyerName, status, createdAt }) => ({
      invoiceId, buyerName, status, createdAt,
    })),
    total,
    page,
  };
}

export function getInvoice(invoiceId: string): Invoice {
  const invoice = invoices.find(inv => inv.invoiceId === invoiceId);

  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided invoice ID does not refer to an existing invoice.');
  }

  return invoice;
}

export function validateInvoice(invoiceId: string): ValidateInvoiceResponse {
  const invoice = invoices.find(inv => inv.invoiceId === invoiceId);

  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided invoice ID does not refer to an existing invoice.');
  }
  if (invoice.status === 'draft') {
    throw new ServerError('INVOICE_NOT_CONVERTED', 'The invoice corresponding to the provided invoice ID has not yet been converted.');
  }

  const errors: ValidationError[] = [];

  try {
    validateName(invoice.buyerName, 'BUYER');
    validateABN(invoice.buyerAbn, 'BUYER');
  } catch (err) {
    if (err instanceof ServerError) errors.push({ field: 'buyer', message: err.message });
  }

  try {
    validateName(invoice.supplierName, 'SUPPLIER');
    validateABN(invoice.supplierAbn, 'SUPPLIER');
  } catch (err) {
    if (err instanceof ServerError) errors.push({ field: 'supplier', message: err.message });
  }

  try {
    validateDates(invoice.issueDate, invoice.paymentDueDate);
  } catch (err) {
    if (err instanceof ServerError) errors.push({ field: 'dates', message: err.message });
  }

  try {
    const { sum } = validateItems(invoice.itemsList);
    validateTotalPayable(sum, invoice.taxRate, invoice.taxAmount, invoice.totalPayable);
  } catch (err) {
    if (err instanceof ServerError) errors.push({ field: 'itemsTotals', message: err.message });
  }

  try {
    validatePaymentDetails(invoice.paymentDetails);
  } catch (err) {
    if (err instanceof ServerError) errors.push({ field: 'paymentDetails', message: err.message });
  }

  if (errors.length === 0 && invoice.status !== 'finalised') {
    invoice.status = 'validated';
  }

  return {
    invoiceId,
    valid: errors.length === 0,
    errors,
    status: invoice.status,
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
