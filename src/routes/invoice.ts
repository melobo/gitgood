/**
 * routes/invoice.ts
 *
 * Defines all /invoice routes and maps them to controller functions.
 * All routes are protected by the authenticate middleware (NFR12).
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createInvoice,
  listInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  convertInvoice,
  validateInvoice,
  finaliseInvoice,
  downloadInvoice,
} from '../controllers/invoiceController';

const router = Router();

router.use(authenticate);

router.post('/', createInvoice);
router.get('/', listInvoices);
router.get('/:invoice_id/download', downloadInvoice);
router.get('/:invoice_id', getInvoice);
router.put('/:invoice_id', updateInvoice);
router.delete('/:invoice_id', deleteInvoice);
router.post('/:invoice_id/convert', convertInvoice);
router.post('/:invoice_id/validate', validateInvoice);
router.post('/:invoice_id/final', finaliseInvoice);

export default router;