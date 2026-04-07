// import { UserInfo, Session } from '../../backend/src/invoiceInterface';

export type { InvoiceStatus, UserInfo, Session, Invoice, InvoiceItem, PaymentDetails, CreateInvoiceInput, UpdateInvoiceInput, InvoiceListFilters } from '../../backend/src/invoiceInterface';

export type UserMode = 'login' | 'register';

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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
}

export interface UserPageProperties {
  onLogin: (input: LoginInput) => Promise<void>;
  onRegister: (input: RegisterInput) => Promise<void>;
}

export interface LoginFormProperties {
  onLogin: (input: LoginInput) => Promise<void>;
  onServerError: (message: string | null) => void;
}

export interface RegisterFormProperties {
  onRegister: (input: RegisterInput) => Promise<void>;
  onServerError: (message: string | null) => void;
}
