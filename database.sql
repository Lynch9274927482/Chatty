
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  username text not null
    check (char_length(username) between 2 and 24),
  content text not null
    check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

grant select, insert on public.messages to anon;

create policy "Anyone can read messages"
on public.messages
for select
to anon
using (true);

create policy "Anyone can send messages"
on public.messages
for insert
to anon
with check (
  char_length(username) between 2 and 24
  and char_length(content) between 1 and 1000
);

-- Enable live database events for the chat.
alter publication supabase_realtime
add table public.messages;
