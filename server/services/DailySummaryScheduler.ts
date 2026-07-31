import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import NotificationService from './NotificationService';
import AnalyticsService from './AnalyticsService';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface DailySummaryJobResult {
  success: boolean;
  totalShopsProcessed: number;
  summariesSent: number;
  skippedDisabled: number;
  skippedAlreadySent: number;
  errors: string[];
}

/**
 * Helper to get date string (YYYY-MM-DD) for a specified timezone
 */
export function getLocalDateString(date: Date = new Date(), timezone: string = 'Africa/Harare'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date); // YYYY-MM-DD
  } catch (err) {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Calculate percentage comparison vs yesterday
 */
export function calculateVisitorComparison(today: number, yesterday: number): string {
  if (yesterday === 0) {
    if (today > 0) return '+100%';
    return '0%';
  }
  const diff = today - yesterday;
  const pct = Math.round((diff / yesterday) * 100);
  if (pct >= 0) return `+${pct}%`;
  return `${pct}%`;
}

/**
 * Main execution function for ThreadZW Daily Summary Job
 */
export async function runDailySummaryJob(options: { force?: boolean } = {}): Promise<DailySummaryJobResult> {
  const errors: string[] = [];
  let totalShopsProcessed = 0;
  let summariesSent = 0;
  let skippedDisabled = 0;
  let skippedAlreadySent = 0;

  const timezone = 'Africa/Harare';
  const todayStr = getLocalDateString(new Date(), timezone);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate, timezone);

  console.log(`[DailySummaryScheduler] Running Daily Summary Job for date ${todayStr} (${timezone})...`);

  try {
    // 1. Retrieve every active shop
    const { data: shops, error: shopsErr } = await supabase
      .from('shops')
      .select('id, name, owner_id, status, is_active');

    if (shopsErr) {
      console.error('[DailySummaryScheduler] Error fetching shops:', shopsErr.message);
      return {
        success: false,
        totalShopsProcessed: 0,
        summariesSent: 0,
        skippedDisabled: 0,
        skippedAlreadySent: 0,
        errors: [shopsErr.message]
      };
    }

    const activeShops = (shops || []).filter((s: any) => {
      if (s.status === 'inactive' || s.status === 'disabled' || s.is_active === false) {
        return false;
      }
      return !!s.owner_id;
    });

    totalShopsProcessed = activeShops.length;
    console.log(`[DailySummaryScheduler] Found ${activeShops.length} active shop(s) for daily summary.`);

    for (const shop of activeShops) {
      const merchantId = shop.owner_id;

      try {
        // 2. Check if daily notifications are disabled in notification_preferences
        const { data: pref } = await supabase
          .from('notification_preferences')
          .select('daily_summary_enabled')
          .eq('profile_id', merchantId)
          .maybeSingle();

        if (pref && pref.daily_summary_enabled === false && !options.force) {
          console.log(`[DailySummaryScheduler] Merchant ${merchantId} (shop ${shop.id}) has daily summaries disabled. Skipping.`);
          skippedDisabled++;
          continue;
        }

        // 3. Idempotency check: Ensure merchant receives only ONE summary per day
        if (!options.force) {
          // Check notification_deliveries table
          const { data: deliveryRecord } = await supabase
            .from('notification_deliveries')
            .select('id')
            .eq('shop_id', shop.id)
            .eq('notification_type', 'daily_shop_summary')
            .eq('notification_date', todayStr)
            .maybeSingle();

          if (deliveryRecord) {
            console.log(`[DailySummaryScheduler] Summary already delivered today for shop ${shop.id}. Skipping (Idempotent).`);
            skippedAlreadySent++;
            continue;
          }

          // Also check notifications table for safety
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .or(`user_id.eq.${merchantId},profile_id.eq.${merchantId}`)
            .eq('type', 'daily_summary')
            .gte('created_at', `${todayStr}T00:00:00.000Z`)
            .maybeSingle();

          if (existingNotif) {
            console.log(`[DailySummaryScheduler] Notification already present for merchant ${merchantId} today. Skipping (Idempotent).`);
            skippedAlreadySent++;
            continue;
          }
        }

        // 4. Consume shared AnalyticsEngine data for shop
        const analytics = await AnalyticsService.getTodayAnalytics(shop.id, timezone);

        const uniqueVisitorsToday = analytics.visitors;
        const uniqueVisitorsYesterday = analytics.yesterdayVisitors;
        const visitorComparisonText = analytics.visitorGrowthPercentage;
        const whatsappClicksToday = analytics.whatsappClicks;
        const conversionRate = analytics.conversionRate;
        const topProductName = analytics.topProduct;
        const productCount = analytics.products;

        // 5. Build required notification content
        const title = '📈 ThreadZW Daily Summary';
        const body = `📈 ThreadZW Daily Summary

👀 Visitors: ${uniqueVisitorsToday} (${visitorComparisonText})

💬 WhatsApp Clicks: ${whatsappClicksToday}

🛍 Conversion Rate: ${conversionRate}%

🔥 Top Product:
${topProductName}

Keep growing 🚀`;

        // 6. Send notification using NotificationService.sendDailySummary()
        const notifResult = await NotificationService.sendDailySummary(merchantId, {
          shopId: shop.id,
          title,
          body,
          stats: {
            uniqueVisitors: uniqueVisitorsToday,
            whatsappClicks: whatsappClicksToday,
            conversionRate,
            productCount,
            topProduct: topProductName,
            visitorComparison: visitorComparisonText
          }
        });

        if (notifResult.success) {
          summariesSent++;

          // Record delivery for idempotency
          try {
            await supabase.from('notification_deliveries').insert([{
              shop_id: shop.id,
              notification_type: 'daily_shop_summary',
              notification_date: todayStr,
              delivered_at: new Date().toISOString(),
              metadata: {
                uniqueVisitors: uniqueVisitorsToday,
                whatsappClicks: whatsappClicksToday,
                conversionRate,
                productCount,
                topProduct: topProductName
              }
            }]);
          } catch (delivErr: any) {
            console.warn('[DailySummaryScheduler] Delivery record insert warning:', delivErr?.message);
          }
        } else {
          if (notifResult.errors) {
            errors.push(...notifResult.errors);
          }
        }
      } catch (shopErr: any) {
        console.error(`[DailySummaryScheduler] Error processing shop ${shop.id}:`, shopErr?.message);
        errors.push(`Shop ${shop.id}: ${shopErr?.message}`);
      }
    }
  } catch (err: any) {
    console.error('[DailySummaryScheduler] Unexpected error during daily summary job execution:', err?.message);
    errors.push(err?.message || 'Unexpected job failure');
  }

  return {
    success: errors.length === 0,
    totalShopsProcessed,
    summariesSent,
    skippedDisabled,
    skippedAlreadySent,
    errors
  };
}

/**
 * Initialize node-cron schedule for 19:00 Africa/Harare every day
 */
export function initDailySummaryScheduler() {
  console.log('[DailySummaryScheduler] Initializing daily summary cron scheduler for 19:00 Africa/Harare...');
  
  // 19:00 = 7:00 PM every day
  cron.schedule('0 19 * * *', async () => {
    console.log('[DailySummaryScheduler] Automated cron trigger at 19:00 Africa/Harare');
    await runDailySummaryJob();
  }, {
    timezone: 'Africa/Harare'
  });
}
