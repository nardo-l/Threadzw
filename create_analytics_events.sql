-- ═══════════════════════════════════════════════════════════════════════════
-- THREADZW MERCHANT ANALYTICS SYSTEM REDESIGN SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this entire script in the Supabase SQL Editor to provision the tracking schema.

-- 1. Create a professional analytics_events table to track the complete customer funnel
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null check (event_type in (
    'store_view', 
    'product_view', 
    'purchase_intent', 
    'confirmed_order', 
    'completed_sale', 
    'wishlist_add', 
    'search_usage', 
    'category_click'
  )),
  shop_id uuid references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  visitor_id text not null, -- client-side unique boutique_customer_id
  session_id text,
  referrer text,
  device text,
  browser text,
  country text,
  city text,
  metadata jsonb default '{}'::jsonb, -- dynamic attributes like clicked button name, product name, search query, category name
  created_at timestamp with time zone default now()
);

-- 2. Add indexes for high-speed performance-critical analytics aggregation
create index if not exists idx_analytics_events_shop_id on public.analytics_events(shop_id);
create index if not exists idx_analytics_events_event_type on public.analytics_events(event_type);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at);
create index if not exists idx_analytics_events_visitor_id on public.analytics_events(visitor_id);

-- 3. Update the notifications table type constraint to allow business intelligence alerts
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'new_drop', 'price_drop', 'best_dresser_round',
  'best_dresser_nominated', 'new_shop', 'restock_signal',
  'low_stock', 'subscription_expiring', 'subscription_expired',
  'announcement', 'access_code_sent',
  -- New interactive merchant business intelligence and CRM notification types
  'new_purchase_intent', 'new_whatsapp_order', 'order_confirmed', 'order_completed', 'milestone_reached'
));

-- 4. Enable Row Level Security (RLS) on analytics_events
alter table public.analytics_events enable row level security;

-- 5. Define policies for inserting and querying analytics_events
drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
create policy "Anyone can insert analytics events" 
  on public.analytics_events for insert 
  with check (true);

drop policy if exists "Shop owners can view their analytics events" on public.analytics_events;
create policy "Shop owners can view their analytics events" 
  on public.analytics_events for select 
  using (
    exists (
      select 1 from public.shops 
      where id = analytics_events.shop_id 
      and owner_id = auth.uid()
    )
  );

-- 6. Signal PostgREST schema cache to reload
notify pgrst, 'reload schema';

comment on table public.analytics_events is 'Redesigned high-density customer event tracking system for ThreadZW analytics funnel';
