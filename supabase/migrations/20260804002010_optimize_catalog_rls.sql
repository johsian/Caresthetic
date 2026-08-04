-- Keep the anonymous policy independent from the private administrator table.
-- PostgreSQL validates referenced table privileges even when an OR branch could
-- otherwise short-circuit, so anon must never evaluate the admin lookup.

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
