import { Router, Request, Response } from 'express';
import { checkExpiredSubscriptions } from '../services/expiryService';

const router = Router();

router.post('/check-expired-subscriptions', async (req: Request, res: Response) => {
  try {
    const result = await checkExpiredSubscriptions();
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[ExpiryEndpoint] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

export default router;
