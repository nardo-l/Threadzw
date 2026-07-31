import { getMessaging, Message } from 'firebase-admin/messaging';
import { getFirebaseAdmin } from '../lib/firebaseAdmin';
import { createClient } from '@supabase/supabase-js';
import { NotificationType } from '../../src/types';

export { NotificationType };

// Setup Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface SendNotificationOptions {
  merchantId: string;
  type?: NotificationType | string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  icon?: string;
  clickAction?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  tokensFound: number;
  successCount: number;
  failureCount: number;
  tokensRemoved: number;
  errors?: string[];
}

export interface NotificationTypeHandler {
  type: NotificationType;
  defaultClickAction: string;
  formatTitle: (data?: Record<string, any>, customTitle?: string) => string;
  formatBody: (data?: Record<string, any>, customBody?: string) => string;
}

/**
 * Behavior registry per NotificationType.
 * Adding a new notification type requires only adding an entry here and in NotificationType enum.
 */
export const NOTIFICATION_TYPE_HANDLERS: Record<NotificationType, NotificationTypeHandler> = {
  [NotificationType.DAILY_SUMMARY]: {
    type: NotificationType.DAILY_SUMMARY,
    defaultClickAction: '/dashboard',
    formatTitle: (d, custom) => custom || d?.title || 'ThreadZW 📊 Daily Summary',
    formatBody: (d, custom) => custom || d?.body || 'Check out your shop analytics summary for today!',
  },
  [NotificationType.NEW_ORDER]: {
    type: NotificationType.NEW_ORDER,
    defaultClickAction: '/orders',
    formatTitle: (d, custom) => custom || `🛍️ New Order Received${d?.orderId ? ` (#${d.orderId})` : ''}`,
    formatBody: (d, custom) => custom || `New order received for ${d?.productName || 'a product'} (${d?.quantity || 1}x)!`,
  },
  [NotificationType.NEW_WHATSAPP_CLICK]: {
    type: NotificationType.NEW_WHATSAPP_CLICK,
    defaultClickAction: '/dashboard',
    formatTitle: (d, custom) => custom || `💬 New WhatsApp Lead!`,
    formatBody: (d, custom) => custom || `A customer clicked to contact your shop on WhatsApp.`,
  },
  [NotificationType.VISITOR_MILESTONE]: {
    type: NotificationType.VISITOR_MILESTONE,
    defaultClickAction: '/dashboard',
    formatTitle: (d, custom) => custom || `🎉 ${d?.count || d?.milestoneCount || ''} Visitors Milestone!`,
    formatBody: (d, custom) => custom || `${d?.shopName || 'Your shop'} just reached ${d?.count || d?.milestoneCount || 100} unique visitors! Keep up the great work.`,
  },
  [NotificationType.TRIAL_EXPIRING]: {
    type: NotificationType.TRIAL_EXPIRING,
    defaultClickAction: '/settings',
    formatTitle: (d, custom) => custom || `⏰ Trial Ending Soon (${d?.daysLeft ?? 3} day${d?.daysLeft === 1 ? '' : 's'} left)`,
    formatBody: (d, custom) => custom || `Your free ${d?.planName || 'Pro'} trial will expire in ${d?.daysLeft ?? 3} day${d?.daysLeft === 1 ? '' : 's'}. Upgrade now to keep premium features active.`,
  },
  [NotificationType.SUBSCRIPTION_ACTIVE]: {
    type: NotificationType.SUBSCRIPTION_ACTIVE,
    defaultClickAction: '/dashboard',
    formatTitle: (d, custom) => custom || `🚀 ${d?.planName || 'Pro'} Plan Activated!`,
    formatBody: (d, custom) => custom || `Thank you for subscribing to ${d?.planName || 'Pro'}. All premium merchant features are unlocked!`,
  },
  [NotificationType.ANNOUNCEMENT]: {
    type: NotificationType.ANNOUNCEMENT,
    defaultClickAction: '/dashboard',
    formatTitle: (d, custom) => custom || d?.title || '📢 ThreadZW Announcement',
    formatBody: (d, custom) => custom || d?.body || 'Check out the latest update from ThreadZW.',
  },
  [NotificationType.PROMOTION]: {
    type: NotificationType.PROMOTION,
    defaultClickAction: '/settings',
    formatTitle: (d, custom) => custom || d?.title || '🔥 Special Merchant Offer!',
    formatBody: (d, custom) => custom || d?.body || 'Exclusive promotion available for your shop.',
  },
  [NotificationType.SYSTEM]: {
    type: NotificationType.SYSTEM,
    defaultClickAction: '/dashboard',
    formatTitle: (d, custom) => custom || d?.title || 'System Notification',
    formatBody: (d, custom) => custom || d?.body || 'You have a new system update.',
  },
};

export class NotificationService {
  /**
   * Normalizes any input type (enum, string key, legacy alias) into a valid NotificationType.
   */
  public static normalizeNotificationType(typeInput?: NotificationType | string): NotificationType {
    if (!typeInput) return NotificationType.SYSTEM;

    const enumValues = Object.values(NotificationType) as string[];
    if (enumValues.includes(typeInput as string)) {
      return typeInput as NotificationType;
    }

    const lower = String(typeInput).toLowerCase().trim();

    switch (lower) {
      case 'milestone':
      case 'visitor_milestone':
      case 'view_milestone':
      case 'milestone_reached':
        return NotificationType.VISITOR_MILESTONE;

      case 'trial_reminder':
      case 'trial_expiring':
      case 'trial_ending':
        return NotificationType.TRIAL_EXPIRING;

      case 'subscription':
      case 'subscription_active':
      case 'subscription_activated':
        return NotificationType.SUBSCRIPTION_ACTIVE;

      case 'order':
      case 'new_order':
      case 'sale':
      case 'new_purchase_intent':
        return NotificationType.NEW_ORDER;

      case 'whatsapp':
      case 'whatsapp_click':
      case 'new_whatsapp_click':
      case 'new_whatsapp_intent':
        return NotificationType.NEW_WHATSAPP_CLICK;

      case 'announcement':
        return NotificationType.ANNOUNCEMENT;

      case 'promotion':
      case 'promo':
        return NotificationType.PROMOTION;

      case 'daily_summary':
        return NotificationType.DAILY_SUMMARY;

      default:
        return NotificationType.SYSTEM;
    }
  }

  /**
   * Helper to stringify data object for FCM payload (FCM data values must be strings)
   */
  private static formatFcmData(data?: Record<string, any>): Record<string, string> {
    if (!data) return {};
    const formatted: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        formatted[key] = JSON.stringify(value);
      } else if (value !== undefined && value !== null) {
        formatted[key] = String(value);
      }
    }
    return formatted;
  }

  /**
   * Helper to check if FCM error indicates an unregistered / invalid token
   */
  private static isUnregisteredTokenError(error: any): boolean {
    if (!error) return false;
    const code = error.code || error.errorCode || '';
    const message = (error.message || '').toLowerCase();

    return (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/mismatched-credential' ||
      message.includes('registration-token-not-registered') ||
      message.includes('invalid-registration-token') ||
      message.includes('not-registered')
    );
  }

  /**
   * Primary method: Sends a typed notification to all registered FCM devices for a merchant,
   * saves the notification record to DB (with its type), and logs all delivery attempts.
   * Behavioral logic switches dynamically based on the notification type handler.
   */
  static async sendNotification(options: SendNotificationOptions): Promise<NotificationResult> {
    const resolvedType = this.normalizeNotificationType(options.type);
    const handler = NOTIFICATION_TYPE_HANDLERS[resolvedType] || NOTIFICATION_TYPE_HANDLERS[NotificationType.SYSTEM];

    const { merchantId, data = {}, icon } = options;
    const title = handler.formatTitle(data, options.title);
    const body = handler.formatBody(data, options.body);
    const clickAction = options.clickAction || handler.defaultClickAction;

    const errors: string[] = [];
    let notificationId: string | undefined;

    // 1. Save notification record into Supabase `notifications` table (including resolved type string)
    try {
      const { data: inserted, error: notifErr } = await supabase
        .from('notifications')
        .insert([{
          user_id: merchantId,
          type: resolvedType,
          title,
          body,
          data,
          read: false,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .maybeSingle();

      if (notifErr) {
        // Retry with profile_id if table relies on profile_id
        const { data: retryInserted, error: retryErr } = await supabase
          .from('notifications')
          .insert([{
            profile_id: merchantId,
            type: resolvedType,
            title,
            body,
            data,
            read: false,
            created_at: new Date().toISOString()
          }])
          .select('id')
          .maybeSingle();

        if (retryInserted) {
          notificationId = retryInserted.id;
        } else if (retryErr) {
          console.warn('[NotificationService] Failed to insert notification record:', retryErr.message);
        }
      } else if (inserted) {
        notificationId = inserted.id;
      }
    } catch (err: any) {
      console.warn('[NotificationService] Exception saving notification record:', err?.message);
    }

    // 2. Fetch all Firebase device tokens for the merchant from `firebase_tokens` table
    let tokens: { id?: string; token: string }[] = [];
    try {
      const { data: tokenRecords, error: tokenErr } = await supabase
        .from('firebase_tokens')
        .select('*')
        .or(`user_id.eq.${merchantId},profile_id.eq.${merchantId}`);

      if (tokenErr) {
        const { data: fallbackRecords } = await supabase
          .from('firebase_tokens')
          .select('*')
          .eq('user_id', merchantId);

        if (fallbackRecords) {
          tokens = fallbackRecords.map((r: any) => ({
            id: r.id,
            token: r.token || r.fcm_token || r.device_token
          })).filter((t: any) => !!t.token);
        }
      } else if (tokenRecords) {
        tokens = tokenRecords.map((r: any) => ({
          id: r.id,
          token: r.token || r.fcm_token || r.device_token
        })).filter((t: any) => !!t.token);
      }
    } catch (err: any) {
      console.warn('[NotificationService] Error fetching firebase_tokens:', err?.message);
    }

    if (tokens.length === 0) {
      return {
        success: true,
        notificationId,
        tokensFound: 0,
        successCount: 0,
        failureCount: 0,
        tokensRemoved: 0
      };
    }

    // 3. Obtain Firebase Messaging instance
    let messaging: any = null;
    try {
      const adminApp = getFirebaseAdmin();
      messaging = getMessaging(adminApp);
    } catch (err: any) {
      console.error('[NotificationService] Firebase Admin Messaging initialization error:', err?.message);
      errors.push(`Firebase Admin init failed: ${err?.message}`);
    }

    let successCount = 0;
    let failureCount = 0;
    let tokensRemoved = 0;

    // 4. Send notification to every registered device token
    const fcmData = this.formatFcmData({ ...data, type: resolvedType, notificationId });
    if (clickAction) fcmData.click_action = clickAction;

    for (const { token } of tokens) {
      let deliverySuccess = false;
      let deliveryError: string | null = null;

      if (messaging) {
        try {
          const messagePayload: Message = {
            token,
            notification: {
              title,
              body,
              imageUrl: icon
            },
            data: fcmData,
            webpush: {
              notification: {
                title,
                body,
                icon,
                clickAction
              }
            }
          };

          await messaging.send(messagePayload);
          deliverySuccess = true;
          successCount++;
        } catch (fcmErr: any) {
          failureCount++;
          deliveryError = fcmErr?.message || 'Unknown FCM delivery error';
          console.error(`[NotificationService] FCM error for token (${token.slice(0, 10)}...):`, deliveryError);
          errors.push(deliveryError);

          // 5. Automatic cleanup of invalid / unregistered tokens
          if (this.isUnregisteredTokenError(fcmErr)) {
            try {
              console.log(`[NotificationService] Removing unregistered FCM token: ${token.slice(0, 10)}...`);
              await supabase
                .from('firebase_tokens')
                .delete()
                .eq('token', token);
              tokensRemoved++;
            } catch (cleanupErr: any) {
              console.warn('[NotificationService] Error removing expired token:', cleanupErr?.message);
            }
          }
        }
      } else {
        failureCount++;
        deliveryError = 'Messaging service unavailable';
      }

      // 6. Log delivery attempt into `notification_delivery_log` table
      try {
        await supabase
          .from('notification_delivery_log')
          .insert([{
            notification_id: notificationId || null,
            user_id: merchantId,
            device_token: token,
            status: deliverySuccess ? 'delivered' : 'failed',
            error_message: deliveryError,
            delivered_at: deliverySuccess ? new Date().toISOString() : null,
            created_at: new Date().toISOString()
          }]);
      } catch (logErr: any) {
        console.warn('[NotificationService] Error inserting into notification_delivery_log:', logErr?.message);
      }
    }

    return {
      success: successCount > 0 || tokens.length === 0,
      notificationId,
      tokensFound: tokens.length,
      successCount,
      failureCount,
      tokensRemoved,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Convenient helper: Send typed notification directly by NotificationType.
   */
  static async sendTypedNotification(
    type: NotificationType,
    merchantId: string,
    payload: {
      title?: string;
      body?: string;
      data?: Record<string, any>;
      icon?: string;
      clickAction?: string;
    } = {}
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type,
      ...payload
    });
  }

  /**
   * Helper: Send daily summary notification
   */
  static async sendDailySummary(
    merchantId: string,
    summaryData: {
      shopId?: string;
      title?: string;
      body?: string;
      stats?: Record<string, any>;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.DAILY_SUMMARY,
      title: summaryData.title,
      body: summaryData.body,
      data: {
        shopId: summaryData.shopId,
        stats: summaryData.stats
      }
    });
  }

  /**
   * Helper: Send visitor milestone notification
   */
  static async sendVisitorMilestone(
    merchantId: string,
    milestoneData: {
      count: number;
      shopName?: string;
      shopId?: string;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.VISITOR_MILESTONE,
      data: {
        milestoneCount: milestoneData.count,
        count: milestoneData.count,
        shopName: milestoneData.shopName,
        shopId: milestoneData.shopId
      }
    });
  }

  /**
   * Helper: Send trial reminder notification
   */
  static async sendTrialReminder(
    merchantId: string,
    reminderData: {
      daysLeft: number;
      planName?: string;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.TRIAL_EXPIRING,
      data: {
        daysLeft: reminderData.daysLeft,
        planName: reminderData.planName
      }
    });
  }

  /**
   * Helper: Send subscription activated notification
   */
  static async sendSubscriptionActivated(
    merchantId: string,
    subData: {
      planName: string;
      expiryDate?: string;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.SUBSCRIPTION_ACTIVE,
      data: {
        planName: subData.planName,
        expiryDate: subData.expiryDate
      }
    });
  }

  /**
   * Helper: Send new order notification
   */
  static async sendNewOrder(
    merchantId: string,
    orderData: {
      orderId?: string;
      productName?: string;
      quantity?: number;
      amount?: number;
      shopId?: string;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.NEW_ORDER,
      data: orderData
    });
  }

  /**
   * Helper: Send new WhatsApp click notification
   */
  static async sendNewWhatsappClick(
    merchantId: string,
    clickData: {
      shopId?: string;
      productName?: string;
      visitorId?: string;
    }
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.NEW_WHATSAPP_CLICK,
      data: clickData
    });
  }

  /**
   * Helper: Send announcement notification
   */
  static async sendAnnouncement(
    merchantId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.ANNOUNCEMENT,
      title,
      body,
      data
    });
  }

  /**
   * Helper: Send promotion notification
   */
  static async sendPromotion(
    merchantId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.PROMOTION,
      title,
      body,
      data
    });
  }

  /**
   * Helper: Send general system notification
   */
  static async sendSystemNotification(
    merchantId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<NotificationResult> {
    return this.sendNotification({
      merchantId,
      type: NotificationType.SYSTEM,
      title,
      body,
      data
    });
  }
}

export default NotificationService;
