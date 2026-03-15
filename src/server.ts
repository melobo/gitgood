import process from 'process';
import 'dotenv/config';
import express, { json, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import config from './config';
import { echo, clear } from '../src/debug';
import { handleError } from '../src/errors';
import { errorHandler } from './errorHandler';
import docs from '../src/docsMiddleware';
import healthRouter from './healthRoute';
import { listInvoice, getInvoice, validateInvoice, finaliseInvoice } from './invoiceService';
import { authenticate } from './auth';

const app = express();
app.use(json());
app.use(cors());
app.use(morgan('dev'));

if (config.showDocs) {
  app.use(docs());
} else {
  app.get('/', (req, res) => {
    res.send('<h1>GitGood Invoice API</h1>');
  });
}

if (config.debug) {
  app.get('/debug/echo', (req: Request, res: Response) => {
    try {
      res.json(echo(req.query.value as string));
    } catch (err) {
      handleError(res, err);
    }
  });

  app.delete('/debug/clear', (req: Request, res: Response) => {
    try {
      clear();
      res.json({});
    } catch (err) {
      handleError(res, err);
    }
  });
}

app.use('/v1', healthRouter);

// ===== ADD YOUR ENDPOINTS BELOW HERE ===== //

app.get('/v1/invoice', authenticate, (req: Request, res: Response) => {
  const { from_date, to_date, page, limit_per_page } = req.query;
  try {
    const result = listInvoice({
      from_date: from_date as string | undefined,
      to_date: to_date as string | undefined,
      page: page !== undefined ? Number(page) : undefined,
      limit_per_page: limit_per_page !== undefined ? Number(limit_per_page) : undefined,
    });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/v1/invoice/:invoice_id', authenticate, (req: Request, res: Response) => {
  const { invoice_id } = req.params;
  try {
    const result = getInvoice(invoice_id);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoice_id/validate', (req: Request, res: Response) => {
  const { invoice_id } = req.params;
  try {
    const result = validateInvoice(invoice_id);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoice_id/final', authenticate, (req: Request, res: Response) => {
  const { invoice_id } = req.params;
  try {
    const result = finaliseInvoice(invoice_id);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ========================================= //

app.use(errorHandler);

const server = app.listen(config.port, config.ip, () => {
  console.log(`🐝 Server running at http://${config.ip}:${config.port}/`);
});

process.on('SIGINT', () => {
  console.log('\n🌱 Shutting down gracefully...');
  server.close(() => {
    console.log('🍂 Goodbye!');
    process.exit();
  });
});

export default app;
