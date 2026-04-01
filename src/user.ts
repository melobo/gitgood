import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import {
  saveUser,
  getUserById,
  getUserByEmail,
  updateUser,
  saveSession,
  getSession,
  deleteSession,
  listAllSessions,
  listAllUsers,
  deleteUserById,
} from './dynamoService';
import {
  validateEmail,
  validateName,
  validatePassword,
  authoriseLogin,
  validateUserId,
  validatePasswordUpdate,
  validateSessionToken,
} from './validation';
import { UserInfo, EmptyObject } from './invoiceInterface';

export async function userRegister(email: string, password: string, name: string): Promise<{ session: string }> {
  const existingUser = await getUserByEmail(email);
  validateEmail(email, existingUser);

  validateName(name, 'SUPPLIER');
  validatePassword(password);

  const newId = uuidv4();
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  await saveUser({
    userId: newId,
    name,
    email,
    password: hashedPassword,
  });

  const session = await generateSession(newId);
  return { session };
};

export async function userLogin(email: string, password: string): Promise<{ session: string }> {
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  const user = await getUserByEmail(email);
  authoriseLogin(email, hashedPassword, user);
  const session = await generateSession(user!.userId);
  return { session };
};

export async function userDetails(userId: string): Promise<{ user: UserInfo }> {
  const user = await getUserById(userId);
  validateUserId(userId, user);

  return {
    user: {
      userId: user!.userId,
      name: user!.name,
      email: user!.email
    },
  };
};

export async function userDetailsUpdate(userId: string, email?: string, name?: string): Promise<EmptyObject> {
  const user = await getUserById(userId);
  validateUserId(userId, user);

  if (user!.email !== email && email !== undefined) {
    const existing = await getUserByEmail(email);
    validateEmail(email, existing);
  }

  if (name !== undefined) {
    validateName(name, 'BUYER');
  }

  await updateUser(userId, {
    ...(email !== undefined && { email }),
    ...(name !== undefined && { name }),
  });

  return {};
};

export async function userPasswordUpdate(userId: string, oldPassword: string, newPassword: string): Promise<EmptyObject> {
  const user = await getUserById(userId);
  validateUserId(userId, user);
  validatePassword(newPassword);

  const hashedOldPassword = crypto.createHash('sha256').update(oldPassword).digest('hex');
  const hashedNewPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

  validatePasswordUpdate(hashedOldPassword, hashedNewPassword, user!);

  await updateUser(userId, { password: hashedNewPassword });

  return {};
};

export async function userLogout(token: string): Promise<EmptyObject> {
  await validateSessionToken(token);
  await deleteSession(token);
  return {};
};

export async function clearUsers(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const all = await listAllUsers();
  await Promise.all(
    all.map(async user => deleteUserById(user.userId))
  );
}

export async function generateSession(userId: string): Promise<string> {
  const sessionToken = uuidv4();
  await saveSession({
    userId,
    session: sessionToken,
  });
  return sessionToken;
};

export async function removeSession(token: string): Promise<boolean> {
  const session = await getSession(token);
  if (!session) {
    return false;
  }
  await deleteSession(token);
  return true;
};

export async function clearSessions(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const all = await listAllSessions();
  await Promise.all(
    all.map(async session => deleteSession(session.session))
  );
};
