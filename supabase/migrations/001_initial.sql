create extension if not exists pgcrypto;

create table if not exists public.planner_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft jsonb not null,
  data_version text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.planner_drafts enable row level security;
revoke all on public.planner_drafts from anon;
grant select, insert, update, delete on public.planner_drafts to authenticated;
create policy "Users can read their own planner draft" on public.planner_drafts for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own planner draft" on public.planner_drafts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own planner draft" on public.planner_drafts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own planner draft" on public.planner_drafts for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  university_id text null,
  university_name text not null,
  country text,
  exchange_semester text,
  major text,
  display_name text,
  is_anonymous boolean not null default true,
  overall_rating smallint not null check (overall_rating between 1 and 5),
  academic_rating smallint check (academic_rating is null or academic_rating between 1 and 5),
  living_rating smallint check (living_rating is null or living_rating between 1 and 5),
  process_rating smallint check (process_rating is null or process_rating between 1 and 5),
  review_text text not null check (char_length(review_text) between 80 and 3000),
  pros text,
  cons text,
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED', 'HIDDEN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant delete on public.reviews to authenticated;
create policy "Anyone can read published reviews" on public.reviews for select to anon, authenticated using (status = 'PUBLISHED');
create policy "Users can delete their own reviews" on public.reviews for delete to authenticated using (auth.uid() = user_id);

create index if not exists reviews_public_created_at_idx on public.reviews (status, created_at desc);
create index if not exists reviews_university_idx on public.reviews (university_id);
create index if not exists reviews_country_idx on public.reviews (country);
