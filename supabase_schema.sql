-- RUN ALL SQL IN SUPABASE SQL EDITOR --

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  handle text unique,
  email text,
  avatar_url text,
  onboarding_complete boolean default false,
  personality_type text,
  style_preferences jsonb default '{}',
  style_preference text,
  whatsapp_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- SHOPS TABLE
create table if not exists public.shops (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  handle text unique not null,
  slug text unique,
  description text,
  logo_url text,
  banner_url text,
  whatsapp text,
  instagram text,
  location text,
  is_live boolean default false,
  is_verified boolean default false,
  categories text[] default '{}',
  follower_count integer default 0,
  product_count integer default 0,
  subscription_status text default 'trial',
  plan text,
  access_code text,
  trial_started_at timestamp with time zone default now(),
  trial_ends_at timestamp with time zone default (now() + interval '3 days'),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  manual_lock boolean default false,
  manual_lock_reason text,
  manual_lock_date timestamp with time zone,
  manual_lock_by uuid,
  payment_overdue_flagged boolean default false,
  payment_overdue_since timestamp with time zone
);

alter table public.shops enable row level security;

create policy "Anyone can view live shops"
  on public.shops for select
  using (is_live = true);

create policy "Owners can manage own shops"
  on public.shops for all
  using (auth.uid() = owner_id);

-- SUBSCRIPTIONS TABLE
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  plan text not null check (plan in ('shop')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  status text not null default 'active' 
    check (status in ('active', 'cancelled', 'expired', 'trial')),
  amount_paid numeric(10,2),
  currency text default 'USD',
  payment_method text default 'ecocash',
  ecocash_number text,
  payment_status text default 'pending',
  started_at timestamp with time zone default now(),
  current_period_start timestamp with time zone default now(),
  current_period_end timestamp with time zone,
  cancelled_at timestamp with time zone,
  paynow_reference text,
  is_first_month boolean default true,
  created_at timestamp with time zone default now()
);

alter table public.subscriptions enable row level security;

-- Now safe to add subscription_id to shops if it doesn't exist
alter table public.shops 
  add column if not exists subscription_id uuid references public.subscriptions(id);

create policy "Owners can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = owner_id);

create policy "Owners can insert own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = owner_id);

-- Function to calculate period end based on billing cycle
-- THREADZW PRICING: $5/month | 3-day trial — do not change without updating all instances
create or replace function calculate_period_end(
  start_date timestamp with time zone,
  cycle text
) returns timestamp with time zone as $$
begin
  -- Strictly 30 days for monthly subscription (no other billing tiers or cycles)
  return start_date + interval '30 days';
end;
$$ language plpgsql;

-- Function to check if subscription is expired
create or replace function is_subscription_expired(sub_id uuid)
returns boolean as $$
declare
  sub_record public.subscriptions%rowtype;
begin
  select * into sub_record
  from public.subscriptions
  where id = sub_id;

  if sub_record.status = 'cancelled' then return true; end if;
  if sub_record.status = 'expired' then return true; end if;
  if sub_record.current_period_end < now() then
    -- Auto-expire
    update public.subscriptions
    set status = 'expired'
    where id = sub_id;
    -- Pause the shop
    update public.shops
    set is_live = false
    where id = sub_record.shop_id;
    return true;
  end if;
  return false;
end;
$$ language plpgsql security definer;

-- PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text,
  condition text,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  images text[] default '{}',
  sizes jsonb default '[]',
  -- sizes format: [{"size": "UK9", "quantity": 3}, ...]
  colours text[] default '{}',
  total_stock integer default 0,
  is_featured boolean default false,
  featured_until timestamp with time zone,
  status text default 'active' check (status in ('active', 'sold_out', 'paused', 'deleted')),
  like_count integer default 0,
  save_count integer default 0,
  view_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.products enable row level security;

create policy "Anyone can view active products from live shops"
  on public.products for select
  using (
    status != 'deleted' and
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
      and shops.is_live = true
    )
  );

create policy "Owners can view own products"
  on public.products for select
  using (auth.uid() = owner_id);

create policy "Owners can insert own products"
  on public.products for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update own products"
  on public.products for update
  using (auth.uid() = owner_id);

