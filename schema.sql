-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- 1. CLEANUP (Drop existing tables if you want a fresh start)
-- CAUTION: This deletes all data!
drop table if exists charm_tags cascade;
drop table if exists tags cascade;
drop table if exists order_items cascade; -- if you standardized this
drop table if exists orders cascade;
drop table if exists charms cascade;
drop table if exists backgrounds cascade;
drop table if exists bracelets cascade;
-- 2. CREATE TABLES
-- Bracelets (Keep mostly same, usually static assets)
create table bracelets (
  id text primary key,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  image text not null,      -- Path to public storage or static file
  "openImage" text,         -- Note: keeping mixedCase to match your frontend code, or switch to snake_case
  grayscale boolean default false,
  color text,
  material text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Backgrounds (Simplified)
create table backgrounds (
  id bigint generated always as identity primary key,
  name text not null,
  image_url text not null, -- URL to Supabase Storage 'backgrounds' bucket
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Charms (The major refactor)
create table charms (
  id text primary key default uuid_generate_v4()::text,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  category text,
  
  -- Assets stored as URLs now
  image_url text, -- URL to Supabase Storage 'charms' bucket
  glb_url text,   -- URL to Supabase Storage 'models' bucket
  
  -- relations
  background_id bigint references backgrounds(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Tags
create table tags (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Charm Tags (Many-to-Many)
create table charm_tags (
  id bigint generated always as identity primary key,
  charm_id text references charms(id) on delete cascade,
  tag_id bigint references tags(id) on delete cascade,
  created_at timestamptz default now(),
  unique(charm_id, tag_id)
);
-- Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  items jsonb not null, -- Stores the cart snapshot including custom preview_image URLs
  total_amount numeric(10, 2) not null,
  status text not null default 'pending', -- pending, completed, cancelled, shipping
  created_at timestamptz default now()
);
-- 3. ROW LEVEL SECURITY (RLS)
alter table bracelets enable row level security;
alter table backgrounds enable row level security;
alter table charms enable row level security;
alter table tags enable row level security;
alter table charm_tags enable row level security;
alter table orders enable row level security;
-- Public Read Access (Everyone can see products)
create policy "Public bracelets are viewable by everyone" on bracelets for select using (true);
create policy "Public backgrounds are viewable by everyone" on backgrounds for select using (true);
create policy "Public charms are viewable by everyone" on charms for select using (true);
create policy "Public tags are viewable by everyone" on tags for select using (true);
create policy "Public charm_tags are viewable by everyone" on charm_tags for select using (true);
-- Orders: Users can only see their own
create policy "Users can view their own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can insert their own orders" on orders for insert with check (auth.uid() = user_id);
-- (Optional) Admin Write Access
-- You might want to create a policy where specific user emails can INSERT/UPDATE products.
-- For now, writing to products is usually done via Supabase Dashboard.
-- 4. STORAGE BUCKETS & POLICIES
-- We can create the buckets directly via SQL to save manual setup.
-- A. Create Buckets (if they don't exist)
insert into storage.buckets (id, name, public)
values 
  ('charms', 'charms', true),
  ('models', 'models', true),
  ('backgrounds', 'backgrounds', true),
  ('previews', 'previews', true),
  ('bracelets', 'bracelets', true)
on conflict (id) do nothing;
-- B. Storage Policies
-- 1. CHARMS Bucket
-- Public Read
create policy "Public Access Charms"
  on storage.objects for select
  using ( bucket_id = 'charms' );
-- Admin Write: RESTRICTED. Use Supabase Dashboard or Service Key to upload.
-- We disable client-side uploads for security.
-- create policy "Authenticated Insert Charms"
--   on storage.objects for insert
--   with check ( bucket_id = 'charms' and auth.role() = 'authenticated' );
-- 2. MODELS Bucket
-- Public Read
create policy "Public Access Models"
  on storage.objects for select
  using ( bucket_id = 'models' );
-- Admin Write
-- create policy "Authenticated Insert Models"
--   on storage.objects for insert
--   with check ( bucket_id = 'models' and auth.role() = 'authenticated' );
-- 3. BACKGROUNDS Bucket
-- Public Read
create policy "Public Access Backgrounds"
  on storage.objects for select
  using ( bucket_id = 'backgrounds' );
-- Admin Write
-- create policy "Authenticated Insert Backgrounds"
--   on storage.objects for insert
--   with check ( bucket_id = 'backgrounds' and auth.role() = 'authenticated' );
-- 4. PREVIEWS Bucket (User Generated Content)
-- Public Read (So admin/user can see it in order history)
create policy "Public Access Previews"
  on storage.objects for select
  using ( bucket_id = 'previews' );
-- Authenticated Upload (Users saving their designs) - Restricted to Images
create policy "Authenticated Insert Previews"
  on storage.objects for insert
  with check (
    bucket_id = 'previews' 
    and auth.role() = 'authenticated'
    and (name like '%.png' or name like '%.jpg' or name like '%.jpeg')
  );
-- 5. BRACELETS Bucket
-- Public Read
create policy "Public Access Bracelets"
  on storage.objects for select
  using ( bucket_id = 'bracelets' );
-- Admin Write
-- create policy "Authenticated Insert Bracelets"
--   on storage.objects for insert
--   with check ( bucket_id = 'bracelets' and auth.role() = 'authenticated' );
-- (Optional) Anomymous Uploads for Previews?
-- If you want guests to add to cart without login:
create policy "Guest Insert Previews"
  on storage.objects for insert
  with check (
    bucket_id = 'previews'
    and auth.role() = 'anon'
    and (name like '%.png' or name like '%.jpg' or name like '%.jpeg')
  );