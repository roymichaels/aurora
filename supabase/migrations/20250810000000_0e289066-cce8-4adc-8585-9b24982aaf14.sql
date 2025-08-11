-- onboarding_answers, habits, master_plans

-- 1) onboarding_answers: store user responses during onboarding
create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

alter table public.onboarding_answers enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_answers' and policyname = 'onboarding_answers_select_own') then
    create policy "onboarding_answers_select_own" on public.onboarding_answers
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_answers' and policyname = 'onboarding_answers_insert_own') then
    create policy "onboarding_answers_insert_own" on public.onboarding_answers
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_answers' and policyname = 'onboarding_answers_update_own') then
    create policy "onboarding_answers_update_own" on public.onboarding_answers
      for update using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_answers' and policyname = 'onboarding_answers_delete_own') then
    create policy "onboarding_answers_delete_own" on public.onboarding_answers
      for delete using (auth.uid() = user_id);
  end if;
end$$;


-- 2) habits: track recurring user habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  frequency text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.habits enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'habits' and policyname = 'habits_select_own') then
    create policy "habits_select_own" on public.habits
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'habits' and policyname = 'habits_insert_own') then
    create policy "habits_insert_own" on public.habits
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'habits' and policyname = 'habits_update_own') then
    create policy "habits_update_own" on public.habits
      for update using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'habits' and policyname = 'habits_delete_own') then
    create policy "habits_delete_own" on public.habits
      for delete using (auth.uid() = user_id);
  end if;
end$$;

-- maintain updated_at
drop trigger if exists set_timestamp_habits on public.habits;
create trigger set_timestamp_habits
before update on public.habits
for each row execute function public.update_updated_at_column();


-- 3) master_plans: generated plans for users
create table if not exists public.master_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.master_plans enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'master_plans' and policyname = 'master_plans_select_own') then
    create policy "master_plans_select_own" on public.master_plans
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'master_plans' and policyname = 'master_plans_insert_own') then
    create policy "master_plans_insert_own" on public.master_plans
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'master_plans' and policyname = 'master_plans_update_own') then
    create policy "master_plans_update_own" on public.master_plans
      for update using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'master_plans' and policyname = 'master_plans_delete_own') then
    create policy "master_plans_delete_own" on public.master_plans
      for delete using (auth.uid() = user_id);
  end if;
end$$;

-- maintain updated_at
drop trigger if exists set_timestamp_master_plans on public.master_plans;
create trigger set_timestamp_master_plans
before update on public.master_plans
for each row execute function public.update_updated_at_column();
