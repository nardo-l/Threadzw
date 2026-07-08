export async function seedShopProductsIfEmpty(supabase: any, shopId: string, userId: string): Promise<any[]> {
  // Directly query the real production database for products
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId);

  if (error) {
    console.error("Error retrieving products from database:", error);
    throw error;
  }

  return dbProducts || [];
}
