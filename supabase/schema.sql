-- Control POP · esquema inicial para Supabase
-- Ejecuta este archivo completo desde Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'seller' check (role in ('seller', 'coordinator')),
  territory text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.campaigns (
  id text primary key,
  name text not null,
  brand text not null,
  status text not null check (status in ('Activa', 'En cierre', 'Planificada')),
  coverage integer not null default 0 check (coverage between 0 and 100),
  leads integer not null default 0 check (leads >= 0),
  revenue numeric not null default 0 check (revenue >= 0),
  delivered integer not null default 0 check (delivered >= 0),
  goal integer not null default 0 check (goal >= 0),
  image_url text,
  brief_image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.materials (
  id text primary key,
  name text not null,
  sku text not null unique,
  category text not null,
  available integer not null default 0 check (available >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= available),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  campaign_id text references public.campaigns(id),
  image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete restrict,
  campaign_id text not null references public.campaigns(id),
  material_id text not null references public.materials(id),
  quantity integer not null check (quantity > 0),
  location text not null,
  signature_captured boolean not null default false,
  signature_data text,
  status text not null default 'Pendiente' check (status in ('Pendiente', 'Verificado', 'Rechazado')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.campaigns add column if not exists image_url text;
alter table public.campaigns add column if not exists brief_image_url text;
alter table public.materials add column if not exists image_url text;

create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'coordinator'
  );
$$;

revoke all on function public.is_coordinator() from public;
grant execute on function public.is_coordinator() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, territory)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'territory'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.materials enable row level security;
alter table public.deliveries enable row level security;

revoke all on table public.profiles, public.campaigns, public.materials, public.deliveries from anon;
grant select on table public.profiles, public.campaigns, public.materials to authenticated;
grant select, insert on table public.deliveries to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_select_coordinators on public.profiles;
create policy profiles_select_coordinators
  on public.profiles for select to authenticated
  using (public.is_coordinator());

drop policy if exists campaigns_select_authenticated on public.campaigns;
create policy campaigns_select_authenticated
  on public.campaigns for select to authenticated
  using (true);

drop policy if exists materials_select_authenticated on public.materials;
create policy materials_select_authenticated
  on public.materials for select to authenticated
  using (true);

drop policy if exists deliveries_select_own on public.deliveries;
create policy deliveries_select_own
  on public.deliveries for select to authenticated
  using (seller_id = auth.uid());

drop policy if exists deliveries_select_coordinators on public.deliveries;
create policy deliveries_select_coordinators
  on public.deliveries for select to authenticated
  using (public.is_coordinator());

drop policy if exists deliveries_insert_own on public.deliveries;
create policy deliveries_insert_own
  on public.deliveries for insert to authenticated
  with check (seller_id = auth.uid() and signature_captured = true);

insert into public.campaigns (id, name, brand, status, coverage, leads, revenue, delivered, goal)
values
  ('pan-65', 'Aniversario 65 años', 'P.A.N.', 'Activa', 78, 146, 986400, 3240, 4200),
  ('maltin-football', 'Temporada fútbol', 'Maltín Polar', 'Activa', 63, 98, 612800, 1980, 3200),
  ('pepsi-football', 'La fiesta del fútbol', 'Pepsi', 'En cierre', 92, 142, 1264800, 4260, 4600)
on conflict (id) do nothing;

insert into public.campaigns (id, name, brand, status, coverage, leads, revenue, delivered, goal, image_url, brief_image_url)
values
  ('llaves-higiene', 'Plan de higiene de carritos', 'Las Llaves', 'Activa', 41, 0, 0, 420, 2000, '/product-images/llaves-carritos.png', '/product-images/plan-desinfeccion-llaves.png'),
  ('papel-lito', 'Visibilidad nacional', 'Papel Lito', 'Activa', 34, 0, 0, 79, 79, '/product-images/papel-lito.png', '/product-images/plan-papel-lito.png'),
  ('lqm-orla', 'Afiches Orla', 'La Que Manda', 'Activa', 28, 0, 0, 1600, 10000, '/product-images/sangria-la-que-manda.png', '/product-images/plan-afiches-orla-lqm.png'),
  ('multimarca-capuchones', 'Capuchones multimarca', 'Multimarca', 'Activa', 22, 0, 0, 40, 300, '/product-images/capuchones-multimarca.png', '/product-images/plan-capuchones-multimarca.png'),
  ('pepsi-vaso', 'Combo Pepsi + vaso Tornasol', 'Pepsi', 'Activa', 46, 0, 0, 3200, 20000, '/product-images/vasos-pepsi.png', '/product-images/plan-pepsi-vaso.png'),
  ('mavesa-combo', 'Combo de tapas con broches', 'Mavesa', 'Activa', 39, 0, 0, 8000, 50000, '/product-images/combo-mavesa-lock.png', '/product-images/plan-tapas-mavesa.png')
on conflict (id) do update set
  name = excluded.name,
  brand = excluded.brand,
  image_url = excluded.image_url,
  brief_image_url = excluded.brief_image_url;

insert into public.materials (id, name, sku, category, available, reserved, reorder_point, campaign_id)
values
  ('display-pan', 'Exhibidor P.A.N. 65 años', 'POP-PAN-6501', 'Exhibición', 1840, 240, 400, 'pan-65'),
  ('cenefa-polar', 'Cenefa Cerveza Polar', 'POP-CP-3408', 'Visibilidad', 620, 120, 300, 'pan-65'),
  ('stand-maltin', 'Stand Maltín Polar fútbol', 'POP-MP-2119', 'Activación', 96, 64, 120, 'maltin-football'),
  ('hablador-pepsi', 'Hablador Pepsi lata', 'POP-PPS-7812', 'Promoción', 1240, 80, 250, 'pepsi-football')
on conflict (id) do nothing;

insert into public.materials (id, name, sku, category, available, reserved, reorder_point, campaign_id, image_url)
values
  ('kit-llaves-carritos', 'Kit higiene de carritos Las Llaves', 'POP-LL-1509', 'Activación', 2000, 240, 400, 'llaves-higiene', '/product-images/llaves-carritos.png'),
  ('papel-lito-79', 'Papel Lito', 'POP-LITO-0079', 'Visibilidad', 79, 0, 20, 'papel-lito', '/product-images/papel-lito.png'),
  ('sangria-lqm', 'Sangría La Que Manda', 'POP-LQM-5001', 'Producto', 420, 80, 100, 'lqm-orla', '/product-images/sangria-la-que-manda.png'),
  ('afiche-orla-lqm', 'Afiche Orla La Que Manda', 'POP-LQM-10000', 'Visibilidad', 10000, 1600, 2000, 'lqm-orla', null),
  ('capuchon-multimarca', 'Capuchón multimarca', 'POP-CAP-0300', 'Visibilidad', 300, 40, 80, 'multimarca-capuchones', '/product-images/capuchones-multimarca.png'),
  ('vaso-tornasol-pepsi', 'Vaso Tornasol Pepsi', 'POP-PEP-VASO', 'Promoción', 20000, 3200, 4000, 'pepsi-vaso', '/product-images/vasos-pepsi.png'),
  ('combo-mavesa-lock', 'Combo Mavesa 500g + tapa Lock & Lock', 'POP-MAV-LOCK', 'Promoción', 50000, 8000, 10000, 'mavesa-combo', '/product-images/combo-mavesa-lock.png')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  available = excluded.available,
  reserved = excluded.reserved,
  reorder_point = excluded.reorder_point,
  campaign_id = excluded.campaign_id,
  image_url = excluded.image_url;

-- La ficha #6 pertenece al proyecto Afiches Orla, no al producto.
update public.materials
set image_url = null
where id = 'afiche-orla-lqm';

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists product_images_coordinator_insert on storage.objects;
create policy product_images_coordinator_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_coordinator());

drop policy if exists product_images_coordinator_update on storage.objects;
create policy product_images_coordinator_update
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_coordinator())
  with check (bucket_id = 'product-images' and public.is_coordinator());
