-- Missions and related tables

-- 1) missions: top-level missions
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scope text not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.missions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'missions' and policyname = 'missions_select_own') then
    create policy "missions_select_own" on public.missions
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'missions' and policyname = 'missions_insert_own') then
    create policy "missions_insert_own" on public.missions
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'missions' and policyname = 'missions_update_own') then
    create policy "missions_update_own" on public.missions
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'missions' and policyname = 'missions_delete_own') then
    create policy "missions_delete_own" on public.missions
      for delete using (auth.uid() = user_id);
  end if;
end$$;

drop trigger if exists set_timestamp_missions on public.missions;
create trigger set_timestamp_missions
before update on public.missions
for each row execute function public.update_updated_at_column();

-- 2) goals: goals associated with missions
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mission_id uuid references public.missions(id) on delete cascade,
  title text not null,
  description text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'goals' and policyname = 'goals_select_own') then
    create policy "goals_select_own" on public.goals
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'goals' and policyname = 'goals_insert_own') then
    create policy "goals_insert_own" on public.goals
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'goals' and policyname = 'goals_update_own') then
    create policy "goals_update_own" on public.goals
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'goals' and policyname = 'goals_delete_own') then
    create policy "goals_delete_own" on public.goals
      for delete using (auth.uid() = user_id);
  end if;
end$$;

drop trigger if exists set_timestamp_goals on public.goals;
create trigger set_timestamp_goals
before update on public.goals
for each row execute function public.update_updated_at_column();

-- 3) kpis: key performance indicators for goals
create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  goal_id uuid references public.goals(id) on delete cascade,
  name text not null,
  target numeric,
  current numeric,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kpis enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpis' and policyname = 'kpis_select_own') then
    create policy "kpis_select_own" on public.kpis
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpis' and policyname = 'kpis_insert_own') then
    create policy "kpis_insert_own" on public.kpis
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpis' and policyname = 'kpis_update_own') then
    create policy "kpis_update_own" on public.kpis
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kpis' and policyname = 'kpis_delete_own') then
    create policy "kpis_delete_own" on public.kpis
      for delete using (auth.uid() = user_id);
  end if;
end$$;

drop trigger if exists set_timestamp_kpis on public.kpis;
create trigger set_timestamp_kpis
before update on public.kpis
for each row execute function public.update_updated_at_column();

-- 4) milestones: milestones for goals
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  goal_id uuid references public.goals(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.milestones enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'milestones' and policyname = 'milestones_select_own') then
    create policy "milestones_select_own" on public.milestones
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'milestones' and policyname = 'milestones_insert_own') then
    create policy "milestones_insert_own" on public.milestones
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'milestones' and policyname = 'milestones_update_own') then
    create policy "milestones_update_own" on public.milestones
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'milestones' and policyname = 'milestones_delete_own') then
    create policy "milestones_delete_own" on public.milestones
      for delete using (auth.uid() = user_id);
  end if;
end$$;

drop trigger if exists set_timestamp_milestones on public.milestones;
create trigger set_timestamp_milestones
before update on public.milestones
for each row execute function public.update_updated_at_column();

-- 5) sprints: sprints within milestones
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  milestone_id uuid references public.milestones(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sprints enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sprints' and policyname = 'sprints_select_own') then
    create policy "sprints_select_own" on public.sprints
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sprints' and policyname = 'sprints_insert_own') then
    create policy "sprints_insert_own" on public.sprints
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sprints' and policyname = 'sprints_update_own') then
    create policy "sprints_update_own" on public.sprints
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sprints' and policyname = 'sprints_delete_own') then
    create policy "sprints_delete_own" on public.sprints
      for delete using (auth.uid() = user_id);
  end if;
end$$;

drop trigger if exists set_timestamp_sprints on public.sprints;
create trigger set_timestamp_sprints
before update on public.sprints
for each row execute function public.update_updated_at_column();

-- 6) tasks: tasks within sprints
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  sprint_id uuid references public.sprints(id) on delete cascade,
  title text not null,
  description text,
  status text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_select_own') then
    create policy "tasks_select_own" on public.tasks
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_insert_own') then
    create policy "tasks_insert_own" on public.tasks
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_update_own') then
    create policy "tasks_update_own" on public.tasks
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_delete_own') then
    create policy "tasks_delete_own" on public.tasks
      for delete using (auth.uid() = user_id);
  end if;
end$$;

drop trigger if exists set_timestamp_tasks on public.tasks;
create trigger set_timestamp_tasks
before update on public.tasks
for each row execute function public.update_updated_at_column();

-- 7) facts: facts collected for tasks
create table if not exists public.facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  task_id uuid references public.tasks(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.facts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'facts' and policyname = 'facts_select_own') then
    create policy "facts_select_own" on public.facts
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'facts' and policyname = 'facts_insert_own') then
    create policy "facts_insert_own" on public.facts
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'facts' and policyname = 'facts_update_own') then
    create policy "facts_update_own" on public.facts
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'facts' and policyname = 'facts_delete_own') then
    create policy "facts_delete_own" on public.facts
      for delete using (auth.uid() = user_id);
  end if;
end$$;
