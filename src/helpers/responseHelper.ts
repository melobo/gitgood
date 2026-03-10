/**
 * utils/responseHelper.ts
 *
 * Helper functions for sending consistent API responses.
 * Use these in all controllers instead of calling res.status().json() directly.
 */

import { Response } from 'express';

export function sendError(res: Response, status: number, error: string, message: string): Response {
  return res.status(status).json({ error, message });
}

export function sendSuccess(res: Response, status: number, data: object): Response {
  return res.status(status).json(data);
}