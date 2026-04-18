import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginInput, RegisterInput, UserPageProperties, LoginFormProperties, RegisterFormProperties, LoginPageProperties, RegisterPageProperties } from './types';

export function UserLayout({ children, response }: UserPageProperties): React.ReactElement {
  return (
    <div className='user-page'>
      <header>
        <h1> PayMe </h1>
        <h2> Your Invoice Management Portal </h2>
      </header>
      <main>
        {response && <p className='auth-error'>{response}</p>}
        {children}
      </main>
    </div>
  );
}

export function LoginPage({ onLogin }: LoginPageProperties): React.ReactElement {
  const [response, setResponse] = useState<string | null>(null);

  return (
    <UserLayout response={response}>
      <LoginForm onLogin={onLogin} onServerError={setResponse} />
    </UserLayout>
  );
}

function LoginForm({onLogin, onServerError}: LoginFormProperties): React.ReactElement {
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

    const validationErrors = validateLoginInput(loginInput);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onLogin(loginInput);
    } catch (err: any) {
      onServerError(err.message ?? 'Login failed.');
    }
  }

  return (
    <form onSubmit={handleLogin} className='user-form'>
        <h2> Login to your account </h2>
        <div className='field'>
          <label> Email Address </label>
          <div className={`input-container ${errors.email ? 'input-error' : ''}`}>
            <input
              type='email'
              placeholder='yourbusiness@example.com'
              value={loginInput.email}
              onChange={e => setLoginInput(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          {errors.email && (<span className='error-message'> ⚠ {errors.email} </span>)}
        </div>

        <div className='field'>
          <label> Password </label>
          <div className={`input-container ${errors.password ? 'input-error' : ''}`}>
            <input
              type='password'
              placeholder='••••••••'
              value={loginInput.password}
              onChange={e => setLoginInput(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
          {errors.password && (<span className='error-message'> ⚠ {errors.password} </span>)}
        </div>

        <button type='submit'>
          Sign in
        </button>
        <p className='form-footer'>
        Don't have an account?{' '}
        <Link to='/register' className='navigate'>
          Sign up
        </Link>
      </p>
      </form>
  );
}

export function RegisterPage({ onRegister }: RegisterPageProperties): React.ReactElement {
  const [response, setResponse] = useState<string | null>(null);

  return (
    <UserLayout response={response}>
      <RegisterForm onRegister={onRegister} onServerError={setResponse} />
    </UserLayout>
  );
}

export function RegisterForm({onRegister, onServerError}: RegisterFormProperties): React.ReactElement {
  const [registerInput, setRegisterInput] = useState<RegisterInput>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const [errors, setErrors] = useState<Partial<RegisterInput>>({});

  function validateRegisterInput(input: RegisterInput): Partial<RegisterInput> {
    const errors: Partial<RegisterInput> = {};

    if (!input.name) {
      errors.name = 'Business name is required.';
    } else if (!/^[a-zA-Z \-']+$/.test(input.name) || /\d/g.test(input.name)) {
      errors.name = 'Business name provided contains invalid characters.';
    }
    if (!input.email) {
      errors.email = 'Email is required.';
    } else if (!input.email.includes("@")) {
      errors.email = 'Invalid email format';
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
    console.log("🔥 FORM SUBMIT FIRED");

    onServerError(null);
    setErrors({});

    const validationErrors = validateRegisterInput(registerInput);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      console.log("onRegister called");
      await onRegister(registerInput);
    } catch (err: any) {
      onServerError(err.message ?? 'Registration failed.');
    }
  }

  return (
      <form onSubmit={handleRegister} className='user-form'>
        <h2> Create your account </h2>
        <div className='field'>
          <label>Business Name</label>
          <div className={`input-container ${errors.name ? 'input-error' : ''}`}>
            <input
              placeholder='Your Business Ltd'
              value={registerInput.name}
              onChange={e => setRegisterInput(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          {errors.name && (<span className='error-message'> ⚠ {errors.name} </span>)}
        </div>

        <div className='field'>
          <label>Email Address</label>
          <div className={`input-container ${errors.email ? 'input-error' : ''}`}>
            <input
              type='email'
              placeholder='yourbusiness@example.com'
              value={registerInput.email}
              onChange={e => setRegisterInput(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          {errors.email && (<span className='error-message'> ⚠ {errors.email} </span>)}
        </div>

        <div className='field'>
          <label>Password</label>
          <div className={`input-container ${errors.password ? 'input-error' : ''}`}>
            <input
              type='password'
              placeholder='••••••••'
              value={registerInput.password}
              onChange={e => setRegisterInput(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>
          {errors.password && (<span className='error-message'> ⚠ {errors.password} </span>)}
        </div>

        <div className='field'>
          <label>Confirm password</label>
          <div className={`input-container ${errors.confirm ? 'input-error' : ''}`}>
            <input
              type='password'
              placeholder='••••••••'
              value={registerInput.confirm}
              onChange={e => setRegisterInput(prev => ({ ...prev, confirm: e.target.value }))}
            />
          </div>
          {errors.confirm && (<span className='error-message'> ⚠ {errors.confirm} </span>)}
        </div>

        <button type='submit'>
          Create account
        </button>
        <p className='form-footer'>
          Already have an account?{' '}
          <Link to="/login" className='navigate'>
            Sign in
          </Link>
        </p>
      </form>
  );
}
