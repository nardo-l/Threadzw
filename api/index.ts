import express from 'express';
import dotenv from 'dotenv';
import billingRouter from '../server/routes/billing';
import aiRouter from '../server/routes/ai';
import notificationsRouter from '../server/routes/notifications';

dotenv.config();

const app = express();

app.use(express.json());

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json').status(200).json({ status: 'ok' });
});

// --- ROUTERS ---
app.use('/api/billing', billingRouter);
app.use('/api/ai', aiRouter);
app.use('/api/cron', notificationsRouter);
app.use('/api/notifications', notificationsRouter);

// Fallback for unmatched /api routes
app.use('/api/*', (req, res) => {
  res.setHeader('Content-Type', 'application/json').status(404).json({
    success: false,
    error: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

export default app;
