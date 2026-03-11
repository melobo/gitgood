/**
 * middleware/auth.ts
 *
 * Validates the API key on every incoming request.
 * Clients must pass their key via the x-api-key header.
 * Matches NFR12: token-based authentication before processing any request.
 */

import { Request, Response, NextFunction } from 'express';
import config from './config';
import { ServerError, handleError } from './errors';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const apiKey = process.env.API_KEY

    if (!apiKey || apiKey !== config.apiKey) {
      throw new ServerError('UNAUTHORIZED', 'Invalid or missing API key.');
    }

    next();
  } catch (err) {
    handleError(res, err);
  }
}