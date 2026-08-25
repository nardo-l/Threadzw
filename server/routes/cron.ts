import { Router, Request, Response } from 'express';
import { checkExpiredSubscriptions } from '../services/expiryService.js';
import { sendScheduledMerchantNotifications, type NotificationSlot } from '../services/scheduledNotificationService.js';
import { serverSupabase } from '../middleware/auth.js';
import { isValidCronSecret } from '../lib/cronAuth.js';

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

router.post('/merchant-notifications', async (req: Request, res: Response) => {
  if (!isValidCronSecret(req)) {
    return res.status(401).json({ success: false, error: 'Invalid cron secret' });
  }

  const slot = req.body?.slot as NotificationSlot;
  if (slot !== 'midday' && slot !== 'evening') {
    return res.status(400).json({ success: false, error: 'slot must be midday or evening' });
  }

  try {
    const result = await sendScheduledMerchantNotifications(serverSupabase, slot);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error(`[MerchantNotifications] ${slot} run failed:`, err);
    return res.status(500).json({ success: false, slot, error: err.message || 'Notification run failed' });
  }
});

export default router;