create policy "Owners can delete own products"
  on public.products for delete
  using (auth.uid() = owner_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure update_updated_at();


-- ORDERS TABLE (manual sales log)
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  product_snapshot jsonb,
  -- Stores product details at time of sale in case product is deleted
  size text,
  quantity integer not null default 1,
  listed_price numeric(10,2),
  sale_price numeric(10,2) not null,
  is_negotiated boolean default false,
  channel text default 'in_store' check (channel in ('in_store', 'whatsapp')),
  note text,
  order_reference text unique,
  -- Auto-generated e.g. #TZW-0042
  total_price numeric(10,2),
  items jsonb,
  buyer_id uuid references auth.users(id),
  sold_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

create policy "Owners can view own orders"
  on public.orders for select
  using (auth.uid() = owner_id);

create policy "Owners can insert own orders"
  on public.orders for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update own orders"
  on public.orders for update
  using (auth.uid() = owner_id);

create policy "Owners can delete own orders"
  on public.orders for delete
  using (auth.uid() = owner_id);

-- Sequence for order references
create sequence if not exists public.order_ref_seq;

-- Auto-generate order reference
create or replace function generate_order_reference()
returns trigger as $$
declare
  next_val integer;
  ref_number text;
begin
  select nextval('public.order_ref_seq') into next_val;
  ref_number := '#TZW-' || lpad(next_val::text, 4, '0');
  new.order_reference := ref_number;
  return new;
end;
$$ language plpgsql security definer;

create trigger orders_generate_reference
  before insert on public.orders
  for each row execute procedure generate_order_reference();

-- LIKES TABLE
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

alter table public.likes enable row level security;

create policy "Users can view all likes"
  on public.likes for select
  using (true);

create policy "Users can manage own likes"
  on public.likes for all
  using (auth.uid() = user_id);

-- Update product like count on like insert
create or replace function update_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.products
    set like_count = like_count + 1
    where id = NEW.product_id;
  elsif TG_OP = 'DELETE' then
    update public.products
    set like_count = greatest(like_count - 1, 0)
    where id = OLD.product_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger likes_update_count
  after insert or delete on public.likes
  for each row execute procedure update_like_count();

-- SAVES TABLE
create table public.saves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

alter table public.saves enable row level security;

create policy "Users can manage own saves"
  on public.saves for all
  using (auth.uid() = user_id);

-- Update product save count
create or replace function update_save_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.products
    set save_count = save_count + 1
    where id = NEW.product_id;
  elsif TG_OP = 'DELETE' then
    update public.products
    set save_count = greatest(save_count - 1, 0)
    where id = OLD.product_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger saves_update_count
  after insert or delete on public.saves
  for each row execute procedure update_save_count();

-- FOLLOWS TABLE
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references auth.users(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(follower_id, shop_id)
);

alter table public.follows enable row level security;

create policy "Anyone can view follows"
  on public.follows for select
  using (true);

create policy "Users can manage own follows"
  on public.follows for all
  using (auth.uid() = follower_id);

-- Update shop follower count
create or replace function update_follower_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.shops
    set follower_count = coalesce(follower_count, 0) + 1
    where id = NEW.shop_id;
  elsif TG_OP = 'DELETE' then
    update public.shops
    set follower_count = greatest(coalesce(follower_count, 0) - 1, 0)
    where id = OLD.shop_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger follows_update_count
  after insert or delete on public.follows
  for each row execute procedure update_follower_count();

-- BEST DRESSER TABLE
create table public.best_dresser_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  instagram_handle text not null,
  instagram_post_url text not null,
  month integer not null,
  year integer not null,
  status text default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'nominated', 'winner')),
  rejection_reason text,
  vote_count integer default 0,
  bracket_position text,
  submitted_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  unique(user_id, month, year)
);

alter table public.best_dresser_entries enable row level security;

create policy "Users can view approved entries"
  on public.best_dresser_entries for select
  using (status in ('approved', 'nominated', 'winner'));

create policy "Users can view own entries"
  on public.best_dresser_entries for select
  using (auth.uid() = user_id);

