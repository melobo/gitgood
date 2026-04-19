export type InvoiceStatus = 'draft' | 'converted' | 'validated' | 'finalised';
export const validBanks = ['ANZ', 'CommBank', 'Westpac', 'StGeorge', 'ApplePay', 'NAB', 'PayPal'];
export const validPaymentMethods = ['bank_transfer', 'direct_debit', 'credit_card'];
export const MIN_PASSWORD_LENGTH = 8;

export interface UserInfo {
  userId: string;
  name: string;
  email: string;
}

export interface User extends UserInfo {
  password: string;
}

export interface Session {
  userId: string;
  session: string;
}

export interface InvoiceItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  unitCode: string;
  totalPrice: number;
}

export interface PaymentDetails {
  bankName: string;
  accountNumber: string;
  bsbAbnNumber: string;
  paymentMethod: string;
}

export interface Invoice {
  invoiceId: string;
  status: InvoiceStatus;
  buyerName: string;
  buyerAbn: string;
  supplierName: string;
  supplierAbn: string;
  issueDate: string;
  paymentDueDate: string;
  itemsList: InvoiceItem[];
  taxRate: number;
  taxAmount: number;
  totalPayable: number;
  paymentDetails: PaymentDetails[];
  additionalNotes?: string;
  ublXml?: string;
  createdAt: string;
  updatedAt: string;
  finalisedAt?: string;
}

export interface CreateInvoiceInput {
  buyerName: string;
  buyerAbn: string;
  supplierName: string;
  supplierAbn: string;
  issueDate: string;
  paymentDueDate: string;
  itemsList: InvoiceItem[];
  taxRate: number;
  paymentDetails: PaymentDetails[];
  additionalNotes?: string;
}

export interface UpdateInvoiceInput {
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
}

export interface InvoiceListFilters {
  fromDate?: string;
  toDate?: string;
  page?: number;
  limitPerPage?: number;
}

export interface InvoiceOverrides {
  buyerName?: string;
  supplierName?: string;
  price?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidateInvoiceResponse {
  invoiceId: string;
  valid: boolean;
  errors: ValidationError[];
  status: InvoiceStatus;
}

export interface FinaliseInvoiceResponse {
  invoiceId: string;
  status: InvoiceStatus;
  ublXml: string;
  finalisedAt: string;
}

export interface DeleteInvoiceResponse {
  invoiceId: string;
  message: string;
}

export interface ErrorObject {
  error: string;
  message: string;
}

export interface HttpReturnObject<T> {
  statusCode: number;
  body: T;
}

export type EmptyObject = Record<never, never>;
export type ValidateItemsResponse = { sum: number };
