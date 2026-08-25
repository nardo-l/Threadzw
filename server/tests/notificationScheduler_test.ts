import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  aggregateMetrics,
  buildSetupMessage,
  buildSummaryMessage,
  formatLocalDate,
  getLocalDayRange,
  isShopProfileComplete
} from '../services/scheduledNotificationService.js';
import { isValidCronSecret } from '../lib/cronAuth.js';
import { withTimeout } from '../../src/lib/withTimeout.js';

const completeShop = {
  id: 'shop-1',
  owner_id: 'profile-1',
  name: 'Demo Drip',
  description: 'Streetwear for every day',
  logo_url: 'https://example.com/logo.png',
  banner_url: 'https://example.com/banner.png',
  location: 'Harare CBD',
  whatsapp_number: '263771234567',
  page_type: 'clothing'
};

assert.equal(formatLocalDate(new Date('2026-08-25T09:59:00.000Z'), 'Africa/Harare'), '2026-08-25');
assert.equal(formatLocalDate(new Date('2026-08-25T22:30:00.000Z'), 'Africa/Harare'), '2026-08-26');

const dayRange = getLocalDayRange(new Date('2026-08-25T17:30:00.000Z'), 'Africa/Harare');
assert.equal(dayRange.localDate, '2026-08-25');
assert.equal(dayRange.start.toISOString(), '2026-08-24T22:00:00.000Z');
assert.equal(dayRange.end.toISOString(), '2026-08-25T22:00:00.000Z');

assert.equal(isShopProfileComplete(completeShop), true);
assert.equal(isShopProfileComplete({ ...completeShop, banner_url: null }), false);
assert.equal(buildSetupMessage({ ...completeShop, location: null }, 0)?.type, 'setup_reminder');
assert.equal(buildSetupMessage(completeShop, 0)?.type, 'first_product_reminder');
assert.equal(buildSetupMessage(completeShop, 1), null);

const metrics = aggregateMetrics(
  [
    { shop_id: 'shop-1', event_type: 'shop_visit', visitor_id: 'visitor-a' },
    { shop_id: 'shop-1', event_type: 'shop_visit', visitor_id: 'visitor-a' },
    { shop_id: 'shop-1', event_type: 'shop_view', visitor_id: 'visitor-b' },
    { shop_id: 'shop-1', event_type: 'whatsapp_click', product_id: 'product-1' },
    { shop_id: 'shop-1', event_type: 'whatsapp_click', product_id: 'product-1' },
    { shop_id: 'shop-1', event_type: 'map_open' },
    { shop_id: 'shop-1', event_type: 'product_view', product_id: 'product-1' }
  ],
  [{ id: 'product-1', shop_id: 'shop-1', name: 'Black Cargo' }]
);

assert.equal(metrics.uniqueVisitors, 2);
assert.equal(metrics.shopVisits, 3);
assert.equal(metrics.whatsappClicks, 2);
assert.equal(metrics.directionsClicks, 1);
assert.equal(metrics.productViews, 1);
assert.equal(metrics.topProductName, 'Black Cargo');
assert.match(buildSummaryMessage(metrics).body, /2 unique visitors/);
assert.match(buildSummaryMessage(metrics).body, /3 customer actions/);
assert.match(buildSummaryMessage(metrics).body, /Black Cargo led/);

process.env.THREADZW_CRON_SECRET = 'test-cron-secret';
const validRequest = { header: (name: string) => name.toLowerCase() === 'x-threadzw-cron-secret' ? 'test-cron-secret' : undefined } as any;
const invalidRequest = { header: () => 'wrong-secret' } as any;
assert.equal(isValidCronSecret(validRequest), true);
assert.equal(isValidCronSecret({ header: (name: string) => name.toLowerCase() === 'x-threadzw-cron-secret' ? '  test-cron-secret\n' : undefined } as any), true);
assert.equal(isValidCronSecret(invalidRequest), false);
await assert.rejects(
  withTimeout(new Promise<void>((resolve) => setTimeout(resolve, 40)), 5, 'BOOTSTRAP'),
  /BOOTSTRAP_TIMEOUT/
);

delete process.env.THREADZW_CRON_SECRET;
const workflow = readFileSync(new URL('../../.github/workflows/merchant-notifications.yml', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../supabase/migrations/20260825000000_create_merchant_notification_system.sql', import.meta.url), 'utf8');
assert.match(workflow, /0 10 \* \* \*/);
assert.match(workflow, /0 17 \* \* \*/);
assert.match(workflow, /THREADZW_CRON_SECRET/);
assert.match(workflow, /merchant-notifications\?slot=\$SLOT/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS public.notification_preferences/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS public.notification_deliveries/);
assert.match(migration, /idx_notifications_dedupe_key_unique/);
assert.match(migration, /idx_push_subscriptions_profile_endpoint_unique/);

console.log('notification scheduler tests passed');
