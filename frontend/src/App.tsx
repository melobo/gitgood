import './App.css';

import { LoginPage, RegisterPage } from './User';
import { Layout } from './Layout';
import { Authenticate } from "./Auth";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LoginInput, RegisterInput } from './types';
import { requestUserRegister, requestUserLogin } from './httpWrappers';

function AppRoutes(): React.ReactElement {
  const navigate = useNavigate();
  async function handleRegister(input: RegisterInput): Promise<void> {
    try {
      const session = await requestUserRegister(input.email, input.password, input.name);
      localStorage.setItem("session", session);
      console.log("SESSION FROM SERVER:", session);
      navigate("/dashboard");
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      throw err;
    }
  }

  async function handleLogin(input: LoginInput): Promise<void> {
    const session = await requestUserLogin(input.email, input.password);
    localStorage.setItem("session", session);
    navigate("/dashboard");
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/register"
        element={<RegisterPage onRegister={handleRegister} />}
      />

      <Route
        element={
          <Authenticate>
            <Layout />
          </Authenticate>
        }
      >
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="/invoices" element={<div>Invoice list page</div>} />
        <Route path="/invoices/create" element={<div>Create invoice page</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
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
