export type InvoiceStatus = 'draft' | 'converted' | 'validated' | 'finalised';

export interface InvoiceItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  unit_code: string;
  total_price: number;
}

export interface PaymentDetails {
  bank_name: string;
  account_number: string;
  bsb_abn_number: string;
  payment_method: string;
}

export interface Invoice {
  invoice_id: string;
  status: InvoiceStatus;
  buyer_name: string;
  buyer_abn: string;
  supplier_name: string;
  supplier_abn: string;
  issue_date: string;
  payment_due_date: string;
  items_list: InvoiceItem[];
  tax_rate: number;
  tax_amount: number;
  total_payable: number;
  payment_details: PaymentDetails[];
  additional_notes?: string;
  ubl_xml?: string;
  created_at: string;
  updated_at: string;
  finalised_at?: string;
}

export interface CreateInvoiceInput {
  buyer_name: string;
  buyer_abn: string;
  supplier_name: string;
  supplier_abn: string;
  issue_date: string;
  payment_due_date: string;
  items_list: InvoiceItem[];
  tax_rate: number;
  payment_details: PaymentDetails[];
  additional_notes?: string;
}

export interface UpdateInvoiceInput {
  buyer_name?: string;
  buyer_abn?: string;
  supplier_name?: string;
  supplier_abn?: string;
  issue_date?: string;
  payment_due_date?: string;
  items_list?: InvoiceItem[];
  tax_rate?: number;
  payment_details?: PaymentDetails[];
  additional_notes?: string;
}

export interface InvoiceListFilters {
  from_date?: string;
  to_date?: string;
  page?: number;
  limit_per_page?: number;
}