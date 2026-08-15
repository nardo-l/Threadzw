import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createNotification(
  profileId: string, 
  data: { 
    type: string; 
    title: string; 
    body: string; 
    target_url?: string; 
  }
) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          profile_id: profileId,
          type: data.type || 'info',
          title: data.title,
          body: data.body,
          read: false,
          target_url: data.target_url || '/dashboard',
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('[NotificationService] Failed to insert notification row:', error);
      // If table doesn't exist yet, try to create table via RPC or log warning
    }
  } catch (err) {
    console.error('[NotificationService] Exception inserting notification:', err);
  }
}
