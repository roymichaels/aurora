-- Migrate LifePilot data into Aurora

-- 1) Convert LifePilot boards to Aurora roadmaps
insert into public.roadmaps (id, user_id, title, description, color, status, position, created_at, updated_at)
select
  b.id,
  b.user_id,
  coalesce(b.title, b.name) as title,
  b.description,
  b.color,
  case when b.is_active then 'active' else 'paused' end as status,
  coalesce(b.position, row_number() over (partition by b.user_id order by b.created_at)) as position,
  coalesce(b.created_at, now()),
  coalesce(b.updated_at, now())
from lifepilot.boards b
on conflict (id) do nothing;

-- 2) Convert LifePilot tasks to Aurora tasks
insert into public.tasks (id, user_id, roadmap_id, title, description, due_at, status, position, created_at, updated_at, completed_at)
select
  t.id,
  t.user_id,
  t.board_id as roadmap_id,
  t.title,
  t.description,
  t.due_at,
  case when t.status in ('todo', 'doing', 'done') then t.status else 'todo' end as status,
  t.position,
  coalesce(t.created_at, now()),
  coalesce(t.updated_at, now()),
  t.completed_at
from lifepilot.tasks t
on conflict (id) do nothing;
