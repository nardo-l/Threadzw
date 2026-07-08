export async function seedShopProductsIfEmpty(supabase: any, shopId: string, userId: string): Promise<any[]> {
  // Directly query the real production database for products
  console.log(`FORENSIC: Querying products table for shop_id: ${shopId}`);
  const tProd0 = performance.now();
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId);
  const tProd1 = performance.now();
  console.log(`FORENSIC TIMING: query on SQL table products with filter [shop_id = ${shopId}] took ${(tProd1 - tProd0).toFixed(2)}ms (row count: ${dbProducts ? dbProducts.length : 0}, evaluation: RLS, indexes: products_shop_id_idx)`);

  if (error) {
    console.error("Error retrieving products from database:", error);
    throw error;
  }

  return dbProducts || [];
}
