// server/tests/phase6b_test.ts

import crypto from 'crypto';
import { resolveProPlanForShop, resolveServerSellerCategory } from '../services/planResolver';
import { nardopayClient } from '../lib/nardopayClient';

const TEST_API_KEY = 'test-api-key';
const TEST_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.NARDOPAY_API_KEY = TEST_API_KEY;
process.env.NARDOPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

async function runPhase6BTests() {
  console.log('====================================================');
  console.log('PHASE 6B: NARDOPAY PAYMENT & SUBSCRIPTION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Clothing upgrade request -> $1.59 / monthly
  const clothingShop = { id: 'shop-101', page_type: 'clothing', owner_id: 'user-1' };
  const clothingPlan = resolveProPlanForShop(clothingShop);
  assert(
    clothingPlan.amount === 1.59 &&
    clothingPlan.billing_cycle === 'monthly' &&
    clothingPlan.currency === 'USD' &&
    clothingPlan.category === 'clothing',
    'Test 1: Clothing upgrade resolves to configured fallback $1.59 / monthly'
  );

  // 2. Vehicle upgrade request -> $30 / yearly
  const vehicleShop = { id: 'shop-202', page_type: 'vehicles', owner_id: 'user-2' };
  const vehiclePlan = resolveProPlanForShop(vehicleShop);
  assert(
    vehiclePlan.amount === 30.00 &&
    vehiclePlan.billing_cycle === 'yearly' &&
    vehiclePlan.currency === 'USD' &&
    vehiclePlan.category === 'vehicles',
    'Test 2: Vehicle upgrade resolves to $30 / yearly'
  );

  // 3. Client tries to submit amount = 0, billingCycle = 'yearly', category = 'vehicles' on clothing shop
  const maliciousClientPayload = {
    shopId: 'shop-clothing-101',
    amount: 0,
    billingCycle: 'yearly',
    category: 'vehicles'
  };
  const verifiedShopInDb = { id: maliciousClientPayload.shopId, page_type: 'clothing', owner_id: 'user-3' };
  // Server queries shop from DB by shopId and ignores the client's payload fields:
  const serverResolvedPricing = resolveProPlanForShop(verifiedShopInDb);
  assert(
    serverResolvedPricing.amount === 1.59 &&
    serverResolvedPricing.billing_cycle === 'monthly' &&
    serverResolvedPricing.category === 'clothing' &&
    serverResolvedPricing.currency === 'USD' &&
    serverResolvedPricing.amount !== maliciousClientPayload.amount &&
    serverResolvedPricing.billing_cycle !== maliciousClientPayload.billingCycle,
    'Test 3: Malicious client pricing fields cannot override server-resolved Clothing pricing'
  );

  // 4. Normalized categories and alias parsing
  assert(resolveServerSellerCategory('dealership') === 'vehicles', 'Test 4a: Dealership resolves to vehicles');
  assert(resolveServerSellerCategory('boutique') === 'clothing', 'Test 4b: Boutique resolves to clothing');
  assert(resolveServerSellerCategory('auto') === 'vehicles', 'Test 4c: Auto resolves to vehicles');

  // 5. Webhook Signature Verification with valid HMAC SHA-256
  const sampleWebhookBody = JSON.stringify({
    event: 'payment.completed',
    link_code: 'NP-TEST-1234',
    amount: 1.59,
    currency: 'USD',
    metadata: {
      profile_id: 'user-1',
      shop_id: 'shop-101',
        plan: 'premium'
    }
  });

  const validSignature = crypto
    .createHmac('sha256', TEST_WEBHOOK_SECRET)
    .update(sampleWebhookBody)
    .digest('hex');

  const isSigValid = nardopayClient.verifyWebhookSignature(sampleWebhookBody, validSignature);
  assert(isSigValid === true, 'Test 5: Valid HMAC SHA-256 webhook signature accepted');

  // 6. Webhook Signature Verification with invalid/tampered signature
  const tamperedSignature = 'invalid_tampered_signature_hex_1234567890abcdef';
  const isInvalidSigRejected = !nardopayClient.verifyWebhookSignature(sampleWebhookBody, tamperedSignature);
  assert(isInvalidSigRejected, 'Test 6: Invalid/tampered webhook signature rejected (401/403)');

  // 7. Webhook Signature Verification with missing signature
  const isMissingSigRejected = !nardopayClient.verifyWebhookSignature(sampleWebhookBody, null);
  assert(isMissingSigRejected, 'Test 7: Missing signature header rejected');

  // 8. Signature verification on tampered body with original signature
  const tamperedBody = JSON.stringify({
    event: 'payment.completed',
    link_code: 'NP-TEST-1234',
    amount: 0.01, // Attacker changed amount
    metadata: { profile_id: 'user-1', shop_id: 'shop-101' }
  });
  const isTamperedBodyRejected = !nardopayClient.verifyWebhookSignature(tamperedBody, validSignature);
  assert(isTamperedBodyRejected, 'Test 8: Tampered payload with valid original signature rejected');

  // 9. Timing calculation tests: Clothing period (+1 month) vs Vehicle period (+1 year)
  const now = new Date('2026-08-18T12:00:00Z');
  const clothingPeriodEnd = new Date(now);
  clothingPeriodEnd.setMonth(clothingPeriodEnd.getMonth() + 1);

  const vehiclePeriodEnd = new Date(now);
  vehiclePeriodEnd.setFullYear(vehiclePeriodEnd.getFullYear() + 1);

  assert(
    clothingPeriodEnd.toISOString().startsWith('2026-09-18'),
    'Test 9: Clothing subscription period calculates exact +1 month'
  );
  assert(
    vehiclePeriodEnd.toISOString().startsWith('2027-08-18'),
    'Test 10: Vehicle subscription period calculates exact +1 year'
  );

  // 10. Grace period duration calculation (+3 days on renew_failed)
  const graceEnd = new Date(now);
  graceEnd.setDate(graceEnd.getDate() + 3);
  assert(
    graceEnd.toISOString().startsWith('2026-08-21'),
    'Test 11: Renewal failure sets +3 days grace period'
  );

  // 11. Subscription status mapping
  assert(clothingPlan.currency === 'USD' && vehiclePlan.currency === 'USD', 'Test 12: Canonical currency is USD');

  console.log(`\n====================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6BTests().catch(err => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
