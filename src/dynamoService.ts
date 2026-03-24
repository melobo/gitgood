import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { dynamoDB, DYNAMO_TABLE } from './awsConfig';
import { Invoice } from './invoiceInterface';

const isTest = process.env.NODE_ENV === 'test';
const store = new Map<string, Invoice>();

export async function saveInvoice(invoice: Invoice): Promise<void> {
  if (isTest) {
    store.set(invoice.invoiceId, { ...invoice });
    return;
  }

  await dynamoDB.send(new PutCommand({
    TableName: DYNAMO_TABLE,
    Item: invoice
  }));
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  if (isTest) {
    return store.get(invoiceId) ?? null;
  }

  const response = await dynamoDB.send(new GetCommand({
    TableName: DYNAMO_TABLE,
    Key: { invoiceId }
  }));

  return response.Item as Invoice || null;
}

export async function listAllInvoices(): Promise<Invoice[]> {
  if (isTest) {
    return Array.from(store.values());
  }

  const response = await dynamoDB.send(new ScanCommand({
    TableName: DYNAMO_TABLE
  }));

  return response.Items as Invoice[] || [];
}

export async function deleteInvoiceById(invoiceId: string): Promise<void> {
  if (isTest) {
    store.delete(invoiceId);
    return;
  }

  await dynamoDB.send(new DeleteCommand({
    TableName: DYNAMO_TABLE,
    Key: { invoiceId }
  }));
}

export function clearStore(): void {
  store.clear();
}
