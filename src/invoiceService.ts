import { ServerError } from './errors';
import { InvoiceListFilters, Invoice } from './invoiceInterface';

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
    throw new ServerError('NOT_FOUND', 'Invoice not found');
  }

  return invoice;
}
