import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function checkExpiredSubscriptions() {
  try {
    const nowIso = new Date().toISOString();
    console.log(`[ExpiryJob] Running check for expired subscriptions at ${nowIso}`);

    const { data: expired, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')
      .lt('active_until', nowIso);

    if (error) {
      console.error('[ExpiryJob] Error fetching expired profiles:', error);
      return { success: false, error: error.message };
    }

    if (!expired || expired.length === 0) {
      console.log('[ExpiryJob] No expired subscriptions found.');
      return { success: true, downgradedCount: 0 };
    }

    const ids = expired.map((p: any) => p.id);
    console.log(`[ExpiryJob] Found ${ids.length} expired profiles to downgrade.`);

    // 1. Downgrade profiles to inactive
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'inactive' })
      .in('id', ids);

    if (profileUpdateError) {
      console.error('[ExpiryJob] Error updating profiles status:', profileUpdateError);
      throw profileUpdateError;
    }

    // 2. Mark subscriptions as inactive (preserving payment history rows)
    const { error: subUpdateError } = await supabase
      .from('subscriptions')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .in('profile_id', ids);

    if (subUpdateError) {
      console.error('[ExpiryJob] Error updating subscriptions status:', subUpdateError);
      throw subUpdateError;
    }

    console.log(`[ExpiryJob] Successfully downgraded ${ids.length} expired profiles and subscriptions.`);
    return { success: true, downgradedCount: ids.length };
  } catch (err: any) {
    console.error('[ExpiryJob] Exception caught during expiration check:', err);
    throw err;
  }
}
