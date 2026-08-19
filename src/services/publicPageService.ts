import { supabase } from '../lib/supabase';
import { Page, PageType } from '../types';
import { resolveSellerCategory } from '../config/sellerCategories';

export const normalizePageType = (rawType: string | null | undefined): PageType => {
  if (!rawType) return 'clothing';
  const lower = rawType.toLowerCase().trim() as PageType;
  
  // Active seller categories
  if (lower === 'clothing' || lower === 'vehicles' || lower === 'general') {
    return lower;
  }

  // Legacy 'storefront' resolves to 'clothing'
  if (lower === 'storefront') {
    return 'clothing';
  }

  // Transitional fallback for existing test bio pages
  const legacyBioTypes: PageType[] = ['service', 'creator', 'professional', 'community'];
  if (legacyBioTypes.includes(lower)) {
    return lower;
  }

  return resolveSellerCategory(rawType);
};

export interface FetchPublicPageResult {
  page: Page | null;
  errorType: 'not_found' | 'paused' | 'error' | null;
}

export async function fetchPublicPageBySlugOrId(slugParam: string | undefined): Promise<FetchPublicPageResult> {
  if (!slugParam) {
    return { page: null, errorType: 'not_found' };
  }

  let cleanSlug = slugParam.replace(/^@/, '').trim().toLowerCase();
  cleanSlug = cleanSlug.replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');
  if (cleanSlug === 'demo') {
    cleanSlug = 'him-clothing';
  }

  if (!cleanSlug) {
    return { page: null, errorType: 'not_found' };
  }

  try {
    // 1. Query shops table by slug
    let { data: dbShop, error: shopErr1 } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (shopErr1) {
      console.error("Supabase error querying page by slug:", shopErr1);
    }

    let pageResult = dbShop;

    // 2. Fallback: If cleanSlug contains '--', extract the ID part after '--'
    if (!pageResult && cleanSlug.includes('--')) {
      const parts = cleanSlug.split('--');
      const possibleId = parts[parts.length - 1];
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(possibleId)) {
        const { data: shopById, error: shopErr2 } = await supabase
          .from('shops')
          .select('*')
          .eq('id', possibleId)
          .maybeSingle();

        if (!shopErr2 && shopById) {
          pageResult = shopById;
        }
      }
    }

    // 3. Fallback: Check if slugParam itself is a valid UUID
    if (!pageResult) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(slugParam)) {
        const { data: shopById, error: shopErr3 } = await supabase
          .from('shops')
          .select('*')
          .eq('id', slugParam)
          .maybeSingle();

        if (!shopErr3 && shopById) {
          pageResult = shopById;
        }
      }
    }

    if (!pageResult) {
      return { page: null, errorType: 'not_found' };
    }

    if (pageResult.is_active === false) {
      return { page: null, errorType: 'paused' };
    }

    const normalizedPage: Page = {
      ...pageResult,
      page_type: normalizePageType(pageResult.page_type),
      template_id: pageResult.template_id || null,
      page_config: pageResult.page_config || {},
    };

    return { page: normalizedPage, errorType: null };
  } catch (err) {
    console.error("Unexpected error fetching public page:", err);
    return { page: null, errorType: 'error' };
  }
}
