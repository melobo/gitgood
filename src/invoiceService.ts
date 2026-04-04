import {
  InvoiceListFilters,
  Invoice,
  ValidationError,
  ValidateInvoiceResponse,
  FinaliseInvoiceResponse,
  PaymentDetails,
  InvoiceItem,
  DeleteInvoiceResponse,
  validBanks,
  validPaymentMethods,
  CreateInvoiceInput,
  InvoiceStatus
} from './invoiceInterface';

import {
  validateName,
  validateABN,
  validateDates,
  validateItems,
  validateTotalPayable,
  validatePaymentDetails
} from './validation';

import {
  saveInvoice,
  getInvoiceById,
  listAllInvoices,
  deleteInvoiceById,
  clearStore as clearDynamo
} from './dynamoService';

import {
  saveXMLToS3,
  getXMLFromS3,
  deleteXMLFromS3,
  clearStore as clearS3
} from './s3Service';

import { ServerError } from './errors';
import { v4 as uuidv4 } from 'uuid';
import { XMLBuilder } from 'fast-xml-parser';

export async function listInvoice(filters: InvoiceListFilters): Promise<{
  invoices: Pick<Invoice, 'invoiceId' | 'buyerName' | 'status' | 'createdAt'>[];
  total: number;
  page: number;
}> {
  const { fromDate, toDate, page = 1, limitPerPage = 20 } = filters;

  if (!Number.isInteger(page) || !Number.isInteger(limitPerPage)) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  if (fromDate && isNaN(Date.parse(fromDate))) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  if (toDate && isNaN(Date.parse(toDate))) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  let result = await listAllInvoices();

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

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const {
    buyerName, buyerAbn, supplierName, supplierAbn,
    issueDate, paymentDueDate, itemsList,
    taxRate, paymentDetails, additionalNotes,
  } = input;

  if (!buyerName || !buyerAbn || !supplierName || !supplierAbn || !issueDate || !paymentDueDate) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(issueDate) || !dateRegex.test(paymentDueDate)) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  if (new Date(paymentDueDate) <= new Date(issueDate)) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  if (taxRate === undefined || taxRate === null || isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  if (!Array.isArray(itemsList) || itemsList.length === 0) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  for (const item of itemsList) {
    if (!item.itemName || !item.unitCode) {
      throw new ServerError(
        'INVALID_REQUEST',
        'Missing or Invalid Fields'
      );
    }

    if (!item.quantity || item.quantity <= 0) {
      throw new ServerError(
        'INVALID_REQUEST',
        `Item quantity must be > 0; ${item.itemName}.`
      );
    }

    if (item.unitPrice === undefined || item.unitPrice < 0) {
      throw new ServerError(
        'INVALID_REQUEST',
        `Item prices cannot be negative; ${item.itemName}.`
      );
    }

    if (item.quantity * item.unitPrice !== item.totalPrice) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `Invoice totals are inconsistent. Item totals must equal quantity * unitPrice; ${item.itemName}.`
      );
    }
  }

  if (!Array.isArray(paymentDetails) || paymentDetails.length === 0) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  for (const pd of paymentDetails) {
    if (!validBanks.includes(pd.bankName)) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `Payment details on invoice include an invalid bank name; ${pd.bankName}.`
      );
    }

    if (!validPaymentMethods.includes(pd.paymentMethod)) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `Payment details on invoice include an invalid payment method; ${pd.paymentMethod}.`
      );
    }

    if (pd.bsbAbnNumber.charAt(3) !== '-' || pd.bsbAbnNumber.replace(/-/g, '').length < 6) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `The BSB provided (${pd.bsbAbnNumber}) is invalid. It must have 6 digits, and be in NNN-NNN format.`
      );
    }

    if (!Number(pd.accountNumber)) {
      throw new ServerError(
        'INSUFFICIENT_DATA',
        `The account number provided (${pd.accountNumber}) is invalid. Only numbers are allowed.`
      );
    }
  }

  const subtotal = itemsList.reduce(
    (sum, item) => parseFloat((sum + item.totalPrice).toFixed(2)), 0
  );
  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  const totalPayable = parseFloat((subtotal + taxAmount).toFixed(2));

  const now = new Date().toISOString();

  const invoice: Invoice = {
    invoiceId: uuidv4(),
    status: 'draft',
    buyerName,
    buyerAbn,
    supplierName,
    supplierAbn,
    issueDate,
    paymentDueDate,
    itemsList,
    taxRate,
    taxAmount,
    totalPayable,
    paymentDetails,
    additionalNotes: additionalNotes ?? '',
    createdAt: now,
    updatedAt: now,
  };

  await saveInvoice(invoice);
  return invoice;
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided invoice ID does not refer to an existing invoice.'
    );
  }

  if (invoice.status !== 'draft' && invoice.invoiceId) {
    invoice.ublXml = await getXMLFromS3(invoice.invoiceId);
  }

  return invoice;
}

