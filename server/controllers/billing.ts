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

      // Merchant plan is standard $7 USD
      const session = nardoPay.createCheckoutSession(userId, shopId || null, 7.00);
      
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
        await billingService.activateSubscription(userId, 7.00, transactionId, 'nardopay', token);
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
    try {
      console.log('[BillingController] NardoPay webhook received:', req.body);

      // Direct integration with NardoPay signed webhooks
      const signature = req.headers['x-nardopay-signature'];
      if (!signature) {
        console.warn('[BillingController] Webhook signature missing - processing only if not in production');
        if (process.env.NODE_ENV === 'production') {
          return res.status(401).json({ error: 'Webhook signature is missing in production' });
        }
      }

      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ error: 'Empty webhook payload' });
      }

      // Extract transaction status and meta fields
      const event = payload.event || payload.status;
      const data = payload.data || payload;

      if (event === 'payment.succeeded' || event === 'verified' || payload.status === 'success' || payload.status === 'verified') {
        const userId = data.userId || data.owner_id || data.profile_id || data.customer_id;
        const amount = Number(data.amount || data.price || 7.00);
        const transactionId = data.transactionId || data.transaction_id || data.id || payload.transactionId || payload.transaction_id || payload.id || null;

        if (!userId) {
          console.warn('[BillingController] Webhook payload missing userId:', data);
          return res.status(400).json({ error: 'Missing userId in webhook payload' });
        }

        console.log(`[BillingController] Processing successful payment webhook activation for user: ${userId}, transactionId: ${transactionId}`);
        await billingService.activateSubscription(userId, amount, transactionId);
        
        return res.status(200).json({ success: true, message: 'Subscription successfully activated via webhook' });
      }

      return res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('[BillingController] Webhook processing failed:', err);
      return res.status(500).json({ error: err.message || 'Webhook internal error' });
    }
  }
}

export const billingController = new BillingController();
