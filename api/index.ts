import express from 'express';
import dotenv from 'dotenv';
import billingRouter from '../server/routes/billing';
import aiRouter from '../server/routes/ai';
import productsRouter from '../server/routes/products';
import subscriptionsRouter from '../server/routes/subscriptions';
import pushRouter from '../server/routes/push';
import notificationsRouter from '../server/routes/notifications';
import cronRouter from '../server/routes/cron';
import { subscriptionController } from '../server/controllers/subscriptionController';

dotenv.config();

const app = express();

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf-8');
  }
}));

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json').status(200).json({ status: 'ok' });
});

// --- SECURE SERVERLESS API ROUTERS ---
app.post('/api/nardopay-webhook', (req, res) => subscriptionController.webhook(req, res));
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/products', productsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/push', pushRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/cron', cronRouter);

// Fallback for unmatched /api routes
app.use('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json').status(404).json({
    success: false,
    error: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global Express Error Handler to prevent 500 HTML responses in Serverless
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVERLESS EXPRESS ERROR]', err);
  res.setHeader('Content-Type', 'application/json').status(500).json({
    success: false,
    error: err?.message || 'Internal Server Error'
  });
});

export default app;