export async function validateInvoice(invoiceId: string): Promise<ValidateInvoiceResponse> {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided invoice ID does not refer to an existing invoice.'
    );
  }

  if (invoice.status === 'draft') {
    throw new ServerError(
      'INVALID_REQUEST',
      'The invoice has not yet been converted.'
    );
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

  await saveInvoice(invoice);

  return {
    invoiceId,
    valid: errors.length === 0,
    errors,
    status: invoice.status,
  };
}

export async function finaliseInvoice(invoiceId: string): Promise<FinaliseInvoiceResponse> {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided in voice ID does not refer to an existing invoice.'
    );
  }

  if (invoice.status === 'draft' || invoice.status === 'converted') {
    throw new ServerError(
      'INVOICE_NOT_VALIDATED',
      'The invoice has not yet been validated.'
    );
  }

  invoice.status = 'finalised';
  invoice.finalisedAt = new Date().toLocaleString();

  await saveInvoice(invoice);

  return {
    invoiceId,
    status: invoice.status,
    ublXml: invoice.ublXml as string,
    finalisedAt: invoice.finalisedAt
  };
}

export async function convertInvoice(invoiceId: string): Promise<{
  invoiceId: string;
  status: string;
  ublXml: string;
}> {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided invoice ID does not refer to an existing invoice.'
    );
  }

  if (invoice.status === 'converted' || invoice.status === 'validated' || invoice.status === 'finalised') {
    throw new ServerError(
      'ALREADY_CONVERTED',
      'Invoice has already been converted.'
    );
  }

  if (!invoice.buyerName || !invoice.buyerAbn || !invoice.supplierName
    || !invoice.supplierAbn || !invoice.itemsList || invoice.itemsList.length === 0) {
    throw new ServerError(
      'INSUFFICIENT_DATA',
      'Not enough data has been provided for one or more of the invoice fields.'
    );
  }

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

  const builder = new XMLBuilder({
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true
  });

  const ublXMLInvoice = builder.build(invoiceObject);

  await saveXMLToS3(invoiceId, ublXMLInvoice);

  invoice.status = 'converted';
  invoice.ublXml = ublXMLInvoice;
  invoice.updatedAt = new Date().toISOString();
  await saveInvoice(invoice);

  return {
    invoiceId: invoice.invoiceId,
    status: invoice.status,
    ublXml: ublXMLInvoice
  };
}

export async function updateInvoice(invoiceId: string, updates: {
  buyerName?: string;
  buyerAbn?: string;
  supplierName?: string;
  supplierAbn?: string;
  issueDate?: string;
  paymentDueDate?: string;
  itemsList?: InvoiceItem[];
  taxRate?: number;
  paymentDetails?: PaymentDetails[];
  additionalNotes?: string;
}): Promise<{ invoiceId: string; status: string; updatedAt: string }> {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided invoice ID does not refer to an existing invoice.'
    );
  }

  if (updates.buyerName !== undefined) {
    validateName(updates.buyerName, 'BUYER');
    invoice.buyerName = updates.buyerName;
  }

  if (updates.buyerAbn !== undefined) {
    validateABN(updates.buyerAbn, 'BUYER');
    invoice.buyerAbn = updates.buyerAbn;
  }

  if (updates.supplierName !== undefined) {
    validateName(updates.supplierName, 'SUPPLIER');
    invoice.supplierName = updates.supplierName;
  }

  if (updates.supplierAbn !== undefined) {
    validateABN(updates.supplierAbn, 'SUPPLIER');
    invoice.supplierAbn = updates.supplierAbn;
  }

  if (updates.issueDate !== undefined || updates.paymentDueDate !== undefined) {
    const newIssueDate = updates.issueDate ?? invoice.issueDate;
    const newPaymentDueDate = updates.paymentDueDate ?? invoice.paymentDueDate;
    validateDates(newIssueDate, newPaymentDueDate);
    invoice.issueDate = newIssueDate;
    invoice.paymentDueDate = newPaymentDueDate;
  }

  if (updates.paymentDetails !== undefined) {
    for (const pd of updates.paymentDetails) {
      if (!validBanks.includes(pd.bankName)) {
        throw new ServerError(
          'INVALID_REQUEST',
          `Invalid bank name: ${pd.bankName}`
        );
      }

      if (!validPaymentMethods.includes(pd.paymentMethod)) {
        throw new ServerError(
          'INVALID_REQUEST',
          `Invalid payment method: ${pd.paymentMethod}`
        );
      }
    }
    invoice.paymentDetails = updates.paymentDetails;
  }

  if (updates.additionalNotes !== undefined) {
    invoice.additionalNotes = updates.additionalNotes;
  }

  if (updates.itemsList !== undefined || updates.taxRate !== undefined) {
    const newItems = updates.itemsList ?? invoice.itemsList;
    const newTaxRate = updates.taxRate ?? invoice.taxRate;

    if (typeof newTaxRate !== 'number' || isNaN(newTaxRate)) {
      throw new ServerError(
        'INVALID_REQUEST',
        'Tax rate must be a number.'
      );
    }

    for (const item of newItems) {
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new ServerError(
          'INVALID_REQUEST',
          `Invalid quantity for item: ${item.itemName}`
        );
      }

      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        throw new ServerError(
          'INVALID_REQUEST',
          `Invalid unit price for item: ${item.itemName}`
        );
      }

      if (typeof item.unitCode !== 'string' || !/^[a-zA-Z]+$/.test(item.unitCode)) {
        throw new ServerError(
          'INVALID_REQUEST',
          `Invalid unit code for item: ${item.itemName}`
        );
      }

      const expectedTotal = parseFloat((item.quantity * item.unitPrice).toFixed(2));
      if (item.totalPrice !== undefined && item.totalPrice !== expectedTotal) {
        throw new ServerError(
          'INVALID_REQUEST',
          `Inconsistent total price for item: ${item.itemName}`
        );
      }
    }

    const sum = newItems.reduce((acc, item) => acc + item.totalPrice, 0);
    invoice.itemsList = newItems;
    invoice.taxRate = newTaxRate;
    invoice.taxAmount = parseFloat((sum * newTaxRate).toFixed(2));
    invoice.totalPayable = parseFloat((sum + invoice.taxAmount).toFixed(2));
  }

  invoice.updatedAt = new Date().toISOString();

  await saveInvoice(invoice);

  return {
    invoiceId: invoice.invoiceId,
    status: invoice.status,
    updatedAt: invoice.updatedAt,
  };
}

