

export interface SeedProduct {
  name: string;
  price: number;
  description: string;
  images: string[];
  status: 'active' | 'paused' | 'sold_out';
  total_stock: number;
  is_featured: boolean;
  sold_count: number;
  category: string;
}

export const SEED_PRODUCTS_METADATA: SeedProduct[] = [
  {
    name: 'Shadow Hoodie',
    price: 35.00,
    description: 'Heavyweight 450gsm shadow black fleece hoodie with signature gothic graphics.',
    images: ['/src/assets/images/shadow_hoodie_1782042202597.jpg'],
    status: 'active',
    total_stock: 128,
    is_featured: true,
    sold_count: 128,
    category: 'Clothing'
  },
  {
    name: 'Capri Track Pants',
    price: 45.00,
    description: 'Slim-straight black cargo pants with zipped pockets and adjustable strap hardware.',
    images: ['/src/assets/images/capri_track_pants_1782042219426.jpg'],
    status: 'active',
    total_stock: 96,
    is_featured: true,
    sold_count: 96,
    category: 'Clothing'
  },
  {
    name: 'Nulla Tee',
    price: 28.00,
    description: 'Oversized cotton tee featuring faded orange screen-printed graphics.',
    images: ['/src/assets/images/nulla_tee_1782042238188.jpg'],
    status: 'active',
    total_stock: 80,
    is_featured: false,
    sold_count: 80,
    category: 'Clothing'
  },
  {
    name: 'Zombie ZipUp',
    price: 50.00,
    description: 'Distressed forest green fleece zip-up hoodie with high-density puff print details.',
    images: ['/src/assets/images/zombie_zipup_1782042256634.jpg'],
    status: 'active',
    total_stock: 64,
    is_featured: false,
    sold_count: 64,
    category: 'Clothing'
  },
  {
    name: 'Vibrant Pink ZipUp',
    price: 48.00,
    description: 'Bright fuschia pink fleece zip-up hoodie featuring contrast logo detailing.',
    images: ['/src/assets/images/pink_zipup_1782042274499.jpg'],
    status: 'paused', // Draft maps to pauses/unpublished, showing "Draft" label
    total_stock: 12,
    is_featured: false,
    sold_count: 0,
    category: 'Clothing'
  },
  {
    name: 'Shadow Shorts',
    price: 24.00,
    description: 'Heavyweight Terry cotton sweat shorts with adjustable drawstring waist.',
    images: ['/src/assets/images/black_shorts_1782042289615.jpg'],
    status: 'sold_out',
    total_stock: 0,
    is_featured: false,
    sold_count: 20,
    category: 'Clothing'
  }
];

export async function seedShopProductsIfEmpty(supabase: any, shopId: string, userId: string): Promise<any[]> {
  // 1. Check if products exist in Supabase for this shop
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId);

  if (error) {
    console.error("Error checking products from database:", error);
    throw error;
  }

  if (dbProducts && dbProducts.length > 0) {
    return dbProducts;
  }

  // 2. Otherwise seed them!
  const insertedProducts: any[] = [];
  for (let i = 0; i < SEED_PRODUCTS_METADATA.length; i++) {
    const meta = SEED_PRODUCTS_METADATA[i];
    const prodRecord = {
      shop_id: shopId,
      owner_id: userId,
      name: meta.name,
      price: meta.price,
      description: meta.description,
      images: meta.images,
      sizes: [
        { size: 'S', quantity: Math.round(meta.total_stock * 0.3) },
        { size: 'M', quantity: Math.round(meta.total_stock * 0.4) },
        { size: 'L', quantity: Math.round(meta.total_stock * 0.3) }
      ],
      category: meta.category,
      total_stock: meta.total_stock,
      is_published: meta.status !== 'paused',
      is_featured: meta.is_featured,
      status: meta.status,
      created_at: new Date(Date.now() - (i * 12 + 6) * 60 * 60 * 100).toISOString()
    };

    const { data, error: insertErr } = await supabase
      .from('products')
      .insert(prodRecord)
      .select();
    
    if (insertErr) {
      console.error("Could not insert seeded product inside Supabase:", insertErr);
      throw insertErr;
    }

    if (data && data[0]) {
      insertedProducts.push(data[0]);
    }
  }

  // Also seed a default set of persistent orders matching screenshot 2
  const seededOrders = [
    {
      shop_id: shopId,
      owner_id: userId,
      product_name: 'Capri Track Pants',
      size: 'L',
      quantity: 1,
      sale_price: 45.00,
      channel: 'whatsapp',
      order_reference: '#1024',
      total_price: 45.00,
      status: 'completed', // Delivered
      customer_name: 'Tawanda M.',
      customer_whatsapp: '263776223144',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      shop_id: shopId,
      owner_id: userId,
      product_name: 'Shadow Hoodie',
      size: 'M',
      quantity: 1,
      sale_price: 25.00,
      channel: 'whatsapp',
      order_reference: '#1023',
      total_price: 25.00,
      status: 'processing', // Processing
      customer_name: 'Rutendo K.',
      customer_whatsapp: '263771234567',
      created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
    },
    {
      shop_id: shopId,
      owner_id: userId,
      product_name: 'Nulla Tee',
      size: 'S',
      quantity: 1,
      sale_price: 75.00,
      channel: 'in_store',
      order_reference: '#1022',
      total_price: 75.00,
      status: 'pending', // Shipped
      customer_name: 'Brian C.',
      customer_whatsapp: '263779876543',
      created_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString()
    }
  ];

  try {
    const { error: orderErr } = await supabase.from('orders').insert(seededOrders);
    if (orderErr) {
      console.error("Could not insert seeded orders inside Supabase:", orderErr);
    }
  } catch (err) {
    console.error("Exception when inserting seeded orders:", err);
  }

  return insertedProducts;
}
