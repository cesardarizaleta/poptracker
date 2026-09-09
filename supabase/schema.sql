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

insert into public.materials (id, name, sku, category, available, reserved, reorder_point, campaign_id)
values
  ('display-pan', 'Exhibidor P.A.N. 65 años', 'POP-PAN-6501', 'Exhibición', 1840, 240, 400, 'pan-65'),
  ('cenefa-polar', 'Cenefa Cerveza Polar', 'POP-CP-3408', 'Visibilidad', 620, 120, 300, 'pan-65'),
  ('stand-maltin', 'Stand Maltín Polar fútbol', 'POP-MP-2119', 'Activación', 96, 64, 120, 'maltin-football'),
  ('hablador-pepsi', 'Hablador Pepsi lata', 'POP-PPS-7812', 'Promoción', 1240, 80, 250, 'pepsi-football')
on conflict (id) do nothing;
