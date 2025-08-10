-- Create legacy LifePilot schema for data migration
create schema if not exists lifepilot;

-- Legacy boards table
create table if not exists lifepilot.boards (
  id uuid primary key,
  user_id uuid not null,
  name text,
  title text,
  description text,
  color text,
  is_active boolean default false,
  position integer,
  created_at timestamptz,
  updated_at timestamptz
);

-- Legacy tasks table
create table if not exists lifepilot.tasks (
  id uuid primary key,
  user_id uuid not null,
  board_id uuid not null references lifepilot.boards(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  status text,
  position integer,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz
);
