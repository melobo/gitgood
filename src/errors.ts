/**
 * errors.ts
 *
 * Contains definitions for various error types, which can be handled by the server in order to send
 * specific error codes.
 */

import { Response } from 'express';

/**
 * A dedicated error class, which can be used to discern expected errors caused by our server's
 * logic from unexpected errors caused by bugs.
 *
 * ## Usage:
 *
 * ```ts
 * throw new ServerError('UNAUTHORIZED', 'A token was provided, but it is invalid.');
 * ```
 */
export class ServerError extends Error {
  /** The error type, for example 'UNAUTHORIZED' */
  error: string;
  /** A human-friendly error message, for example 'A token was provided, but it is invalid.' */
  message: string;

  constructor(error: string, message: string) {
    super(message);
    this.error = error;
    this.message = message;
  }
}

export function errorToStatus(e: string): number {
  switch (e) {
    case 'UNAUTHORIZED':
      return 401;
    case 'INVALID_REQUEST':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'INSUFFICIENT_DATA':
      return 422;
    case 'CONFLICT':
    case 'ALREADY_FINALISED':
    case 'ALREADY_CONVERTED':
    case 'INVOICE_NOT_CONVERTED':
    case 'INVOICE_NOT_VALIDATED':
    case 'INVOICE_NOT_READY':
      return 409;
    case 'INTERNAL_SERVER_ERROR':
      return 500;
    default:
      throw new Error(`Missing status code definition for error type '${e}'!`);
  }
}

/**
 * A helper function to handle errors by sending the corresponding response code.
 *
 * If the error is unrecognised, it is thrown again, in order to be handled by Express. That way,
 * errors aren't inadvertently silenced.
 */
export function handleError(res: Response, err: unknown) {
  if (err instanceof ServerError) {
    return res.status(errorToStatus(err.error)).json({ error: err.message });
  }
  // Unrecognised error -- we throw it again so that the error can be handled by Express
  throw err;
}
