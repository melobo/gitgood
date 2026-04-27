import './App.css';

import { LoginPage, RegisterPage } from './User';
import { DashboardLayout, DashboardHome } from './Dashboard';
import { Layout } from './Layout';
import { Authenticate } from './Auth';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginInput, RegisterInput } from './types';
import { requestUserRegister, requestUserLogin } from './httpWrappers';
import { InvoiceLayout, InvoicesTable } from './Invoices';
import { CreateInvoice, CreateInvoiceAutofill, CreateInvoiceBulk, CreateLayout } from './CreateInvoice';
import { EditInvoicePage, InvoiceDetailsPage } from './InvoiceDetails';

function AppRoutes(): React.ReactElement {
  const navigate = useNavigate();
  async function handleRegister(input: RegisterInput): Promise<void> {
    const session = await requestUserRegister(input.email, input.password, input.name);
    localStorage.setItem('session', session);
    navigate('/dashboard');
  }

  async function handleLogin(input: LoginInput): Promise<void> {
    const session = await requestUserLogin(input.email, input.password);
    localStorage.setItem('session', session);
    navigate('/dashboard');
  }

  return (
    <Routes>
      <Route
        path='/login'
        element={<LoginPage onLogin={handleLogin} />}
      />
      <Route
        path='/register'
        element={<RegisterPage onRegister={handleRegister} />}
      />

      <Route element={
        <Authenticate>
          <Layout />
        </Authenticate>
      }>
        <Route path='/dashboard' element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
        </Route>
        <Route path='/invoices' element={<InvoiceLayout />}>
          <Route index element={<InvoicesTable />} />
        </Route>
        <Route path='/invoices/create' element={<CreateLayout />} />
        <Route path='/invoices/create/manual' element={<CreateInvoice onSuccess={() => { navigate('/invoices'); }} />} />
        <Route path='/invoices/create/autofill' element={<CreateInvoiceAutofill />} />
        <Route path='/invoices/create/bulk' element={<CreateInvoiceBulk />} />
        <Route path='/invoices/:invoiceId' element={<InvoiceDetailsPage />} />
        <Route path='/invoices/:invoiceId/edit' element={<EditInvoicePage />} />
      </Route>

      <Route path='*' element={<Navigate to='/login' replace />} />
    </Routes>
  );
}

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