create policy "Users can submit own entries"
  on public.best_dresser_entries for insert
  with check (auth.uid() = user_id);

-- REVIEWS TABLE
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

-- NOTIFICATIONS TABLE
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in (
    'new_drop', 'price_drop', 'best_dresser_round',
    'best_dresser_nominated', 'new_shop', 'restock_signal',
    'low_stock', 'subscription_expiring', 'subscription_expired',
    'announcement', 'access_code_sent'
  )),
  title text not null,
  body text not null,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- COMMUNITY CARDS TABLE
create table if not exists public.community_cards (
  id uuid default gen_random_uuid() primary key,
  card_key text unique not null,
  image_url text,
  updated_at timestamptz default now()
);

alter table public.community_cards enable row level security;

create policy "Anyone can view community cards"
  on public.community_cards for select using (true);

-- Insert default rows
insert into public.community_cards (card_key, image_url)
values
  ('musify', null),
  ('how_fly', null),
  ('best_dresser', null)
on conflict (card_key) do nothing;

-- MUSIFY TABLES
create table if not exists public.musify_tracks_cache (
  id uuid default gen_random_uuid() primary key,
  artist_name text not null,
  tracks jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists musify_tracks_cache_artist_name_idx on public.musify_tracks_cache (lower(artist_name));

alter table public.musify_tracks_cache enable row level security;
create policy "Anyone can view musify tracks cache" on public.musify_tracks_cache for select using (true);
create policy "Service role can manage tracks cache" on public.musify_tracks_cache for all using (true); -- Usually handled by edge functions with service role

create table if not exists public.musify_leaderboard (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  handle text,
  avatar_url text,
  artist_name text,
  score integer,
  best_percentage integer,
  max_streak integer,
  difficulty text,
  created_at timestamptz default now()
);

alter table public.musify_leaderboard enable row level security;
create policy "Anyone can view musify leaderboard" on public.musify_leaderboard for select using (true);
create policy "Authenticated users can insert musify score" on public.musify_leaderboard for insert with check (auth.uid() = user_id);

create table if not exists public.musify_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  artist_query text,
  artist_name text,
  artist_image text,
  total_questions integer,
  correct_count integer,
  score_percentage integer,
  max_streak integer,
  difficulty text,
  platform text default 'native' check (platform in ('native', 'muzify')),
  completed boolean default false,
  created_at timestamptz default now()
);

alter table public.musify_sessions enable row level security;
create policy "Users can view own musify sessions" on public.musify_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own musify sessions" on public.musify_sessions for insert with check (auth.uid() = user_id);

-- Ensure community-cards bucket exists
insert into storage.buckets (id, name, public)
select 'community-cards', 'community-cards', true
where not exists (select 1 from storage.buckets where id = 'community-cards');

-- Storage policies for community-cards
create policy "community_cards_public_read"
  on storage.objects for select to public
  using (bucket_id = 'community-cards');

create policy "community_cards_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'community-cards');

create policy "community_cards_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'community-cards');

create policy "community_cards_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'community-cards');

-- STORAGE BUCKETS
-- insert into storage.buckets (id, name, public)
-- values
--   ('avatars', 'avatars', true),
--   ('shop-banners', 'shop-banners', true),
--   ('shop-avatars', 'shop-avatars', true),
--   ('product-images', 'product-images', true),
--   ('shop-stories', 'shop-stories', true)
-- on conflict (id) do update set public = excluded.public;

-- Ensure buckets exist (using a more robust method if insert fails)
insert into storage.buckets (id, name, public)
select 'product-images', 'product-images', true
where not exists (select 1 from storage.buckets where id = 'product-images');

insert into storage.buckets (id, name, public)
select 'avatars', 'avatars', true
where not exists (select 1 from storage.buckets where id = 'avatars');

insert into storage.buckets (id, name, public)
select 'shop-banners', 'shop-banners', true
where not exists (select 1 from storage.buckets where id = 'shop-banners');

insert into storage.buckets (id, name, public)
select 'shop-avatars', 'shop-avatars', true
where not exists (select 1 from storage.buckets where id = 'shop-avatars');

insert into storage.buckets (id, name, public)
select 'shop-stories', 'shop-stories', true
where not exists (select 1 from storage.buckets where id = 'shop-stories');

