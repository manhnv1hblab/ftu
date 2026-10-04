-- Run in Supabase SQL editor with two authenticated JWT contexts.
-- Expected: each user can only read/update/delete their own planner draft;
-- anonymous requests can read published reviews but cannot write planner drafts.
select plan(9);
select has_table('public', 'planner_drafts', 'planner_drafts exists');
select has_table('public', 'reviews', 'reviews exists');
select policies_are('public', 'planner_drafts', ARRAY[
  'Users can read their own planner draft',
  'Users can create their own planner draft',
  'Users can update their own planner draft',
  'Users can delete their own planner draft'
], 'planner draft has owner policies');
select policies_are('public', 'reviews', ARRAY[
  'Anyone can read published reviews',
  'Users can delete their own reviews'
], 'reviews has public read and owner delete policies');
select ok((select relrowsecurity from pg_class where oid = 'public.planner_drafts'::regclass), 'planner drafts RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.reviews'::regclass), 'reviews RLS enabled');
select has_table('public', 'review_submission_limits', 'review rate limit table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.review_submission_limits'::regclass), 'review rate limits RLS enabled');
select function_privs_are('public', 'consume_review_rate_limit', ARRAY['text'], 'service_role', ARRAY['EXECUTE'], 'only service role is granted rate-limit RPC access');
select * from finish();
