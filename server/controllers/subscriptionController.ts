// server/controllers/subscriptionController.ts

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { subscriptionService } from '../services/subscriptionService.js';

export class SubscriptionController {
  /**
   * POST /api/subscriptions/create-payment-link
   * Creates a NardoPay payment link for the shop owner.
   */
  public async createPaymentLink(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { shopId } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Authentication required' });
      }

      if (!shopId) {
        return res.status(400).json({ success: false, error: 'INVALID_SHOP', message: 'shopId is required' });
      }

      const origin = req.headers.origin || process.env.APP_URL;

      const result = await subscriptionService.createPaymentLink({
        userId,
        shopId,
        origin
      });

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[SubscriptionController] createPaymentLink error:', err.message);

      const message = err.message || '';
      if (message.includes('ALREADY_SUBSCRIBED')) {
        return res.status(400).json({ success: false, error: 'ALREADY_SUBSCRIBED', message: 'This shop already has an active subscription' });
      }
      if (message.includes('UNAUTHORIZED')) {
        return res.status(403).json({ success: false, error: 'UNAUTHORIZED', message: 'You do not own this shop' });
      }
      if (message.includes('INVALID_SHOP')) {
        return res.status(404).json({ success: false, error: 'INVALID_SHOP', message: 'Shop not found' });
      }
      if (message.includes('PAYMENT_PROVIDER_UNAVAILABLE')) {
        return res.status(503).json({ success: false, error: 'PAYMENT_PROVIDER_UNAVAILABLE', message: 'NardoPay is currently unavailable. Please try again shortly.' });
      }

      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to create subscription checkout session'
      });
    }
  }

  /**
   * GET /api/subscriptions/status?shopId=...
   * Fetches verified subscription status for a shop.
   */
  public async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const shopId = req.query.shopId as string;

      if (!userId) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }

      if (!shopId) {
        return res.status(400).json({ error: 'INVALID_SHOP', message: 'shopId query parameter is required' });
      }

      const statusData = await subscriptionService.getStatus({ userId, shopId });
      return res.status(200).json({ success: true, ...statusData });
    } catch (err: any) {
      console.error('[SubscriptionController] getStatus error:', err.message);
      if (err.message?.includes('UNAUTHORIZED')) {
        return res.status(403).json({ error: 'UNAUTHORIZED' });
      }
      return res.status(500).json({ error: 'FAILED_TO_LOAD_STATUS', message: err.message });
    }
  }

  /**
   * POST /api/subscriptions/verify-fallback
   */
  public async verifyFallback(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { shopId, linkCode } = req.body;

      if (!userId || !shopId) {
        return res.status(400).json({ error: 'Missing parameters' });
      }

      const result = await subscriptionService.verifyPaymentFallback({ userId, shopId, linkCode });
      return res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/nardopay-webhook
   * Authoritative NardoPay Webhook processing.
   */
  public async webhook(req: any, res: Response) {
    try {
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const signatureHeader = req.headers['x-nardopay-signature'] || req.headers['x-signature'];

      const result = await subscriptionService.handleWebhook({
        rawBody,
        signatureHeader,
        payload: req.body || {}
      });

      return res.status(200).json({ received: true, ...result });
    } catch (err: any) {
      console.error('[SubscriptionController] Webhook handling error:', err.message);

      if (err.message === 'INVALID_SIGNATURE') {
        return res.status(401).json({ error: 'INVALID_SIGNATURE', message: 'Signature verification failed' });
      }

      // Return 500 so NardoPay can retry transient server failures
      return res.status(500).json({ error: 'PROCESSING_ERROR', message: err.message });
    }
  }
}

export const subscriptionController = new SubscriptionController();
