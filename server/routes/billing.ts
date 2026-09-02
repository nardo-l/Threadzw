import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController.js';

const router = Router();

// Legacy webhook aliases only. All merchant payment operations use /api/subscriptions.
router.post('/webhook', (req, res) => subscriptionController.webhook(req, res));
router.post('/nardopay-webhook', (req, res) => subscriptionController.webhook(req, res));

export default router;
