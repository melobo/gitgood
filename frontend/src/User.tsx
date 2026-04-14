import React, { useState } from 'react';
import { UserMode, LoginInput, RegisterInput, UserPageProperties, LoginFormProperties, RegisterFormProperties } from './types';

export function UserPage({ onLogin, onRegister }: UserPageProperties): React.ReactElement {
  const [mode, setMode] = useState<UserMode>('login');
  const [response, setResponse] = useState<string | null>(null);

  function switchMode(selectedMode: UserMode): void {
    setMode(selectedMode);
    setResponse(null);
  }

  let formContent;
  if (mode === "login") {
    formContent = <LoginForm onLogin={onLogin} onServerError={setResponse} />;
  } else {
    formContent = <RegisterForm onRegister={onRegister} onServerError={setResponse} />;
  }

  return (
    <div className='auth-container'>
      <main className='auth-right'>
        <div className='auth-toggle'>
          <button onClick={() => switchMode('login')}
            style={{ marginLeft: '3px', marginRight: '3px' }}>
            Log in
          </button>
          <button onClick={() => switchMode('register')}
            style={{ marginLeft: '3px', marginRight: '3px' }}>
            Register
          </button>
        </div>
        {response && <p className="auth-error">{response}</p>}
        {formContent}
      </main>
    </div>
  );
}

export function LoginForm({onLogin, onServerError}: LoginFormProperties): React.ReactElement {
  const [loginInput, setLoginInput] = useState<LoginInput>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<LoginInput>>({});

  function validateLoginInput(input: LoginInput): Partial<LoginInput> {
    const errors: Partial<LoginInput> = {};

    if (!input.email) {
      errors.email = 'Email is required.';
    }
    if (!input.password) {
      errors.password = 'Password is required.';
    }

    return errors;
  }

  async function handleLogin(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    onServerError(null);
    setErrors({});

    const errors = validateLoginInput(loginInput);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      await onLogin(loginInput);
    } catch (err: any) {
      onServerError(err.message ?? 'Login failed.');
    }
  }

  return (
    <>
      <h2>Login Form</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <div className='input-container'>
          <input
            type='email'
            placeholder='Email'
            value={loginInput.email}
            onChange={e => setLoginInput(prev => ({ ...prev, email: e.target.value }))}
          />
          {errors.email && (<span className='error-message'> {errors.email} </span>)}
        </div>

        <div className='input-container'>
          <input
            type='password'
            placeholder='Password'
            value={loginInput.password}
            onChange={e => setLoginInput(prev => ({ ...prev, password: e.target.value }))}
          />
          {errors.password && (<span className='error-message'> {errors.password} </span>)}
        </div>

        <button>
          Submit
        </button>
      </form>
    </>
  );
}

export function RegisterForm({onRegister, onServerError}: RegisterFormProperties): React.ReactElement {
  const [registerInput, setRegisterInput] = useState<RegisterInput>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [errors, setErrors] = useState<Partial<RegisterInput>>({});

  function validateRegisterInput(input: RegisterInput): Partial<RegisterInput> {
    const errors: Partial<RegisterInput> = {};

    if (!input.firstName) {
      errors.firstName = 'First name is required.';
    } else if (!/^[a-zA-Z \-']+$/.test(input.firstName) || /\d/g.test(input.firstName)) {
      errors.firstName = 'Name provided contains invalid characters.';
    }
    if (!input.lastName) {
      errors.lastName = 'Last name is required.';
    } else if (!/^[a-zA-Z \-']+$/.test(input.lastName) || /\d/g.test(input.lastName)) {
      errors.lastName = 'Name provided contains invalid characters.';
    }
    if (!input.email) {
      errors.email = 'Email is required.';
    }
    if (!input.password) {
      errors.password = 'Password is required.';
    } else if (input.password.length < 8 || !/[0-9]/.test(input.password) || !/[a-zA-Z]/.test(input.password)) {
      errors.password = 'Provided password does not meet the required criteria.';
    }
    if (!input.confirm) {
      errors.confirm = 'Please confirm your password.';
    } else if (input.confirm !== input.password) {
      errors.confirm = 'Passwords do not match.';
    }

    return errors;
  }

  async function handleRegister(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    onServerError(null);
    setErrors({});

    const errors = validateRegisterInput(registerInput);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    try {
      await onRegister(registerInput);
    } catch (err: any) {
      onServerError(err.message ?? 'Registration failed.');
    }
  }

  return (
    <>
      <h2>Registration Form</h2>
      <form onSubmit={handleRegister} className="auth-form">
        <div className='input-container'>
          <input
            placeholder="First name"
            value={registerInput.firstName}
            onChange={e => setRegisterInput(prev => ({ ...prev, firstName: e.target.value }))}
          />
          {errors.firstName && (<span className='error-message'> {errors.firstName} </span>)}
        </div>

        <div className='input-container'>
          <input
            placeholder="Last name"
            value={registerInput.lastName}
            onChange={e => setRegisterInput(prev => ({ ...prev, lastName: e.target.value }))}
          />
          {errors.lastName && (<span className='error-message'> {errors.lastName} </span>)}
        </div>

        <div className='input-container'>
          <input
            type="email"
            placeholder="Email"
            value={registerInput.email}
            onChange={e => setRegisterInput(prev => ({ ...prev, email: e.target.value }))}
          />
          {errors.email && (<span className='error-message'> {errors.email} </span>)}
        </div>

        <div className='input-container'>
          <input
            type="password"
            placeholder="Password"
            value={registerInput.password}
            onChange={e => setRegisterInput(prev => ({ ...prev, password: e.target.value }))}
          />
          {errors.password && (<span className='error-message'> {errors.password} </span>)}
        </div>

        <div className='input-container'>
          <input
            type="password"
            placeholder="Confirm password"
            value={registerInput.confirm}
            onChange={e => setRegisterInput(prev => ({ ...prev, confirm: e.target.value }))}
          />
          {errors.confirm && (<span className='error-message'> {errors.confirm} </span>)}
        </div>

        <button>
          Create account
        </button>
      </form>
    </>
  );
}