-- Storage policies (Consolidated at the end of file)

-- UPDATE SHOPS TABLE (add missing columns - redundantly checked but kept for safety if table already existed without them)
alter table public.shops
  add column if not exists follower_count integer default 0,
  add column if not exists product_count integer default 0,
  add column if not exists is_verified boolean default false,
  add column if not exists subscription_status text default 'trial',
  add column if not exists subscription_paid_at timestamp with time zone,
  add column if not exists plan text,
  add column if not exists access_code text,
  add column if not exists trial_started_at timestamp with time zone default now(),
  add column if not exists trial_ends_at timestamp with time zone default (now() + interval '3 days'),
  add column if not exists featured_until timestamp with time zone;

-- UPDATE PRODUCTS TABLE (add missing columns)
alter table public.products
  add column if not exists is_published boolean default true;

-- Update product count when products are added/removed
create or replace function update_product_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.shops
    set product_count = product_count + 1
    where id = NEW.shop_id;
  elsif TG_OP = 'DELETE' then
    update public.shops
    set product_count = greatest(product_count - 1, 0)
    where id = OLD.shop_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger products_update_shop_count
  after insert or delete on public.products
  for each row execute procedure update_product_count();

-- STORIES TABLE
create table if not exists public.stories (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  media_url text not null,
  media_type text default 'image' check (media_type in ('image', 'video')),
  content text,
  product_id uuid references public.products(id) on delete set null,
  expires_at timestamp with time zone default (now() + interval '24 hours'),
  created_at timestamp with time zone default now()
);

alter table public.stories enable row level security;

create policy "Anyone can view stories"
  on public.stories for select
  using (expires_at > now());

create policy "Owners can manage own stories"
  on public.stories for all
  using (auth.uid() = owner_id);

-- ECOCASH & PAYMENTS ADDITIONS
-- Add payment_method column to subscriptions
alter table public.subscriptions
  add column if not exists payment_method text default 'ecocash',
  add column if not exists ecocash_number text,
  add column if not exists zuripay_transaction_id text,
  add column if not exists zuripay_poll_url text,
  add column if not exists payment_status text default 'pending'
    check (payment_status in ('pending', 'processing', 'paid', 'failed', 'cancelled'));

-- TABLE: payments (manual system)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade not null,
  whatsapp_number text not null,
  plan text not null check (plan in ('shop')),
  amount numeric not null check (amount = 6),
  payment_method text default 'ecocash' check (payment_method in ('ecocash', 'innbucks')),
  receiving_number text not null default '0776223144',
  status text default 'pending' check (status in (
    'pending', 'verified', 'code_generated', 'code_sent', 
    'activated', 'rejected', 'refunded'
  )),
  access_code text,
  code_generated_at timestamptz,
  code_sent_at timestamptz,
  activated_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  admin_notes text,
  submitted_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Sellers can view own payments"
  on public.payments for select
  using (auth.uid() = owner_id);

create policy "Sellers can insert own payments"
  on public.payments for insert
  with check (auth.uid() = owner_id);

create policy "Sellers can update own pending payments"
  on public.payments for update
  using (auth.uid() = owner_id and status = 'pending')
  with check (auth.uid() = owner_id and status = 'pending');

