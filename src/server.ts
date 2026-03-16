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
import {
  createInvoice,
  convertInvoice,
  listInvoice,
  getInvoice,
  updateInvoice,
  downloadInvoice,
  validateInvoice,
  finaliseInvoice,
  deleteInvoice,
  clearInvoices,
} from './invoiceService';
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
      clearInvoices();
      res.json({});
    } catch (err) {
      handleError(res, err);
    }
  });
}

app.use('/v1', healthRouter);

// ===== INVOICE ENDPOINTS ===== //

app.post('/v1/invoice', authenticate, (req: Request, res: Response) => {
  try {
    const invoice = createInvoice(req.body);
    res.status(201).json({
      invoiceId: invoice.invoiceId,
      status: invoice.status,
      createdAt: invoice.createdAt,
    });
  } catch (err) {
    handleError(res, err);
  }
});

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
    res.status(200).json({
      invoiceId: result.invoiceId,
      status: result.status,
      buyerName: result.buyerName,
      buyerAbn: result.buyerAbn,
      supplierName: result.supplierName,
      supplierAbn: result.supplierAbn,
      issueDate: result.issueDate,
      paymentDueDate: result.paymentDueDate,
      itemsList: result.itemsList.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCode: item.unitCode,
        totalPrice: item.totalPrice,
      })),
      taxRate: result.taxRate,
      taxAmount: result.taxAmount,
      totalPayable: result.totalPayable,
      paymentDetails: result.paymentDetails.map(pd => ({
        bankName: pd.bankName,
        accountNumber: pd.accountNumber,
        bsbAbnNumber: pd.bsbAbnNumber,
        paymentMethod: pd.paymentMethod,
      })),
      ...(result.additionalNotes !== undefined && { additionalNotes: result.additionalNotes }),
      ...(result.ublXml !== undefined && { ublXml: result.ublXml }),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      ...(result.finalisedAt !== undefined && { finalisedAt: result.finalisedAt }),
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoiceId/validate', authenticate, (req: Request, res: Response) => {
  try {
    const result = validateInvoice(req.params.invoiceId);
    res.status(200).json({
      invoiceId: result.invoiceId,
      valid: result.valid,
      errors: result.errors,
      status: result.status,
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoiceId/final', authenticate, (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const result = finaliseInvoice(invoiceId);
    res.status(200).json({
      invoiceId: result.invoiceId,
      status: result.status,
      ublXml: result.ublXml,
      finalisedAt: result.finalisedAt,
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.delete('/v1/invoice/:invoice_id', authenticate, (req: Request, res: Response) => {
  const { invoice_id: invoiceId } = req.params;
  try {
    const result = deleteInvoice(invoiceId);
    res.status(200).json({
      invoice_id: result.invoiceId,
      message: result.message,
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoiceId/convert', authenticate, (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const result = convertInvoice(invoiceId);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.put('/v1/invoice/:invoiceId', authenticate, (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const result = updateInvoice(invoiceId, {
      ...req.body,
      paymentDueDate: req.body.paymentDate ?? req.body.paymentDueDate,
      itemsList: req.body.itemDetails ?? req.body.itemsList,
    });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/v1/invoice/:invoiceId/download', authenticate, (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  const format = (req.query.format as string) ?? 'xml';
  try {
    const { content, contentType, filename } = downloadInvoice(invoiceId, format);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(content);
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
