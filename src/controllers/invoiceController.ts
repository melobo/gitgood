/**
 * controllers/invoiceController.ts
 *
 * Handles HTTP request/response logic for all invoice endpoints.
 * Each controller validates input, calls the appropriate service function,
 * and returns the response. Business logic lives in services/invoiceService.ts.
 *
 * Status: Stubs — to be implemented in Sprint 2.
 */

import { Request, Response } from 'express';

export function createInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function listInvoices(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function getInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function updateInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function deleteInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function convertInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function validateInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function finaliseInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}

export function downloadInvoice(req: Request, res: Response): void {
  res.status(501).json({ error: 'NOT_IMPLEMENTED', message: 'Coming in Sprint 2' });
}