-- STYLE CARDS TABLE (For Onboarding Style Picker)
create table if not exists public.style_cards (
  id uuid default uuid_generate_v4() primary key,
  image_url text not null,
  style_label text not null,
  result_headline text,
  result_message text,
  result_emoji text,
  result_stat text,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.style_cards enable row level security;

create policy "Anyone can view active style cards"
  on public.style_cards for select
  using (is_active = true);

-- SEED DATA: Style Cards
insert into public.style_cards (image_url, style_label, result_headline, result_message, result_emoji, result_stat, display_order)
values 
('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800', 'Streetwear', 'Nice choice. You''re in the top 1%.', 'Your style is rare and forward-thinking. You set the trends while others follow.', '🔥', 'Top 1%', 10),
('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', 'Minimalist', 'The Architect of Style.', 'Clean lines, muted tones. You know that less is always more.', '⚪', 'Elite Tier', 20),
('https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800', 'Smart Casual', 'Sophisticated & Sharp.', 'You bridge the gap between effort and effortless. Truly timeless.', '💼', 'Top 5%', 30),
('https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&q=80&w=800', 'Sneakerhead', 'The Grail Hunter.', 'Your collection is the envy of Zimbabwe. You speak the language of limited drops.', '👟', 'Rare Level', 40)
on conflict do nothing;

-- TABLE: admin_settings
create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  description text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.admin_settings enable row level security;

create policy "Public can select admin settings"
  on public.admin_settings for select
  to public
  using (true);

insert into public.admin_settings (key, value, description)
values
  ('receiving_number', '0776223144', 'EcoCash/InnBucks number that receives shop subscription payments'),
  ('shop_price', '6', 'Monthly price in USD for the Thread ZW Shop plan'),
  ('trial_days', '28', 'Number of free trial days before payment is required'),
  ('best_dresser_prize', '30', 'Monthly cash prize in USD for Best Dresser winner'),
  ('max_notifications', '50', 'Maximum notifications kept per user before oldest are deleted')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description;

-- ═══════════════════════════════════════════════════════════════════════════
-- MANUAL PAYMENT SYSTEM HELPERS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: Generate 6-digit access code
create or replace function public.generate_access_code()
returns text as $function$
begin
  return lpad(floor(random() * 1000000)::int::text, 6, '0');
end;
$function$ language plpgsql;

-- Helper: Get pending payments count
create or replace function public.get_pending_payments_count()
returns int as $function$
declare
  pending_count int;
begin
  select count(*) into pending_count
  from public.payments
  where status = 'pending';
  return pending_count;
end;
$function$ language plpgsql security definer;

-- Helper: Get payment summary
create or replace function public.get_payment_summary()
returns jsonb as $function$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_payments', count(*),
    'pending', count(*) filter (where status = 'pending'),
    'verified', count(*) filter (where status = 'verified'),
    'activated', count(*) filter (where status = 'activated'),
    'rejected', count(*) filter (where status = 'rejected'),
    'total_revenue', coalesce(sum(amount) filter (where status = 'activated'), 0),
    'shop_count', count(*) filter (where plan = 'shop' and status = 'activated')
  ) into result
  from public.payments;
  return result;
end;
$function$ language plpgsql security definer;

-- Trigger: Auto set amount based on plan
create or replace function public.tr_fn_auto_set_amount()
returns trigger as $function$
begin
  if NEW.amount is null then
    if NEW.plan = 'shop' then NEW.amount := 6;
    end if;
  end if;
  return NEW;
end;
$function$ language plpgsql;

create trigger tr_payments_auto_set_amount 
  before insert on public.payments 
  for each row execute function public.tr_fn_auto_set_amount();

-- Trigger: Auto update shop on activation
create or replace function public.tr_fn_auto_update_shop_on_activation()
returns trigger as $function$
begin
  if NEW.status = 'activated' and (OLD.status is null or OLD.status != 'activated') then
    update public.shops
    set 
      subscription_status = 'active',
      subscription_paid_at = now(),
      plan = NEW.plan,
      is_live = true,
      access_code = NEW.access_code
    where id = NEW.shop_id;
    NEW.activated_at := coalesce(NEW.activated_at, now());
  end if;
  return NEW;
end;
$function$ language plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATIONS & PATCHES
-- ═══════════════════════════════════════════════════════════════════════════

-- Patch: Ensure necessary columns exist on orders table
do $$
begin
    -- Essential columns that might be missing from older local schemas
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='channel') then
        alter table public.orders add column channel text default 'in_store' check (channel in ('in_store', 'whatsapp'));
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='listed_price') then
        alter table public.orders add column listed_price numeric(10,2);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='product_name') then
        alter table public.orders add column product_name text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='is_negotiated') then
        alter table public.orders add column is_negotiated boolean default false;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='owner_id') then
        alter table public.orders add column owner_id uuid references auth.users(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='shop_id') then
        alter table public.orders add column shop_id uuid references public.shops(id);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='total_price') then
        alter table public.orders add column total_price numeric(10,2);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='items') then
        alter table public.orders add column items jsonb;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='orders' and column_name='buyer_id') then
        alter table public.orders add column buyer_id uuid references auth.users(id);
    end if;
