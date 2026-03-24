import { Request, Response, NextFunction } from 'express';
import config from './config';
import { ServerError, handleError } from './errors';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const raw = req.headers['x-api-key'];
    const clientKey = Array.isArray(raw) ? raw[0] : raw;

    if (!clientKey || clientKey !== config.apiKey) {
      throw new ServerError('UNAUTHORIZED', 'Invalid or missing API key.');
    }

    next();
  } catch (err) {
    handleError(res, err);
  }
}
