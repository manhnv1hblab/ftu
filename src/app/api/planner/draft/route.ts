import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabase/server';

const errorResponse = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return errorResponse('Supabase chưa được cấu hình.', 503);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse('Bạn cần đăng nhập để đồng bộ bản nháp.', 401);
  if (!user.email_confirmed_at) return errorResponse('Hãy xác minh email trước khi đồng bộ bản nháp.', 403);
  const { data, error } = await supabase.from('planner_drafts').select('id,draft,data_version,updated_at,created_at').eq('user_id', user.id).maybeSingle();
  if (error) return errorResponse('Không thể tải bản nháp.', 500);
  return NextResponse.json({ draft: data || null });
}

export async function PUT(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return errorResponse('Supabase chưa được cấu hình.', 503);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse('Bạn cần đăng nhập để đồng bộ bản nháp.', 401);
  if (!user.email_confirmed_at) return errorResponse('Hãy xác minh email trước khi đồng bộ bản nháp.', 403);
  let body: { draft?: unknown; dataVersion?: unknown };
  try { body = await request.json(); } catch { return errorResponse('Payload không hợp lệ.'); }
  if (!body.draft || typeof body.draft !== 'object' || typeof body.dataVersion !== 'string' || body.dataVersion.length > 100) return errorResponse('Dữ liệu bản nháp không hợp lệ.');
  const { data, error } = await supabase.from('planner_drafts').upsert({ user_id: user.id, draft: body.draft, data_version: body.dataVersion, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select('id,draft,data_version,updated_at,created_at').single();
  if (error) return errorResponse('Không thể lưu bản nháp.', 500);
  return NextResponse.json({ draft: data });
}

export async function DELETE() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return errorResponse('Supabase chưa được cấu hình.', 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('Bạn cần đăng nhập.', 401);
  const { error } = await supabase.from('planner_drafts').delete().eq('user_id', user.id);
  if (error) return errorResponse('Không thể xóa bản nháp.', 500);
  return NextResponse.json({ ok: true });
}
