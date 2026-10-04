import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabase/server';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase chưa được cấu hình.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) return NextResponse.json({ error: 'Mã review không hợp lệ.' }, { status: 400 });
  const { data, error } = await supabase.from('reviews').delete().eq('id', params.id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Không thể xóa review.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Không tìm thấy review thuộc tài khoản này.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
