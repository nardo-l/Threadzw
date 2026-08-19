import express from 'express';
import dotenv from 'dotenv';
import billingRouter from '../server/routes/billing';
import aiRouter from '../server/routes/ai';
import productsRouter from '../server/routes/products';
import productsV2Router from '../server/routes/productsV2';
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

// Request logging middleware for serverless debugging
app.use((req, res, next) => {
  console.log(`[SERVERLESS_GATEWAY] ${req.method} ${req.url} (originalUrl: ${req.originalUrl})`);
  next();
});

// --- HEALTH CHECK ---
app.get(['/api/health', '/health'], (req, res) => {
  res.setHeader('Content-Type', 'application/json').status(200).json({ status: 'ok' });
});

// --- SECURE SERVERLESS API ROUTERS (Mounting both /api/* and root paths for Vercel rewrite compatibility) ---
app.post(['/api/nardopay-webhook', '/nardopay-webhook'], (req, res) => subscriptionController.webhook(req, res));
app.use(['/api/subscriptions', '/subscriptions'], subscriptionsRouter);
app.use(['/api/billing', '/billing'], billingRouter);
app.use(['/api/products', '/products'], productsV2Router);
app.use(['/api/products', '/products'], productsRouter);
app.use(['/api/ai', '/ai'], aiRouter);
app.use(['/api/push', '/push'], pushRouter);
app.use(['/api/notifications', '/notifications'], notificationsRouter);
app.use(['/api/cron', '/cron'], cronRouter);

// Fallback for unmatched routes
app.use('*', (req, res) => {
  console.warn(`[SERVERLESS_404] No handler matched for ${req.method} ${req.originalUrl} (url: ${req.url})`);
  res.setHeader('Content-Type', 'application/json').status(404).json({
    success: false,
    error: `API endpoint ${req.method} ${req.originalUrl} not found`,
    url: req.url,
    originalUrl: req.originalUrl
  });
});

// Global Express Error Handler to prevent 500 HTML crashes in Serverless
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVERLESS_EXPRESS_UNCAUGHT_ERROR]', err);
  res.setHeader('Content-Type', 'application/json').status(500).json({
    success: false,
    error: err?.message || 'Internal Server Error',
    name: err?.name,
    stack: err?.stack
  });
});

export default app;
