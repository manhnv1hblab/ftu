import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import universitiesData from '../../../../data/universities_s27.json';
import { getSupabaseAdminClient, getSupabaseServerClient } from '../../../lib/supabase/server';
import { publicReview, REVIEW_SEMESTERS } from '../../../lib/apiValidation';

export const dynamic = 'force-dynamic';
type ReviewBody = {
  universityId?: unknown; universityName?: unknown; exchangeSemester?: unknown; major?: unknown;
  displayName?: unknown; isAnonymous?: unknown; overallRating?: unknown; academicRating?: unknown;
  livingRating?: unknown; processRating?: unknown; reviewText?: unknown; pros?: unknown; cons?: unknown;
  website?: unknown;
};

const universities = universitiesData as Array<{ id: string; name: string; country: string }>;
const universityIds = new Set(universities.map(item => item.id));
const countries = new Set(universities.map(item => item.country));
const semesters = new Set<string>(REVIEW_SEMESTERS);
const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const rating = (value: unknown) => value === undefined || value === null || value === '' ? null : Number(value);
const validRating = (value: number | null) => value === null || (Number.isInteger(value) && value >= 1 && value <= 5);
const hasMarkup = (value: string) => /<[^>]*>|javascript:/i.test(value);

function requestFingerprint(request: Request, userId?: string) {
  const address = request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  const raw = userId ? `user:${userId}` : `anon:${address}:${request.headers.get('user-agent') || 'unknown'}`;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-development-only';
  return createHmac('sha256', secret).update(raw).digest('hex');
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient() || getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ reviews: [], configured: false });
  const { searchParams } = new URL(request.url);
  let query = supabase.from('reviews').select('id,university_id,university_name,exchange_semester,major,display_name,is_anonymous,overall_rating,academic_rating,living_rating,process_rating,review_text,pros,cons,created_at').eq('status', 'PUBLISHED').order('created_at', { ascending: false }).limit(100);
  const universityId = text(searchParams.get('universityId'), 120);
  const country = text(searchParams.get('country'), 120);
  const semester = text(searchParams.get('exchangeSemester'), 120);
  if ((universityId && !universityIds.has(universityId)) || (country && !countries.has(country)) || (semester && !semesters.has(semester))) {
    return NextResponse.json({ error: 'Bộ lọc review không hợp lệ.' }, { status: 400 });
  }
  if (universityId) query = query.eq('university_id', universityId);
  if (country) query = query.eq('country', country);
  if (semester) query = query.eq('exchange_semester', semester);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Không thể tải review.' }, { status: 500 });
  return NextResponse.json({ reviews: (data || []).map(publicReview), configured: true });
}

export async function POST(request: Request) {
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: 'Chức năng review chưa được cấu hình.' }, { status: 503 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return NextResponse.json({ error: 'Content-Type phải là application/json.' }, { status: 415 });
  let body: ReviewBody;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Payload không hợp lệ.' }, { status: 400 }); }
  if (text(body.website, 50)) return NextResponse.json({ error: 'Payload không hợp lệ.' }, { status: 400 });
  const universityId = text(body.universityId, 120);
  const university = universities.find(item => item.id === universityId);
  const universityName = text(body.universityName, 240);
  const reviewText = text(body.reviewText, 3000);
  const pros = text(body.pros, 1000);
  const cons = text(body.cons, 1000);
  const exchangeSemester = text(body.exchangeSemester, 120);
  const major = text(body.major, 160);
  const displayName = text(body.displayName, 80);
  const ratings = [rating(body.overallRating), rating(body.academicRating), rating(body.livingRating), rating(body.processRating)];
  const isAnonymous = body.isAnonymous !== false;
  if (!university || !universityName || universityName !== university.name || !reviewText || reviewText.length < 80 || ratings[0] === null || ratings.some(value => !validRating(value)) || (exchangeSemester && !semesters.has(exchangeSemester)) || (!isAnonymous && !displayName) || hasMarkup([reviewText, pros, cons, displayName].join(' '))) {
    return NextResponse.json({ error: 'Vui lòng chọn trường, nhập review từ 80 đến 3000 ký tự và đánh giá từ 1 đến 5.' }, { status: 400 });
  }
  const server = getSupabaseServerClient();
  const { data: { user } } = server ? await server.auth.getUser() : { data: { user: null } };
  const { data: allowed, error: limitError } = await admin.rpc('consume_review_rate_limit', { p_key: requestFingerprint(request, user?.id) });
  if (limitError) return NextResponse.json({ error: 'Chức năng giới hạn review chưa sẵn sàng.' }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: 'Bạn đã gửi quá nhiều review. Vui lòng thử lại sau.' }, { status: 429 });
  const { data, error } = await admin.from('reviews').insert({
    user_id: user?.id || null, university_id: university.id, university_name: university.name,
    country: university.country, exchange_semester: exchangeSemester || null, major: major || null,
    display_name: isAnonymous ? null : displayName, is_anonymous: isAnonymous,
    overall_rating: ratings[0], academic_rating: ratings[1], living_rating: ratings[2], process_rating: ratings[3],
    review_text: reviewText, pros: pros || null, cons: cons || null, status: 'PUBLISHED'
  }).select('id,university_id,university_name,exchange_semester,major,display_name,is_anonymous,overall_rating,academic_rating,living_rating,process_rating,review_text,pros,cons,created_at').single();
  if (error) return NextResponse.json({ error: 'Không thể lưu review.' }, { status: 500 });
  return NextResponse.json({ review: publicReview(data) }, { status: 201 });
}