export async function deleteInvoice(invoiceId: string): Promise<DeleteInvoiceResponse> {
  if (!invoiceId || !invoiceId.trim() || !/^[a-zA-Z0-9-]+$/.test(invoiceId.trim())) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Invalid invoice ID format.'
    );
  }

  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided invoice ID does not refer to an existing invoice.'
    );
  }

  if (invoice.status !== 'draft') {
    await deleteXMLFromS3(invoiceId);
  }

  await deleteInvoiceById(invoiceId);

  return {
    invoiceId,
    message: 'Invoice successfully deleted'
  };
}

export async function downloadInvoice(invoiceId: string, format: string = 'xml'): Promise<{
  content: string;
  contentType: string;
  filename: string;
}> {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided invoice ID does not refer to an existing invoice.'
    );
  }

  if (invoice.status !== 'finalised') {
    throw new ServerError(
      'INVOICE_NOT_READY',
      'Invoice not yet converted/validated to UBL XML format'
    );
  }

  const allowedFormats = ['xml', 'json'];
  if (!allowedFormats.includes(format.toLowerCase())) {
    throw new ServerError(
      'INVALID_REQUEST',
      'Missing or Invalid Fields'
    );
  }

  if (format.toLowerCase() === 'xml') {
    const ublXml = await getXMLFromS3(invoiceId);
    return {
      content: ublXml,
      contentType: 'application/xml',
      filename: `invoice-${invoiceId}.xml`,
    };
  }

  const invoiceJson = Object.fromEntries(
    Object.entries(invoice).filter(([key]) => key !== 'ublXml')
  );

  return {
    content: JSON.stringify(invoiceJson, null, 2),
    contentType: 'application/json',
    filename: `invoice-${invoiceId}.json`,
  };
}

export async function getInvoiceSummary(invoiceId: string): Promise<{
  invoiceId: string;
  status: InvoiceStatus;
  buyerName: string;
  supplierName: string;
  issueDate: string;
  paymentDueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalPayable: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  finalisedAt?: string;
}> {
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    throw new ServerError(
      'NOT_FOUND',
      'The provided invoice ID does not refer to an existing invoice.'
    );
  }

  const subtotal = parseFloat((invoice.totalPayable - invoice.taxAmount).toFixed(2));

  return {
    invoiceId: invoice.invoiceId,
    status: invoice.status,
    buyerName: invoice.buyerName,
    supplierName: invoice.supplierName,
    issueDate: invoice.issueDate,
    paymentDueDate: invoice.paymentDueDate,
    subtotal,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    totalPayable: invoice.totalPayable,
    itemCount: invoice.itemsList.length,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    ...(invoice.finalisedAt !== undefined && { finalisedAt: invoice.finalisedAt }),
  };
}

export async function clearInvoices(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    clearDynamo();
    clearS3();
    return;
  }

  const all = await listAllInvoices();
  await Promise.all(
    all.map(async (inv) => {
      if (inv.status !== 'draft') {
        await deleteXMLFromS3(inv.invoiceId);
      }
      await deleteInvoiceById(inv.invoiceId);
    })
  );
}
