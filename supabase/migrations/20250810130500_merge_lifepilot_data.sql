-- Migration: merge LifePilot data into Aurora schema
-- Assumes LifePilot tables exist in schema lifepilot (projects, tasks, moments)

-- 1) Projects -> roadmaps
insert into public.roadmaps (id, user_id, title, description, status, position, created_at, updated_at)
select p.id,
       p.user_id,
       p.title,
       p.description,
       coalesce(p.status, 'active'),
       p.position,
       p.created_at,
       p.updated_at
from lifepilot.projects p
on conflict (id) do nothing;

-- 2) Tasks -> tasks (map project_id to roadmap_id)
insert into public.tasks (id, user_id, roadmap_id, title, description, due_at, status, position, created_at, updated_at, completed_at)
select t.id,
       t.user_id,
       t.project_id as roadmap_id,
       t.title,
       t.description,
       t.due_at,
       t.status,
       t.position,
       t.created_at,
       t.updated_at,
       t.completed_at
from lifepilot.tasks t
on conflict (id) do nothing;

-- 3) Moments -> moments
insert into public.moments (id, user_id, type, content, storage_path, state, folder, tags, linked_goal_id, visibility, created_at, updated_at)
select m.id,
       m.user_id,
       m.type,
       m.content,
       m.storage_path,
       m.state,
       m.folder,
       m.tags,
       m.linked_goal_id,
       m.visibility,
       m.created_at,
       m.updated_at
from lifepilot.moments m
on conflict (id) do nothing;

-- Optionally drop LifePilot schema after verifying data
-- drop schema lifepilot cascade;
