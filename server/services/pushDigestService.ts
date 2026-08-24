import { sendPushToProfile } from './pushService';
import { createNotification } from './notificationService';

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
      
      let interestCount = 0;
      let visitCount = 0;

      if (shopIds.length > 0) {
        const { count: interestEvents } = await supabase
          .from('shop_analytics')
          .select('*', { count: 'exact', head: true })
          .in('shop_id', shopIds)
          .in('event_type', ['whatsapp_click', 'visit_shop_click', 'map_open'])
          .gte('created_at', startOfDay);
        interestCount = interestEvents || 0;

        const { count: visitEvents } = await supabase
          .from('shop_analytics')
          .select('*', { count: 'exact', head: true })
          .in('shop_id', shopIds)
          .in('event_type', ['shop_visit', 'shop_view'])
          .gte('created_at', startOfDay);
        visitCount = visitEvents || 0;
      }

      // Skip sending daily review to profiles with zero activity for the day, but still check expiry reminders below!
      if (interestCount > 0 || visitCount > 0) {
        const payload = {
          title: "Your daily shop review",
          body: `You had ${interestCount} customer interests and ${visitCount} shop visits today`,
          data: { url: "/dashboard" }
        };

        await sendPushToProfile(supabase, profileId, payload);
        await createNotification(profileId, {
          type: 'daily_summary',
          title: 'Daily shop summary',
          body: `You had ${interestCount} customer interests and ${visitCount} shop visits today.`,
          target_url: '/analytics'
        });
        sentCount++;
      }
    }

    // 2. Check for Premium subscriptions expiring within 3 days and send reminders (once per cycle)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: expiringSoon, error: expiringError } = await supabase
      .from('profiles')
      .select('id, active_until, subscription_status')
      .eq('subscription_status', 'active')
      .lt('active_until', threeDaysFromNow.toISOString())
      .gt('active_until', new Date().toISOString());

    let reminderCount = 0;
    if (!expiringError && expiringSoon && expiringSoon.length > 0) {
      for (const profile of expiringSoon) {
        const profileId = profile.id;

        // Check if reminder was already sent for this cycle
        const { data: userSub } = await supabase
          .from('subscriptions')
          .select('reminder_sent_at, active_until')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let alreadyReminded = false;
        if (userSub) {
          if ('reminder_sent_at' in userSub) {
            if (userSub.reminder_sent_at) {
              const reminderDate = new Date(userSub.reminder_sent_at);
              const activeUntilDate = new Date(profile.active_until);
              const cycleStart = new Date(activeUntilDate);
              cycleStart.setDate(cycleStart.getDate() - 35);
              if (reminderDate > cycleStart) {
                alreadyReminded = true;
              }
            }
          } else {
            console.warn("[ExpiryReminder] Missing required column 'reminder_sent_at' on subscriptions table. Please add: ALTER TABLE subscriptions ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;");
          }
        }

        if (!alreadyReminded) {
          const reminderPayload = {
            title: "Your Premium access expires soon",
            body: "Renew to keep Premium storefront access active",
            data: { url: "/dashboard/upgrade" }
          };

          try {
            await sendPushToProfile(supabase, profileId, reminderPayload);
            await createNotification(profileId, {
              type: 'pro_expiry',
              title: 'Premium access expires in 3 days',
              body: 'Renew to keep Premium storefront access active',
              target_url: '/subscription'
            });
            reminderCount++;
            console.log(`[ExpiryReminder] Sent expiry reminder push to profile ${profileId}`);

            if (userSub && 'reminder_sent_at' in userSub) {
              await supabase
                .from('subscriptions')
                .update({ reminder_sent_at: new Date().toISOString() })
                .eq('profile_id', profileId);
            }
          } catch (remErr) {
            console.error(`[ExpiryReminder] Failed to send push to profile ${profileId}:`, remErr);
          }
        }
      }
    }

    console.log(`Daily digest push sent to ${sentCount} active profiles. Expiry reminders sent to ${reminderCount} profiles.`);
    return { success: true, sentCount, reminderCount };
  } catch (err: any) {
    console.error('Error running daily digest push:', err);
    throw err;
  }
}
