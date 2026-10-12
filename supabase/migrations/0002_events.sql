-- Typed backend events (D17): guard checks, tool calls, saved handoffs, gaps, turn cost, errors.
-- Payload never carries contact details. RLS on with no policies: service role only.
create table events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id text not null,
  type text not null check (type in ('guard_checked', 'tool_called', 'handoff_saved', 'gap_logged', 'turn_completed', 'error')),
  payload jsonb not null default '{}'
);

create index events_conversation_created_idx on events (conversation_id, created_at);
create index events_created_at_idx on events (created_at);

alter table events enable row level security;