end $$;

-- Refresh PostgREST cache (internal supabase helper if available)
notify pgrst, 'reload schema';

-- Trigger: Notify on rejection
create or replace function public.tr_fn_notify_on_rejection()
returns trigger as $function$
begin
  if NEW.status = 'rejected' and (OLD.status is null or OLD.status != 'rejected') then
    begin
      insert into public.notifications (user_id, type, title, body, data)
      values (
        NEW.owner_id, 'subscription_expiring', 'Payment Could Not Be Verified',
        'We could not verify your payment. Please contact us on WhatsApp: 0776223144',
        jsonb_build_object('payment_id', NEW.id, 'rejection_reason', NEW.rejection_reason)
      );
    exception when others then null; end;
  end if;
  return NEW;
end;
$function$ language plpgsql;

create trigger tr_payments_notify_rejected 
  after update on public.payments 
  for each row execute function public.tr_fn_notify_on_rejection();

-- Trigger: Notify on code sent
create or replace function public.tr_fn_notify_on_code_sent()
returns trigger as $function$
begin
  if NEW.status = 'code_sent' and (OLD.status is null or OLD.status != 'code_sent') then
    begin
      insert into public.notifications (user_id, type, title, body, data)
      values (
        NEW.owner_id, 'access_code_sent', 'Your Access Code is Ready 🎉',
        'Check WhatsApp — we sent your activation code to ' || NEW.whatsapp_number,
        jsonb_build_object('payment_id', NEW.id, 'whatsapp', NEW.whatsapp_number)
      );
    exception when others then null; end;
  end if;
  return NEW;
end;
$function$ language plpgsql;

create trigger tr_payments_notify_code_sent 
  after update on public.payments 
  for each row execute function public.tr_fn_notify_on_code_sent();

-- Trigger: Admin Settings updated_at
create or replace function public.tr_fn_update_admin_settings_timestamp()
returns trigger as $function$
begin
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  if NEW is not null then
    begin
      NEW.updated_at := now();
    exception when others then
      null;
    end;
  end if;
  return NEW;
end;
$function$ language plpgsql;

create trigger tr_admin_settings_updated_at 
  before update on public.admin_settings 
  for each row execute function public.tr_fn_update_admin_settings_timestamp();

-- INDEXES
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_owner_id on public.payments(owner_id);
create index if not exists idx_payments_shop_id on public.payments(shop_id);
create index if not exists idx_payments_whatsapp_number on public.payments(whatsapp_number);
create index if not exists idx_payments_submitted_at_desc on public.payments(submitted_at desc);
create index if not exists idx_admin_settings_key on public.admin_settings(key);

-- ═══════════════════════════════════════════════════════════════════════════
-- NEW AUTOMATED TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- TRIGGER 1: Auto create profile on user signup
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $function$
begin
  insert into public.profiles (id, email, display_name, handle, created_at)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'display_name', ''), 
    coalesce(new.raw_user_meta_data->>'handle', ''), 
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- TRIGGER 2: Auto set trial end date
create or replace function public.set_trial_period()
returns trigger 
language plpgsql 
security definer
as $function$
begin
  if (tg_op = 'update') then
    if (old.trial_started_at is null and new.trial_started_at is not null) then
      new.trial_ends_at := new.trial_started_at + interval '3 days';
    end if;
  elsif (tg_op = 'insert') then
    if (new.trial_started_at is not null) then
      new.trial_ends_at := new.trial_started_at + interval '3 days';
    end if;
  end if;
  return new;
end;
$function$;

create trigger tr_shops_trial_period_insert
  before insert on public.shops
  for each row execute function public.set_trial_period();

create trigger tr_shops_trial_period_update
  before update on public.shops
  for each row execute function public.set_trial_period();

-- TRIGGER 3: Auto notify followers on new drop
create or replace function public.notify_new_product()
returns trigger 
language plpgsql 
security definer
as $function$
declare
  shop_rec record;
  follower record;
