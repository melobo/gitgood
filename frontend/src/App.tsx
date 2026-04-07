/*import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';*/
import './App.css';

import { UserPage } from './User';
import { LoginInput, RegisterInput } from './types';
import { requestUserRegister, requestUserLogin } from './httpWrappers';

function App() {
  async function handleRegister(input: RegisterInput): Promise<void> {
    await requestUserRegister(input.email, input.password, input.firstName + input.lastName);
  }

  async function handleLogin(input: LoginInput): Promise<void> {
    await requestUserLogin(input.email, input.password);
  }

  return <UserPage onLogin={handleLogin} onRegister={handleRegister} />;
}

export default App
