// server/routes/billing.ts

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { billingController } from '../controllers/billing';
import { subscriptionController } from '../controllers/subscriptionController';

const router = Router();

// Legacy merchant routes remain temporarily isolated from the new checkout flow.
router.post('/create-session', requireAuth, (req, res) => billingController.createSession(req, res));
router.post('/create-subscription', requireAuth, (req, res) => billingController.createSubscription(req, res));
router.post('/confirm-payment', requireAuth, (req, res) => billingController.confirmPayment(req, res));
router.post('/cancel-subscription', requireAuth, (req, res) => billingController.cancelSubscription(req, res));

// Legacy admin routes remain protected and are not used by the new payment flow.
router.post('/admin/approve-claim', requireAuth, (req, res) => billingController.adminApproveClaim(req, res));
router.post('/admin/reject-claim', requireAuth, (req, res) => billingController.adminRejectClaim(req, res));

// Compatibility aliases. All webhook requests use the same authoritative handler.
router.post('/webhook', (req, res) => subscriptionController.webhook(req, res));
router.post('/nardopay-webhook', (req, res) => subscriptionController.webhook(req, res));

// Legacy manual activation routes are intentionally disabled.
router.post('/activate-by-shop-name', (_req, res) => res.status(410).json({ error: 'LEGACY_PAYMENT_FLOW_DISABLED' }));
router.post('/activate-by-email', (_req, res) => res.status(410).json({ error: 'LEGACY_PAYMENT_FLOW_DISABLED' }));

export default router;