begin
  if (old.is_published = false and new.is_published = true) then
    select name, id into shop_rec 
    from public.shops 
    where id = new.shop_id and is_live = true;

    if shop_rec.id is not null then
      for follower in 
        select follower_id from public.follows
        where shop_id = new.shop_id
      loop
        begin
          insert into public.notifications (
            user_id,
            type,
            title,
            body,
            data
          ) values (
            follower.follower_id,
            'new_drop',
            shop_rec.name || ' just dropped something new',
            new.name || ' — $' || new.price::text,
            jsonb_build_object(
              'product_id', new.id,
              'shop_id', new.shop_id,
              'product_name', new.name,
              'shop_name', shop_rec.name,
              'price', new.price
            )
          );
        exception when others then
          null;
        end;
      end loop;
    end if;
  end if;
  return null;
end;
$function$;

create trigger tr_notify_on_product_published
  after update on public.products
  for each row execute function public.notify_new_product();

-- TRIGGER 4: Auto notify saved users on price drop
create or replace function public.notify_price_drop()
returns trigger 
language plpgsql 
security definer
as $function$
declare
  saver record;
  drop_pct int;
begin
  if (new.is_published = true and new.price < old.price) then
    drop_pct := round(((old.price - new.price) / old.price * 100)::numeric, 0);
    for saver in 
      select user_id from public.saves 
      where product_id = new.id
    loop
      begin
        insert into public.notifications (
          user_id,
          type,
          title,
          body,
          data
        ) values (
          saver.user_id,
          'price_drop',
          'Price Drop Alert 💰',
          new.name || ' dropped from $' || old.price::text || ' to $' || new.price::text,
          jsonb_build_object(
            'product_id', new.id,
            'shop_id', new.shop_id,
            'product_name', new.name,
            'old_price', old.price,
            'new_price', new.price,
            'drop_amount', (old.price - new.price),
            'drop_percentage', drop_pct
          )
        );
      exception when others then
        null;
      end;
    end loop;
  end if;
  return null;
end;
$function$;

create trigger tr_notify_on_price_drop
  after update on public.products
  for each row execute function public.notify_price_drop();

-- TRIGGER 5: Auto notify saved users on low stock
create or replace function public.notify_low_stock()
returns trigger 
language plpgsql 
security definer
as $function$
declare
  saver record;
  notif_type text;
  notif_title text;
  notif_body text;
begin
  if (new.is_published = true and new.total_stock <= 3 and old.total_stock > 3) then
    if (new.total_stock = 0) then
      notif_type := 'out_of_stock';
      notif_title := 'Out of Stock ⚠️';
      notif_body := new.name || ' is now out of stock. Visit the shop to check.';
    else
      notif_type := 'low_stock';
      notif_title := 'Low Stock Alert ⚠️';
      notif_body := 'Only ' || new.total_stock::text || ' left of ' || new.name;
    end if;

    for saver in 
      select user_id from public.saves 
      where product_id = new.id
    loop
      begin
        insert into public.notifications (
          user_id,
          type,
          title,
          body,
          data
        ) values (
          saver.user_id,
          notif_type,
          notif_title,
          notif_body,
          jsonb_build_object(
            'product_id', new.id,
            'shop_id', new.shop_id,
            'product_name', new.name,
            'stock_remaining', new.total_stock
          )
        );
      exception when others then
        null;
      end;
    end loop;
  end if;
  return null;
end;
$function$;

create trigger tr_notify_on_low_stock
  after update on public.products
  for each row execute function public.notify_low_stock();

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- BUCKET: avatars
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects for select to public using (bucket_id = 'avatars');

drop policy if exists "avatars: owner upload" on storage.objects;
create policy "avatars: owner upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

-- BUCKET: shop-banners
drop policy if exists "shop-banners: public read" on storage.objects;
create policy "shop-banners: public read" on storage.objects for select to public using (bucket_id = 'shop-banners');

drop policy if exists "shop-banners: owner upload" on storage.objects;
create policy "shop-banners: owner upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'shop-banners' and exists (
    select 1 from public.shops where id::text = (storage.foldername(name))[1] and owner_id = auth.uid()
  )
);

