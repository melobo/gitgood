import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMO_TABLE, USER_TABLE, SESSION_TABLE } from './awsConfig';
import { Invoice, User, Session } from './invoiceInterface';

const isTest = process.env.NODE_ENV === 'test';
const invoiceStore = new Map<string, Invoice>();
const userStore = new Map<string, User>();
const sessionStore = new Map<string, Session>();

export async function saveInvoice(invoice: Invoice): Promise<void> {
  if (isTest) {
    invoiceStore.set(invoice.invoiceId, { ...invoice });
    return;
  }

  await dynamoDB.send(new PutCommand({
    TableName: DYNAMO_TABLE,
    Item: invoice
  }));
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  if (isTest) {
    return invoiceStore.get(invoiceId) ?? null;
  }

  const response = await dynamoDB.send(new GetCommand({
    TableName: DYNAMO_TABLE,
    Key: { invoiceId }
  }));

  return response.Item as Invoice || null;
}

export async function listAllInvoices(): Promise<Invoice[]> {
  if (isTest) {
    return Array.from(invoiceStore.values());
  }

  const response = await dynamoDB.send(new ScanCommand({
    TableName: DYNAMO_TABLE
  }));

  return response.Items as Invoice[] || [];
}

export async function listInvoicesByUser(userId: string): Promise<Invoice[]> {
  if (isTest) {
    return Array.from(invoiceStore.values()).filter(inv => inv.userId === userId);
  }

  const response = await dynamoDB.send(new QueryCommand({
    TableName: DYNAMO_TABLE,
    IndexName: 'userId',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: {
      ':uid': userId
    }
  }));

  return response.Items as Invoice[] || [];
}

export async function deleteInvoiceById(invoiceId: string): Promise<void> {
  if (isTest) {
    invoiceStore.delete(invoiceId);
    return;
  }

  await dynamoDB.send(new DeleteCommand({
    TableName: DYNAMO_TABLE,
    Key: { invoiceId }
  }));
}

export async function saveUser(user: User): Promise<void> {
  if (isTest) {
    userStore.set(String(user.userId), { ...user });
    return;
  }

  await dynamoDB.send(new PutCommand({
    TableName: USER_TABLE,
    Item: user
  }));
}

export async function getUserById(userId: string): Promise<User | null> {
  if (isTest) {
    return userStore.get(String(userId)) ?? null;
  }

  const response = await dynamoDB.send(new GetCommand({
    TableName: USER_TABLE,
    Key: { userId }
  }));

  return response.Item as User || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (isTest) {
    return Array.from(userStore.values()).find(u => u.email === email) ?? null;
  }

  const response = await dynamoDB.send(new ScanCommand({
    TableName: USER_TABLE,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  }));

  return response.Items?.[0] as User || null;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  const existing = await getUserById(userId);
  if (!existing) {
    return;
  }
  await saveUser({ ...existing, ...updates });
}

export async function listAllUsers(): Promise<User[]> {
  if (isTest) {
    return Array.from(userStore.values());
  }

  const response = await dynamoDB.send(new ScanCommand({
    TableName: USER_TABLE
  }));

  return response.Items as User[] || [];
}

export async function deleteUserById(userId: string): Promise<void> {
  if (isTest) {
    userStore.delete(userId);
    return;
  }

  await dynamoDB.send(new DeleteCommand({
    TableName: USER_TABLE,
    Key: { userId }
  }));
}

export async function saveSession(session: Session): Promise<void> {
  if (isTest) {
    sessionStore.set(session.session, { ...session });
    return;
  }

  await dynamoDB.send(new PutCommand({
    TableName: SESSION_TABLE,
    Item: session
  }));
}

export async function getSession(token: string): Promise<Session | null> {
  if (isTest) {
    return sessionStore.get(token) ?? null;
  }

  const response = await dynamoDB.send(new GetCommand({
    TableName: SESSION_TABLE,
    Key: { session: token }
  }));

  return response.Item as Session || null;
}

export async function listAllSessions(): Promise<Session[]> {
  if (isTest) {
    return Array.from(sessionStore.values());
  }

  const response = await dynamoDB.send(new ScanCommand({
    TableName: SESSION_TABLE
  }));
  return response.Items as Session[] || [];
}

export async function deleteSession(token: string): Promise<void> {
  if (isTest) {
    sessionStore.delete(token);
    return;
  }

  await dynamoDB.send(new DeleteCommand({
    TableName: SESSION_TABLE,
    Key: { session: token }
  }));
}

export function clearStore(): void {
  invoiceStore.clear();
  userStore.clear();
  sessionStore.clear();
}
