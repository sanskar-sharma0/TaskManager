-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  total_points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- TASKS TABLE
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  assigned_by uuid references public.profiles(id) not null,
  assigned_to uuid references public.profiles(id) not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'in_review', 'completed', 'done', 'delayed')),
  deadline timestamp with time zone not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for tasks
alter table public.tasks enable row level security;
create policy "Tasks are viewable by everyone in the organization"
  on tasks for select
  using ( true ); -- In a real app, restrict by org/tenant.

create policy "Users can insert tasks"
  on tasks for insert
  with check ( auth.uid() != null );

create policy "Users can update tasks"
  on tasks for update
  using ( auth.uid() != null );

-- PERFORMANCE LOGS TABLE
create table if not exists public.performance_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  task_id uuid references public.tasks(id) not null,
  points_change integer not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for performance_logs
alter table public.performance_logs enable row level security;
create policy "Logs are viewable by everyone"
  on performance_logs for select
  using ( true );

create policy "Users can insert logs"
  on performance_logs for insert
  with check ( auth.uid() != null );

-- TRIGGER: AUTO CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRIGGER: UPDATE TOTAL POINTS ON NEW LOG
create or replace function public.update_total_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set total_points = total_points + new.points_change
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists on_performance_log_insert on public.performance_logs;
create trigger on_performance_log_insert
  after insert on public.performance_logs
  for each row execute procedure public.update_total_points();

-- TASK ACTIVITY LOGS TABLE
create table if not exists public.task_activity_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id),
  action_type text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for task_activity_logs
alter table public.task_activity_logs enable row level security;
create policy "Users can view logs for tasks they are involved in"
  on task_activity_logs for select
  using (
    exists (
      select 1 from tasks 
      where tasks.id = task_activity_logs.task_id 
      and (tasks.assigned_by = auth.uid() or tasks.assigned_to = auth.uid())
    )
  );

-- TRIGGER: AUTO LOG TASK ACTIVITY
create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null and TG_OP = 'INSERT' then
    v_user_id := NEW.assigned_by;
  end if;

  if TG_OP = 'INSERT' then
    insert into public.task_activity_logs (task_id, user_id, action_type, new_value)
    values (NEW.id, v_user_id, 'created', row_to_json(NEW)::jsonb);
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if row_to_json(OLD)::jsonb != row_to_json(NEW)::jsonb then
      insert into public.task_activity_logs (task_id, user_id, action_type, old_value, new_value)
      values (NEW.id, v_user_id, 'updated', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    end if;
    return NEW;
  end if;
  return null;
end;
$$;

drop trigger if exists on_task_created_or_updated on public.tasks;
create trigger on_task_created_or_updated
  after insert or update on public.tasks
  for each row execute procedure public.log_task_activity();
