-- SUPABASE SQL MIGRATION FOR THREADZW PHASE 2: REVIEWS & RATINGS SYSTEM

-- 1. EXPAND PUBLIC.REVIEWS TABLE WITH PRODUCT, AUTHOR, AND ENGAGEMENT FIELDS
-- We alter the existing table if it exists, or create it if it doesn't.
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

alter table public.reviews add column if not exists product_id uuid references public.products(id) on delete cascade;
alter table public.reviews add column if not exists user_name text;
alter table public.reviews add column if not exists user_handle text;
alter table public.reviews add column if not exists is_verified boolean default false;
alter table public.reviews add column if not exists helpful_count integer default 0;
alter table public.reviews add column if not exists unhelpful_count integer default 0;
alter table public.reviews add column if not exists reply text;
alter table public.reviews add column if not exists reply_created_at timestamp with time zone;

-- Enable RLS on public.reviews (already enabled but safe to ensure)
alter table public.reviews enable row level security;

-- Policies for public.reviews
drop policy if exists "Anyone can view reviews" on public.reviews;
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Users can insert own reviews" on public.reviews;
create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update or delete own reviews" on public.reviews;
create policy "Users can update or delete own reviews"
  on public.reviews for all
  using (auth.uid() = user_id);

drop policy if exists "Shop owners can update reviews (replies)" on public.reviews;
create policy "Shop owners can update reviews (replies)"
  on public.reviews for update
  using (
    exists (
      select 1 from public.shops
      where id = public.reviews.shop_id and owner_id = auth.uid()
    )
  );


-- 2. REVIEW PHOTOS TABLE (For multiple photo attachments)
create table if not exists public.review_photos (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.reviews(id) on delete cascade,
  image_url text not null,
  created_at timestamp with time zone default now()
);

alter table public.review_photos enable row level security;

drop policy if exists "Anyone can view review photos" on public.review_photos;
create policy "Anyone can view review photos"
  on public.review_photos for select
  using (true);

drop policy if exists "Users can insert own review photos" on public.review_photos;
create policy "Users can insert own review photos"
  on public.review_photos for insert
  with check (
    exists (
      select 1 from public.reviews
      where id = public.review_photos.review_id and user_id = auth.uid()
    )
  );


-- 3. REVIEW REACTIONS TABLE (👍 Helpful, 👎 Not Helpful - preventing double voting)
create table if not exists public.review_reactions (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.reviews(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('helpful', 'unhelpful')),
  created_at timestamp with time zone default now(),
  unique (review_id, user_id)
);

alter table public.review_reactions enable row level security;

drop policy if exists "Anyone can view review reactions" on public.review_reactions;
create policy "Anyone can view review reactions"
  on public.review_reactions for select
  using (true);

drop policy if exists "Users can manage own reactions" on public.review_reactions;
create policy "Users can manage own reactions"
  on public.review_reactions for all
  using (auth.uid() = user_id);


-- 4. MERCHANT REPLIES TABLE (Optional auxiliary, mirroring/recording all replies)
create table if not exists public.merchant_replies (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.reviews(id) on delete cascade unique,
  shop_id uuid references public.shops(id) on delete cascade,
  reply_text text not null,
  created_at timestamp with time zone default now()
);

alter table public.merchant_replies enable row level security;

drop policy if exists "Anyone can view merchant replies" on public.merchant_replies;
create policy "Anyone can view merchant replies"
  on public.merchant_replies for select
  using (true);

drop policy if exists "Shop owners can manage merchant replies" on public.merchant_replies;
create policy "Shop owners can manage merchant replies"
  on public.merchant_replies for all
  using (
    exists (
      select 1 from public.shops
      where id = public.merchant_replies.shop_id and owner_id = auth.uid()
    )
  );


-- 5. REVIEWER BADGES TABLE (Early Reviewer, Top Reviewer, Fashion Expert, Sneaker Enthusiast)
create table if not exists public.reviewer_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  badge_type text not null,
  created_at timestamp with time zone default now(),
  unique (user_id, badge_type)
);

alter table public.reviewer_badges enable row level security;

drop policy if exists "Anyone can view reviewer badges" on public.reviewer_badges;
create policy "Anyone can view reviewer badges"
  on public.reviewer_badges for select
  using (true);

drop policy if exists "System can manage reviewer badges" on public.reviewer_badges;
create policy "System can manage reviewer badges"
  on public.reviewer_badges for all
  using (true); -- Accessible by authenticated users to assign based on client rules


-- 6. REVIEW NOTIFICATIONS TABLE (Milestones, alerts, new review signals)
create table if not exists public.review_notifications (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade,
  type text not null check (type in (
    'new_review', 'five_star', 'one_star_alert', 'milestone_50', 'milestone_100', 'rating_drop'
  )),
  title text not null,
  body text not null,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.review_notifications enable row level security;

drop policy if exists "Shop owners can manage review notifications" on public.review_notifications;
create policy "Shop owners can manage review notifications"
  on public.review_notifications for all
  using (
    exists (
      select 1 from public.shops
      where id = public.review_notifications.shop_id and owner_id = auth.uid()
    )
  );


-- 7. EFFICIENT INDEXES FOR SCALE
create index if not exists idx_reviews_shop_id on public.reviews(shop_id);
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_review_photos_review_id on public.review_photos(review_id);
create index if not exists idx_review_reactions_review_id on public.review_reactions(review_id);
create index if not exists idx_reviewer_badges_user_id on public.reviewer_badges(user_id);
create index if not exists idx_review_notifications_shop_id on public.review_notifications(shop_id);
