import { Router } from 'express';
import { sendPushToProfile } from '../services/pushService.js';
import { sendDailyDigestToAll } from '../services/pushDigestService.js';
import { serverSupabase, requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { isValidCronSecret } from '../lib/cronAuth.js';

const router = Router();

// The public VAPID key is safe to expose to browsers. The private key is
// never returned by this endpoint and remains server-side only.
router.get('/vapid-public-key', (_req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({ error: 'Push notifications are not configured.' });
  }

  return res.json({ publicKey });
});

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
