import { ServerError } from './errors';
import {
  InvoiceListFilters,
  Invoice,
  ValidationError,
  ValidateInvoiceResponse,
  FinaliseInvoiceResponse } from './invoiceInterface';
import {
  validateName,
  validateABN,
  validateDates,
  validateItems,
  validateTotalPayable,
  validatePaymentDetails
} from './validateInvoice';

import { XMLBuilder } from 'fast-xml-parser';

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
  const invoice = invoices.find(inv => inv.invoiceId === invoice_id);
  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided in voice ID does not refer to an existing invoice.');
  }
  if (invoice.status === 'draft' || invoice.status === 'converted') {
    throw new ServerError('CONFLICT', 'The invoice corresponding to the provided invoice ID has not yet been validated.');
  }

  invoice.status = 'finalised';
  invoice.finalisedAt = new Date().toLocaleString();

  return {
    invoice_id,
    status: invoice.status,
    ubl_xml: invoice.ublXml as string,
    finalised_at: invoice.finalisedAt
  };
}

export function convertInvoice(invoice_id: string) {
  // first, find and determine invoice exists
  const invoice = invoices.find(inv => inv.invoiceId === invoice_id);

  if (!invoice) {
    throw new ServerError('NOT_FOUND', 'The provided invoice ID does not refer to an existing invoice.');
  }

  // ensures only draft invoices can be converted
  if (invoice.status === 'converted' || invoice.status === 'validated' || invoice.status === 'finalised') {
    throw new ServerError('CONFLICT', 'Invoice has already been converted.');
  }

  if (!invoice.buyerName || !invoice.buyerAbn || !invoice.supplierName
    || !invoice.supplierAbn || !invoice.itemsList || invoice.itemsList.length === 0) {
    throw new ServerError('INSUFFICIENT_DATA', 'Not enough data has been provided for one or more of the invoice fields.');
  }

  // construct the UBL data
  const invoiceObject = {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'UTF-8'
    },
    'Invoice': {
      '@_xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'ID': invoice.invoiceId,
      'IssueDate': invoice.issueDate,
      'DueDate': invoice.paymentDueDate,
      'InvoiceTypeCode': '380',
      'DocumentCurrencyCode': 'AUD',

      'AccountingSupplierParty': {
        Party: {
          PartyName: {
            Name: invoice.supplierName
          },
          PartyTaxScheme: {
            CompanyID: invoice.supplierAbn
          }
        }
      },

      'AccountingCustomerParty': {
        Party: {
          PartyName: {
            Name: invoice.buyerName
          },
          PartyTaxScheme: {
            CompanyID: invoice.buyerAbn
          }
        }
      },

      'InvoiceLine': invoice.itemsList.map((item, index) => ({
        ID: index + 1,
        InvoicedQuantity: item.quantity,
        LineExtensionAmount: item.totalPrice,
        Item: {
          Description: item.itemName
        },
        Price: {
          PriceAmount: item.unitPrice,
          BaseQuantity: item.quantity,
          UnitCode: item.unitCode
        }
      })),

      'TaxTotal': {
        TaxAmount: invoice.taxAmount,
        TaxSubtotal: {
          TaxableAmount: invoice.totalPayable - invoice.taxAmount,
          TaxAmount: invoice.taxAmount,
          TaxCategory: {
            Percent: invoice.taxRate * 100
          }
        }
      },

      'LegalMonetaryTotal': {
        TaxInclusiveAmount: invoice.totalPayable,
        PayableAmount: invoice.totalPayable
      },

      'PaymentMeans': invoice.paymentDetails.map(payment => ({
        PaymentMeansCode: payment.paymentMethod,
        PayeeFinancialAccount: {
          ID: payment.accountNumber,
          FinancialInstitutionBranch: {
            ID: payment.bsbAbnNumber,
            Name: payment.bankName
          }
        }
      })),

      'Note': invoice.additionalNotes
    }
  };

  // convert to XML with fast-xml-parser
  const builder = new XMLBuilder({
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true
  });

  const ublXMLInvoice = builder.build(invoiceObject);

  invoice.status = 'converted';
  invoice.ublXml = ublXMLInvoice;
  invoice.updatedAt = new Date().toISOString();

  return {
    invoice_id: invoice.invoiceId,
    status: invoice.status,
    ubl_xml: ublXMLInvoice
  };
}
