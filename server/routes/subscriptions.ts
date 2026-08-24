// server/routes/subscriptions.ts

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { subscriptionController } from '../controllers/subscriptionController';

const router = Router();

router.post('/create-payment-link', requireAuth, (req, res) => subscriptionController.createPaymentLink(req, res));
router.get('/status', requireAuth, (req, res) => subscriptionController.getStatus(req, res));
router.post('/verify-fallback', requireAuth, (req, res) => subscriptionController.verifyFallback(req, res));

// Public provider callback. Authentication is provided by NardoPay HMAC verification.
router.post('/webhook', (req, res) => subscriptionController.webhook(req, res));

export default router;
