import { Router } from 'express';
import { sendPushToProfile } from '../services/pushService';
import { sendDailyDigestToAll } from '../services/pushDigestService';
import { serverSupabase, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { isValidCronSecret } from '../lib/cronAuth';

const router = Router();

router.post('/send', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { payload } = req.body || {};
    const profileId = req.user?.id;
    if (!profileId || !payload) {
      return res.status(400).json({ error: 'Missing payload' });
    }

    const result = await sendPushToProfile(serverSupabase, profileId, payload);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Error sending push notification:', err);
    return res.status(500).json({ error: err.message || 'Failed to send push notification' });
  }
});

router.post('/daily-digest', async (req, res) => {
  if (!isValidCronSecret(req)) {
    return res.status(401).json({ error: 'Invalid cron secret' });
  }

  try {
    const result = await sendDailyDigestToAll(serverSupabase);
    return res.json(result);
  } catch (err: any) {
    console.error('Error sending daily digest push notifications:', err);
    return res.status(500).json({ error: err.message || 'Failed to send daily digest' });
  }
});

export default router;
