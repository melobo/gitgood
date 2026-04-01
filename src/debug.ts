/**
 * debug.ts
 *
 * Debug utility functions used by debug routes in server.ts.
 * These routes are only active when config.debug is true (i.e. not in production).
 */
import { clearStore } from './dynamoService';
import { clearInvoices } from './invoiceService';
import { clearSessions, clearUsers } from './user';

export function echo(value: string): { value: string } {
  return { value };
}

export async function clear(): Promise<void> {
  await clearInvoices();
  await clearUsers();
  await clearSessions();
  clearStore();
}
