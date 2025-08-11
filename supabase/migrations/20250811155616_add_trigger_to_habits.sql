-- Add trigger column to habits
alter table public.habits add column if not exists trigger text;
