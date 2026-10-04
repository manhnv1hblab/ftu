import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabase/server';
import { isPlainRecord, isValidDataVersion, MAX_DRAFT_BYTES } from '../../../../lib/apiValidation';

const errorResponse = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return errorResponse('Supabase chưa được cấu hình.', 503);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse('Bạn cần đăng nhập để đồng bộ bản nháp.', 401);
  const { data, error } = await supabase.from('planner_drafts').select('id,draft,data_version,updated_at,created_at').eq('user_id', user.id).maybeSingle();
  if (error) return errorResponse('Không thể tải bản nháp.', 500);
  return NextResponse.json({ draft: data || null });
}

export async function PUT(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return errorResponse('Supabase chưa được cấu hình.', 503);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return errorResponse('Bạn cần đăng nhập để đồng bộ bản nháp.', 401);
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_DRAFT_BYTES) return errorResponse('Bản nháp vượt quá giới hạn 500 KB.', 413);
  let body: { draft?: unknown; dataVersion?: unknown };
  try { body = await request.json(); } catch { return errorResponse('Payload không hợp lệ.'); }
  if (!isPlainRecord(body.draft) || !isValidDataVersion(body.dataVersion)) return errorResponse('Dữ liệu bản nháp không hợp lệ.');
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_DRAFT_BYTES) return errorResponse('Bản nháp vượt quá giới hạn 500 KB.', 413);
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
