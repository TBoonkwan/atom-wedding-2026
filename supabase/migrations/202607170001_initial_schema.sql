create extension if not exists pgcrypto;

create type public.rsvp_status as enum ('pending', 'accepted', 'maybe', 'rejected');
create type public.beer_preference as enum ('ipa', 'lager', 'wheat', 'none');

create table public.event_config (
  id text primary key,
  event_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  soft_deadline timestamptz not null,
  edit_cutoff timestamptz not null,
  venue_name text not null,
  venue_address text not null,
  map_url text not null,
  check_in_enabled boolean not null default false,
  check_in_code text,
  updated_at timestamptz not null default now()
);

insert into public.event_config (
  id, event_name, starts_at, ends_at, soft_deadline, edit_cutoff,
  venue_name, venue_address, map_url
) values (
  'np-wedding-2026',
  'พิธีมงคลสมรส ณัฐพล & เพ็ญพิสุทธิ์',
  '2026-12-04 15:00:00+07',
  '2026-12-04 22:00:00+07',
  '2026-11-27 23:59:59+07',
  '2026-12-04 15:00:00+07',
  'Celebce Venue',
  'เลขที่ 58 หมู่ 8 ประชาชื่น–ปากเกร็ด ซอย 3 ตำบลบางตลาด อำเภอปากเกร็ด นนทบุรี 11120',
  'https://share.google/m3zGggUxfeZ9WIHUw'
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique check (char_length(invite_code) between 6 and 12),
  token_hash text not null unique check (char_length(token_hash) = 64),
  display_name text not null,
  contact_name text not null,
  phone text,
  email text,
  host_notes text,
  status public.rsvp_status not null default 'pending',
  adult_count integer not null default 0 check (adult_count between 0 and 300),
  child_count integer not null default 0 check (child_count between 0 and 300),
  child_seat_count integer not null default 0 check (child_seat_count between 0 and child_count),
  dietary_notes text,
  accessibility_notes text,
  reason text,
  beer_preference public.beer_preference not null default 'none',
  song_request text,
  late_response boolean not null default false,
  checked_in_count integer not null default 0 check (checked_in_count between 0 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitations_status_idx on public.invitations (status);
create index invitations_display_name_idx on public.invitations (display_name);

create table public.rsvp_history (
  id bigint generated always as identity primary key,
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  snapshot jsonb not null,
  source text not null check (source in ('guest', 'host')),
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.wedding_tables (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check (number between 1 and 30),
  capacity integer not null default 10 check (capacity > 0),
  revealed boolean not null default false
);

insert into public.wedding_tables (number)
select generate_series(1, 30);

create table public.table_assignments (
  id bigint generated always as identity primary key,
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  table_id uuid not null references public.wedding_tables(id) on delete cascade,
  seat_count integer not null check (seat_count between 1 and 300),
  unique (invitation_id, table_id)
);

create table public.check_ins (
  id bigint generated always as identity primary key,
  invitation_id uuid not null unique references public.invitations(id) on delete cascade,
  attendee_count integer not null check (attendee_count between 1 and 300),
  checked_in_at timestamptz not null default now(),
  corrected_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.host_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.host_audit_log (
  id bigint generated always as identity primary key,
  host_user_id uuid not null references public.host_users(user_id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.rate_limit_buckets (
  key_hash text primary key check (char_length(key_hash) = 64),
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null
);
create index rate_limit_buckets_window_idx on public.rate_limit_buckets (window_started_at);

create or replace function public.consume_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  resulting_count integer;
begin
  delete from public.rate_limit_buckets
  where window_started_at < now() - interval '1 day';

  insert into public.rate_limit_buckets (key_hash, request_count, window_started_at)
  values (p_key_hash, 1, now())
  on conflict (key_hash) do update
  set
    request_count = case
      when rate_limit_buckets.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else rate_limit_buckets.request_count + 1
    end,
    window_started_at = case
      when rate_limit_buckets.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else rate_limit_buckets.window_started_at
    end
  returning request_count into resulting_count;
  return resulting_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.submit_rsvp_transaction(
  p_invitation_id uuid,
  p_fields jsonb
) returns setof public.invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_party_size integer;
  assigned_seats integer;
begin
  update public.invitations
  set
    status = (p_fields->>'status')::public.rsvp_status,
    adult_count = (p_fields->>'adult_count')::integer,
    child_count = (p_fields->>'child_count')::integer,
    child_seat_count = (p_fields->>'child_seat_count')::integer,
    dietary_notes = p_fields->>'dietary_notes',
    accessibility_notes = p_fields->>'accessibility_notes',
    beer_preference = (p_fields->>'beer_preference')::public.beer_preference,
    song_request = p_fields->>'song_request',
    reason = p_fields->>'reason',
    late_response = (p_fields->>'late_response')::boolean,
    updated_at = now()
  where id = p_invitation_id;
  if not found then raise exception 'Invitation not found'; end if;

  accepted_party_size := case
    when (p_fields->>'status') = 'accepted'
      then (p_fields->>'adult_count')::integer + (p_fields->>'child_count')::integer
    else 0
  end;
  select coalesce(sum(seat_count), 0) into assigned_seats
  from public.table_assignments where invitation_id = p_invitation_id;
  if assigned_seats > accepted_party_size then
    delete from public.table_assignments where invitation_id = p_invitation_id;
    p_fields := p_fields || jsonb_build_object('table_assignments_cleared', true);
  end if;

  insert into public.rsvp_history (invitation_id, snapshot, source)
  values (p_invitation_id, p_fields, 'guest');
  return query select * from public.invitations where id = p_invitation_id;
end;
$$;

create or replace function public.set_table_assignment_transaction(
  p_invitation_id uuid,
  p_table_id uuid,
  p_seat_count integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_status public.rsvp_status;
  accepted_party_size integer;
  assigned_elsewhere integer;
begin
  select status, adult_count + child_count
  into invitation_status, accepted_party_size
  from public.invitations
  where id = p_invitation_id
  for update;
  if not found then raise exception 'Invitation not found'; end if;
  if invitation_status <> 'accepted' then raise exception 'Invitation is not accepted'; end if;

  select coalesce(sum(seat_count), 0) into assigned_elsewhere
  from public.table_assignments
  where invitation_id = p_invitation_id and table_id <> p_table_id;
  if assigned_elsewhere + p_seat_count > accepted_party_size then
    raise exception 'Assigned seats exceed accepted party size';
  end if;

  insert into public.table_assignments (invitation_id, table_id, seat_count)
  values (p_invitation_id, p_table_id, p_seat_count)
  on conflict (invitation_id, table_id) do update set seat_count = excluded.seat_count;
end;
$$;

create or replace function public.apply_check_in_transaction(
  p_invitation_id uuid,
  p_attendee_count integer,
  p_checked_in_at timestamptz,
  p_corrected_by uuid default null
) returns setof public.invitations
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.check_ins (
    invitation_id, attendee_count, checked_in_at, corrected_by, updated_at
  ) values (
    p_invitation_id, p_attendee_count, p_checked_in_at, p_corrected_by, now()
  )
  on conflict (invitation_id) do update set
    attendee_count = excluded.attendee_count,
    checked_in_at = excluded.checked_in_at,
    corrected_by = excluded.corrected_by,
    updated_at = now();

  update public.invitations
  set checked_in_count = p_attendee_count, updated_at = now()
  where id = p_invitation_id;
  if not found then raise exception 'Invitation not found'; end if;
  return query select * from public.invitations where id = p_invitation_id;
end;
$$;

create or replace function public.cancel_check_in_transaction(
  p_invitation_id uuid
) returns setof public.invitations
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.check_ins where invitation_id = p_invitation_id;
  update public.invitations
  set checked_in_count = 0, updated_at = now()
  where id = p_invitation_id;
  if not found then raise exception 'Invitation not found'; end if;
  return query select * from public.invitations where id = p_invitation_id;
end;
$$;

revoke all on function public.submit_rsvp_transaction(uuid, jsonb) from public;
revoke all on function public.set_table_assignment_transaction(uuid, uuid, integer) from public;
revoke all on function public.apply_check_in_transaction(uuid, integer, timestamptz, uuid) from public;
revoke all on function public.cancel_check_in_transaction(uuid) from public;
grant execute on function public.submit_rsvp_transaction(uuid, jsonb) to service_role;
grant execute on function public.set_table_assignment_transaction(uuid, uuid, integer) to service_role;
grant execute on function public.apply_check_in_transaction(uuid, integer, timestamptz, uuid) to service_role;
grant execute on function public.cancel_check_in_transaction(uuid) to service_role;

create or replace function public.is_host()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.host_users where user_id = auth.uid()
  );
$$;

alter table public.event_config enable row level security;
alter table public.invitations enable row level security;
alter table public.rsvp_history enable row level security;
alter table public.wedding_tables enable row level security;
alter table public.table_assignments enable row level security;
alter table public.check_ins enable row level security;
alter table public.host_users enable row level security;
alter table public.host_audit_log enable row level security;
alter table public.rate_limit_buckets enable row level security;

create policy "hosts read event config" on public.event_config for select to authenticated using (public.is_host());
create policy "hosts update event config" on public.event_config for update to authenticated using (public.is_host()) with check (public.is_host());
create policy "hosts manage invitations" on public.invitations for all to authenticated using (public.is_host()) with check (public.is_host());
create policy "hosts read rsvp history" on public.rsvp_history for select to authenticated using (public.is_host());
create policy "hosts insert rsvp history" on public.rsvp_history for insert to authenticated with check (public.is_host());
create policy "hosts manage tables" on public.wedding_tables for all to authenticated using (public.is_host()) with check (public.is_host());
create policy "hosts manage table assignments" on public.table_assignments for all to authenticated using (public.is_host()) with check (public.is_host());
create policy "hosts manage check ins" on public.check_ins for all to authenticated using (public.is_host()) with check (public.is_host());
create policy "hosts read host list" on public.host_users for select to authenticated using (public.is_host());
create policy "hosts read audit log" on public.host_audit_log for select to authenticated using (public.is_host());
create policy "hosts insert audit log" on public.host_audit_log for insert to authenticated with check (public.is_host());

insert into storage.buckets (id, name, public)
values ('wedding-gallery', 'wedding-gallery', true), ('payment-qr', 'payment-qr', false)
on conflict (id) do nothing;

create policy "public reads wedding gallery"
on storage.objects for select to public
using (bucket_id = 'wedding-gallery');

create policy "hosts manage wedding assets"
on storage.objects for all to authenticated
using (bucket_id in ('wedding-gallery', 'payment-qr') and public.is_host())
with check (bucket_id in ('wedding-gallery', 'payment-qr') and public.is_host());

alter publication supabase_realtime add table public.invitations;
alter publication supabase_realtime add table public.check_ins;

comment on column public.invitations.token_hash is
  'SHA-256 of the opaque invitation token. Never store the raw token.';
