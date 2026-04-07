const SERVER_URL = () => process.env.SERVER_URL ?? 'http://127.0.0.1:3000';

export async function requestUserRegister(email: string, password: string, name: string): Promise<void> {
  const res = await fetch(`${SERVER_URL()}/v1/admin/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Registration failed.");
  }
}

export async function requestUserLogin(email: string, password: string): Promise<void> {
  const res = await fetch(`${SERVER_URL()}/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Login failed.");
  }
}
