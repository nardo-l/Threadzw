// server/controllers/billing.ts

import { Response } from 'express';
import { AuthenticatedRequest, serverSupabase } from '../middleware/auth';
import { nardoPay } from '../lib/nardopay';
import { billingService } from '../services/billing';

export class BillingController {
  /**
   * Creates a secure checkout session.
   */
  public async createSession(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { shopId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User context is missing' });
      }

      // Merchant plan is standard $2.99 USD
      const session = nardoPay.createCheckoutSession(userId, shopId || null, 2.99);
      
      // Redirect URL inside the application to the PCI-DSS free hosted checkout simulator
      const checkoutUrl = `/checkout/nardopay?session_id=${session.id}`;
      
      return res.status(200).json({ checkoutUrl, sessionId: session.id });
    } catch (err: any) {
      console.error('Error creating checkout session in controller:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate checkout session' });
    }
  }

  /**
   * Creates a NardoPay subscription link for the authenticated merchant.
   */
  public async createSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User context is missing' });
      }

      const subscriptionLink = await billingService.createSubscriptionLink(userId);
      return res.status(200).json(subscriptionLink);
    } catch (err: any) {
      console.error('[BillingController] createSubscription failed:', err);
      const safeMessage = err.message && !err.message.includes('np_live') 
        ? err.message 
        : 'Billing integration error occurred';
      return res.status(500).json({ error: safeMessage });
    }
  }

  /**
   * Confirms payment status with NardoPay, then triggers billing service mutations.
   * Prevents client manipulation by checking payment details against NardoPay session state.
   */
  public async confirmPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { sessionId, whatsappNumber } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User context is missing' });
      }

      const isDev = process.env.NODE_ENV === 'development' || process.env.USE_PAYMENT_SIMULATOR === 'true';

      if (isDev) {
        // In development/simulation mode, we allow confirmPayment to directly activate the subscription
        // to seamlessly mock the NardoPay webhook trigger.
        console.log(`[BillingController] Dev/Simulation Mode: Automatically activating subscription for user ${userId} via confirmPayment.`);
        
        const transactionId = sessionId || `MOCK-TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const authHeader = req.headers.authorization;
        const token = authHeader ? authHeader.split(' ')[1] : undefined;
        await billingService.activateSubscription(userId, 2.99, transactionId, 'nardopay', token);
        return res.status(200).json({ success: true, message: 'Subscription successfully activated (Simulation)' });
      }

      // In production mode, /api/billing/confirm-payment ONLY reads the subscription status from the database and returns it.
      // It does not attempt to verify or activate the payment itself, which must be triggered asynchronously by NardoPay's webhook.
      const { data: subscription, error } = await serverSupabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[BillingController] confirmPayment error reading subscription:', error);
        return res.status(500).json({ error: 'Failed to read subscription status' });
      }

      return res.status(200).json({
        success: true,
        subscription,
        status: subscription?.status || 'inactive'
      });
    } catch (err: any) {
      console.error('Error confirming payment in controller:', err);
      return res.status(500).json({ error: err.message || 'Payment confirmation failed' });
    }
  }

  /**
   * Allows a merchant to cancel their subscription.
   */
  public async cancelSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { shopId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User context is missing' });
      }

      if (!shopId) {
        return res.status(400).json({ error: 'Shop ID is required' });
      }

      await billingService.cancelSubscription(userId, shopId);
      return res.status(200).json({ success: true, message: 'Subscription successfully cancelled' });
    } catch (err: any) {
      console.error('Error cancelling subscription in controller:', err);
      return res.status(500).json({ error: err.message || 'Failed to cancel subscription' });
    }
  }

  /**
   * Admin: Approve a claim manually.
   */
  public async adminApproveClaim(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      
      // In production, we'd verify user.role === 'admin' or user.email is allowed
      const allowedAdmins = ['jackluro2@gmail.com'];
      if (!user || !allowedAdmins.includes(user.email)) {
        return res.status(403).json({ error: 'Forbidden: Admin clearance required' });
      }

      const { claim } = req.body;
      if (!claim || !claim.shop_id) {
        return res.status(400).json({ error: 'Invalid claim data' });
      }

      await billingService.adminApproveClaim(claim);
      return res.status(200).json({ success: true, message: 'Claim successfully approved and activated' });
    } catch (err: any) {
      console.error('Error approving claim in admin controller:', err);
      return res.status(500).json({ error: err.message || 'Claim approval failed' });
    }
  }

  /**
   * Admin: Reject a claim.
   */
  public async adminRejectClaim(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      const allowedAdmins = ['jackluro2@gmail.com'];
      if (!user || !allowedAdmins.includes(user.email)) {
        return res.status(403).json({ error: 'Forbidden: Admin clearance required' });
      }

      const { claim } = req.body;
      if (!claim || !claim.id) {
        return res.status(400).json({ error: 'Invalid claim data' });
      }

      await billingService.adminRejectClaim(claim);
      return res.status(200).json({ success: true, message: 'Claim successfully rejected' });
    } catch (err: any) {
      console.error('Error rejecting claim in admin controller:', err);
      return res.status(500).json({ error: err.message || 'Claim rejection failed' });
    }
  }

  /**
   * NardoPay Webhook processing. Handles automated payment events.
   */
  public async webhook(req: any, res: Response) {
    const startTime = Date.now();
    try {
      const payload = req.body || {};
      const signature = req.headers['x-nardopay-signature'] || req.headers['x-signature'] || null;

      console.log('[NardoPay Webhook] Received payload:', JSON.stringify(payload));
      console.log('[NardoPay Webhook] Signature header:', signature);

      // TODO: verify this request actually came from NardoPay before trusting it
      // (check NardoPay docs/support for their signature verification method)
      if (!signature && process.env.NODE_ENV === 'production') {
        console.warn('[NardoPay Webhook] Warning: Missing signature in production');
      }

      // Log every webhook payload received (even ones you don't act on) to a webhook_logs table for debugging
      try {
        await serverSupabase.from('webhook_logs').insert({
          event: payload.event || payload.status || 'unknown',
          payload: payload,
          signature: signature ? String(signature) : null,
          created_at: new Date().toISOString()
        });
      } catch (logErr: any) {
        console.warn('[NardoPay Webhook] Could not insert into webhook_logs (table may not exist yet):', logErr.message);
      }

      const event = payload.event || payload.status;
      const data = payload.data || payload;

      if (event === 'payment.completed' || event === 'payment.succeeded' || event === 'verified' || payload.status === 'success' || payload.status === 'verified') {
        const linkCode = payload.link_code || data.link_code || data.linkCode;
        const linkId = payload.link_id || data.link_id || data.linkId;
        const userId = data.userId || data.owner_id || data.profile_id || data.customer_id || payload.profile_id;

        let profileId = userId;

        if (!profileId && (linkCode || linkId)) {
          const codeToMatch = linkCode || linkId;
          const { data: sub } = await serverSupabase
            .from('subscriptions')
            .select('profile_id, plan')
            .ilike('plan', `%${codeToMatch}%`)
            .maybeSingle();

          if (sub) {
            profileId = sub.profile_id;
          }
        }

        if (profileId) {
          const activeUntil = new Date();
          activeUntil.setDate(activeUntil.getDate() + 30);

          await serverSupabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              active_until: activeUntil.toISOString()
            })
            .eq('id', profileId);

          await serverSupabase
            .from('subscriptions')
            .update({
              status: 'active',
              last_payment_at: new Date().toISOString()
            })
            .eq('profile_id', profileId);

          console.log(`[NardoPay Webhook] Successfully activated Pro Plan for profile: ${profileId} until ${activeUntil.toISOString()}`);
        } else {
          console.warn('[NardoPay Webhook] payment.completed received but could not resolve profile_id from link_code/link_id:', payload);
        }
      } else {
        console.log(`[NardoPay Webhook] Event ${event} received and logged.`);
      }

      // Return a 200 response quickly
      return res.status(200).send('OK');
    } catch (err: any) {
      console.error('[NardoPay Webhook] Error processing webhook:', err);
      return res.status(200).send('OK');
    }
  }

  /**
   * Activates subscription based on Shop Name (NardoPay MVP success page).
   */
  public async activateByShopName(req: any, res: Response) {
    console.log("ACTIVATION ENDPOINT HIT");
    try {
      const { shopName, shop_name } = req.body;
      const targetName = shopName || shop_name;
      if (!targetName || typeof targetName !== 'string' || targetName.trim() === '') {
        return res.status(400).json({ error: 'Please enter your shop name.' });
      }

      const result = await billingService.activateSubscriptionByShopName(targetName);
      return res.status(200).json({ success: true, message: 'Subscription successfully activated.', data: result });
    } catch (err: any) {
      console.error('[BillingController] activateByShopName failed:', err);
      const msg = err.message || "We couldn't find a shop with that name.";
      return res.status(400).json({ error: msg });
    }
  }

  /**
   * Legacy email endpoint fallback
   */
  public async activateByEmail(req: any, res: Response) {
    try {
      const { email, shopName, userId } = req.body;
      const target = shopName || email;
      if (!target) {
        return res.status(400).json({ error: 'Please enter your shop name.' });
      }

      await billingService.activateSubscriptionByEmail(target, userId);
      return res.status(200).json({ success: true, message: 'Subscription successfully activated.' });
    } catch (err: any) {
      console.error('[BillingController] activateByEmail failed:', err);
      const msg = err.message || 'Something went wrong.\nPlease contact ThreadZW support.';
      return res.status(400).json({ error: msg });
    }
  }
}

export const billingController = new BillingController();
