import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get notifications for a profile
router.get('/', async (req, res) => {
  const profileId = req.query.profileId as string;
  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json({ notifications: [] });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ notifications: data || [] });
  } catch (err: any) {
    res.json({ notifications: [] });
  }
});

// Mark all as read
router.post('/mark-read', async (req, res) => {
  const { profileId } = req.body;
  if (!profileId) {
    return res.status(400).json({ error: 'profileId is required' });
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', profileId)
      .eq('read', false);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single as read
router.post('/mark-one', async (req, res) => {
  const { notificationId } = req.body;
  if (!notificationId) {
    return res.status(400).json({ error: 'notificationId is required' });
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