drop policy if exists "shop-banners: owner update" on storage.objects;
create policy "shop-banners: owner update" on storage.objects for update to authenticated using (
  bucket_id = 'shop-banners' and exists (
    select 1 from public.shops where id::text = (storage.foldername(name))[1] and owner_id = auth.uid()
  )
);

drop policy if exists "shop-banners: owner delete" on storage.objects;
create policy "shop-banners: owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'shop-banners' and exists (
    select 1 from public.shops where id::text = (storage.foldername(name))[1] and owner_id = auth.uid()
  )
);

-- BUCKET: shop-avatars
drop policy if exists "shop-avatars: public read" on storage.objects;
create policy "shop-avatars: public read" on storage.objects for select to public using (bucket_id = 'shop-avatars');

drop policy if exists "shop-avatars: owner upload" on storage.objects;
create policy "shop-avatars: owner upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'shop-avatars' and exists (
    select 1 from public.shops where id::text = (storage.foldername(name))[1] and owner_id = auth.uid()
  )
);

drop policy if exists "shop-avatars: owner update" on storage.objects;
create policy "shop-avatars: owner update" on storage.objects for update to authenticated using (
  bucket_id = 'shop-avatars' and exists (
    select 1 from public.shops where id::text = (storage.foldername(name))[1] and owner_id = auth.uid()
  )
);

drop policy if exists "shop-avatars: owner delete" on storage.objects;
create policy "shop-avatars: owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'shop-avatars' and exists (
    select 1 from public.shops where id::text = (storage.foldername(name))[1] and owner_id = auth.uid()
  )
);

-- BUCKET: product-images
drop policy if exists "product-images: public read" on storage.objects;
create policy "product-images: public read" on storage.objects for select to public using (bucket_id = 'product-images');

drop policy if exists "product-images: owner upload" on storage.objects;
create policy "product-images: owner upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'product-images' 
  and exists (
    select 1 from public.shops 
    where id::text = (storage.foldername(name))[1] 
    and owner_id = auth.uid()
  )
);

drop policy if exists "product-images: owner update" on storage.objects;
create policy "product-images: owner update" on storage.objects for update to authenticated using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.shops 
    where id::text = (storage.foldername(name))[1] 
    and owner_id = auth.uid()
  )
);

drop policy if exists "product-images: owner delete" on storage.objects;
create policy "product-images: owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.shops 
    where id::text = (storage.foldername(name))[1] 
    and owner_id = auth.uid()
  )
);

-- STORIES TABLE
create table if not exists public.stories (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  owner_id uuid references auth.users(id) on delete cascade not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  content text,
  product_id uuid references public.products(id) on delete set null,
  expires_at timestamp with time zone default (now() + interval '24 hours'),
  created_at timestamp with time zone default now()
);

alter table public.stories enable row level security;

create policy "Anyone can view stories from live shops"
  on public.stories for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = stories.shop_id
      and shops.is_live = true
    ) and expires_at > now()
  );

create policy "Owners can manage own stories"
  on public.stories for all
  using (auth.uid() = owner_id);

-- BUCKET: shop-stories
drop policy if exists "shop-stories: public read" on storage.objects;
create policy "shop-stories: public read" on storage.objects for select to public using (bucket_id = 'shop-stories');

drop policy if exists "shop-stories: owner upload" on storage.objects;
create policy "shop-stories: owner upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'shop-stories'
  and exists (
    select 1 from public.shops 
    where id::text = (storage.foldername(name))[1] 
    and owner_id = auth.uid()
  )
);

drop policy if exists "shop-stories: owner delete" on storage.objects;
create policy "shop-stories: owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'shop-stories'
  and exists (
    select 1 from public.shops 
    where id::text = (storage.foldername(name))[1] 
    and owner_id = auth.uid()
  )
);

-- RPC to increment product view count
create or replace function public.increment_product_view_count(product_id uuid)
returns void as $$
begin
  update public.products
  set view_count = view_count + 1
  where id = product_id;
end;
$$ language plpgsql security definer;

-- RPC to increment shop view count
create or replace function public.increment_shop_view_count(shop_id uuid)
returns void as $$
begin
  -- Future: add view_count to shops if desired
end;
$$ language plpgsql security definer;
