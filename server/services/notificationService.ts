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

    const query = data.dedupe_key
      ? supabase
          .from('notifications')
          .upsert(row, { onConflict: 'dedupe_key', ignoreDuplicates: true })
          .select('id')
          .maybeSingle()
      : supabase
          .from('notifications')
          .insert(row)
          .select('id')
          .maybeSingle();

    const { data: inserted, error } = await query;
    if (error) {
      console.error('[NotificationService] Failed to persist notification:', error.message);
      return { created: false, error: error.message };
    }

    return { created: Boolean(inserted) || Boolean(data.dedupe_key), error: undefined };
  } catch (err: any) {
    console.error('[NotificationService] Exception inserting notification:', err);
    return { created: false, error: err?.message || 'NOTIFICATION_CREATE_FAILED' };
  }
}
