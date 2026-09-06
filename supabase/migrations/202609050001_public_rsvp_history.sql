-- Public RSVP inserts a complete response instead of updating a prior invitation.
-- Keep its first history entry in the same transaction as the guest record.
create or replace function public.record_initial_rsvp_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'pending' then
    insert into public.rsvp_history (invitation_id, snapshot, source, created_at)
    values (
      new.id,
      jsonb_build_object(
        'status', new.status,
        'adult_count', new.adult_count,
        'child_count', new.child_count,
        'child_seat_count', new.child_seat_count,
        'dietary_notes', new.dietary_notes,
        'accessibility_notes', new.accessibility_notes,
        'beer_preference', new.beer_preference,
        'song_request', new.song_request,
        'reason', new.reason,
        'late_response', new.late_response
      ),
      'guest',
      new.created_at
    );
  end if;
  return new;
end;
$$;

revoke all on function public.record_initial_rsvp_history() from public, anon, authenticated;

create trigger invitations_initial_rsvp_history
  after insert on public.invitations
  for each row execute function public.record_initial_rsvp_history();
