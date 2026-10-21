-- Add the client work date and optional notes fields.
-- This migration was applied to Supabase project bgakkkbavdtcndylpwgd.
alter table public.clients_data
  add column if not exists client_date date not null default current_date,
  add column if not exists notes text;
