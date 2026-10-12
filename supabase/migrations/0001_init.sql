-- Cadre support assistant: initial schema.
-- RLS is on with no policies, so only the service role (server-side) can read or write.

create table handoffs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id text not null,
  name text not null,
  email text not null,
  company text,
  intent text not null check (intent in ('sales', 'client_support', 'security', 'other')),
  summary text not null
);

create table knowledge_gaps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id text not null,
  question text not null,
  topic text
);

create table conversation_turns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id text not null,
  user_text text not null,
  reply_text text not null,
  tool_calls text[] not null default '{}',
  model text not null,
  prompt_hash text not null,
  input_tokens int not null,
  output_tokens int not null,
  cost_usd numeric(10, 6) not null default 0,
  latency_ms int not null
);

create index conversation_turns_created_at_idx on conversation_turns (created_at);

create table rate_counters (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

alter table handoffs enable row level security;
alter table knowledge_gaps enable row level security;
alter table conversation_turns enable row level security;
alter table rate_counters enable row level security;

-- Atomic increment of the counter for p_key in the current fixed window; returns the new count.
create function bump_rate(p_key text, p_window_seconds int) returns int
language sql
security definer
set search_path = public
as $$
  insert into rate_counters as rc (key, window_start, count)
  values (
    p_key,
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds),
    1
  )
  on conflict (key, window_start) do update set count = rc.count + 1
  returning rc.count;
$$;

revoke execute on function bump_rate(text, int) from public, anon, authenticated;
