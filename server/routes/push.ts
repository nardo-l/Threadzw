import { Router } from 'express';
import { sendPushToProfile } from '../services/pushService';
import { sendDailyDigestToAll } from '../services/pushDigestService';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

router.post('/send', async (req, res) => {
  try {
    const { profileId, payload } = req.body;
    if (!profileId || !payload) {
      return res.status(400).json({ error: 'Missing profileId or payload' });
    }

    await sendPushToProfile(supabase, profileId, payload);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error sending push notification:', err);
    res.status(500).json({ error: err.message || 'Failed to send push notification' });
  }
});

router.post('/daily-digest', async (req, res) => {
  try {
    const result = await sendDailyDigestToAll(supabase);
    res.json(result);
  } catch (err: any) {
    console.error('Error sending daily digest push notifications:', err);
    res.status(500).json({ error: err.message || 'Failed to send daily digest' });
  }
});

export default router;

