import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabase/server';
import { isSafeLocalRedirect } from '../../../lib/apiValidation';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const requestedNext = requestUrl.searchParams.get('next');
  const next = isSafeLocalRedirect(requestedNext) ? requestedNext : '/planner';
  const supabase = getSupabaseServerClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL('/auth/login?error=callback', requestUrl.origin));
  }
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
