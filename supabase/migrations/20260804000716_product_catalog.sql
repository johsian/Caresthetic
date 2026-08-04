-- Caresthetic TiZO product catalog.
-- Public visitors can only read published products. Authenticated users must
-- also be listed in public.admin_users before they can manage the catalog.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default pg_catalog.timezone('utc'::text, pg_catalog.now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null
    check (char_length(trim(name)) between 1 and 120),
  short_description text not null default '',
  description text not null default '',
  price_cents integer not null default 0
    check (price_cents >= 0),
  currency text not null default 'USD'
    check (currency ~ '^[A-Z]{3}$'),
  inventory_count integer
    check (inventory_count is null or inventory_count >= 0),
  cover_image_url text not null default '',
  features text[] not null default '{}',
  active boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default pg_catalog.timezone('utc'::text, pg_catalog.now()),
  updated_at timestamptz not null default pg_catalog.timezone('utc'::text, pg_catalog.now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now());
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.products enable row level security;

drop policy if exists "Admins can read their own membership" on public.admin_users;
create policy "Admins can read their own membership"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Published products are public" on public.products;
create policy "Published products are public"
on public.products
for select
to anon
using (active);

drop policy if exists "Authenticated users can read products" on public.products;
create policy "Authenticated users can read products"
on public.products
for select
to authenticated
using (
  active or exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can create products" on public.products;
create policy "Admins can create products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  )
);

-- New Supabase projects no longer expose SQL-created tables automatically.
-- These grants expose only the operations that RLS is designed to authorize.
grant usage on schema public to anon, authenticated;
revoke all on table public.admin_users from anon;
grant select on table public.admin_users to authenticated;
grant select on table public.products to anon;
grant select, insert, update, delete on table public.products to authenticated;

insert into public.products (
  slug,
  name,
  short_description,
  description,
  price_cents,
  currency,
  inventory_count,
  cover_image_url,
  features,
  active,
  featured,
  sort_order
)
values
  (
    'tizo3-tinted',
    'TiZO3 Tinted',
    'Tinted Primer · SPF 40',
    'Primer y protector solar mineral con tinte universal y acabado mate transparente.',
    0,
    'USD',
    null,
    '/tizo-assets/images/tizo3-tube.png',
    array['Broad Spectrum SPF 40, PA+++', 'Óxidos de titanio y zinc', 'Resistente al agua por 80 minutos'],
    true,
    true,
    10
  ),
  (
    'tizo2-non-tinted',
    'TiZO2 Non-Tinted',
    'Non-Tinted Primer · SPF 40',
    'Primer y protector solar mineral sin tinte, invisible y libre de brillo.',
    0,
    'USD',
    null,
    '/tizo-assets/images/tizo2-tube.png',
    array['Broad Spectrum SPF 40, PA++++', 'Óxidos de titanio y zinc', 'Resistente al agua por 80 minutos'],
    true,
    true,
    20
  ),
  (
    'ultra-zinc-non-tinted',
    'Ultra Zinc Non-Tinted',
    'Body & Face · SPF 40',
    'Protección mineral de amplio espectro para cuerpo y rostro con 20% óxido de zinc.',
    0,
    'USD',
    null,
    '/tizo-assets/images/ultra-zinc-nontinted-tube.png',
    array['Broad Spectrum SPF 40', '20% óxido de zinc', 'Resistente al agua por 40 minutos'],
    true,
    false,
    30
  ),
  (
    'ultra-zinc-tinted',
    'Ultra Zinc Tinted',
    'Body & Face · SPF 40',
    'Protección mineral para cuerpo y rostro con tinte que ayuda a unificar el tono.',
    0,
    'USD',
    null,
    '/tizo-assets/images/ultra-zinc-tinted-tube.png',
    array['Broad Spectrum SPF 40', '20% óxido de zinc', 'Resistente al agua por 40 minutos'],
    true,
    false,
    40
  ),
  (
    'eye-renewal',
    'Eye Renewal',
    'Firming Eye Repair · SPF 20',
    'Protección mineral e hidratación formuladas para el área delicada del contorno de ojos.',
    0,
    'USD',
    null,
    '/tizo-assets/images/eye-renewal-tube.png',
    array['Broad Spectrum SPF 20', 'Péptidos y mezcla botánica', 'Sin tinte'],
    true,
    false,
    50
  ),
  (
    'am-replenish',
    'AM Replenish',
    'Moisturizing Sunscreen · SPF 40',
    'Protección mineral hidratante con ceramidas para ayudar a restaurar la barrera cutánea.',
    0,
    'USD',
    null,
    '/tizo-assets/images/am-replenish-tube.png',
    array['Broad Spectrum SPF 40', 'Ceramidas y antioxidantes C y E', 'Sin tinte'],
    true,
    false,
    60
  )
on conflict (slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  cover_image_url = excluded.cover_image_url,
  features = excluded.features,
  sort_order = excluded.sort_order;
