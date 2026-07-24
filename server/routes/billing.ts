// server/routes/billing.ts

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { billingController } from '../controllers/billing';

const router = Router();

// Merchant Endpoints
router.post('/create-session', requireAuth, (req, res) => billingController.createSession(req, res));
router.post('/create-subscription', requireAuth, (req, res) => billingController.createSubscription(req, res));
router.post('/confirm-payment', requireAuth, (req, res) => billingController.confirmPayment(req, res));
router.post('/cancel-subscription', requireAuth, (req, res) => billingController.cancelSubscription(req, res));

// Admin Endpoints
router.post('/admin/approve-claim', requireAuth, (req, res) => billingController.adminApproveClaim(req, res));
router.post('/admin/reject-claim', requireAuth, (req, res) => billingController.adminRejectClaim(req, res));

// Webhook & Public Verification
router.post('/webhook', (req, res) => billingController.webhook(req, res));
router.post('/activate-by-email', (req, res) => billingController.activateByEmail(req, res));

export default router;
