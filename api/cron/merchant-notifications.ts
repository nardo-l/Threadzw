import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).setHeader('Content-Type', 'application/json').json(body);
}

function validSecret(req: VercelRequest): boolean {
  const expected = (process.env.THREADZW_CRON_SECRET || '').trim();
  const supplied = (
    (req.headers['x-threadzw-cron-secret'] as string | undefined) ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  ).trim();

  if (!expected || !supplied) return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(supplied, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { success: false, error: 'Method not allowed' });
  }

  if (!validSecret(req)) {
    return json(res, 401, { success: false, error: 'Invalid cron secret' });
  }

  const rawSlot = typeof req.query.slot === 'string' ? req.query.slot : req.body?.slot;
  const slot = rawSlot === 'midday' || rawSlot === 'evening' ? rawSlot : null;
  if (!slot) {
    return json(res, 400, { success: false, error: 'slot must be midday or evening' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return json(res, 500, { success: false, slot, error: 'SUPABASE_SERVER_CONFIGURATION_MISSING' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { sendScheduledMerchantNotifications } =
      await import('../../server/services/scheduledNotificationService');

    const result = await sendScheduledMerchantNotifications(supabase, slot);
    return json(res, 200, result);
  } catch (error: any) {
    console.error('[MerchantNotifications] Cron invocation failed:', error);
    return json(res, 500, {
      success: false,
      slot,
      error: error?.message || 'Notification run failed',
      name: error?.name || 'Error'
    });
  }
}
