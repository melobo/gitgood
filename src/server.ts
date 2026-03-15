import process from 'process';
import 'dotenv/config';
import express, { json, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import config from './config';
import { echo, clear } from './debug';
import { handleError } from './errors';
import { errorHandler } from './errorHandler';
import docs from './docsMiddleware';
import healthRouter from './healthRoute';
import { listInvoice, getInvoice, validateInvoice, finaliseInvoice, deleteInvoice, convertInvoice } from './invoiceService';
import { authenticate } from './auth';

const app = express();
app.use(json());
app.use(cors());
app.use(morgan('dev'));

if (config.showDocs) {
  app.use('/docs', docs());
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
  const { fromDate, toDate, page, limitPerPage } = req.query;
  try {
    const result = listInvoice({
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      page: page !== undefined ? Number(page) : undefined,
      limitPerPage: limitPerPage !== undefined ? Number(limitPerPage) : undefined,
    });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/v1/invoice/:invoiceId', authenticate, (req: Request, res: Response) => {
  try {
    const result = getInvoice(req.params.invoiceId);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoiceId/validate', authenticate, (req: Request, res: Response) => {
  try {
    const result = validateInvoice(req.params.invoiceId);
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

app.delete('/v1/invoice/:invoice_id', authenticate, (req: Request, res: Response) => {
  const { invoice_id } = req.params;
  try {
    const result = deleteInvoice(invoice_id);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoice_id/convert', authenticate, (req: Request, res: Response) => {
  const { invoice_id } = req.params;
  try {
    const result = convertInvoice(invoice_id);
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
