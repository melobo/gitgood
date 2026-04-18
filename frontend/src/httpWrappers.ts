const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export async function requestUserRegister(email: string, password: string, name: string): Promise<string> {
  const res = await fetch(`${SERVER_URL}/v1/admin/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Registration failed.");
  }
  const data = await res.json();
  return data.session;
}

export async function requestUserLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${SERVER_URL}/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Invalid credentials.');
  }
  const data = await res.json();
  return data.session;
}
