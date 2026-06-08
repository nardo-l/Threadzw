// src/utils/slugify.ts

export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '')       // Remove ALL spaces
    .replace(/[^a-z0-9]/g, '');// Final cleanup
};

export const generateUniqueSlug = async (
  supabase: any,
  shopName: string,
  excludeShopId: string | null = null
): Promise<string> => {
  const base = slugify(shopName);
  
  if (!base) return `shop${Date.now()}`;

  // Check if base slug is available
  let query = supabase
    .from('shops')
    .select('slug')
    .eq('slug', base);
  
  if (excludeShopId) {
    query = query.neq('id', excludeShopId);
  }
  
  const { data: existing } = await query.maybeSingle();

  if (!existing) return base;

  // Slug taken, try with numbers
  let counter = 2;
  while (counter < 100) {
    const candidate = `${base}${counter}`;
    
    let checkQuery = supabase
      .from('shops')
      .select('slug')
      .eq('slug', candidate);
    
    if (excludeShopId) {
      checkQuery = checkQuery.neq('id', excludeShopId);
    }
    
    const { data: taken } = await checkQuery.maybeSingle();
    
    if (!taken) return candidate;
    counter++;
  }

  // Fallback with timestamp
  return `${base}${Date.now()}`;
};
