-- Esquema inicial para AfiliShop Starter

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  affiliate_param text default 'ref',
  affiliate_code text,
  logo_url text,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  price numeric(10,2),
  currency text default 'USD',
  image_url text,
  original_url text not null,
  affiliate_url text not null,
  store_id uuid references public.stores(id),
  category_id uuid references public.categories(id),
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  clicks_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_agent text,
  referrer text,
  device text,
  created_at timestamptz default now()
);

insert into public.categories (name, slug)
values
  ('Energía portátil', 'energia-portatil'),
  ('Televisores', 'televisores'),
  ('Celulares', 'celulares'),
  ('Computadoras', 'computadoras'),
  ('Herramientas', 'herramientas')
on conflict (slug) do nothing;
