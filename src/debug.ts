/**
 * debug.ts
 *
 * Debug utility functions used by debug routes in server.ts.
 * These routes are only active when config.debug is true (i.e. not in production).
 */
import { clearInvoices } from './invoiceService';

export function echo(value: string): { value: string } {
  return { value };
}

export function clear(): void {
  clearInvoices();
}
