import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let serviceClient: any | null = null;

function getServiceClient() {
  if (!serviceClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_CONFIGURATION_MISSING');
    }
    serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceClient;
}

export interface NotificationInput {
  type: string;
  title: string;
  body: string;
  target_url?: string;
  dedupe_key?: string;
}

export interface NotificationCreateResult {
  created: boolean;
  error?: string;
}

export async function createNotification(
  profileId: string,
  data: NotificationInput,
  client?: any
): Promise<NotificationCreateResult> {
  if (!profileId) return { created: false, error: 'PROFILE_ID_REQUIRED' };

  try {
    const supabase = client || getServiceClient();
    const row = {
      profile_id: profileId,
      type: data.type || 'info',
      title: data.title,
      body: data.body,
      read: false,
      target_url: data.target_url || '/dashboard',
      ...(data.dedupe_key ? { dedupe_key: data.dedupe_key } : {}),
      created_at: new Date().toISOString()
    };

    // Use INSERT rather than ON CONFLICT (dedupe_key): the database's
    // dedupe index is partial (WHERE dedupe_key IS NOT NULL), so Postgres
    // cannot infer it from a plain ON CONFLICT (dedupe_key) target.
    const { data: inserted, error } = await supabase
      .from('notifications')
      .insert(row)
      .select('id')
      .maybeSingle();

    if (error) {
      // A prior successful delivery may already own this dedupe key.
      // Treat that as an idempotent duplicate, not a delivery failure.
      if (data.dedupe_key && error.code === '23505') {
        return { created: false };
      }
      console.error('[NotificationService] Failed to persist notification:', error.message);
      return { created: false, error: error.message };
    }

    return { created: Boolean(inserted), error: undefined };
  } catch (err: any) {
    console.error('[NotificationService] Exception inserting notification:', err);
    return { created: false, error: err?.message || 'NOTIFICATION_CREATE_FAILED' };
  }
}
