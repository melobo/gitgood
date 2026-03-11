/**
* middleware/errorHandler.ts
*
* Global Express error handler. Catches any unhandled errors that bubble up
* through the route handlers and returns a consistent 500 response.
*/
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error, 
  req: Request, 
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error(err.stack);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected error on the server side.',
  });
}

