create table if not exists public.review_submission_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  submission_count smallint not null default 0 check (submission_count between 0 and 3)
);

alter table public.review_submission_limits enable row level security;
revoke all on public.review_submission_limits from public, anon, authenticated;

create or replace function public.consume_review_rate_limit(p_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted boolean := false;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  insert into public.review_submission_limits as limits (key_hash, window_started_at, submission_count)
  values (p_key, now(), 1)
  on conflict (key_hash) do update
    set window_started_at = case
          when limits.window_started_at <= now() - interval '1 hour' then now()
          else limits.window_started_at
        end,
        submission_count = case
          when limits.window_started_at <= now() - interval '1 hour' then 1
          else limits.submission_count + 1
        end
    where limits.window_started_at <= now() - interval '1 hour'
       or limits.submission_count < 3
  returning true into accepted;

  return coalesce(accepted, false);
end;
$$;

revoke all on function public.consume_review_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_review_rate_limit(text) to service_role;
