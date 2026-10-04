import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../../lib/supabase/server';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase chưa được cấu hình.' }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  const { error } = await supabase.from('reviews').delete().eq('id', params.id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Không thể xóa review.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
