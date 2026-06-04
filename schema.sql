-- Seed the demo shop record physically with a lifetime 'active' subscription
INSERT INTO public.shops (
  id,
  owner_id,
  name,
  handle,
  slug,
  description,
  categories,
  location,
  whatsapp,
  whatsapp_number,
  is_live,
  subscription_status,
  trial_ends_at,
  logo_url,
  banner_url
) VALUES (
  'da7da7da-7da7-4da7-bda7-da7da7da7da7', -- UUID representation of 'demo-shop'
  null, -- No specific auth.users required
  'Kure Streetwear',
  'demo',
  'demo',
  'Zim clothing store - built for the ones chasing more.',
  ARRAY['Clothing', 'Streetwear'],
  'Harare',
  '263776223144',
  '263776223144',
  true,
  'active',
  now() + interval '100 years', -- lifetime subscription
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
) ON CONFLICT (handle) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  whatsapp = EXCLUDED.whatsapp,
  whatsapp_number = EXCLUDED.whatsapp_number,
  is_live = EXCLUDED.is_live,
  subscription_status = EXCLUDED.subscription_status,
  trial_ends_at = EXCLUDED.trial_ends_at;
