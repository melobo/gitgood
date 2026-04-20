import process from 'process';
import express, { json, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import config from './config';
import { clear, echo } from './debug';
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
  getInvoiceSummary,
  bulkCreateInvoices,
  batchProcessInvoices,
} from './invoiceService';
import { getInvoiceById } from './dynamoService';
import { authenticate } from './auth';
import { userRegister, userLogin, userDetails, userDetailsUpdate, userPasswordUpdate, userLogout } from './user';
import { validateSessionToken } from './validation';
import { aiAutofillInvoice } from './autofillService';
import { sendInvoice } from './sendService';
import { InvoiceStatus } from './invoiceInterface';

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

  app.delete('/debug/clear', async (_req, res) => {
    try {
      await clear();
      res.json({ message: 'All data cleared' });
    } catch (err) {
      handleError(res, err);
    }
  });
}

app.use('/v1', healthRouter);

async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionToken = req.header('session');
    await validateSessionToken(sessionToken);
    next();
  } catch (err) {
    handleError(res, err);
  }
}

// ===== INVOICE ENDPOINTS ===== //

// ── Single create ────────────────────────────────────────────────────────────
app.post('/v1/invoice/autofill', authenticate, requireSession, async (req: Request, res: Response) => {
  try {
    const result = await aiAutofillInvoice(req.body ?? {});
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice', authenticate, requireSession, async (req: Request, res: Response) => {
  try {
    const invoice = await createInvoice(req.body);
    res.status(201).json({
      invoiceId: invoice.invoiceId,
      status: invoice.status,
      createdAt: invoice.createdAt,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ── Bulk create — BEFORE /v1/invoice/:invoiceId so "bulk" isn't treated as an ID
app.post('/v1/invoice/bulk', authenticate, requireSession, async (req: Request, res: Response) => {
  try {
    const { invoices } = req.body;

    if (!invoices) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Missing or Invalid Fields',
      });
    }

    const result = await bulkCreateInvoices(invoices);
    return res.status(201).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ── Batch processing — /v1/invoices/batch/:action (note: "invoices" plural)
app.post('/v1/invoices/batch/:action', authenticate, requireSession, async (req: Request, res: Response) => {
  try {
    const action = req.params.action as string;
    const { invoiceIds } = req.body;

    if (!invoiceIds || (Array.isArray(invoiceIds) && invoiceIds.length === 0)) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing or Invalid Fields' });
    }

    const VALID_ACTIONS = ['convert', 'validate', 'finalise'];
    if (!VALID_ACTIONS.includes(action)) {
      return res.status(400).json({ error: 'INVALID_REQUEST', message: `Unknown batch action: "${action}"` });
    }

    const result = await batchProcessInvoices(invoiceIds, action);
    return res.status(200).json(result);
  } catch (err) {
    console.error('BATCH ROUTE CAUGHT:', err); // ← add this temporarily
    handleError(res, err);
  }
});

// ── List ─────────────────────────────────────────────────────────────────────
app.get('/v1/invoice/:invoiceId/history', authenticate, async (req: Request, res: Response) => {
  try {
    const invoice = await getInvoiceById(req.params.invoiceId as string);
    if (!invoice) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Invoice not found' });
    }
    res.status(200).json({
      invoiceId: invoice.invoiceId,
      statusHistory: invoice.statusHistory,
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/v1/invoice', authenticate, requireSession, async (req: Request, res: Response) => {
  const { fromDate, toDate, page, limitPerPage } = req.query;
  try {
    const result = await listInvoice({
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

app.get('/v2/invoice', authenticate, requireSession, async (req: Request, res: Response) => {
  const { fromDate, toDate, page, limitPerPage, filter, status, buyerName, supplierName, minAmount, maxAmount } = req.query;
  try {
    const result = await listInvoice({
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      page: page !== undefined ? Number(page) : undefined,
      limitPerPage: limitPerPage !== undefined ? Number(limitPerPage) : undefined,
      filter: filter as string | undefined,
      status: status as InvoiceStatus | undefined,
      buyerName: buyerName as string | undefined,
      supplierName: supplierName as string | undefined,
      minAmount: minAmount !== undefined ? Number(minAmount) : undefined,
      maxAmount: maxAmount !== undefined ? Number(maxAmount) : undefined,
    });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ── All /:invoiceId routes below — "bulk" is already handled above ────────────
app.get('/v1/invoice/:invoiceId', authenticate, requireSession, async (req: Request, res: Response) => {
  try {
    const result = await getInvoice(req.params.invoiceId as string);
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

app.post('/v1/invoice/:invoiceId/validate', authenticate, requireSession, async (req: Request, res: Response) => {
  try {
    const result = await validateInvoice(req.params.invoiceId as string);
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

app.post('/v1/invoice/:invoiceId/final', authenticate, requireSession, async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const result = await finaliseInvoice(invoiceId as string);
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

app.post('/v1/invoice/:invoiceId/send', authenticate, requireSession, async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const { recipientEmail } = req.body ?? {};
    const result = await sendInvoice(invoiceId as string, recipientEmail);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.delete('/v1/invoice/:invoiceId', authenticate, requireSession, async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const result = await deleteInvoice(invoiceId as string);
    res.status(200).json({
      invoiceId: result.invoiceId,
      message: result.message,
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/invoice/:invoiceId/convert', authenticate, requireSession, async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const result = await convertInvoice(invoiceId as string);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.put('/v1/invoice/:invoiceId', authenticate, requireSession, async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const result = await updateInvoice(invoiceId as string, {
      ...req.body,
      paymentDueDate: req.body.paymentDate ?? req.body.paymentDueDate,
      itemsList: req.body.itemDetails ?? req.body.itemsList,
    });
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/v1/invoice/:invoiceId/download', authenticate, requireSession, async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  const format = (req.query.format as string) ?? 'xml';
  try {
    const { content, contentType, filename } = await downloadInvoice(invoiceId as string, format);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(content);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/v1/invoice/:invoiceId/summary', authenticate, requireSession, async (req: Request, res: Response) => {
  try {
    const result = await getInvoiceSummary(req.params.invoiceId as string);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ===== AUTH ENDPOINTS ===== //
app.post('/v1/admin/auth/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  try {
    const result = await userRegister(email, password, name);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/admin/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await userLogin(email, password);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ===== USER ENDPOINTS ===== //
app.get('/v1/admin/user/details', authenticate, async (req: Request, res: Response) => {
  try {
    const sessionToken = req.header('session');
    const validated = await validateSessionToken(sessionToken);
    const result = await userDetails(validated.userId);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.put('/v1/admin/user/details', authenticate, async (req: Request, res: Response) => {
  const { email, name } = req.body;
  try {
    const sessionToken = req.header('session');
    const validated = await validateSessionToken(sessionToken);
    const result = await userDetailsUpdate(validated.userId, email, name);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.put('/v1/admin/user/password', authenticate, async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const sessionToken = req.header('session');
    const validated = await validateSessionToken(sessionToken);
    const result = await userPasswordUpdate(validated.userId, oldPassword, newPassword);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/v1/admin/auth/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const sessionToken = req.header('session');
    const result = await userLogout(sessionToken as string);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// ========================================= //
app.use(errorHandler);

export const server = app.listen(config.port, config.ip, () => {
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
