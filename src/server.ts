/**
 * server.ts
 *
 * The entrypoint to the express app.
 * Responsible for middleware setup, route registration, and starting the server.
 */

import process from 'process';
import 'dotenv/config';
import express, { json, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import config from './config';
import { echo, clear } from '../src/debug';
import { handleError } from '../src/errors';
import { errorHandler } from './middleware/errorHandler';
import docs from '../src/docsMiddleware';
import healthRouter from './health';
import invoiceRouter from './invoice';

const app = express();
app.use(json());
app.use(cors());
app.use(morgan('dev'));

// Swagger docs at root
if (config.showDocs) {
  app.use(docs());
} else {
  app.get('/', (req, res) => {
    res.send('<h1>GitGood Invoice API</h1>');
  });
}

/**
 * Wraps a route handler with error handling.
 * Passes any thrown errors to handleError for structured error responses.
 */
function withErrorHandler<T>(res: Response, callback: () => T): T | undefined {
  try {
    return callback();
  } catch (err) {
    handleError(res, err);
  }
}

// Debug routes — disabled in production
if (config.debug) {
  app.get('/debug/echo', (req, res) => {
    withErrorHandler(res, () => {
      res.json(echo(req.query.value as string));
    });
  });

  app.delete('/debug/clear', (req, res) => {
    withErrorHandler(res, () => {
      clear();
      res.json({});
    });
  });
}

// API routes
app.use('/v1', healthRouter);
app.use('/v1/invoice', invoiceRouter);

// Global error handler — must be registered last
app.use(errorHandler);

// Start server
const server = app.listen(config.port, config.ip, () => {
  console.log(`🐝 Server running at http://${config.ip}:${config.port}/`);
});

// Graceful shutdown for coverage tools
process.on('SIGINT', () => {
  console.log('\n🌱 Shutting down gracefully...');
  server.close(() => {
    console.log('🍂 Goodbye!');
    process.exit();
  });
});

export default app;