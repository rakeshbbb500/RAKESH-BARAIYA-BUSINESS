-- RAKESH BARAIYA BUSINESS: secure customer ownership and client payment tracking
alter table public.customers
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists payment_status text not null default 'Pending',
  add column if not exists payment_completed_at timestamptz;

alter table public.clients_data
  add column if not exists payment_status text not null default 'Pending',
  add column if not exists payment_amount numeric(12,2) not null default 0,
  add column if not exists payment_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_data_payment_status_check'
      and conrelid = 'public.clients_data'::regclass
  ) then
    alter table public.clients_data add constraint clients_data_payment_status_check
      check (payment_status in ('Pending', 'Complete'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'clients_data_payment_amount_nonnegative'
      and conrelid = 'public.clients_data'::regclass
  ) then
    alter table public.clients_data add constraint clients_data_payment_amount_nonnegative
      check (payment_amount >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'customers_payment_status_check'
      and conrelid = 'public.customers'::regclass
  ) then
    alter table public.customers add constraint customers_payment_status_check
      check (payment_status in ('Pending', 'Complete'));
  end if;
end $$;

drop policy if exists "Anon users can view customers" on public.customers;
drop policy if exists "Anon users can insert customers" on public.customers;
drop policy if exists "Anon users can update customers" on public.customers;
drop policy if exists "Anon users can delete customers" on public.customers;
drop policy if exists "Authenticated users can view customers" on public.customers;
drop policy if exists "Authenticated users can insert customers" on public.customers;
drop policy if exists "Authenticated users can update customers" on public.customers;
drop policy if exists "Authenticated users can delete customers" on public.customers;

create policy "Users can view own customers" on public.customers
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own customers" on public.customers
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own customers" on public.customers
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own customers" on public.customers
  for delete to authenticated using ((select auth.uid()) = user_id);
