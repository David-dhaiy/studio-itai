-- ============================================================
-- Studio Itai — Initial Schema
-- Migration: 001_initial_schema
-- ============================================================

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

create table trainers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text,
  phone       text,
  created_at  timestamptz default now()
);

create table clients (
  id              uuid primary key default gen_random_uuid(),
  trainer_id      uuid not null references trainers(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  full_name       text not null,
  phone           text,
  email           text,
  goal            text not null,
  fitness_level   text,
  limitations     text,
  available_days  text[],
  status          text default 'active',
  created_at      timestamptz default now()
);

create table workouts (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  trainer_id  uuid not null references trainers(id) on delete cascade,
  title       text not null,
  goal        text,
  notes       text,
  source      text default 'manual',
  created_at  timestamptz default now()
);

create table workout_days (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references workouts(id) on delete cascade,
  day_of_week text not null,
  title       text not null,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

create table exercises (
  id              uuid primary key default gen_random_uuid(),
  workout_day_id  uuid not null references workout_days(id) on delete cascade,
  name            text not null,
  sets            int,
  reps            text,
  rest_seconds    int,
  instructions    text,
  sort_order      int default 0,
  created_at      timestamptz default now()
);

create table workout_logs (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  workout_day_id  uuid not null references workout_days(id) on delete cascade,
  completed_at    timestamptz default now(),
  feedback        text,
  difficulty      int,
  created_at      timestamptz default now()
);

create table chat_messages (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  trainer_id   uuid not null references trainers(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant', 'system')),
  content      text not null,
  safety_flag  boolean default false,
  created_at   timestamptz default now()
);

create table program_templates (
  id             uuid primary key default gen_random_uuid(),
  trainer_id     uuid not null references trainers(id) on delete cascade,
  title          text not null,
  goal           text,
  level          text,
  description    text,
  template_json  jsonb,
  created_at     timestamptz default now()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

create index on clients(trainer_id);
create index on clients(user_id);
create index on workouts(client_id);
create index on workouts(trainer_id);
create index on workout_days(workout_id);
create index on exercises(workout_day_id);
create index on workout_logs(client_id);
create index on chat_messages(client_id);
create index on program_templates(trainer_id);

-- ─────────────────────────────────────────
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ─────────────────────────────────────────

-- Returns the trainers.id for the currently authenticated user (null if not a trainer)
create or replace function current_trainer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from trainers where user_id = auth.uid() limit 1;
$$;

-- Returns the clients.id for the currently authenticated user (null if not a client)
create or replace function current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from clients where user_id = auth.uid() limit 1;
$$;

-- Returns true if the current user is the trainer of the given client
create or replace function is_trainer_for_client(client_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from clients c
    join trainers t on t.id = c.trainer_id
    where c.id = client_uuid
      and t.user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table trainers           enable row level security;
alter table clients            enable row level security;
alter table workouts           enable row level security;
alter table workout_days       enable row level security;
alter table exercises          enable row level security;
alter table workout_logs       enable row level security;
alter table chat_messages      enable row level security;
alter table program_templates  enable row level security;

-- ── trainers ──────────────────────────────
-- A trainer can only see and manage their own profile
create policy "trainer: select own"   on trainers for select using (user_id = auth.uid());
create policy "trainer: insert own"   on trainers for insert with check (user_id = auth.uid());
create policy "trainer: update own"   on trainers for update using (user_id = auth.uid());
create policy "trainer: delete own"   on trainers for delete using (user_id = auth.uid());

-- ── clients ───────────────────────────────
-- Trainer manages all their own clients; client reads only their own record
create policy "trainer: select own clients"  on clients for select  using (trainer_id = current_trainer_id());
create policy "trainer: insert own clients"  on clients for insert  with check (trainer_id = current_trainer_id());
create policy "trainer: update own clients"  on clients for update  using (trainer_id = current_trainer_id());
create policy "trainer: delete own clients"  on clients for delete  using (trainer_id = current_trainer_id());
create policy "client: select own record"    on clients for select  using (user_id = auth.uid());

-- ── workouts ──────────────────────────────
create policy "trainer: select own workouts"  on workouts for select  using (trainer_id = current_trainer_id());
create policy "trainer: insert own workouts"  on workouts for insert  with check (trainer_id = current_trainer_id());
create policy "trainer: update own workouts"  on workouts for update  using (trainer_id = current_trainer_id());
create policy "trainer: delete own workouts"  on workouts for delete  using (trainer_id = current_trainer_id());
create policy "client: select own workouts"   on workouts for select  using (client_id = current_client_id());

-- ── workout_days ──────────────────────────
-- Access is granted through the parent workout's ownership
create policy "trainer: select workout_days"  on workout_days for select  using (exists (select 1 from workouts w where w.id = workout_id and w.trainer_id = current_trainer_id()));
create policy "trainer: insert workout_days"  on workout_days for insert  with check (exists (select 1 from workouts w where w.id = workout_id and w.trainer_id = current_trainer_id()));
create policy "trainer: update workout_days"  on workout_days for update  using (exists (select 1 from workouts w where w.id = workout_id and w.trainer_id = current_trainer_id()));
create policy "trainer: delete workout_days"  on workout_days for delete  using (exists (select 1 from workouts w where w.id = workout_id and w.trainer_id = current_trainer_id()));
create policy "client: select workout_days"   on workout_days for select  using (exists (select 1 from workouts w where w.id = workout_id and w.client_id = current_client_id()));

-- ── exercises ─────────────────────────────
-- Access through workout_day → workout ownership
create policy "trainer: select exercises"  on exercises for select  using (exists (select 1 from workout_days wd join workouts w on w.id = wd.workout_id where wd.id = workout_day_id and w.trainer_id = current_trainer_id()));
create policy "trainer: insert exercises"  on exercises for insert  with check (exists (select 1 from workout_days wd join workouts w on w.id = wd.workout_id where wd.id = workout_day_id and w.trainer_id = current_trainer_id()));
create policy "trainer: update exercises"  on exercises for update  using (exists (select 1 from workout_days wd join workouts w on w.id = wd.workout_id where wd.id = workout_day_id and w.trainer_id = current_trainer_id()));
create policy "trainer: delete exercises"  on exercises for delete  using (exists (select 1 from workout_days wd join workouts w on w.id = wd.workout_id where wd.id = workout_day_id and w.trainer_id = current_trainer_id()));
create policy "client: select exercises"   on exercises for select  using (exists (select 1 from workout_days wd join workouts w on w.id = wd.workout_id where wd.id = workout_day_id and w.client_id = current_client_id()));

-- ── workout_logs ──────────────────────────
create policy "client: select own logs"   on workout_logs for select  using (client_id = current_client_id());
create policy "client: insert own logs"   on workout_logs for insert  with check (client_id = current_client_id());
create policy "trainer: select client logs" on workout_logs for select  using (is_trainer_for_client(client_id));

-- ── chat_messages ─────────────────────────
create policy "client: select own messages"   on chat_messages for select  using (client_id = current_client_id());
create policy "client: insert own messages"   on chat_messages for insert  with check (client_id = current_client_id());
create policy "trainer: select chat messages" on chat_messages for select  using (trainer_id = current_trainer_id());
create policy "trainer: insert chat messages" on chat_messages for insert  with check (trainer_id = current_trainer_id());

-- ── program_templates ─────────────────────
create policy "trainer: select own templates"  on program_templates for select  using (trainer_id = current_trainer_id());
create policy "trainer: insert own templates"  on program_templates for insert  with check (trainer_id = current_trainer_id());
create policy "trainer: update own templates"  on program_templates for update  using (trainer_id = current_trainer_id());
create policy "trainer: delete own templates"  on program_templates for delete  using (trainer_id = current_trainer_id());
