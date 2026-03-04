/**
 * routes/health.ts
 *
 * Public health check route — no authentication required.
 * Satisfies NFR04: status page so other teams can verify the service is running.
 */

import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;