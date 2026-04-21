// import { UserInfo, Session } from '../../backend/src/invoiceInterface';

export type { UserInfo, Session, Invoice, InvoiceItem, PaymentDetails, CreateInvoiceInput, UpdateInvoiceInput, InvoiceListFilters } from '../../backend/src/invoiceInterface';

export type UserMode = 'login' | 'register';
export type InvoiceStatus = 'draft' | 'converted' | 'validated' | 'finalised';

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
  invoiceId: string,
  status: InvoiceStatus,
  changedAt: string,
  buyerName: string,
}
