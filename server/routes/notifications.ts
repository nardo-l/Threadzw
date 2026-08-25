import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
let supabaseClient: any | null = null;

function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_CONFIGURATION_MISSING');
    }
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

const DEFAULT_PREFERENCES = {
  timezone: 'Africa/Harare',
  setup_reminders_enabled: true,
  daily_summary_enabled: true,
  push_enabled: true
};

function isMissingTableError(error: any): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST204' || error?.message?.includes('does not exist');
}

function validTimezone(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return DEFAULT_PREFERENCES.timezone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch {
    return DEFAULT_PREFERENCES.timezone;
  }
}

function userId(req: AuthenticatedRequest): string {
  return String(req.user?.id || '');
}

router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const profileId = userId(req);
  if (!profileId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data, error } = await getSupabase()
      .from('notifications')
      .select('id, profile_id, type, title, body, read, target_url, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (isMissingTableError(error)) return res.json({ notifications: [], unreadCount: 0 });
      return res.status(500).json({ error: error.message });
    }

    const notifications = data || [];
    return res.json({
      notifications,
      unreadCount: notifications.filter((notification: any) => !notification.read).length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to load notifications' });
  }
});

router.post('/mark-read', async (req: AuthenticatedRequest, res) => {
  const profileId = userId(req);
  try {
    const { error } = await getSupabase()
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', profileId)
      .eq('read', false);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update notifications' });
  }
});

router.post('/mark-one', async (req: AuthenticatedRequest, res) => {
  const profileId = userId(req);
  const notificationId = String(req.body?.notificationId || '');
  if (!notificationId) return res.status(400).json({ error: 'notificationId is required' });

  try {
    const { error } = await getSupabase()
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('profile_id', profileId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to update notification' });
  }
});

router.get('/preferences', async (req: AuthenticatedRequest, res) => {
  const profileId = userId(req);
  try {
    const { data, error } = await getSupabase()
      .from('notification_preferences')
      .select('profile_id, timezone, setup_reminders_enabled, daily_summary_enabled, push_enabled')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error && !isMissingTableError(error)) return res.status(500).json({ error: error.message });
    return res.json({ preferences: { profile_id: profileId, ...DEFAULT_PREFERENCES, ...(data || {}) } });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to load notification preferences' });
  }
});

router.put('/preferences', async (req: AuthenticatedRequest, res) => {
  const profileId = userId(req);
  const body = req.body || {};
  const preferences = {
    profile_id: profileId,
    timezone: validTimezone(body.timezone),
    setup_reminders_enabled: body.setup_reminders_enabled !== false,
    daily_summary_enabled: body.daily_summary_enabled !== false,
    push_enabled: body.push_enabled !== false,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await getSupabase()
      .from('notification_preferences')
      .upsert(preferences, { onConflict: 'profile_id' })
      .select('profile_id, timezone, setup_reminders_enabled, daily_summary_enabled, push_enabled')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ preferences: data });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save notification preferences' });
  }
});

export default router;
