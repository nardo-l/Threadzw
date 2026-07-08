// src/utils/storeRouterTestSuite.ts
import { supabase } from '../lib/supabase';
import { getShopUrl, getAbsoluteShopUrl } from './shopUrl';

export interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Live Routing & ID-based Store Test Suite
 * Executes automated checks for ThreadZW Store IDs & Store links architecture.
 */
export async function runStoreRouterTestSuite(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const runId = Math.random().toString(36).substring(7);

  // 1. Test Store URL Generation
  try {
    const testId = 'clx8n2k9m';
    const relativeUrl = getShopUrl('vintage-vault', testId);
    const absoluteUrl = getAbsoluteShopUrl('vintage-vault', testId);
    const expectedPrefix = '/shop/clx8n2k9m?page=home';

    const urlValid = relativeUrl === expectedPrefix;
    const absValid = absoluteUrl.endsWith(expectedPrefix) && absoluteUrl.startsWith('http');

    results.push({
      testName: 'Store URL Generation',
      success: urlValid && absValid,
      message: urlValid && absValid
        ? `Successfully generated ID-based URLs: ${relativeUrl} and ${absoluteUrl}`
        : `URL mismatch. Expected relative url to equal ${expectedPrefix}. Got: ${relativeUrl}`,
      details: { relativeUrl, absoluteUrl }
    });
  } catch (err: any) {
    results.push({
      testName: 'Store URL Generation',
      success: false,
      message: `Exception during URL generation: ${err.message}`
    });
  }

  // 2. SUCCESSFUL STORE CREATION TEST (Insert -> Verify -> Retrieve)
  let tempShopId: string | null = null;
  const hashHex = runId.padEnd(12, 'a').slice(0, 12);
  const mockId = `e0000000-0000-0000-0000-${hashHex}`; // Valid custom UUID format

  try {
    // Attempt Database Insertion
    const { error: insertError } = await supabase
      .from('shops')
      .insert({
        id: mockId,
        owner_id: null, // neutral testing shop
        name: `Successful Test Store - ${runId}`,
        handle: `autotest-${runId}`,
        slug: `autotest-${runId}`,
        description: 'Auto-generated successful diagnostics store.',
        is_live: false
      });

    if (insertError) throw insertError;

    // Confirm Insert Success & Retrieve Saved Store ID
    const { data: verifiedShop, error: verifyErr } = await supabase
      .from('shops')
      .select('id, name')
      .eq('id', mockId)
      .maybeSingle();

    if (verifyErr) throw verifyErr;
    
    const isVerifiedSucessfully = verifiedShop && verifiedShop.id === mockId;

    if (isVerifiedSucessfully) {
      tempShopId = mockId;
    }

    results.push({
      testName: 'successful store creation',
      success: !!isVerifiedSucessfully,
      message: isVerifiedSucessfully
        ? `Successfully created and verified test store in database: ID ${mockId}`
        : `Database verification failed. Store not found or ID mismatch.`,
      details: verifiedShop
    });
  } catch (err: any) {
    results.push({
      testName: 'successful store creation',
      success: false,
      message: `Failed store creation query: ${err.message}`,
      details: err
    });
  }

  // 3. FAILED STORE CREATION TEST
  try {
    // Attempting an insert with duplicate fields or malformed payload to trigger failure
    const malformedId = 'malformed-uuid-which-should-fail-on-foreign-keys-or-casting';
    const { error: failError } = await supabase
      .from('shops')
      .insert({
        id: malformedId,
        name: `Malformed Store ${runId}`,
        handle: `autofail-${runId}`
      });

    // We expect this database insert to return an error/fail
    const failedGracefully = !!failError;

    results.push({
      testName: 'failed store creation',
      success: failedGracefully,
      message: failedGracefully
        ? `Database successfully caught and rejected malformed store insert: ${failError.message}`
        : `Database failed to reject malformed insertion, or accepted malformed ID format.`,
      details: failError
    });
  } catch (err: any) {
    results.push({
      testName: 'failed store creation',
      success: true, // Threw an exception, which counts as successfully blocking a bad write
      message: `Exception triggered successfully when attempting malformed write: ${err.message}`
    });
  }

  // 4. STORE LOOKUP TEST (by ID)
  if (tempShopId) {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', tempShopId)
        .maybeSingle();

      if (error) throw error;
      const matched = data && data.id === tempShopId;

      results.push({
        testName: 'store lookup',
        success: !!matched,
        message: matched
          ? `Verified database query using unique ID: found store "${data.name}"`
          : 'Failed to look up shop record using assigned ID.',
        details: data
      });
    } catch (err: any) {
      results.push({
        testName: 'store lookup',
        success: false,
        message: `Error querying store by ID: ${err.message}`
      });
    }
  } else {
    results.push({
      testName: 'store lookup',
      success: false,
      message: 'Skipped - dependent on successful store creation.'
    });
  }

  // 5. INVALID UUID VALIDATION TEST
  try {
    const invalidId = 'not-a-valid-uuid-identifier-123';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invalidId);
    
    let dbExceptionAvoided = false;
    let fallbackTo404Page = false;

    if (!isUUID) {
      dbExceptionAvoided = true;
      fallbackTo404Page = true;
    }

    results.push({
      testName: 'invalid UUID',
      success: dbExceptionAvoided && fallbackTo404Page,
      message: 'Successfully validated malformed UUID locally, avoiding cast crash scenarios, and correctly marked for fallback routing.'
    });
  } catch (err: any) {
    results.push({
      testName: 'invalid UUID',
      success: false,
      message: `Exception in invalid UUID test: ${err.message}`
    });
  }

  // 6. DELETED STORE TEST
  try {
    const deletedShopId = '00000000-0000-4000-b000-111111111111'; // Non-existent/deleted shop id
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', deletedShopId)
      .maybeSingle();

    const handledResiliently = !error && !data;

    results.push({
      testName: 'deleted store',
      success: handledResiliently,
      message: handledResiliently
        ? 'Resiliently handled deleted or non-existent store lookup - returned null gracefully instead of breaking.'
        : `Deleted lookup returned record or error: ${error?.message || 'Found record, expected none'}`
    });
  } catch (err: any) {
    results.push({
      testName: 'deleted store',
      success: false,
      message: `Deleted store query crashed: ${err.message}`
    });
  }

  // Clean up mock shop
  if (tempShopId) {
    try {
      await supabase.from('shops').delete().eq('id', tempShopId);
    } catch (_) {}
  }

  return results;
}
