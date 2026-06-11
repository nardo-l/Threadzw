// src/utils/slugify.ts

export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
};

export const generateUniqueSlug = async (
  supabase: any,
  name: string,
  excludeId: string | null = null
): Promise<string> => {
  const base = slugify(name);
  if (!base) return `shop${Date.now()}`;

  // Check if base is available
  let query = supabase
    .from('shops')
    .select('slug')
    .eq('slug', base);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data } = await query.maybeSingle();
  if (!data) return base;

  // Try numbered variants
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}${i}`;

    let checkQuery = supabase
      .from('shops')
      .select('slug')
      .eq('slug', candidate);

    if (excludeId) {
      checkQuery = checkQuery.neq('id', excludeId);
    }

    const { data: taken } = await checkQuery.maybeSingle();
    if (!taken) return candidate;
  }

  return `${base}${Date.now()}`;
};
