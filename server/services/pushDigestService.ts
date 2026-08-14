import { sendPushToProfile } from './pushService';

export async function sendDailyDigestToAll(supabase: any) {
  try {
    // 1. Get all unique profile_ids from push_subscriptions
    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('profile_id');

    if (subsError || !subs || subs.length === 0) {
      console.log('No push subscriptions found for daily digest.');
      return { success: true, sentCount: 0 };
    }

    const uniqueProfileIds = Array.from(new Set(subs.map((s: any) => s.profile_id)));
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    let sentCount = 0;

    for (const rawProfileId of uniqueProfileIds) {
      const profileId = rawProfileId as string;
      if (!profileId) continue;

      // Find shops owned by this profile
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', profileId);

      const shopIds = (shops || []).map((s: any) => s.id);
      
      let orderCount = 0;
      let visitCount = 0;

      if (shopIds.length > 0) {
        // Count WhatsApp / real orders today
        const { count: ordCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('shop_id', shopIds)
          .neq('status', 'visit')
          .gte('created_at', startOfDay);

        orderCount = ordCount || 0;

        // Count shop visits today (from shop_analytics or orders status = 'visit')
        const { count: visCount } = await supabase
          .from('shop_analytics')
          .select('*', { count: 'exact', head: true })
          .in('shop_id', shopIds)
          .gte('created_at', startOfDay);

        visitCount = visCount || 0;

        if (visitCount === 0) {
          const { count: visOrdersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .in('shop_id', shopIds)
            .eq('status', 'visit')
            .gte('created_at', startOfDay);
          visitCount = visOrdersCount || 0;
        }
      }

      // Skip sending to profiles with zero activity for the day
      if (orderCount === 0 && visitCount === 0) {
        continue;
      }

      const payload = {
        title: "Your daily shop review 📊",
        body: `You had ${orderCount} WhatsApp orders and ${visitCount} shop visits today`,
        data: { url: "/dashboard" }
      };

      await sendPushToProfile(supabase, profileId, payload);
      sentCount++;
    }

    console.log(`Daily digest push sent to ${sentCount} active profiles.`);
    return { success: true, sentCount };
  } catch (err: any) {
    console.error('Error running daily digest push:', err);
    throw err;
  }
}
