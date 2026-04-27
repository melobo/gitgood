// import { UserInfo, Session } from '../../backend/src/invoiceInterface';

import type { InvoiceStatus } from '../../backend/src/invoiceInterface';

export { validBanks } from '../../backend/src/invoiceInterface';

export type { InvoiceStatus, UserInfo, Session, Invoice, InvoiceItem, PaymentDetails, CreateInvoiceInput, UpdateInvoiceInput, InvoiceListFilters, PartialInvoice, AutofillResponse, AutofillInput } from '../../backend/src/invoiceInterface';

export type UserMode = 'login' | 'register';
export type CreateMode = 'manual' | 'autofill' | 'bulk';

export interface FormFieldProperties {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

export interface SearchInput {
  query: string;
}

export interface UserPageProperties {
  children: React.ReactNode;
  response: string | null;
}

export interface LoginPageProperties {
  onLogin: (input: LoginInput) => Promise<void>;
}

export interface LoginFormProperties extends LoginPageProperties {
  onServerError: (message: string | null) => void;
}

export interface RegisterPageProperties {
  onRegister: (input: RegisterInput) => Promise<void>;
}

export interface RegisterFormProperties extends RegisterPageProperties {
  onServerError: (message: string | null) => void;
}

export interface AuthProperties {
  children: React.ReactNode;
}

export interface ActivityTimelineItem {
  invoiceId: string;
  status: InvoiceStatus;
  changedAt: string;
  buyerName: string;
}

export interface InvoiceFormInput {
  buyerName: string;
  buyerAbn: string;
  buyerEmail: string;
  supplierName: string;
  supplierAbn: string;
  issueDate: string;
  paymentDueDate: string;
  taxRate: number;
  additionalNotes: string;
};

export interface InvoiceItemErrors {
  itemName?: string;
  quantity?: string;
  unitPrice?: string;
}

export interface PaymentDetailsErrors {
  accountNumber?: string;
  bsbAbnNumber?: string;
}

export interface CreateInvoiceProperties {
  onSuccess: () => void;
}