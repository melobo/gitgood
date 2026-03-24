import { Request, Response, NextFunction } from 'express';
import config from './config';
import { ServerError, handleError } from './errors';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const raw = req.headers['x-api-key'];
    // Headers can arrive as string | string[] — normalise to a single string
    const clientKey = Array.isArray(raw) ? raw[0] : raw;
    const serverKey = config.apiKey;

    if (!clientKey || clientKey !== serverKey) {
      throw new ServerError('UNAUTHORIZED', 'Invalid or missing API key.');
    }

    next();
  } catch (err) {
    handleError(res, err);
  }
}
