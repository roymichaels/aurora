-- KPI records for tracking progress over time
create table if not exists public.kpi_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mission_id uuid references public.missions(id) on delete cascade,
  kpi_id uuid references public.kpis(id) on delete cascade,
  value numeric not null,
  recorded_at timestamptz not null default now(),
  source text,
  created_at timestamptz not null default now()
);

alter table public.kpi_records enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_records' and policyname = 'kpi_records_select_own') then
    create policy "kpi_records_select_own" on public.kpi_records
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_records' and policyname = 'kpi_records_insert_own') then
    create policy "kpi_records_insert_own" on public.kpi_records
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_records' and policyname = 'kpi_records_update_own') then
    create policy "kpi_records_update_own" on public.kpi_records
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpi_records' and policyname = 'kpi_records_delete_own') then
    create policy "kpi_records_delete_own" on public.kpi_records
      for delete using (auth.uid() = user_id);
  end if;
end$$;
