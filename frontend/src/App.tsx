import './App.css';

import { LoginPage, RegisterPage } from './User';
import { DashboardLayout, DashboardHome } from './Dashboard';
import { Layout } from './Layout';
import { Authenticate } from './Auth';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginInput, RegisterInput } from './types';
import { requestUserRegister, requestUserLogin } from './httpWrappers';
import { InvoiceLayout, InvoicesList } from './Invoices';

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

      <Route
        element={
          <Authenticate>
            <Layout />
          </Authenticate>
        }
      >
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
        </Route>
        <Route path='/invoices' element={<div>Invoices list page</div>} />
        <Route path='/invoices/create' element={<div>Create invoice page</div>} />
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
